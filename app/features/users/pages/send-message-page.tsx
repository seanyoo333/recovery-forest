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
  const { profile_id: toUserId } = await getUserProfile(client, {
    username: params.username,
  });

  console.log("1", toUserId);
  console.log("2", fromUserId);

  const messageRoomId = await sendMessage(adminClient, {
    fromUserId,
    toUserId,
    content: formData.get("content") as string,
  });
  console.log(messageRoomId);
  return redirect(`/my/messages/${messageRoomId}`);
};
