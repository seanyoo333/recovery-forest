CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chat_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_id" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"session_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chat_sessions_session_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"session_name" text DEFAULT 'New Chat' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint



CREATE POLICY "chat-messages-select-policy" ON "chat_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM chat_sessions
        WHERE session_id = "chat_messages"."session_id"
        AND user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "chat-messages-insert-policy" ON "chat_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM chat_sessions
        WHERE session_id = "chat_messages"."session_id"
        AND user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "chat-sessions-select-policy" ON "chat_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "chat_sessions"."user_id");--> statement-breakpoint
CREATE POLICY "chat-sessions-insert-policy" ON "chat_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "chat_sessions"."user_id");--> statement-breakpoint
CREATE POLICY "chat-sessions-update-policy" ON "chat_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "chat_sessions"."user_id") WITH CHECK ((select auth.uid()) = "chat_sessions"."user_id");--> statement-breakpoint
CREATE POLICY "chat-sessions-delete-policy" ON "chat_sessions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "chat_sessions"."user_id");--> statement-breakpoint
CREATE POLICY "admin-logs-select-policy" ON "admin_activity_logs" AS RESTRICTIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = (select auth.uid())
        AND is_active = true
      ));--> statement-breakpoint