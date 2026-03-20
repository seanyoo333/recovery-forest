import {
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
import { FEATURES } from "~/core/config/features";

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
          title: "건강정보",
          url: "/my/dashboard/health",
        },
        {
          title: "생활습관",
          url: "/my/dashboard/health-habits",
        },
        {
          title: "맞춤 건강 보고서",
          url: "/my/dashboard/health/report",
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
          url: "/my/dashboard/bookmarks",
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
      title: "천연물질",
      url: "/natural-ingredients",
      icon: LineChartIcon,
      items: [
        {
          title: "전체 천연물질",
          url: "/natural-ingredients",
        },
        {
          title: "표적별 모음",
          url: "/natural-ingredients/targets",
        },
        {
          title: "대사 안정화",
          url: "/my/dashboard/metabolic-fuel",
        },
        {
          title: "EV AI 천연물질 추천",
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
        {/* Messages Section (MVP: 숨김) */}
        {FEATURES.userMessages && (
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
        )}

        {/* <SidebarProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <div className="text-muted-foreground px-3 py-4 text-xs">
          Evidence Base © {new Date().getFullYear()}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
