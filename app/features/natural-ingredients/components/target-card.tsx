import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

import { NEON_CARD_BASE_CLASS } from "~/core/lib/neon-card";
import { cn } from "~/core/lib/utils";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

interface TargetCardProps {
  slug: string;
  name: string;
  description?: string | null;
}

export function TargetCard({ slug, name, description }: TargetCardProps) {
  return (
    <Link
      to={`/natural-ingredients/targets/${slug}`}
      className="relative z-10 block h-full"
    >
      <Card
        className={cn(NEON_CARD_BASE_CLASS, "w-full", "!gap-0 !py-4 px-4")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
          <div className="min-w-0 flex-1 space-y-1.5 pr-2">
            <CardTitle className="text-xl leading-snug font-semibold tracking-tight">
              {name}
            </CardTitle>
            {description ? (
              <CardDescription className="line-clamp-2 leading-relaxed">
                {description}
              </CardDescription>
            ) : null}
          </div>
          <ChevronRightIcon
            className="text-muted-foreground size-5 shrink-0"
            aria-hidden
          />
        </CardHeader>
      </Card>
    </Link>
  );
}
