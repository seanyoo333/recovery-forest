import type { Route } from "./+types/dashboard.layout";

import { Outlet } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";
import makeServerClient from "~/core/lib/supa-client.server";

import DashboardSidebar from "../components/dashboard-sidebar";
import { getLoggedInUserId, getMessages } from "../queries";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const userId = await getLoggedInUserId(client);
  const messages = await getMessages(client, { userId });
  console.log("messages", messages);

  return {
    user,
    messages,
  };
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { user, messages } = loaderData;
  return (
    <SidebarProvider>
      <DashboardSidebar
        user={{
          name: user?.user_metadata.name ?? "",
          avatarUrl: user?.user_metadata.avatar_url ?? "",
          email: user?.email ?? "",
        }}
        messages={messages as any}
      />
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
            }}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
