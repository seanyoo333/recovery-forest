import type { Route } from "./+types/profile-teams-page";

import makeServerClient from "~/core/lib/supa-client.server";
import { TeamCard } from "~/features/teams/components/team-card";

import { getUserTeams } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Groups | Evidence Base" }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const teams = await getUserTeams(client, {
    username: params.username,
  });
  return { teams };
};

export default function ProfileTeamsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-5">
      {loaderData.teams.map((team) => (
        <TeamCard
          key={team.team_id}
          id={team.team_id}
          teamName={team.team_name}
          leaderUsername={team.profiles.username}
          leaderAvatarUrl={team.profiles.avatar}
          leaderPosition={team.team_position}
          targets={team.target}
        />
      ))}
    </div>
  );
}
