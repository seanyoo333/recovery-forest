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

  return (
    <Link to={`/community/${id}`} className="block h-full">
      <Card
        className={cn(
          "hover:bg-card/50 h-full bg-transparent transition-colors",
          expanded
            ? "flex flex-row flex-wrap items-center justify-between"
            : "",
        )}
      >
        <CardHeader className="flex min-w-0 flex-1 flex-row items-start gap-2">
          <Avatar className="size-14">
            <AvatarFallback>{author?.[0] || "?"}</AvatarFallback>
            {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} />}
          </Avatar>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg leading-tight md:text-xl">
                {title}
              </CardTitle>
              {isMDFile && (
                <Badge variant="secondary" className="text-xs">
                  EB 뉴스
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground flex gap-2 text-sm leading-tight">
              <span>
                {authorUsername || author} on {category}
              </span>
              <DotIcon className="h-4 w-4" />
              <span>
                {DateTime.fromISO(postedAt, {
                  zone: "Asia/Seoul",
                }).toRelative()}
              </span>
            </div>
          </div>
        </CardHeader>
        {!expanded && (
          <CardFooter className="flex justify-end">
            <Button variant="link">Reply &rarr;</Button>
          </CardFooter>
        )}
        {expanded && (
          <CardFooter className="flex justify-end md:pb-0">
            <Button
              onClick={absorbClick}
              variant="outline"
              className={cn(
                "flex h-14 w-full flex-col md:w-fit",
                optimisticIsUpvoted ? "border-primary text-primary" : "",
              )}
            >
              <ChevronUpIcon className="size-4 shrink-0" />
              <span>{optimisticVotesCount}</span>
            </Button>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
