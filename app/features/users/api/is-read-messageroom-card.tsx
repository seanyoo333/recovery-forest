import type { Route } from "./+types/is-read-messageroom-card";

import makeServerClient from "~/core/lib/supa-client.server";

import { isReadMessageRoom } from "../mutations";
import { getLoggedInUserId } from "../queries";

export const action = async ({ request, params }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { messageRoomId } = params;
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  await isReadMessageRoom(client, {
    userId,
    messageRoomId: messageRoomId as string,
  });
  return {
    ok: true,
  };
};
