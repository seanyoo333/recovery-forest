import type { Route } from "./+types/upvote";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { toggleBlogPostUpvote } from "../mutations";

export const action = async ({ request, params }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  await toggleBlogPostUpvote(client, {
    postId: Number(params.postId),
    userId,
  });
  return {
    ok: true,
  };
};
