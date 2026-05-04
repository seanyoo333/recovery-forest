import { ChevronUpIcon, DotIcon } from "lucide-react";
import { DateTime } from "luxon";
import { Link, useFetcher, useNavigate, useOutletContext } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { NEON_CARD_BASE_CLASS } from "~/core/lib/neon-card";
import { cn } from "~/core/lib/utils";

interface PostCardProps {
  id: number;
  title: string;
  author: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  category: string;
  postedAt: string;
  isMarkdown?: boolean;
  expanded?: boolean;
  votesCount?: number;
  isUpvoted?: boolean;
}

export function PostCard({
  id,
  title,
  author,
  authorUsername,
  authorAvatarUrl,
  category,
  postedAt,
  isMarkdown,
  expanded = false,
  votesCount = 0,
  isUpvoted = false,
}: PostCardProps) {
  const fetcher = useFetcher();
  const { isLoggedIn } = useOutletContext<{
    isLoggedIn: boolean;
  }>();
  const isMDFile = isMarkdown === true;
  const optimisticVotesCount =
    fetcher.state === "idle"
      ? votesCount
      : isUpvoted
        ? votesCount - 1
        : votesCount + 1;
  const optimisticIsUpvoted = fetcher.state === "idle" ? isUpvoted : !isUpvoted;
  const navigate = useNavigate();
  const absorbClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      alert("Please log in first");
      navigate("/login");
      return;
    }
    fetcher.submit(null, {
      method: "POST",
      action: `/community/${id}/upvote`,
    });
  };

  const renderUpvoteButton = () => (
    <Button
      type="button"
      onClick={absorbClick}
      variant="outline"
      className={cn(
        "flex h-14 min-h-[44px] w-fit shrink-0 flex-col px-3",
        optimisticIsUpvoted ? "border-primary text-primary" : "",
      )}
    >
      <ChevronUpIcon className="size-4 shrink-0" />
      <span>{optimisticVotesCount}</span>
    </Button>
  );

  return (
    <Link to={`/community/${id}`} className="relative z-10 block h-full">
      <Card
        className={cn(
          NEON_CARD_BASE_CLASS,
          "h-full",
          expanded &&
            "gap-3 py-4 sm:gap-6 sm:py-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        )}
      >
        <CardHeader className="relative z-10 flex min-w-0 flex-1 flex-row items-start gap-3 sm:gap-2">
          <Avatar className="size-11 shrink-0 sm:size-14">
            <AvatarFallback>{author?.[0] || "?"}</AvatarFallback>
            {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} />}
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start gap-2">
              <CardTitle className="line-clamp-3 text-base leading-snug text-foreground sm:text-lg md:text-xl md:leading-snug">
                {title}
              </CardTitle>
              {isMDFile && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  EB 뉴스
                </Badge>
              )}
            </div>
            {expanded ? (
              <>
                <div className="flex items-start justify-between gap-2 sm:hidden">
                  <div className="text-muted-foreground min-w-0 flex-1 space-y-0.5 text-xs leading-snug">
                    <p className="break-words">
                      {author || authorUsername}
                      <span className="text-muted-foreground/80"> · </span>
                      {category}
                    </p>
                    <p>
                      {DateTime.fromISO(postedAt, {
                        zone: "Asia/Seoul",
                      }).toRelative()}
                    </p>
                  </div>
                  <div className="shrink-0">{renderUpvoteButton()}</div>
                </div>
                <div
                  className={cn(
                    "text-muted-foreground hidden flex-col gap-1 text-sm leading-relaxed sm:flex",
                    "sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-0 sm:leading-normal",
                  )}
                >
                  <span className="break-words">
                    {author || authorUsername}
                    <span className="text-muted-foreground/80"> · </span>
                    {category}
                  </span>
                  <span className="flex items-center gap-2 sm:inline-flex">
                    <DotIcon className="hidden size-4 shrink-0 sm:block" />
                    <span>
                      {DateTime.fromISO(postedAt, {
                        zone: "Asia/Seoul",
                      }).toRelative()}
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <div
                className={cn(
                  "text-muted-foreground flex flex-col gap-1 text-sm leading-relaxed",
                  "sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-0 sm:leading-normal",
                )}
              >
                <span className="break-words">
                  {author || authorUsername}
                  <span className="text-muted-foreground/80"> · </span>
                  {category}
                </span>
                <span className="flex items-center gap-2 sm:inline-flex">
                  <DotIcon className="hidden size-4 shrink-0 sm:block" />
                  <span>
                    {DateTime.fromISO(postedAt, {
                      zone: "Asia/Seoul",
                    }).toRelative()}
                  </span>
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        {!expanded && (
          <CardFooter className="relative z-10 flex justify-end">
            <Button variant="link">Reply &rarr;</Button>
          </CardFooter>
        )}
        {expanded && (
          <CardFooter className="relative z-10 hidden w-full shrink-0 justify-end sm:flex sm:w-auto sm:self-center sm:pb-0 md:pb-0">
            {renderUpvoteButton()}
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
