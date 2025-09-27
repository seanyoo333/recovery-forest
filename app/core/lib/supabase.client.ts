import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 채팅 메시지 타입
export type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
  userId: string;
};

// 채팅 관련 함수들
export const chatApi = {
  // 채팅 메시지 저장
  async saveMessage(message: Omit<ChatMessage, "id" | "createdAt">) {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 채팅 히스토리 조회
  async getChatHistory(userId: string) {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: true });

    if (error) throw error;
    return data;
  },
};
