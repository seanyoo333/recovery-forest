import { DotIcon } from "lucide-react";
import { Link } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

import { TEAM_POSITIONS } from "../constants";

interface TeamCardProps {
  id: string | number;
  teamName: string;
  leaderUsername: string;
  leaderAvatarUrl: string | null;
  leaderPosition: "doctor" | "nurse" | "nutritionist" | "foresttherapist";
  targets: string;
}

// team_position enum을 한국어로 변환하는 함수
const getPositionKorean = (
  position: "doctor" | "nurse" | "nutritionist" | "foresttherapist",
): string => {
  const positionItem = TEAM_POSITIONS.find((p) => p.value === position);
  return positionItem?.label || position;
};

// 전문 분야별 아이콘 색상
const getPositionColor = (
  position: "doctor" | "nurse" | "nutritionist" | "foresttherapist",
): string => {
  switch (position) {
    case "doctor":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "nurse":
      return "bg-green-100 text-green-800 border-green-200";
    case "nutritionist":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "foresttherapist":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function TeamCard({
  id,
  teamName,
  leaderPosition,
  leaderAvatarUrl,
  leaderUsername,
  targets,
}: TeamCardProps) {
  return (
    <Link to={`/teams/${id}`} className="block h-full">
      <Card className="hover:bg-card/50 h-full bg-transparent transition-colors">
        <CardHeader className="flex min-w-0 flex-1 flex-row items-start gap-2">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {leaderUsername?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
            {leaderAvatarUrl ? <AvatarImage src={leaderAvatarUrl} /> : null}
          </Avatar>
          <div className="space-y-2">
            <CardTitle className="text-lg leading-tight md:text-xl">
              {teamName}
            </CardTitle>
            <div className="text-muted-foreground flex gap-2 text-sm leading-tight">
              <span>팀 리더: {leaderUsername}</span>
              <DotIcon className="h-4 w-4" />
              <Badge
                className={`${getPositionColor(leaderPosition)} border font-medium`}
                variant="secondary"
              >
                {getPositionKorean(leaderPosition)}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="bg-primary h-2 w-2 rounded-full"></div>
                <span className="text-foreground text-sm font-medium">
                  추천 참여자
                </span>
              </div>
              <p className="text-muted-foreground pl-4 text-sm leading-relaxed">
                {targets}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex justify-end">
          <Button variant="link">팀 참여하기 &rarr;</Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
