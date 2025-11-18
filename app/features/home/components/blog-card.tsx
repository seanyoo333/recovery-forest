import { AvatarFallback } from "@radix-ui/react-avatar";
import { DotIcon } from "lucide-react";
import { DateTime } from "luxon";
import { Link } from "react-router";

import { Avatar, AvatarImage } from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { cn } from "~/core/lib/utils";

interface BlogCardProps {
  title: string;
  description: string;
  category: string;
  author: string;
  date: string;
  slug: string;
  expanded?: boolean;
}

export function BlogCard({
  title,
  description,
  category,
  author,
  date,
  slug,
  expanded = false,
}: BlogCardProps) {
  return (
    <Link to={`/blog-posts/${slug}`} className="block h-full">
      <Card
        className={cn(
          "hover:bg-card/50 h-full bg-transparent transition-colors",
          expanded
            ? "flex flex-row flex-wrap items-center justify-between"
            : "",
        )}
      >
        <CardHeader className="flex min-w-0 flex-1 flex-row items-start gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="text-lg leading-tight break-words md:text-xl">
              {title}
            </CardTitle>
            <div className="text-muted-foreground flex gap-2 text-sm leading-tight">
              <span>
                {author} on {category}
              </span>
              <DotIcon className="h-4 w-4" />
              <span>
                {DateTime.fromISO(date, {
                  zone: "Asia/Seoul",
                }).toFormat("yy년 MM월 dd일")}
              </span>
            </div>
            {expanded && (
              <p className="text-muted-foreground text-sm leading-tight">
                {description}
              </p>
            )}
          </div>
        </CardHeader>
        {!expanded && (
          <CardFooter className="flex justify-end">
            <Button variant="link">자세히 보기 &rarr;</Button>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
