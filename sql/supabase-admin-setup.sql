-- Supabase SQL Editor에서 실행할 관리자 권한 설정 스크립트
-- 이 스크립트는 Supabase 대시보드의 SQL Editor에서 직접 실행하세요

-- 1. 기존 admin 역할을 가진 사용자를 슈퍼 관리자로 설정
INSERT INTO admin_permissions (admin_id, admin_role, permissions, created_by)
SELECT 
  profile_id,
  'super_admin',
  '{"can_manage_users": true, "can_manage_products": true, "can_manage_clinics": true, "can_manage_content": true, "can_view_analytics": true, "can_manage_admins": true}',
  profile_id
FROM profiles 
WHERE role = 'admin'
ON CONFLICT (admin_id) DO NOTHING;

-- 2. 현재 관리자 권한 확인
SELECT 
  p.name,
  p.username,
  p.role as user_role,
  ap.admin_role,
  ap.permissions,
  ap.is_active,
  ap.created_at
FROM profiles p
LEFT JOIN admin_permissions ap ON p.profile_id = ap.admin_id
WHERE ap.admin_id IS NOT NULL
ORDER BY ap.created_at DESC;

-- 3. 특정 사용자를 슈퍼 관리자로 설정 (UUID를 실제 사용자 ID로 변경하세요)
-- INSERT INTO admin_permissions (admin_id, admin_role, permissions, created_by) 
-- VALUES ('your-user-uuid-here', 'super_admin', '{"can_manage_users": true, "can_manage_products": true, "can_manage_clinics": true, "can_manage_content": true, "can_view_analytics": true, "can_manage_admins": true}', 'your-user-uuid-here');

-- 4. 제품 관리자 설정 예시
-- INSERT INTO admin_permissions (admin_id, admin_role, permissions, created_by) 
-- VALUES ('product-admin-uuid', 'product_admin', '{"can_manage_users": false, "can_manage_products": true, "can_manage_clinics": false, "can_manage_content": false, "can_view_analytics": true, "can_manage_admins": false}', 'super-admin-uuid');

-- 5. 병원 관리자 설정 예시
-- INSERT INTO admin_permissions (admin_id, admin_role, permissions, created_by) 
-- VALUES ('clinic-admin-uuid', 'clinic_admin', '{"can_manage_users": false, "can_manage_products": false, "can_manage_clinics": true, "can_manage_content": false, "can_view_analytics": true, "can_manage_admins": false}', 'super-admin-uuid'); 