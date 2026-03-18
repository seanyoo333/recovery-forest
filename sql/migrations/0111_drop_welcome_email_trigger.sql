-- 환영 이메일 발송을 가입 완료 이벤트(join action)로 이전함.
-- DB 트리거를 제거하여 중복 발송을 방지합니다.

DROP TRIGGER IF EXISTS welcome_email ON auth.users;
