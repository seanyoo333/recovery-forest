import {
  AudioWaveformIcon,
  BookOpenIcon,
  BotIcon,
  BriefcaseIcon,
  BuildingIcon,
  CommandIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  MapIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  PieChartIcon,
  RocketIcon,
  Settings2Icon,
  SquareTerminalIcon,
  Target,
  UsersIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/core/components/ui/sidebar";

import MessageRoomCard from "./message-room-card";
import SidebarMain from "./sidebar-main";
import SidebarProjects from "./sidebar-projects";
import TeamSwitcher from "./sidebar-team-switcher";
import SidebarUser from "./sidebar-user";

const data = {
  teams: [],
  navMain: [
    {
      title: "Health Analytics",
      url: "#",
      icon: LayoutDashboardIcon,
      isActive: true,
      items: [
        {
          title: "혈액검사 현황",
          url: "/my/dashboard/health",
        },
        {
          title: "혈액검사 입력",
          url: "/my/dashboard/health/consent",
        },
        {
          title: "EV AI 혈액검사 분석",
          url: "/my/dashboard/health/analysis",
        },
      ],
    },
    {
      title: "Evidence",
      url: "#",
      icon: UsersIcon,
      items: [
        {
          title: "근거자료 북마크",
          url: "#",
        },
        {
          title: "근거자료 기반 질문하기",
          url: "#",
        },
        {
          title: "EV AI 근거자료 검색",
          url: "#",
        },
      ],
    },
    {
      title: "Products",
      url: "#",
      icon: LineChartIcon,
      items: [
        {
          title: "관련제품 카트",
          url: "#",
        },
        {
          title: "관련제품 검색",
          url: "#",
        },
        {
          title: "EV AI 제품 추천",
          url: "#",
        },
      ],
    },
  ],
  /* projects: [
    {
      name: "Sales Team",
      url: "#",
      icon: Target,
    },
    {
      name: "Customer Success",
      url: "#",
      icon: HeartHandshakeIcon,
    },
    {
      name: "Marketing",
      url: "#",
      icon: MegaphoneIcon,
    },
  ], */
};

export default function DashboardSidebar({
  user,
  messages = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatarUrl: string;
  };
  messages?: {
    avatar?: string;
    last_message?: string;
    last_time?: string;
    message_room_id: number;
    name: string;
    other_profile_id: string;
    profile_id: string;
    is_read?: boolean;
  }[];
}) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarUser
          user={{
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          }}
        />
        <div className="border-border my-3 border-t" />
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMain items={data.navMain} />

        {/* 구분선 */}
        <div className="border-border my-2 border-t" />
        {/* Messages Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Messages</SidebarGroupLabel>
          <SidebarMenu>
            {messages.map((message) => (
              <MessageRoomCard
                key={message.message_room_id}
                id={message.message_room_id.toString()}
                name={message.name}
                avatarUrl={message.avatar ?? ""}
                lastMessage={message.last_message ?? ""}
                lastTime={message.last_time ?? ""}
                isRead={message.is_read ?? false}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* <SidebarProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <div className="text-muted-foreground px-3 py-4 text-xs">Evidence Base © {new Date().getFullYear()}</div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
