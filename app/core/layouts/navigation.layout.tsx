import type { Route } from "./+types/navigation.layout";

import { Suspense } from "react";
import { Await, Outlet, useOutletContext } from "react-router";

import { FEATURES } from "~/core/config/features";
import {
  countNotifications,
  existMessages,
  getUserById,
} from "~/features/users/queries";

import Footer from "../components/footer";
import { NavigationBar } from "../components/navigation-bar";
import makeServerClient from "../lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userPromise = client.auth.getUser();

  const {
    data: { user },
  } = await client.auth.getUser();

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
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
