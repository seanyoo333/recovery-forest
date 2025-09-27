import type { Route } from "./+types/hide-bot-message";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { hideBotMessage } from "../mutations";

export const action = async ({ request, params }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { botMessageRoomId } = params;
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  await hideBotMessage(client, {
    userId,
    botMessageRoomId: botMessageRoomId as string,
  });
  return {
    ok: true,
  };
};
