-- Storage 버킷 정책 설정
-- products 버킷에 대한 RLS 정책 설정

-- 1. products 버킷이 존재하는지 확인하고 생성 (버킷은 수동으로 생성해야 할 수도 있음)
-- Supabase Dashboard에서 Storage > Buckets에서 "products" 버킷을 먼저 생성해야 합니다.

-- admin_permissions 체크를 위한 함수 생성 (RLS 우회)
-- SECURITY DEFINER로 RLS를 우회하여 무한 재귀 방지
CREATE OR REPLACE FUNCTION check_admin_permission(
  user_id uuid,
  required_roles text[]
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE admin_id = user_id
    AND admin_role = ANY(required_roles)
    AND is_active = true
  );
END;
$$;

-- 2. 모든 사용자가 products 버킷의 파일을 조회할 수 있음
-- admin_permissions를 참조할 때 RLS를 우회하기 위해 SECURITY DEFINER 함수 사용
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'products-storage-select-policy'
  ) THEN
    CREATE POLICY "products-storage-select-policy" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'products' 
      AND check_admin_permission(auth.uid(), ARRAY['super_admin', 'product_admin'])
    );
  END IF;
END $$;

-- 3. 관리자만 products 버킷에 파일을 업로드할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'products-storage-insert-policy'
  ) THEN
    CREATE POLICY "products-storage-insert-policy" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'products' 
      AND check_admin_permission(auth.uid(), ARRAY['super_admin', 'product_admin'])
    );
  END IF;
END $$;

-- 4. 관리자만 products 버킷의 파일을 수정할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'products-storage-update-policy'
  ) THEN
    CREATE POLICY "products-storage-update-policy" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'products' 
      AND check_admin_permission(auth.uid(), ARRAY['super_admin', 'product_admin'])
    )
    WITH CHECK (
      bucket_id = 'products' 
      AND check_admin_permission(auth.uid(), ARRAY['super_admin', 'product_admin'])
    );
  END IF;
END $$;

-- 5. 관리자만 products 버킷의 파일을 삭제할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'products-storage-delete-policy'
  ) THEN
    CREATE POLICY "products-storage-delete-policy" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'products' 
      AND check_admin_permission(auth.uid(), ARRAY['super_admin', 'product_admin'])
    );
  END IF;
END $$;

