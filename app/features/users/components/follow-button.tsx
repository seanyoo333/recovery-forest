import type { Variable } from "lucide-react";

import { Link, useFetcher, useOutletContext } from "react-router";

import { Button, type ButtonProps } from "~/core/components/ui/button";

interface FollowButtonProps {
  username: string;
  isFollowing: boolean;
  variant?: ButtonProps["variant"];
}

export function FollowButton({
  username,
  isFollowing,
  variant = "outline",
}: FollowButtonProps) {
  const fetcher = useFetcher();

  // Root에서 전달된 context 사용
  const context = useOutletContext<{
    isLoggedIn: boolean;
  }>();

  const { isLoggedIn = false } = context || {};

  const optimisitcIsFollowing =
    fetcher.state === "idle" ? isFollowing : !isFollowing;
  if (!isLoggedIn) {
    return (
      <Button variant="outline" className="w-full" asChild>
        <Link to="/login">로그인하고 팔로우하기</Link>
      </Button>
    );
  }
  return (
    <fetcher.Form method="post" action={`/users/${username}/follow`}>
      <Button variant={variant} className="w-full font-bold">
        {optimisitcIsFollowing ? "팔로우 취소" : "팔로우 하기"}
      </Button>
    </fetcher.Form>
  );
}
