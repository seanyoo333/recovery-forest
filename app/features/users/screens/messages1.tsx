/**
 * Messages Screen
 *
 * This component displays a list of user messages and conversations.
 * Users can view their message history and start new conversations.
 */

import type { Route } from "./+types/messages";

import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Badge } from "~/core/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import { Separator } from "~/core/components/ui/separator";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: "Messages | Dashboard",
    },
  ];
};

export default function Messages({ loaderData }: Route.ComponentProps) {
  // Mock data - 실제로는 loader에서 메시지 데이터를 가져와야 함
  const conversations = [
    {
      id: 1,
      user: {
        name: "Alice Johnson",
        avatar: "/placeholder-avatar-1.jpg",
        online: true,
      },
      lastMessage: "Thanks for the help!",
      timestamp: "2024-01-15T10:30:00Z",
      unreadCount: 2,
      isActive: true,
    },
    {
      id: 2,
      user: {
        name: "Bob Smith",
        avatar: "/placeholder-avatar-2.jpg",
        online: false,
      },
      lastMessage: "Can you review my latest project?",
      timestamp: "2024-01-14T15:45:00Z",
      unreadCount: 0,
      isActive: false,
    },
    {
      id: 3,
      user: {
        name: "Carol Davis",
        avatar: "/placeholder-avatar-3.jpg",
        online: true,
      },
      lastMessage: "The meeting is scheduled for tomorrow.",
      timestamp: "2024-01-14T09:20:00Z",
      unreadCount: 1,
      isActive: false,
    },
    {
      id: 4,
      user: {
        name: "David Wilson",
        avatar: "/placeholder-avatar-4.jpg",
        online: false,
      },
      lastMessage: "Great work on the presentation!",
      timestamp: "2024-01-13T14:15:00Z",
      unreadCount: 0,
      isActive: false,
    },
  ];

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Messages</h1>
          {totalUnread > 0 && (
            <Badge variant="default">{totalUnread} unread</Badge>
          )}
        </div>
        <p className="text-muted-foreground">Manage your conversations</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversations</CardTitle>
                <Button size="sm">New</Button>
              </div>
              <Input placeholder="Search conversations..." className="mt-2" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      conversation.isActive ? "bg-blue-50 border-r-2 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage 
                            src={conversation.user.avatar} 
                            alt={conversation.user.name} 
                          />
                          <AvatarFallback>
                            {conversation.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.user.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">
                            {conversation.user.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conversation.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder-avatar-1.jpg" alt="Alice Johnson" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">Alice Johnson</CardTitle>
                  <p className="text-sm text-muted-foreground">Online</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0">
              <div className="h-full flex flex-col">
                {/* Messages */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs">
                      <p className="text-sm">Hi Alice! How are you doing?</p>
                      <p className="text-xs opacity-75 mt-1">10:30 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                      <p className="text-sm">Hi! I'm doing great, thanks for asking. How about you?</p>
                      <p className="text-xs text-muted-foreground mt-1">10:32 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs">
                      <p className="text-sm">I'm good too! Just wanted to check in.</p>
                      <p className="text-xs opacity-75 mt-1">10:33 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                      <p className="text-sm">Thanks for the help!</p>
                      <p className="text-xs text-muted-foreground mt-1">10:35 AM</p>
                    </div>
                  </div>
                </div>
                
                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Type your message..." 
                      className="flex-1"
                    />
                    <Button>Send</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 