import { Bot, Home, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Separator } from "~/core/components/ui/separator";
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

export default function ChatSidebar() {
  // AI 챗봇 정보
  const aiBot = {
    name: "Evidence Base AI",
    avatar: "/ai-bot-avatar.png",
    description: "AI-powered research assistant",
    capabilities: ["처방전으로 만들기", "대화 내용 요약", "추가 근거 저장"],
    status: "Online",
  };

  const isConnected = true;

  const handleQuickAction = (action: string) => {
    // 여기서 실제 입력 처리 로직을 구현할 수 있습니다
    console.log("Quick action:", action);
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={aiBot.avatar} alt={aiBot.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{aiBot.name}</span>
                <span className="truncate text-xs">{aiBot.description}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/">
                  <Home className="h-4 w-4" />
                  <span>홈</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleQuickAction("analyze")}>
                <Zap className="h-4 w-4" />
                <span>초대하기</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleQuickAction("trends")}>
                <Sparkles className="h-4 w-4" />
                <span>종료하기</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleQuickAction("review")}>
                <Bot className="h-4 w-4" />
                <span>내 상태창 확인</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <Separator />
        <SidebarGroup>
          <SidebarGroupLabel>Tools List</SidebarGroupLabel>
          <SidebarMenu>
            {aiBot.capabilities.map((capability, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton>
                  <Sparkles className="h-4 w-4" />
                  <span>{capability}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <Separator />

        <SidebarGroup>
          <SidebarGroupLabel>Status</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"}`}
                  />
                  <span>{aiBot.status}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4">
          {!isConnected && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <h4 className="mb-1 text-sm font-medium text-yellow-800">
                Connection Issue
              </h4>
              <p className="text-xs text-yellow-700">
                Unable to connect to AI server. Please check your connection.
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

