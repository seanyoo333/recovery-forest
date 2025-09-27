import type { Route } from "./+types/teams-page";

import { Hero } from "~/core/components/hero";
import makeServerClient from "~/core/lib/supa-client.server";

import { TeamCard } from "../components/team-card";
import { getTeams } from "../queries";

export const meta: Route.MetaFunction = () => [
  { title: "Teams | Evidence Base" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const teams = await getTeams(client, { limit: 100 });
  return { teams };
};

export default function TeamsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <Hero
        title="전문가 그룹"
        subtitle="전문가 그룹과 함께 건강을 찾으세요."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {loaderData.teams.map((team) => (
          <TeamCard
            key={team.team_id}
            id={team.team_id}
            teamName={team.team_name}
            leaderUsername={team.team_leader?.username || "Unknown"}
            leaderAvatarUrl={team.team_leader?.avatar}
            leaderPosition={
              team.team_position as
                | "doctor"
                | "nurse"
                | "nutritionist"
                | "foresttherapist"
            }
            targets={team.target}
          />
        ))}
      </div>
    </div>
  );
}

/* leaderUsername={team.team_leader_id.username}
            leaderAvatarUrl={team.team_leader_id.avatar} */

/* {Array.from({ length: 8 }).map((_, index) => (
  <TeamCard
    key={`teamId-${index}`}
    id={`teamId-${index}`}
    leaderUsername="좋은습관"
    leaderPosition={["산림치유지도사", "영양사"]}
    leaderAvatarUrl="https://github.com/inthetiger.png"
    programs={[
      "영양 식단 관린",
      "보조제 사용 관리",
      "산림치유 프로그램",
    ]}
    projectDescription="선착순 10명 모집"
  />
))} */
