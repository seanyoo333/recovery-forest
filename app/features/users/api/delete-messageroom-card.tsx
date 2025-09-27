import type { Route } from "./+types/delete-message-bubble";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

export const action = async ({ request, params }: Route.ActionArgs) => {
  if (request.method !== "DELETE") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { messageId } = params;
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  // deleteNotification 함수를 직접 구현
  const { error } = await client
    .from("messages")
    .delete()
    .eq("message_id", messageId)
    .eq("target_id", userId);

  if (error) {
    throw error;
  }

  return {
    ok: true,
  };
};
