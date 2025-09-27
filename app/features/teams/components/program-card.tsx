import { CalendarIcon, ClockIcon, MapPinIcon } from "lucide-react";
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
import { cn } from "~/core/lib/utils";

interface ProgramCardProps {
  id: number;
  programName: string;
  programLocation: string;
  programAddress: string;
  programDescription: string;
  programNotice: string;
  programImage: string;
  isFree: boolean;
  programUrl: string;
  programDateStart: string;
  programTimeStart: string;
  programTimeEnd: string;
  programRecruitmentStart: string;
  programRecruitmentEnd: string;
  expanded?: boolean;
}

export function ProgramCard({
  id,
  programName,
  programLocation,
  programAddress,
  programDescription,
  programNotice,
  programImage,
  isFree,
  programUrl,
  programDateStart,
  programTimeStart,
  programTimeEnd,
  programRecruitmentStart,
  programRecruitmentEnd,
  expanded = false,
}: ProgramCardProps) {
  const programDate = DateTime.fromISO(programDateStart, {
    zone: "Asia/Seoul",
  });
  const recruitmentStart = DateTime.fromISO(programRecruitmentStart, {
    zone: "Asia/Seoul",
  });
  const recruitmentEnd = DateTime.fromISO(programRecruitmentEnd, {
    zone: "Asia/Seoul",
  });
  const now = DateTime.now().setZone("Asia/Seoul");

  const isRecruiting = now >= recruitmentStart && now <= recruitmentEnd;
  const isUpcoming = now < recruitmentStart;
  const isExpired = now > recruitmentEnd;

  const getRecruitmentStatus = () => {
    if (isRecruiting) return { label: "모집중", variant: "default" as const };
    if (isUpcoming) return { label: "모집예정", variant: "secondary" as const };
    if (isExpired)
      return { label: "모집마감", variant: "destructive" as const };
    return { label: "상태불명", variant: "outline" as const };
  };

  const status = getRecruitmentStatus();

  return (
    <Link to={`/programs/${id}`} className="block h-full">
      <Card
        className={cn(
          "hover:bg-card/50 h-full bg-transparent transition-colors",
          expanded
            ? "flex flex-row flex-wrap items-center justify-between"
            : "",
        )}
      >
        <CardHeader className="flex min-w-0 flex-1 flex-row items-start gap-4">
          <div className="relative">
            <img
              src={programImage}
              alt={programName}
              className="h-20 w-20 rounded-lg object-cover"
            />
            {isFree && (
              <Badge
                className="absolute -top-2 -right-2 bg-green-500 text-white"
                variant="default"
              >
                무료
              </Badge>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg leading-tight md:text-xl">
                {programName}
              </CardTitle>
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <MapPinIcon className="h-4 w-4" />
                <span>{programLocation}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4" />
                <span>{programDate.toFormat("yyyy.MM.dd")}</span>
                <ClockIcon className="h-4 w-4" />
                <span>
                  {programTimeStart} - {programTimeEnd}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
              {programDescription}
            </p>
          </div>
        </CardHeader>
        {!expanded && (
          <CardFooter className="flex justify-end">
            <Button variant="link">자세히 보기 &rarr;</Button>
          </CardFooter>
        )}
        {expanded && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">프로그램 안내</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {programNotice}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">모집 기간</h4>
              <p className="text-muted-foreground text-sm">
                {recruitmentStart.toFormat("yyyy.MM.dd")} -{" "}
                {recruitmentEnd.toFormat("yyyy.MM.dd")}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">장소</h4>
              <p className="text-muted-foreground text-sm">{programAddress}</p>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
