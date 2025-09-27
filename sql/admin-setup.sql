-- 관리자 권한 설정 스크립트
-- 이 스크립트는 데이터베이스에서 직접 실행하여 관리자 권한을 설정합니다.

-- 1. 사용자 역할 enum 업데이트 (admin 제거)
-- ALTER TYPE role RENAME TO user_role;
-- ALTER TYPE user_role DROP VALUE 'admin';

-- 2. 관리자 권한 테이블 생성 (이미 스키마에서 정의됨)
-- admin_permissions 테이블과 admin_activity_logs 테이블은 이미 생성되어 있음

-- 3. 슈퍼 관리자 권한 설정
-- 사용자의 UUID를 여기에 입력하세요 (Supabase Auth에서 확인 가능)
-- 예: INSERT INTO admin_permissions (admin_id, admin_role, permissions, created_by) 
-- VALUES ('your-user-uuid-here', 'super_admin', '{"can_manage_users": true, "can_manage_products": true, "can_manage_clinics": true, "can_manage_content": true, "can_view_analytics": true, "can_manage_admins": true}', 'your-user-uuid-here');

-- 4. 특정 권한을 가진 관리자 설정 예시
-- 제품 관리자
-- INSERT INTO admin_permissions (admin_id, admin_role, permissions, created_by) 
-- VALUES ('product-admin-uuid', 'product_admin', '{"can_manage_users": false, "can_manage_products": true, "can_manage_clinics": false, "can_manage_content": false, "can_view_analytics": true, "can_manage_admins": false}', 'super-admin-uuid');

-- 병원 관리자
-- INSERT INTO admin_permissions (admin_id, admin_role, permissions, created_by) 
-- VALUES ('clinic-admin-uuid', 'clinic_admin', '{"can_manage_users": false, "can_manage_products": false, "can_manage_clinics": true, "can_manage_content": false, "can_view_analytics": true, "can_manage_admins": false}', 'super-admin-uuid');

-- 5. 관리자 권한 확인 쿼리
-- SELECT 
--   p.name,
--   p.email,
--   ap.admin_role,
--   ap.permissions,
--   ap.is_active
-- FROM profiles p
-- JOIN admin_permissions ap ON p.profile_id = ap.admin_id
-- WHERE ap.is_active = true;

-- 6. 관리자 활동 로그 확인
-- SELECT 
--   p.name as admin_name,
--   aal.action,
--   aal.target_type,
--   aal.target_id,
--   aal.details,
--   aal.ip_address,
--   aal.created_at
-- FROM admin_activity_logs aal
-- JOIN profiles p ON aal.admin_id = p.profile_id
-- ORDER BY aal.created_at DESC
-- LIMIT 50; 