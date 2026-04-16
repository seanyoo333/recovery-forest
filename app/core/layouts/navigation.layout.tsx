import type { Route } from "./+types/navigation.layout";

import { Suspense } from "react";
import {
  Await,
  Outlet,
  type ShouldRevalidateFunctionArgs,
  useOutletContext,
} from "react-router";

import { FEATURES } from "~/core/config/features";
import {
  countNotifications,
  existMessages,
  getUserById,
} from "~/features/users/queries";

import Footer from "../components/footer";
import { NavigationBar } from "../components/navigation-bar";
import makeServerClient from "../lib/supa-client.server";

const SKIP_ROOT_REVALIDATE_INTENTS = new Set([
  "create-experience",
  "update-experience",
  "delete-experience",
  "create-reply",
  "delete-reply",
]);

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  // Prevent duplicate Auth API hits in one loader execution.
  const userResult = await client.auth.getUser();
  const userPromise = Promise.resolve(userResult);
  const user = userResult.data.user;

  if (!user) {
    return {
      userPromise,
      profile: null,
      notificationsCount: 0,
      messagesCount: 0,
    };
  }

  const [profile, notificationsCount, messagesCount] = await Promise.all([
    getUserById(client, { id: user.id }),
    countNotifications(client, { userId: user.id }),
    FEATURES.userMessages
      ? existMessages(client, { userId: user.id })
      : Promise.resolve(0),
  ]);

  return { userPromise, profile, notificationsCount, messagesCount };
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

  if (intent && isNaturalIngredientsAction && SKIP_ROOT_REVALIDATE_INTENTS.has(intent)) {
    return false;
  }

  return args.defaultShouldRevalidate;
};

export default function NavigationLayout({ loaderData }: Route.ComponentProps) {
  const { userPromise, profile, notificationsCount, messagesCount } =
    loaderData;
  const { isLoggedIn, username } = useOutletContext<{
    isLoggedIn: boolean;
    username: string;
  }>();

  return (
    <div className="flex min-h-screen flex-col justify-between">
      <Suspense fallback={<NavigationBar loading={true} />}>
        <Await resolve={userPromise}>
          {({ data: { user } }) => (
            <NavigationBar
              isLoggedIn={isLoggedIn}
              name={profile?.name || user?.user_metadata?.name || "Anonymous"}
              username={username}
              email={user?.email}
              avatarUrl={profile?.avatar || user?.user_metadata?.avatar_url}
              loading={false}
              hasNotifications={notificationsCount > 0}
              hasMessages={messagesCount > 0}
            />
          )}
        </Await>
      </Suspense>
      <div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
        <Outlet
          context={{
            isLoggedIn,
            name: profile?.name || "Anonymous",
            username,
            avatar: profile?.avatar,
            profileId: profile?.profile_id,
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
