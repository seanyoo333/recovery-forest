CREATE POLICY "avatars-storage-select-policy" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars'::text);

CREATE POLICY "avatars-storage-insert-policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ((bucket_id = 'avatars'::text) AND ((name = (auth.uid())::text) OR (name ~~ ((auth.uid())::text || '/%'::text))));

CREATE POLICY "avatars-storage-update-policy" ON storage.objects
FOR UPDATE
TO authenticated
USING ((bucket_id = 'avatars'::text) AND ((name = (auth.uid())::text) OR (name ~~ ((auth.uid())::text || '/%'::text))))
WITH CHECK ((bucket_id = 'avatars'::text) AND ((name = (auth.uid())::text) OR (name ~~ ((auth.uid())::text || '/%'::text))));

CREATE POLICY "avatars-storage-delete-policy" ON storage.objects
FOR DELETE
TO authenticated
USING ((bucket_id = 'avatars'::text) AND ((name = (auth.uid())::text) OR (name ~~ ((auth.uid())::text || '/%'::text))));



CREATE POLICY "blog-posts-storage-select-policy" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'blog-posts'::text);

CREATE POLICY "blog-posts-storage-insert-policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ((bucket_id = 'blog-posts'::text) AND (EXISTS ( SELECT 1
   FROM admin_permissions
  WHERE ((admin_permissions.admin_id = auth.uid()) AND (admin_permissions.admin_role = ANY (ARRAY['super_admin'::admin_role, 'content_admin'::admin_role])) AND (admin_permissions.is_active = true)))));

CREATE POLICY "blog-posts-storage-update-policy" ON storage.objects
FOR UPDATE
TO authenticated
USING ((bucket_id = 'blog-posts'::text) AND (EXISTS ( SELECT 1
   FROM admin_permissions
  WHERE ((admin_permissions.admin_id = auth.uid()) AND (admin_permissions.admin_role = ANY (ARRAY['super_admin'::admin_role, 'content_admin'::admin_role])) AND (admin_permissions.is_active = true)))))
WITH CHECK ((bucket_id = 'blog-posts'::text) AND (EXISTS ( SELECT 1
   FROM admin_permissions
  WHERE ((admin_permissions.admin_id = auth.uid()) AND (admin_permissions.admin_role = ANY (ARRAY['super_admin'::admin_role, 'content_admin'::admin_role])) AND (admin_permissions.is_active = true)))));

CREATE POLICY "blog-posts-storage-delete-policy" ON storage.objects
FOR DELETE
TO authenticated
USING ((bucket_id = 'blog-posts'::text) AND (EXISTS ( SELECT 1
   FROM admin_permissions
  WHERE ((admin_permissions.admin_id = auth.uid()) AND (admin_permissions.admin_role = ANY (ARRAY['super_admin'::admin_role, 'content_admin'::admin_role])) AND (admin_permissions.is_active = true)))));

CREATE POLICY "blog-images-storage-select-policy" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'blog-images'::text);

CREATE POLICY "blog-images-storage-insert-policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ((bucket_id = 'blog-images'::text) AND (EXISTS ( SELECT 1
   FROM admin_permissions
  WHERE ((admin_permissions.admin_id = auth.uid()) AND (admin_permissions.admin_role = ANY (ARRAY['super_admin'::admin_role, 'content_admin'::admin_role])) AND (admin_permissions.is_active = true)))));

CREATE POLICY "blog-images-storage-update-policy" ON storage.objects
FOR UPDATE
TO authenticated
USING ((bucket_id = 'blog-images'::text) AND (EXISTS ( SELECT 1
   FROM admin_permissions
  WHERE ((admin_permissions.admin_id = auth.uid()) AND (admin_permissions.admin_role = ANY (ARRAY['super_admin'::admin_role, 'content_admin'::admin_role])) AND (admin_permissions.is_active = true)))))
WITH CHECK ((bucket_id = 'blog-images'::text) AND (EXISTS ( SELECT 1
   FROM admin_permissions
  WHERE ((admin_permissions.admin_id = auth.uid()) AND (admin_permissions.admin_role = ANY (ARRAY['super_admin'::admin_role, 'content_admin'::admin_role])) AND (admin_permissions.is_active = true)))));

CREATE POLICY "blog-images-storage-delete-policy" ON storage.objects
FOR DELETE
TO authenticated
USING ((bucket_id = 'blog-images'::text) AND (EXISTS ( SELECT 1
   FROM admin_permissions
  WHERE ((admin_permissions.admin_id = auth.uid()) AND (admin_permissions.admin_role = ANY (ARRAY['super_admin'::admin_role, 'content_admin'::admin_role])) AND (admin_permissions.is_active = true)))));