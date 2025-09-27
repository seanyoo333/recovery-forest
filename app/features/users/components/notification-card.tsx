import { EyeIcon, TrashIcon } from "lucide-react";
import { Link, useFetcher } from "react-router";

import { cn } from "~/lib/utils";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

interface NotificationCardProps {
  avatarUrl: string;
  avatarFallback: string;
  name: string;
  userName: string;
  type: "follow" | "review" | "reply";
  timestamp: string;
  seen: boolean;
  teamName?: string;
  payloadId?: number;
  postTitle?: string;
  id: number;
}

export function NotificationCard({
  type,
  avatarUrl,
  avatarFallback,
  name,
  userName,
  timestamp,
  seen,
  teamName,
  postTitle,
  payloadId,
  id,
}: NotificationCardProps) {
  const getMessage = (type: "follow" | "review" | "reply") => {
    switch (type) {
      case "follow":
        return "이(가) 당신을 팔로우 했어요~";
      case "review":
        return "이(가) 리뷰 남겨줘서 고마워요~";
      case "reply":
        return "이(가) 게시글에 답변을 달았어요~";
    }
  };
  const fetcher = useFetcher();
  const optimisticSeen = fetcher.state === "idle" ? seen : true;

  return (
    <Card
      className={cn(
        "w-full max-w-[500px] md:min-w-[500px]",
        optimisticSeen ? "" : "border border-yellow-400",
      )}
    >
      <CardHeader className="flex flex-row gap-5 space-y-0">
        <Link to={`/users/${userName}`}>
          <Avatar className="">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
          <CardTitle className="flex w-full flex-col flex-wrap items-start space-y-0 text-lg font-bold">
            <div>
              <span>{name}</span>
              <span>{getMessage(type)}</span>
            </div>
            {teamName && (
              <Button
                variant={"link"}
                asChild
                className="p-0 text-lg text-white"
              >
                <Link to={`/teams/${payloadId}`}>{teamName}</Link>
              </Button>
            )}
            {postTitle && (
              <Button
                variant={"link"}
                asChild
                className="p-0 text-lg text-white"
              >
                <Link to={`/community/${payloadId}`}>{postTitle}</Link>
              </Button>
            )}
          </CardTitle>
          <small className="text-muted-foregroud text-sm">{timestamp}</small>
        </div>
      </CardHeader>
      {optimisticSeen ? (
        <CardFooter className="flex justify-end pt-0">
          <fetcher.Form
            method="delete"
            action={`/my/notifications/${id}/delete`}
          >
            <Button variant="outline" size="icon">
              <TrashIcon className="h-4 w-4" />
            </Button>
          </fetcher.Form>
        </CardFooter>
      ) : (
        <CardFooter className="flex justify-end pt-0">
          <fetcher.Form method="post" action={`/my/notifications/${id}/see`}>
            <Button variant="outline" size="icon">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </fetcher.Form>
        </CardFooter>
      )}
    </Card>
  );
}
