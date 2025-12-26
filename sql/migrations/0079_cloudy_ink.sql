-- conversation_id를 text에서 uuid로 변환
-- 유효한 UUID 형식만 변환하고, NULL이거나 유효하지 않은 값은 NULL로 설정
ALTER TABLE "bot_message_rooms" 
  ALTER COLUMN "conversation_id" 
  SET DATA TYPE uuid 
  USING CASE 
    WHEN conversation_id IS NULL THEN NULL
    WHEN conversation_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN conversation_id::uuid
    ELSE NULL
  END;