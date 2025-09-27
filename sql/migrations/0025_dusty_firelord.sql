ALTER TABLE "bot_messages" DROP CONSTRAINT "bot_messages_sender_id_profiles_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "bot_message_room_members" ALTER COLUMN "left_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bot_message_room_members" ALTER COLUMN "left_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bot_messages" ALTER COLUMN "sender_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bot_messages" ALTER COLUMN "sender_id" SET NOT NULL;