import type { SupabaseClient } from "@supabase/supabase-js";

import { DateTime } from "luxon";
import { bundleMDX } from "mdx-bundler";
import { readdir } from "node:fs/promises";
import path from "node:path";

import type { Database } from "~/core/lib/supa-client.server";

import { createPost } from "./mutations";

export const getTopics = async (client: SupabaseClient<Database>) => {
  const { data, error } = await client
    .from("topics")
    .select("topic_id, name, slug");
  if (error) throw new Error(error.message);
  return data;
};

// MD 파일을 데이터베이스에 동기화하는 함수
const syncMDFilesToDatabase = async (client: SupabaseClient<Database>) => {
  try {
    // 현재 데이터베이스의 주제들 확인
    const { data: existingTopics } = await client
      .from("topics")
      .select("name, slug");

    const docsPath = path.join(
      process.cwd(),
      "app",
      "features",
      "community",
      "docs",
    );
    const files = await readdir(docsPath);
    const mdFiles = files.filter((file) => file.endsWith(".md"));

    for (const file of mdFiles) {
      const filePath = path.join(docsPath, file);
      const { frontmatter } = await bundleMDX({ file: filePath });
      const content = await import("node:fs/promises").then((fs) =>
        fs.readFile(filePath, "utf-8"),
      );

      // 카테고리 매칭 확인
      const matchingTopic = existingTopics?.find(
        (topic) => topic.slug === frontmatter.category,
      );

      // 이미 존재하는지 확인
      const { data: existingPost } = await client
        .from("posts")
        .select("post_id")
        .eq("title", frontmatter.title || file.replace(".md", ""))
        .eq("is_markdown", true)
        .single();

      if (!existingPost && matchingTopic) {
        // 새로운 MD 파일을 데이터베이스에 저장
        await createPost(client, {
          title: frontmatter.title || file.replace(".md", ""),
          content: content, // 전체 파일 내용 사용
          category: frontmatter.category,
          userId: "6921ac29-1832-412a-8d9a-356c285bdd68",
          isMarkdown: true,
        });
      }
    }
  } catch (error) {
    console.error("MD 파일 동기화 중 오류:", error);
  }
};

export const getPosts = async (
  client: SupabaseClient<Database>,
  {
    limit,
    sorting,
    period = "all",
    keyword,
    topic,
  }: {
    limit: number;
    sorting: "newest" | "popular";
    period?: "all" | "today" | "week" | "month" | "year";
    keyword?: string;
    topic?: string;
  },
) => {
  // MD 파일을 데이터베이스에 동기화
  await syncMDFilesToDatabase(client);

  // 데이터베이스에서 포스트 가져오기 (MD 파일 포함)
  const baseQuery = client
    .from("community_post_list_view")
    .select(`*`)
    .limit(limit);

  if (sorting === "newest") {
    baseQuery.order("created_at", { ascending: false });
  } else if (sorting === "popular") {
    if (period === "all") {
      baseQuery.order("upvotes", { ascending: false });
    } else {
      const today = DateTime.now();
      if (period === "today") {
        baseQuery.gte("created_at", today.startOf("day").toISO());
      } else if (period === "week") {
        baseQuery.gte("created_at", today.startOf("week").toISO());
      } else if (period === "month") {
        baseQuery.gte("created_at", today.startOf("month").toISO());
      } else if (period === "year") {
        baseQuery.gte("created_at", today.startOf("year").toISO());
      }
      baseQuery.order("upvotes", { ascending: false });
    }
  }

  if (keyword) {
    baseQuery.ilike("title", `%${keyword}%`);
  }

  if (topic) {
    baseQuery.eq("topic_slug", topic);
  }

  const { data, error } = await baseQuery;
  if (error) throw new Error(error.message);
  return data;
};

export const getPostById = async (
  client: SupabaseClient<Database>,
  { postId }: { postId: string },
) => {
  // MD 파일을 데이터베이스에 동기화
  await syncMDFilesToDatabase(client);

  // 데이터베이스에서 포스트 조회
  const { data, error } = await client
    .from("community_post_detail")
    .select("*")
    .eq("post_id", parseInt(postId))
    .single();
  if (error) throw error;
  return data;
};

export const getReplies = async (
  client: SupabaseClient<Database>,
  { postId }: { postId: string },
) => {
  const replyQuery = `
    post_reply_id,
    reply,
    created_at,
    user:profiles!post_replies_profile_id_profiles_profile_id_fk (
      name,
      avatar,
      username
    )
  `;
  const { data, error } = await client
    .from("post_replies")
    .select(`${replyQuery}, post_replies(${replyQuery})`)
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};
