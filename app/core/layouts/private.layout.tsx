import type { Route } from "./+types/private.layout";

import {
  Outlet,
  redirect,
  type ShouldRevalidateFunctionArgs,
  useOutletContext,
} from "react-router";

import makeServerClient from "../lib/supa-client.server";

const SKIP_PRIVATE_REVALIDATE_INTENTS = new Set([
  "create-experience",
  "update-experience",
  "delete-experience",
  "create-reply",
  "delete-reply",
]);

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

export const shouldRevalidate = (args: ShouldRevalidateFunctionArgs) => {
  const intent =
    args.actionResult &&
    typeof args.actionResult === "object" &&
    "intent" in args.actionResult &&
    typeof args.actionResult.intent === "string"
      ? args.actionResult.intent
      : null;

  const isNaturalIngredientsAction =
    args.formAction?.includes("/natural-ingredients/") ?? false;

  if (
    intent &&
    isNaturalIngredientsAction &&
    SKIP_PRIVATE_REVALIDATE_INTENTS.has(intent)
  ) {
    return false;
  }

  return args.defaultShouldRevalidate;
};

export default function PrivateLayout() {
  const outletContext = useOutletContext<{
    isLoggedIn?: boolean;
    name?: string;
    username?: string;
    avatar?: string;
  }>();
  return <Outlet context={outletContext ?? {}} />;
}
