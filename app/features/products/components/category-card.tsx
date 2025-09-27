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
  description: string;
  mainEnergy: string;
  koreanName: string;
  koreanMainEnergy: string;
  energyType: string;
}

export function CategoryCard({
  id,
  name,
  description,
  mainEnergy,
  koreanName,
  koreanMainEnergy,
  energyType,
}: CategoryCardProps) {
  // 에너지 타입에 따른 뱃지 색상 설정
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "glucose":
        return "bg-red-500 text-white border-red-500";
      case "glutamine":
        return "bg-blue-500 text-white border-blue-500";
      case "fatty_acid":
        return "bg-yellow-500 text-black border-yellow-500";
      default:
        return "bg-gray-500 text-white border-gray-500";
    }
  };

  const content = (
    <Link to={`/products/categories/${id}`} className="relative z-10 block">
      <Card
        className={cn(
          "flex w-full flex-row items-center justify-between",
          "hover:bg-card/50 bg-transparent",
        )}
      >
        <CardHeader className="w-full">
          <CardTitle className="flex w-full flex-wrap items-center justify-between gap-2 text-2xl leading-none font-semibold tracking-tight">
            <div className="flex min-w-0 flex-nowrap items-center gap-2">
              <Badge
                className={`shrink-0 font-bold ${getBadgeColor(energyType)}`}
                variant={"outline"}
              >
                {koreanMainEnergy}
              </Badge>
              <span className="truncate">{koreanName}</span>
            </div>
            <ChevronRightIcon className="size-6 shrink-0" />
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );

  return content;
}
