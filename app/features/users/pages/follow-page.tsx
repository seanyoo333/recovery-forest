import type { Route } from "./+types/follow-page";

import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import { toggleFollow } from "../mutations";
import { getLoggedInUserId, getUserById, getUserProfile } from "../queries";

export async function action({
  request,
  params: { username },
}: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  const loggedInUserId = await getLoggedInUserId(client);
  const followerProfile = await getUserById(client, { id: loggedInUserId });
  if (username === followerProfile.username) {
    return data(null, { status: 400 });
  }
  const targetProfile = await getUserProfile(client, { username });
  await toggleFollow(client, {
    userId: loggedInUserId,
    targetId: targetProfile.profile_id as string,
  });
  return {
    ok: true,
  };
}
