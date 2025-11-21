-- Grant permissions to service_role for message tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "message_rooms" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "message_room_members" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "messages" TO "service_role";

-- Also grant usage on sequences (for auto-increment columns)
GRANT USAGE, SELECT ON SEQUENCE "message_rooms_message_room_id_seq" TO "service_role";
GRANT USAGE, SELECT ON SEQUENCE "messages_message_id_seq" TO "service_role";

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "admin_permissions" TO "authenticated";

-- profiles 테이블에 대한 접근 권한 설정
GRANT INSERT, UPDATE, DELETE ON TABLE "profiles" TO "authenticated";
GRANT SELECT ON TABLE "profiles" TO "public";

GRANT UPDATE ON TABLE "profiles" TO "service_role";

-- follows 테이블에 대한 접근 권한 설정
GRANT INSERT, UPDATE, DELETE ON TABLE "follows" TO "authenticated";
GRANT SELECT ON TABLE "follows" TO "public";
GRANT UPDATE ON TABLE "follows" TO "service_role";


-- products 테이블에 대한 접근 권한 설정
GRANT INSERT, UPDATE, DELETE ON TABLE "products" TO "public";
GRANT SELECT ON TABLE "products" TO "authenticated";

-- reviews 테이블에 대한 접근 권한 설정
GRANT INSERT, UPDATE, DELETE ON TABLE "products" TO "public";
GRANT SELECT ON TABLE "products" TO "authenticated";


-- posts 테이블에 대한 접근 권한 설정
GRANT INSERT, UPDATE, DELETE ON TABLE "posts" TO "authenticated";
GRANT SELECT ON TABLE "posts" TO "public";
GRANT UPDATE ON TABLE "posts" TO "service_role";


-- topics 테이블에 대한 접근 권한 설정
GRANT INSERT, UPDATE, DELETE ON TABLE "posts" TO "authenticated";
GRANT SELECT ON TABLE "posts" TO "public";

-- post_upvotes 테이블에 대한 접근 권한 설정
GRANT INSERT, UPDATE, DELETE ON TABLE "post_upvotes" TO "authenticated";
GRANT SELECT ON TABLE "post_upvotes" TO "public";

-- blog_posts_meta  테이블에 대한 접근 권한 설정
GRANT INSERT, UPDATE, DELETE ON TABLE "blog_posts_meta" TO "authenticated";
GRANT SELECT ON TABLE "blog_posts_meta" TO "public";

-- product_overview_view에 대한 접근 권한 설정
-- 뷰는 읽기 전용이므로 SELECT 권한만 부여

-- 모든 사용자(인증되지 않은 사용자 포함)가 조회 가능
GRANT SELECT ON product_overview_view TO public;

-- 또는 인증된 사용자만 조회 가능하게 하려면:
-- GRANT SELECT ON product_overview_view TO authenticated;
-- REVOKE SELECT ON product_overview_view FROM public;

GRANT SELECT ON profiles_view TO public;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "product_upvotes" TO "authenticated";


