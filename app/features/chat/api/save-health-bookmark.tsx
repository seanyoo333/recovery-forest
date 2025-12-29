/**
 * Save Health Bookmark API Endpoint
 *
 * 건강 질문 답변을 북마크로 저장하는 서버 사이드 API
 * RLS 정책을 우회하기 위해 서버 사이드에서 실행됩니다.
 */
import type { OutputPayload } from "../utils/evibot-api";
import type { Route } from "./+types/save-health-bookmark";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { createHealthBookmark } from "../mutations";

interface RequestBody {
  botMessageId?: string;
  botMessageRoomId: string;
  question: string;
  answer: OutputPayload;
  title?: string;
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as RequestBody;
    const { botMessageId, botMessageRoomId, question, answer, title } = body;

    if (!botMessageRoomId || !question || !answer) {
      return Response.json(
        { error: "botMessageRoomId, question, and answer are required" },
        { status: 400 },
      );
    }

    // 북마크 저장
    await createHealthBookmark(client, {
      userId,
      botMessageId: botMessageId
        ? Number.parseInt(botMessageId, 10)
        : undefined,
      botMessageRoomId,
      question,
      answer,
      title,
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Save health bookmark error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
