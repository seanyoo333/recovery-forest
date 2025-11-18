import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { cn } from "~/core/lib/utils";

interface CategoryCardProps {
  id: number;
  name: string;
  academicName: string;
  target?: string | null;
  description?: string | null;
}

const ACADEMIC_BADGE_META: Record<
  string,
  { className: string; label: string }
> = {
  glucose: {
    className: "bg-red-500 text-white border-red-500",
    label: "Glucose",
  },
  amino_acids: {
    className: "bg-blue-500 text-white border-blue-500",
    label: "Amino Acids",
  },
  fatty_acids: {
    className: "bg-yellow-500 text-white border-yellow-500",
    label: "Fatty Acids",
  },
};

function formatAcademicName(name: string) {
  return name
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getBadgeMeta(academicName?: string | null) {
  if (!academicName) {
    return {
      className: "bg-green-500 text-white border-green-500",
      label: "General",
    };
  }

  const key = academicName.toLowerCase();
  const meta = ACADEMIC_BADGE_META[key];
  if (meta) {
    return meta;
  }

  return {
    className: "bg-green-500 text-white border-green-500",
    label: formatAcademicName(academicName),
  };
}

export function CategoryCard({
  id,
  name,
  description,
  academicName,
  target,
}: CategoryCardProps) {
  const badgeMeta = getBadgeMeta(academicName);

  return (
    <Link to={`/products/categories/${id}`} className="block">
      <Card className={cn("hover:bg-card/50 transition")}>
        <CardHeader className="space-y-3">
          <CardTitle className="flex w-full flex-wrap items-center justify-between gap-2 text-2xl leading-none font-semibold tracking-tight">
            <div className="flex min-w-0 flex-nowrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("font-semibold", badgeMeta.className)}
              >
                {badgeMeta.label}
              </Badge>
              <span className="truncate">{name}</span>
            </div>
            <ChevronRightIcon className="text-muted-foreground size-5 shrink-0" />
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm"></CardDescription>
          {description ? (
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
