import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

interface IngredientCardProps {
  slug: string;
  name: string;
  description?: string | null;
  tagline?: string | null;
  picture?: string | null;
}

export function IngredientCard({
  slug,
  name,
  description,
  tagline,
  picture,
}: IngredientCardProps) {
  const summary = tagline || description;
  const displaySummary = summary
    ? summary.length > 120
      ? summary.slice(0, 120) + "…"
      : summary
    : null;

  return (
    <Link to={`/natural-ingredients/${slug}`} className="block">
      <Card className="neon-card !bg-background hover:border-primary/30 flex w-full cursor-pointer flex-row items-center justify-between border transition">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {picture ? (
            <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-lg">
              <img
                src={picture}
                alt={name}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="bg-primary/10 flex size-16 shrink-0 items-center justify-center rounded-lg">
              <span className="text-primary text-2xl font-bold">
                {name.charAt(0)}
              </span>
            </div>
          )}
          <CardHeader className="min-w-0 flex-1 space-y-1 p-4">
            <CardTitle className="truncate text-xl font-semibold">
              {name}
            </CardTitle>
            {displaySummary ? (
              <CardDescription className="line-clamp-2 text-sm">
                {displaySummary}
              </CardDescription>
            ) : null}
          </CardHeader>
        </div>
        <ChevronRightIcon className="text-muted-foreground size-5 shrink-0 px-4" />
      </Card>
    </Link>
  );
}
