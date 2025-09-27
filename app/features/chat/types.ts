/**
 * Chat Types
 *
 * TypeScript type definitions for AI chat functionality.
 */

export interface ChatSession {
  session_id: number;
  user_id: string;
  session_name: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: {
    prescription?: string;
    response_type?: string;
  };
  created_at: string;
}

export interface AIBot {
  name: string;
  avatar: string;
  description: string;
  capabilities: string[];
  status: string;
}

export interface LLMResponse {
  status: "success" | "error";
  message: any;
  error?: string;
}
