import type { Route } from "./+types/profile-layout";

import {
  Form,
  Link,
  NavLink,
  Outlet,
  useNavigation,
  useOutletContext,
} from "react-router";

import { cn } from "~/lib/utils";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button, buttonVariants } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/core/components/ui/dialog";
import { Textarea } from "~/core/components/ui/textarea";
import makeServerClient from "~/core/lib/supa-client.server";

import { FollowButton } from "../components/follow-button";
import { getUserProfile } from "../queries";

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: `${data.user.name} | Evidence Base` }];
};

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs & { params: { username: string } }) => {
  const [client] = makeServerClient(request);
  const user = await getUserProfile(client, {
    username: params.username,
  });
  return { user };
};

export default function ProfileLayout({
  loaderData,
  params,
}: Route.ComponentProps & { params: { username: string } }) {
  // Root에서 전달된 context 사용
  const { isLoggedIn, username } = useOutletContext<{
    isLoggedIn: boolean;
    username?: string;
  }>();
  const navigation = useNavigation();
  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <Avatar className="size-40">
          {loaderData.user.avatar ? (
            <AvatarImage src={loaderData.user.avatar} />
          ) : (
            <AvatarFallback className="text-2xl">
              {loaderData.user.name?.[0]}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <h1 className="w-full text-2xl font-semibold md:w-fit">
              {loaderData.user.name}
            </h1>
            {isLoggedIn && username === params.username ? (
              <Button variant="outline" asChild>
                <Link to="/my/settings">프로필 수정</Link>
              </Button>
            ) : null}
            {isLoggedIn && username !== params.username ? (
              <>
                <FollowButton
                  username={params.username}
                  isFollowing={loaderData.user.is_following}
                  variant="secondary"
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary">메세지</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>메세지</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="space-y-4" asChild>
                      <Form
                        method="post"
                        action={`/users/${loaderData.user.username}/messages`}
                      >
                        <span className="text-muted-foreground text-sm">
                          따뜻한 메세지를 보내보세요.
                        </span>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Message"
                            className="resize-none"
                            name="content"
                            rows={4}
                          />
                          <Button
                            type="submit"
                            disabled={navigation.state === "submitting"}
                          >
                            {navigation.state === "submitting"
                              ? "Sending..."
                              : "Send"}
                          </Button>
                        </div>
                      </Form>
                    </DialogDescription>
                  </DialogContent>
                </Dialog>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">
              @{loaderData.user.username}
            </span>
            <Badge variant={"secondary"} className="capitalize">
              {loaderData.user.role}
            </Badge>
            <Badge variant={"secondary"}>
              {loaderData.user.followers} followers
            </Badge>
            <Badge variant={"secondary"}>
              {loaderData.user.following} following
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex w-full justify-center gap-5 md:justify-start">
        {[
          { label: "About", to: `/users/${loaderData.user.username}` },
          {
            label: "Teams",
            to: `/users/${loaderData.user.username}/teams`,
          },
          { label: "Posts", to: `/users/${loaderData.user.username}/posts` },
        ].map((item) => (
          <NavLink
            end
            key={item.label}
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: "outline" }),
                isActive && "bg-accent text-foreground",
              )
            }
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="max-w-screen-md">
        <Outlet
          context={{
            headline: loaderData.user.headline,
            bio: loaderData.user.bio,
            isLoggedIn,
            username,
          }}
        />
      </div>
    </div>
  );
}
