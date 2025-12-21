-- Add conversation_id column to bot_message_rooms table
ALTER TABLE "bot_message_rooms" ADD COLUMN "conversation_id" text;

