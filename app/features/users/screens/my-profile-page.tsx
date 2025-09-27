import type { Route } from "./+types/my-profile-page";

import { redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import { getUserById } from "../queries";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (user) {
    const profile = await getUserById(client, { id: user.id });

    return redirect(`/users/${encodeURIComponent(profile.username!)}`);
  }
  return redirect("/login");
}
