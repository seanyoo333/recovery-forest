import { ChevronUpIcon, EyeIcon, MessageCircleIcon } from "lucide-react";
import { Link, useFetcher, useNavigate, useOutletContext } from "react-router";

import { cn } from "~/lib/utils";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { NeonGradientCard } from "~/core/components/ui/neon-gradient-card";

interface ProductCardProps {
  id: number | string;
  name: string;
  description: string;
  reviewsCount: string | number;
  viewsCount: string | number;
  votesCount: string | number;
  isUpvoted: boolean;
  promotedFrom: string | null;
}

export function ProductCard({
  id,
  name,
  description,
  reviewsCount,
  viewsCount,
  votesCount,
  isUpvoted,
  promotedFrom,
}: ProductCardProps) {
  const fetcher = useFetcher();
  const { isLoggedIn } = useOutletContext<{
    isLoggedIn: boolean;
  }>();
  const navigate = useNavigate();
  const optimisticVotesCount =
    fetcher.state === "idle"
      ? votesCount
      : isUpvoted
        ? Number(votesCount) - 1
        : Number(votesCount) + 1;
  const optimisticIsUpvoted = fetcher.state === "idle" ? isUpvoted : !isUpvoted;
  const absorbClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please log in first!");
      navigate("/auth/login");
      return;
    }
    fetcher.submit(null, {
      method: "POST",
      action: `/products/${id}/upvote`,
    });
  };
  const content = (
    <Link to={`/products/${id}`} className="relative z-10 block">
      <Card
        className={cn(
          "flex w-full flex-row items-center justify-between",
          promotedFrom ? "" : "hover:bg-card/50 bg-transparent",
        )}
      >
        <CardHeader className="w-full">
          <CardTitle className="flex w-full flex-wrap items-center justify-between gap-2 text-2xl leading-none font-semibold tracking-tight">
            {name}{" "}
            {promotedFrom ? <Badge variant={"outline"}>Promoted</Badge> : null}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
          <div className="mt-2 flex items-center gap-4">
            <div className="text-muted-foreground flex items-center gap-px text-xs">
              <MessageCircleIcon className="h-4 w-4" />
              <span>{reviewsCount}</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-px text-xs">
              <EyeIcon className="h-4 w-4" />
              <span>{viewsCount}</span>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="py-0">
          <Button
            variant="outline"
            className={cn(
              optimisticIsUpvoted && "border-primary text-primary",
              "flex h-14 flex-col",
            )}
            onClick={absorbClick}
          >
            <ChevronUpIcon className="size-4 shrink-0" />
            <span>{optimisticVotesCount}</span>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
  return promotedFrom ? (
    <NeonGradientCard
      borderRadius={12}
      className="dark"
      borderSize={1}
      neonColors={{
        firstColor: "#fc4a1a",
        secondColor: "#f7b733",
      }}
    >
      {content}
    </NeonGradientCard>
  ) : (
    content
  );
}
