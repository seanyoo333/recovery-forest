import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

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
    <Link to={`/natural-ingredients/targets/${slug}`} className="block">
      <Card className="neon-card !bg-background hover:border-primary/30 cursor-pointer border transition">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">{name}</CardTitle>
            {description ? (
              <CardDescription className="line-clamp-2">
                {description}
              </CardDescription>
            ) : null}
          </div>
          <ChevronRightIcon className="text-muted-foreground size-5 shrink-0" />
        </CardHeader>
      </Card>
    </Link>
  );
}
