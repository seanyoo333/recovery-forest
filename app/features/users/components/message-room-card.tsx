import { EyeIcon, TrashIcon } from "lucide-react";
import { DateTime } from "luxon";
import { Link, useFetcher, useLocation } from "react-router";

import { cn } from "~/lib/utils";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/core/components/ui/sidebar";

interface MessageCardProps {
  id: string;
  avatarUrl?: string;
  name: string;
  lastMessage: string;
  isRead: boolean;
  lastTime: string;
}

export default function MessageRoomCard({
  id,
  avatarUrl,
  name,
  lastMessage,
  isRead,
  lastTime,
}: MessageCardProps) {
  const location = useLocation();
  const fetcher = useFetcher();
  // 더 정확한 Optimistic UI 로직
  const optimisticIsRead =
    fetcher.state === "idle"
      ? isRead
      : fetcher.formAction?.includes("/isRead")
        ? true
        : isRead;
  const formatRelativeTime = (timestamp: string) => {
    if (!timestamp) return "";

    const seoulTime = DateTime.fromISO(timestamp).setZone("Asia/Seoul");
    const now = DateTime.now().setZone("Asia/Seoul");

    const diff = now.diff(seoulTime, ["days", "hours", "minutes"]);

    if (diff.days > 0) {
      return `${diff.days}일 전`;
    } else if (diff.hours > 0) {
      return `${diff.hours}시간 전`;
    } else if (diff.minutes > 0) {
      return `${diff.minutes}분 전`;
    } else {
      return "방금 전";
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn(
          "relative h-18",
          !optimisticIsRead && "border border-yellow-400",
        )}
        asChild
        isActive={location.pathname === `/my/messages/${id}`}
      >
        <Link to={`/my/messages/${id}`}>
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm">{name}</span>
              <span className="text-muted-foreground text-xs">
                {lastMessage.length > 30
                  ? lastMessage.slice(0, 30) + "..."
                  : lastMessage}
              </span>
              {lastTime && (
                <span className="text-muted-foreground text-xs">
                  {formatRelativeTime(lastTime)}
                </span>
              )}
            </div>
          </div>
          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            {optimisticIsRead ? (
              <fetcher.Form method="post" action={`/my/messages/${id}/hide`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </fetcher.Form>
            ) : (
              <fetcher.Form method="post" action={`/my/messages/${id}/isRead`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EyeIcon className="h-3 w-3" />
                </Button>
              </fetcher.Form>
            )}
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
