import type { Route } from "./+types/chat-page";

import { Bot, Brain, MessageSquare } from "lucide-react";

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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { ChatInput } from "../components/ChatInput";
import { ChatMessageList } from "../components/ChatMessageList";
import ChatSidebar from "../components/chat-sidebar";
import { useChatMessages } from "../hooks/useChatMessages";
import { getChatMessages, getChatSessions } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "AI Chat | Evidence-Base" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    // Get user's chat sessions
    const sessions = await getChatSessions(client, userId);

    // Get messages from the most recent session if it exists
    let messages: any[] = [];
    let currentSessionId: number | null = null;

    if (sessions.length > 0) {
      const recentSession = sessions[0];
      currentSessionId = recentSession.session_id;
      messages = await getChatMessages(
        client,
        recentSession.session_id,
        userId,
      );
    }

    return {
      userId,
      sessions,
      messages,
      currentSessionId,
    };
  } catch (error) {
    console.error("Chat loader error:", error);
    // 오류가 발생해도 빈 상태로 반환하여 페이지가 로드되도록 함
    return {
      userId: null,
      sessions: [],
      messages: [],
      currentSessionId: null,
    };
  }
};

export default function ChatPage({ loaderData }: Route.ComponentProps) {
  console.log("ChatPage loaded with data:", loaderData);

  const { userId, messages: initialMessages, currentSessionId } = loaderData;

  // user가 null이면 로그인 페이지로 리다이렉트
  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground">
            Please log in to access the chat.
          </p>
        </div>
      </div>
    );
  }

  const { messages, input, setInput, isLoading, isConnected, handleSubmit } =
    useChatMessages(initialMessages, userId, currentSessionId);

  // AI 챗봇 정보
  const aiBot = {
    name: "Evidence Base AI",
    avatar: "/ai-bot-avatar.png",
    description: "AI-powered research assistant",
    capabilities: [
      "Research analysis",
      "Data interpretation",
      "Evidence synthesis",
      "Literature review",
    ],
    status: isConnected ? "Online" : "Connecting...",
  };

  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="h-full w-full">
          <div className="h-full">
            {/* Chat Area */}
            <div className="h-full p-6">
              <Card className="flex h-full flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={aiBot.avatar} alt={aiBot.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{aiBot.name}</CardTitle>
                        <p className="text-muted-foreground flex items-center gap-1 text-sm">
                          <MessageSquare className="h-3 w-3" />
                          AI Research Assistant
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {messages.length} messages
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-0">
                  <div className="flex h-full flex-col">
                    {/* Messages */}
                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                      {messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                            <Brain className="h-8 w-8 text-blue-600" />
                          </div>
                          <h3 className="mb-2 text-lg font-medium">
                            Welcome to Evidence Base AI
                          </h3>
                          <p className="text-muted-foreground max-w-md">
                            I'm your AI research assistant. Ask me anything
                            about research, data analysis, or evidence
                            synthesis. I'm here to help you find and interpret
                            information.
                          </p>
                          <div className="mt-6 grid w-full max-w-sm grid-cols-1 gap-2">
                            <Button
                              variant="outline"
                              className="h-auto justify-start p-3 text-left"
                              onClick={() =>
                                setInput(
                                  "Can you help me analyze this research data?",
                                )
                              }
                            >
                              <div>
                                <div className="font-medium">
                                  Analyze research data
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  Get insights from your data
                                </div>
                              </div>
                            </Button>
                            <Button
                              variant="outline"
                              className="h-auto justify-start p-3 text-left"
                              onClick={() =>
                                setInput(
                                  "What are the latest trends in AI research?",
                                )
                              }
                            >
                              <div>
                                <div className="font-medium">
                                  Research trends
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  Explore current developments
                                </div>
                              </div>
                            </Button>
                            <Button
                              variant="outline"
                              className="h-auto justify-start p-3 text-left"
                              onClick={() =>
                                setInput("Help me write a literature review")
                              }
                            >
                              <div>
                                <div className="font-medium">
                                  Literature review
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  Structure your review
                                </div>
                              </div>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`flex max-w-xs gap-3 lg:max-w-md ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                              {message.role === "assistant" && (
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage
                                    src={aiBot.avatar}
                                    alt={aiBot.name}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs text-white">
                                    <Bot className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  message.role === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">
                                  {message.content}
                                </p>
                                <p
                                  className={`mt-1 text-xs ${
                                    message.role === "user"
                                      ? "opacity-75"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {message.timestamp
                                    ? new Date(
                                        message.timestamp,
                                      ).toLocaleTimeString()
                                    : "Now"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="flex max-w-xs gap-3 lg:max-w-md">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage
                                src={aiBot.avatar}
                                alt={aiBot.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs text-white">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="rounded-lg bg-gray-100 px-4 py-2">
                              <div className="flex items-center gap-1">
                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                                <div
                                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <ChatInput
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                        isConnected={isConnected}
                        onSubmit={handleSubmit}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
