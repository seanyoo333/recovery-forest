import { DateTime } from "luxon";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

interface ClinicCardProps {
  id: number;
  clinicName: string;
  clinicLogoUrl: string;
  clinicLocation: string;
  clinicType: string;
  clinicLevel: string;
  overview: string;
  location: string;
  createdAt: string;
}

export function ClinicCard({
  id,
  clinicName,
  clinicLogoUrl,
  clinicLocation,
  clinicType,
  clinicLevel,
  overview,
  location,
  createdAt,
}: ClinicCardProps) {
  return (
    <Link to={`/clinic/${id}`} className="relative z-10 block w-full">
      <Card className="neon-card !bg-background w-full cursor-pointer border !shadow-none transition-colors">
        <CardHeader className="relative z-10">
          <div className="mb-4 flex items-center gap-4">
            <img
              src={clinicLogoUrl}
              alt={`${clinicName} Logo`}
              className="size-10 rounded-full"
            />
            <div className="space-x-2">
              <span className="text-accent-foreground">{clinicName}</span>
              <span className="text-muted-foreground text-xs">
                {DateTime.fromISO(createdAt, {
                  zone: "utc",
                }).toRelative()}
              </span>
            </div>
          </div>
          <CardTitle>{overview}</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <Badge variant="outline" className="capitalize">
            {clinicType}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {location}
          </Badge>
        </CardContent>
        <CardFooter className="relative z-10 flex justify-between">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium">
              {clinicLevel}
            </span>

            <span className="text-muted-foreground text-sm font-medium">
              {clinicLocation}
            </span>
          </div>
          <Button variant="secondary" size="sm">
            Apply now
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
