ALTER TABLE "bot_message_room_members" ALTER COLUMN "left_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bot_message_room_members" ALTER COLUMN "left_at" DROP NOT NULL;