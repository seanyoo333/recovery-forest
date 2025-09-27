import type { Route } from "./+types/upvote-post-page";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { toggleUpvote } from "../mutations";

export const action = async ({ request, params }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }
  const [client] = await makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  await toggleUpvote(client, { postId: params.postId, userId });
  return {
    ok: true,
  };
};
