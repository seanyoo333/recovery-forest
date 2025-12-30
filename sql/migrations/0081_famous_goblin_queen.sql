ALTER TYPE "public"."photo_type" ADD VALUE 'logo' BEFORE 'exterior';--> statement-breakpoint
ALTER TABLE "health_bookmarks" DROP CONSTRAINT "health_bookmarks_bot_message_room_id_bot_message_rooms_bot_message_room_id_fk";
--> statement-breakpoint
ALTER TABLE "health_bookmarks" ALTER COLUMN "bot_message_room_id" DROP NOT NULL;