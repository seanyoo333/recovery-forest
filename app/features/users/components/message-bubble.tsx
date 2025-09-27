import { cn } from "~/lib/utils";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";

interface MessageBubbleProps {
  avatarUrl: string;
  avatarFallback: string;
  content: string;
  isCurrentUser?: boolean;
  lastTime: string;
  isRead: boolean;
}

export function MessageBubble({
  avatarUrl,
  avatarFallback,
  content,
  isCurrentUser = false,
  lastTime,
  isRead,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-4",
        isCurrentUser ? "flex-row-reverse" : "",
      )}
    >
      <Avatar>
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>{avatarFallback}</AvatarFallback>
      </Avatar>
      <div
        className={cn({
          "rounded-md p-4 text-sm md:w-1/4": true,
          "bg-accent rounded-br-none": isCurrentUser,
          "bg-primary text-primary-foreground rounded-bl-none": !isCurrentUser,
        })}
      >
        <p>{content}</p>
        <small className="text-muted-foreground mt-1 block text-xs">
          {lastTime}
        </small>
      </div>
    </div>
  );
}
