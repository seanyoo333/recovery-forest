import type { Route } from "./+types/welcome-page";

import { render } from "@react-email/components";
import { Resend } from "resend";
import Welcome from "transactional-emails/emails/welcome";

import makeServerClient from "~/core/lib/supa-client.server";

import { getUserProfile } from "../queries";

const emailClient = new Resend(process.env.RESEND_API_KEY);

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const { email, name, username, avatar } = await getUserProfile(client, {
    username: params.username,
  });

  const { data, error } = await emailClient.emails.send({
    from: "Evidence_Base <good_habit@mail.evidence-base.ai>",
    to: [email!],
    subject: "Evidence Base 가입을 환영합니다!",
    react: (
      <Welcome
        profile={{
          name: name!,
          email: email!,
          username: username || undefined,
          avatar: avatar || undefined,
        }}
      />
    ),
  });
  return Response.json({ data, error });
};
