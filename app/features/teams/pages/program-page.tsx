import type { Route } from "./+types/program-page";

import {
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
  MapPinIcon,
} from "lucide-react";
import { DateTime } from "luxon";

import { Hero } from "~/core/components/hero";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";

import { getProgramById } from "../queries";

export const meta: Route.MetaFunction = () => [
  { title: "Program Details | Evidence Base" },
];

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const program = await getProgramById(client, { programId: params.programId });
  return { program };
};

export default function ProgramPage({ loaderData }: Route.ComponentProps) {
  const program = loaderData.program;

  const programDate = DateTime.fromISO(program.program_date_start, {
    zone: "Asia/Seoul",
  });
  const recruitmentStart = DateTime.fromISO(program.program_recruitment_start, {
    zone: "Asia/Seoul",
  });
  const recruitmentEnd = DateTime.fromISO(program.program_recruitment_end, {
    zone: "Asia/Seoul",
  });
  const now = DateTime.now().setZone("Asia/Seoul");

  const isRecruiting = now >= recruitmentStart && now <= recruitmentEnd;
  const isUpcoming = now < recruitmentStart;
  const isExpired = now > recruitmentEnd;

  const getRecruitmentStatus = () => {
    if (isRecruiting)
      return {
        label: "모집중",
        variant: "default" as const,
        color: "bg-green-100 text-green-800 border-green-200",
      };
    if (isUpcoming)
      return {
        label: "모집예정",
        variant: "secondary" as const,
        color: "bg-blue-100 text-blue-800 border-blue-200",
      };
    if (isExpired)
      return {
        label: "모집마감",
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800 border-red-200",
      };
    return {
      label: "상태불명",
      variant: "outline" as const,
      color: "bg-gray-100 text-gray-800 border-gray-200",
    };
  };

  const status = getRecruitmentStatus();

  return (
    <div className="space-y-20">
      <Hero
        title="추천 건강 프로그램"
        subtitle="당신에게 맞는 건강 프로그램을 EVI AI가 찾아왔습니다."
      />
      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-6 md:gap-40">
        <div className="grid grid-cols-1 gap-5 md:col-span-4">
          {/* 프로그램 이미지 */}
          <Card>
            <CardContent className="p-0">
              <img
                src={program.program_image}
                alt={program.program_name}
                className="h-64 w-full rounded-lg object-cover"
              />
            </CardContent>
          </Card>

          {/* 기본 정보 카드들 */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              {
                title: "프로그램 일정",
                value: programDate.toFormat("yyyy년 MM월 dd일"),
                icon: <CalendarIcon className="h-5 w-5" />,
              },
              {
                title: "프로그램 시간",
                value: `${program.program_time_start} - ${program.program_time_end}`,
                icon: <ClockIcon className="h-5 w-5" />,
              },
              {
                title: "장소",
                value: program.program_location,
                icon: <MapPinIcon className="h-5 w-5" />,
              },
              {
                title: "참가비",
                value: program.is_free ? "무료" : "유료",
                icon: null,
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    {item.icon}
                    {item.title}
                  </CardTitle>
                  <CardContent className="p-0 text-lg font-bold">
                    <p>{item.value}</p>
                  </CardContent>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* 프로그램 설명 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                프로그램 소개
              </CardTitle>
              <CardContent className="p-0 text-lg leading-relaxed">
                <p>{program.program_description}</p>
              </CardContent>
            </CardHeader>
          </Card>

          {/* 프로그램 안내 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                프로그램 안내
              </CardTitle>
              <CardContent className="p-0 text-lg leading-relaxed">
                <p>{program.program_notice}</p>
              </CardContent>
            </CardHeader>
          </Card>

          {/* 상세 주소 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                상세 주소
              </CardTitle>
              <CardContent className="p-0 text-lg">
                <p>{program.program_address}</p>
              </CardContent>
            </CardHeader>
          </Card>
        </div>

        {/* 사이드바 */}
        <aside className="space-y-5 rounded-lg border p-6 shadow-sm md:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">모집 현황</h3>
              <Badge
                className={`${status.color} border font-medium`}
                variant={status.variant}
              >
                {status.label}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-muted-foreground text-sm font-medium">
                  모집 기간
                </h4>
                <p className="text-sm">
                  {recruitmentStart.toFormat("yyyy.MM.dd")} -{" "}
                  {recruitmentEnd.toFormat("yyyy.MM.dd")}
                </p>
              </div>

              <div>
                <h4 className="text-muted-foreground text-sm font-medium">
                  프로그램 일정
                </h4>
                <p className="text-sm">
                  {programDate.toFormat("yyyy.MM.dd")}{" "}
                  {program.program_time_start} - {program.program_time_end}
                </p>
              </div>

              <div>
                <h4 className="text-muted-foreground text-sm font-medium">
                  장소
                </h4>
                <p className="text-sm">{program.program_location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full font-bold"
              size="lg"
              onClick={() => window.open(program.program_url, "_blank")}
              disabled={isExpired}
            >
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              {isExpired ? "모집 마감" : "프로그램 신청하기"}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-2 text-sm font-medium">주의사항</h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>• 프로그램 시작 전까지 신청이 가능합니다.</li>
              <li>• 신청 후 취소는 프로그램 시작 24시간 전까지 가능합니다.</li>
              <li>• 문의사항이 있으시면 고객센터로 연락해주세요.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
