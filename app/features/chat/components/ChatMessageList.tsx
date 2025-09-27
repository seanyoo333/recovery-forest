import type { ChatMessage } from "~/core/lib/supabase.client";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`mb-4 ${
            message.role === "user" ? "text-right" : "text-left"
          }`}
        >
          <div
            className={`inline-block rounded-lg p-3 ${
              message.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
} 