interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isConnected: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({
  input,
  setInput,
  isLoading,
  isConnected,
  onSubmit,
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isConnected ? "메시지를 입력하세요..." : "연결 중입니다..."
          }
          className="flex-1 rounded-lg border p-2"
          disabled={isLoading || !isConnected}
        />
        <button
          type="submit"
          disabled={isLoading || !isConnected}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </form>
  );
}
