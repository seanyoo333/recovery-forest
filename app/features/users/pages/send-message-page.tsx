import type { Route } from "./+types/send-message-page";

import { redirect } from "react-router";
import { z } from "zod";

import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { sendMessage } from "~/features/users/mutations";
import { getLoggedInUserId, getUserProfile } from "~/features/users/queries";

const formSchema = z.object({
  content: z.string().min(1),
});

export const action = async ({ request, params }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const formData = await request.formData();
  const [client] = makeServerClient(request);
  const fromUserId = await getLoggedInUserId(client);

  if (!fromUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProfile = await getUserProfile(client, {
    username: params.username,
  });

  if (!userProfile?.profile_id) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const toUserId = userProfile.profile_id;

  const messageRoomId = await sendMessage(adminClient, {
    fromUserId,
    toUserId,
    content: formData.get("content") as string,
  });

  return redirect(`/my/messages/${messageRoomId}`);
};
