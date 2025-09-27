import type { Route } from "./+types/chat.layout";

import { Outlet } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  getLoggedInUserId,
  getUserPointsByUserId,
} from "~/features/users/queries";

import ChatSidebar from "../components/chat-sidebar";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const userId = await getLoggedInUserId(client);

  // 사용자 포인트 조회
  const userPoints = await getUserPointsByUserId(client, { userId });

  return {
    user,
    userPoints,
  };
}

export default function ChatLayout({ loaderData }: Route.ComponentProps) {
  const { user, userPoints } = loaderData;
  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="h-full w-full overflow-y-auto">
          <Outlet
            context={{
              userId: user?.id ?? "",
              name: user?.user_metadata.name ?? "",
              avatar: user?.user_metadata.avatar_url ?? "",
              userPoints,
            }}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
