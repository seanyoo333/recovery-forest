import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

import type { PostReference } from "./reference-utils";

export const createPost = async (
  client: SupabaseClient<Database>,
  {
    title,
    category,
    content,
    references = [],
    userId,
    isMarkdown = false,
  }: {
    title: string;
    category: string;
    content: string;
    references?: PostReference[];
    userId: string;
    isMarkdown?: boolean;
  },
) => {
  const { data: categoryData, error: categoryError } = await client
    .from("topics")
    .select("topic_id")
    .eq("slug", category)
    .single();
  if (categoryError) {
    throw categoryError;
  }
  const { data, error } = await client
    .from("posts")
    .insert({
      title,
      content,
      references,
      profile_id: userId,
      topic_id: categoryData.topic_id,
      is_markdown: isMarkdown,
    })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const createReply = async (
  client: SupabaseClient<Database>,
  {
    postId,
    reply,
    userId,
    topLevelId,
  }: { postId: string; reply: string; userId: string; topLevelId?: number },
) => {
  const { error } = await client.from("post_replies").insert({
    ...(topLevelId ? { parent_id: topLevelId } : { post_id: Number(postId) }),
    reply,
    profile_id: userId,
  });
  if (error) {
    throw error;
  }
};

export const toggleUpvote = async (
  client: SupabaseClient<Database>,
  { postId, userId }: { postId: string; userId: string },
) => {
  const { count } = await client
    .from("post_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", Number(postId))
    .eq("profile_id", userId);

  if (count === 0) {
    await client.from("post_upvotes").insert({
      post_id: Number(postId),
      profile_id: userId,
    });
  } else {
    await client
      .from("post_upvotes")
      .delete()
      .eq("post_id", Number(postId))
      .eq("profile_id", userId);
  }
};

export const deleteReply = async (
  client: SupabaseClient<Database>,
  { replyId, userId }: { replyId: number; userId: string },
) => {
  // 댓글 작성자만 삭제할 수 있도록 확인
  const { data: reply, error: fetchError } = await client
    .from("post_replies")
    .select("profile_id")
    .eq("post_reply_id", replyId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (reply.profile_id !== userId) {
    throw new Error("댓글을 삭제할 권한이 없습니다.");
  }

  const { error } = await client
    .from("post_replies")
    .delete()
    .eq("post_reply_id", replyId);

  if (error) {
    throw error;
  }
};

export const updatePost = async (
  client: SupabaseClient<Database>,
  {
    postId,
    title,
    category,
    content,
    references = [],
    userId,
  }: {
    postId: string;
    title: string;
    category: string;
    content: string;
    references?: PostReference[];
    userId: string;
  },
) => {
  // 글 작성자만 수정할 수 있도록 확인
  const { data: post, error: fetchError } = await client
    .from("posts")
    .select("profile_id")
    .eq("post_id", Number(postId))
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (post.profile_id !== userId) {
    throw new Error("글을 수정할 권한이 없습니다.");
  }

  const { data: categoryData, error: categoryError } = await client
    .from("topics")
    .select("topic_id")
    .eq("slug", category)
    .single();

  if (categoryError) {
    throw categoryError;
  }

  const { data, error } = await client
    .from("posts")
    .update({
      title,
      content,
      references,
      topic_id: categoryData.topic_id,
    })
    .eq("post_id", Number(postId))
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deletePost = async (
  client: SupabaseClient<Database>,
  { postId, userId }: { postId: string; userId: string },
) => {
  // 글 작성자만 삭제할 수 있도록 확인
  const { data: post, error: fetchError } = await client
    .from("posts")
    .select("profile_id")
    .eq("post_id", Number(postId))
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (post.profile_id !== userId) {
    throw new Error("글을 삭제할 권한이 없습니다.");
  }

  const { error } = await client
    .from("posts")
    .delete()
    .eq("post_id", Number(postId));

  if (error) {
    throw error;
  }
};
