-- Blog Storage Bucket Policies
-- Storage 버킷 정책 설정
-- blog-posts와 blog-images 버킷에 대한 RLS 정책 설정

-- 1. blog-posts 버킷이 존재하는지 확인하고 생성 (버킷은 수동으로 생성해야 할 수도 있음)
-- Supabase Dashboard에서 Storage > Buckets에서 "blog-posts" 버킷을 먼저 생성해야 합니다.
-- Supabase Dashboard에서 Storage > Buckets에서 "blog-images" 버킷을 먼저 생성해야 합니다.


DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'blog-posts-storage-select-policy'
  ) THEN
    CREATE POLICY "blog-posts-storage-select-policy" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'blog-posts');
  END IF;
END $$;

-- 3. 관리자만 blog-posts 버킷에 파일을 업로드할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'blog-posts-storage-insert-policy'
  ) THEN
    CREATE POLICY "blog-posts-storage-insert-policy" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'blog-posts' 
      AND EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = auth.uid()
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )
    );
  END IF;
END $$;

-- 4. 관리자만 blog-posts 버킷의 파일을 수정할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'blog-posts-storage-update-policy'
  ) THEN
    CREATE POLICY "blog-posts-storage-update-policy" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'blog-posts' 
      AND EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = auth.uid()
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )
    )
    WITH CHECK (
      bucket_id = 'blog-posts' 
      AND EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = auth.uid()
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      )
    );
  END IF;
END $$;

-- 5. 관리자만 blog-posts 버킷의 파일을 삭제할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'blog-posts-storage-delete-policy'
  ) THEN
    CREATE POLICY "blog-posts-storage-delete-policy" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'blog-posts' 
      AND EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = auth.uid()
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )
    );
  END IF;
END $$;

-- 6. 모든 사용자가 blog-images 버킷의 파일을 조회할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'blog-images-storage-select-policy'
  ) THEN
    CREATE POLICY "blog-images-storage-select-policy" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'blog-images');
  END IF;
END $$;

-- 7. 관리자만 blog-images 버킷에 파일을 업로드할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'blog-posts-storage-insert-policy'
  ) THEN
    CREATE POLICY "blog-images-storage-insert-policy" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'blog-images' 
      AND EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = auth.uid()
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )
    );
  END IF;
END $$;



-- 8. 관리자만 blog-images 버킷의 파일을 수정할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'blog-images-storage-update-policy'
  ) THEN
    CREATE POLICY "blog-images-storage-update-policy" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'blog-images' 
      AND EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = auth.uid()
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )
    )
    WITH CHECK (
      bucket_id = 'blog-images' 
      AND EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = auth.uid()
        AND admin_role IN ('super_admin', 'product_admin')
        AND is_active = true
      )
    );
  END IF;
END $$;

-- 9. 관리자만 blog-images 버킷의 파일을 삭제할 수 있음
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'blog-images-storage-delete-policy'
  ) THEN
    CREATE POLICY "blog-images-storage-delete-policy" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'blog-images' 
      AND EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE admin_id = auth.uid()
        AND admin_role IN ('super_admin', 'content_admin')
        AND is_active = true
      )
    );
  END IF;
END $$;