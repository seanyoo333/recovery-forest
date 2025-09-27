/**
 * Notifications Screen
 *
 * This component displays all user notifications including system alerts,
 * product updates, and user interactions.
 */
import type { Route } from "./+types/notifications";

import { DateTime } from "luxon";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Separator } from "~/core/components/ui/separator";
import makeServerClient from "~/core/lib/supa-client.server";
import { NotificationCard } from "~/features/users/components/notification-card";
import { getLoggedInUserId, getNotifications } from "~/features/users/queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Notifications | Dashboard" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const notifications = await getNotifications(client, { userId });
  return { notifications };
};

export default function NotificationsPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="space-y-10 px-10 md:space-y-20">
      <h1 className="text-2xl font-bold md:text-4xl">알림</h1>
      <div className="flex flex-col items-start gap-5">
        {loaderData.notifications.map((notification) => (
          <NotificationCard
            id={notification.notification_id}
            key={notification.notification_id}
            avatarUrl={notification.source?.avatar ?? ""}
            avatarFallback={notification.source?.name?.[0] ?? ""}
            name={notification.source?.name ?? ""}
            userName={notification.source?.username ?? ""}
            type={notification.type}
            teamName={notification.team?.team_name ?? ""}
            postTitle={notification.post?.title ?? ""}
            payloadId={notification.team?.team_id ?? notification.post?.post_id}
            timestamp={
              DateTime.fromISO(notification.created_at, {
                zone: "Asia/Seoul",
              }).toRelative()!
            }
            seen={notification.seen}
          />
        ))}
      </div>
    </div>
  );
}
