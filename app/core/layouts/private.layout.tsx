import type { Route } from "./+types/private.layout";

import { Outlet, redirect, useOutletContext } from "react-router";

import makeServerClient from "../lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const redirectTo =
      path && path !== "/" && path !== "/login"
        ? `?redirectTo=${encodeURIComponent(path)}`
        : "";
    throw redirect(`/login${redirectTo}`);
  }

  // Return an empty object to avoid the "Cannot read properties of undefined" error
  return {};
}

export default function PrivateLayout() {
  const outletContext = useOutletContext<{
    isLoggedIn?: boolean;
    name?: string;
    username?: string;
    avatar?: string;
  }>();
  return <Outlet context={outletContext ?? {}} />;
}
