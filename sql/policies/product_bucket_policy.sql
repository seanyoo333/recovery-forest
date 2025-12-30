-- Storage 버킷 정책 설정
-- products와 clinics 버킷에 대한 RLS 정책 설정

-- 1. 버킷이 존재하는지 확인하고 생성 (버킷은 수동으로 생성해야 할 수도 있음)
-- Supabase Dashboard에서 Storage > Buckets에서 "products"와 "clinics" 버킷을 먼저 생성해야 합니다.

-- ============================================
-- products 버킷 정책
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "products-storage-select-policy" ON storage.objects;
DROP POLICY IF EXISTS "products-storage-insert-policy" ON storage.objects;
DROP POLICY IF EXISTS "products-storage-update-policy" ON storage.objects;
DROP POLICY IF EXISTS "products-storage-delete-policy" ON storage.objects;

-- 모든 사용자가 products 버킷의 파일을 조회할 수 있음
CREATE POLICY "products-storage-select-policy" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- 관리자만 products 버킷에 파일을 업로드할 수 있음
CREATE POLICY "products-storage-insert-policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE admin_id = auth.uid()
    AND admin_role IN ('super_admin', 'product_admin')
    AND is_active = true
  )
);

-- 관리자만 products 버킷의 파일을 수정할 수 있음
CREATE POLICY "products-storage-update-policy" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE admin_id = auth.uid()
    AND admin_role IN ('super_admin', 'product_admin')
    AND is_active = true
  )
)
WITH CHECK (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE admin_id = auth.uid()
    AND admin_role IN ('super_admin', 'product_admin')
    AND is_active = true
  )
);

-- 관리자만 products 버킷의 파일을 삭제할 수 있음
CREATE POLICY "products-storage-delete-policy" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE admin_id = auth.uid()
    AND admin_role IN ('super_admin', 'product_admin')
    AND is_active = true
  )
);

-- ============================================
-- clinics 버킷 정책
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "clinics-storage-select-policy" ON storage.objects;
DROP POLICY IF EXISTS "clinics-storage-insert-policy" ON storage.objects;
DROP POLICY IF EXISTS "clinics-storage-update-policy" ON storage.objects;
DROP POLICY IF EXISTS "clinics-storage-delete-policy" ON storage.objects;

-- 모든 사용자가 clinics 버킷의 파일을 조회할 수 있음
CREATE POLICY "clinics-storage-select-policy" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'clinics');

-- 관리자만 clinics 버킷에 파일을 업로드할 수 있음
CREATE POLICY "clinics-storage-insert-policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clinics' 
  AND EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE admin_id = auth.uid()
    AND admin_role IN ('super_admin', 'clinic_admin')
    AND is_active = true
  )
);

-- 관리자만 clinics 버킷의 파일을 수정할 수 있음
CREATE POLICY "clinics-storage-update-policy" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clinics' 
  AND EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE admin_id = auth.uid()
    AND admin_role IN ('super_admin', 'clinic_admin')
    AND is_active = true
  )
)
WITH CHECK (
  bucket_id = 'clinics' 
  AND EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE admin_id = auth.uid()
    AND admin_role IN ('super_admin', 'clinic_admin')
    AND is_active = true
  )
);

-- 관리자만 clinics 버킷의 파일을 삭제할 수 있음
CREATE POLICY "clinics-storage-delete-policy" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'clinics' 
  AND EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE admin_id = auth.uid()
    AND admin_role IN ('super_admin', 'clinic_admin')
    AND is_active = true
  )
);

