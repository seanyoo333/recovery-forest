import type { Route } from "./+types/delete-messageroom-card";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

export const action = async ({ request, params }: Route.ActionArgs) => {
  if (request.method !== "DELETE") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { messageId } = params;
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 메시지를 삭제 (본인이 보낸 메시지만 삭제 가능)
  const { error } = await client
    .from("messages")
    .delete()
    .eq("message_id", Number.parseInt(messageId, 10))
    .eq("sender_id", userId);

  if (error) {
    throw error;
  }

  return {
    ok: true,
  };
};
