import type { Route } from "./+types/team-page";

import { Form, Link, useOutletContext } from "react-router";

import { FEATURES } from "~/core/config/features";
import { Hero } from "~/core/components/hero";
import InputPair from "~/core/components/input-pair";
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
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import makeServerClient from "~/core/lib/supa-client.server";

import { getTeamById } from "../queries";

export const meta: Route.MetaFunction = () => [
  { title: "Team Details | Evidence Base" },
];

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const team = await getTeamById(client, { teamId: params.teamId });
  return { team };
};

export default function TeamPage({ loaderData }: Route.ComponentProps) {
  const context = useOutletContext<{ userId?: string }>();
  const userId = context?.userId;

  // team_leader가 null일 수 있으므로 안전하게 처리
  const teamLeader = loaderData.team.team_leader || {
    username: "unknown",
    name: "Unknown",
    avatar: null,
  };

  return (
    <div className="space-y-20">
      <Hero title={`${teamLeader.name}님의 팀 참여하기`} />
      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-6 md:gap-40">
        <div className="grid grid-cols-1 gap-5 md:col-span-4 md:grid-cols-4">
          {[
            {
              title: "팀명",
              value: loaderData.team.team_name,
            },
            {
              title: "전문 영역",
              value: loaderData.team.team_position,
            },
            {
              title: "팀 최대 인원 수",
              value: loaderData.team.team_size,
            },
            {
              title: "비용(원)",
              value: loaderData.team.cost,
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {item.title}
                </CardTitle>
                <CardContent className="p-0 text-2xl font-bold capitalize">
                  <p>{item.value}</p>
                </CardContent>
              </CardHeader>
            </Card>
          ))}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                세부 프로그램 설명
              </CardTitle>
              <CardContent className="p-0 text-2xl font-bold">
                <ul className="list-inside list-disc text-lg">
                  {[
                    "영양 식단 관리",
                    "보조제 사용 관리",
                    "산림치유 프로그램",
                  ].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </CardHeader>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                팀 소개
              </CardTitle>
              <CardContent className="p-0 text-xl font-medium">
                <p>{loaderData.team.team_description}</p>
              </CardContent>
            </CardHeader>
          </Card>
        </div>
        <aside className="space-y-5 rounded-lg border p-6 shadow-sm md:col-span-2">
          <div className="flex gap-5">
            <Link to={`/users/${teamLeader.username}`}>
              <Avatar className="size-14">
                <AvatarFallback>{teamLeader.name[0]}</AvatarFallback>
                {teamLeader.avatar ? (
                  <AvatarImage src={teamLeader.avatar} />
                ) : null}
              </Avatar>
            </Link>
            <div className="flex flex-col items-start">
              <Link to={`/users/${teamLeader.username}`}>
                <h4 className="text-lg font-medium">{teamLeader.name}</h4>
              </Link>
              <Badge variant="secondary" className="capitalize">
                {loaderData.team.team_position}
              </Badge>
            </div>
          </div>
          {/* 사용자 메시지 (MVP: 숨김) */}
          {FEATURES.userMessages &&
            userId &&
            userId !== loaderData.team.team_leader_id && (
              <Form
                className="space-y-5"
                method="post"
                action={`/users/${teamLeader.username}/messages`}
              >
                <InputPair
                  label="소개하기"
                  description="당신의 소개를 입력하세요"
                  name="content"
                  type="text"
                  id="introduction"
                  required
                  textArea
                  placeholder="i.e. 산림치유를 통해 더 건강해 지고 싶습니다."
                />
                <Button type="submit" className="w-full font-bold">
                  메세지 보내기
                </Button>
              </Form>
            )}
        </aside>
      </div>
    </div>
  );
}
