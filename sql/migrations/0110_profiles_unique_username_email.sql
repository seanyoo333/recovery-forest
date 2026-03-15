-- profiles 테이블에 username, email 유니크 제약 추가
-- 중복 가입 방지를 위해 DB 레벨에서 강제

-- username 유니크 (필수 필드)
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_username_unique" ON "public"."profiles" ("username");

-- email 유니크 (nullable - PostgreSQL은 NULL을 각각 다르게 취급하여 여러 NULL 허용)
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_email_unique" ON "public"."profiles" ("email");
