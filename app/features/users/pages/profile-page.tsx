/**
 * Public Profile Page
 *
 * This component displays a user's public profile information.
 * It's accessible to all users and shows basic profile information.
 */
import type { Route } from "./+types/profile-page";

import { Link, useOutletContext } from "react-router";

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
import { Separator } from "~/core/components/ui/separator";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getUserProfile } from "../queries";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  // 현재 로그인한 사용자 정보 가져오기
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  await adminClient.rpc("track_event", {
    event_type: "profile_view",
    event_data: {
      username: params.username,
    },
    profile_id: user?.id as string,
  });
  return {};
};

export default function ProfilePage() {
  const { headline, bio } = useOutletContext<{
    headline: string;
    bio: string;
  }>();
  return (
    <div className="flex max-w-screen-md flex-col space-y-10">
      <div className="space-y-2">
        <h4 className="text-lg font-bold">삶의 정체성</h4>
        {headline ? (
          <p className="text-muted-foreground">{headline}</p>
        ) : (
          <p className="text-muted-foreground">
            {" "}
            <Button variant={"link"} asChild className="p-0 text-base">
              <Link to="/my/profile/settings">프로필 수정</Link>
            </Button>{" "}
            에서 자신을 표현하는 가장 중요한 정체성을 소개해 주세요.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <h4 className="text-lg font-bold">회복의 여정</h4>
        {bio ? (
          <p className="text-muted-foreground">{bio}</p>
        ) : (
          <p className="text-muted-foreground">
            {" "}
            <Button variant={"link"} asChild className="p-0 text-base">
              <Link to="/my/profile/settings">프로필 수정</Link>
            </Button>{" "}
            에서 자신의 치유 과정 중 가장 도움이 되었다고 생각하는 경험 세
            가지를 공유해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
