import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

import { NEON_CARD_BASE_CLASS } from "~/core/lib/neon-card";
import { cn } from "~/core/lib/utils";

import {
  Card,
  CardDescription,
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
    <Link to={`/natural-ingredients/${slug}`} className="relative z-10 block h-full">
      <Card
        className={cn(
          NEON_CARD_BASE_CLASS,
          "flex w-full flex-row items-center justify-between",
          "!gap-3 !py-4 px-4",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {picture ? (
            <div className="border-border/70 bg-muted size-[4.5rem] shrink-0 overflow-hidden rounded-xl border shadow-inner ring-1 ring-black/5 dark:ring-white/10">
              <img
                src={picture}
                alt={name}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="border-primary/20 bg-primary/10 flex size-[4.5rem] shrink-0 items-center justify-center rounded-xl border shadow-inner ring-1 ring-primary/15">
              <span className="text-primary text-2xl font-bold">
                {name.charAt(0)}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1.5 pr-1">
            <CardTitle className="text-xl leading-snug font-semibold tracking-tight">
              {name}
            </CardTitle>
            {displaySummary ? (
              <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                {displaySummary}
              </CardDescription>
            ) : null}
          </div>
        </div>
        <ChevronRightIcon
          className="text-muted-foreground size-5 shrink-0"
          aria-hidden
        />
      </Card>
    </Link>
  );
}
