import { EyeIcon, FileTextIcon, TrashIcon } from "lucide-react";
import { Link, useFetcher } from "react-router";

import { cn } from "~/lib/utils";
import { HEALTH_REPORT_PAGE_PATH } from "~/core/lib/health-report";

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
  type: "follow" | "review" | "reply" | "health_report";
  timestamp: string;
  seen: boolean;
  teamName?: string;
  payloadId?: number;
  postTitle?: string;
  content?: string | null;
  reportRequestId?: string | null;
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
  content,
  id,
}: NotificationCardProps) {
  const getMessage = (t: typeof type) => {
    switch (t) {
      case "follow":
        return "이(가) 당신을 팔로우 했어요~";
      case "review":
        return "이(가) 리뷰 남겨줘서 고마워요~";
      case "reply":
        return "이(가) 게시글에 답변을 달았어요~";
      case "health_report":
        return "건강 리포트";
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
        {type === "health_report" ? (
          <Link to={HEALTH_REPORT_PAGE_PATH}>
            <Avatar className="">
              <AvatarFallback>
                <FileTextIcon className="size-5" />
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link to={`/users/${userName}`}>
            <Avatar className="">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
          </Link>
        )}
        <div
          className={cn(
            "overflow-hidden",
            type === "health_report" ? "whitespace-normal" : "overflow-ellipsis whitespace-nowrap",
          )}
        >
          <CardTitle className="flex w-full flex-col flex-wrap items-start space-y-0 text-lg font-bold">
            <div>
              {type === "health_report" ? (
                <span>{getMessage(type)}</span>
              ) : (
                <>
                  <span>{name}</span>
                  <span>{getMessage(type)}</span>
                </>
              )}
            </div>
            {type === "health_report" && content && (
              <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm font-normal">
                {content}
              </p>
            )}
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
            {type === "health_report" && (
              <Button variant={"link"} asChild className="p-0 text-lg text-white">
                <Link to={HEALTH_REPORT_PAGE_PATH}>내 리포트 보기</Link>
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
