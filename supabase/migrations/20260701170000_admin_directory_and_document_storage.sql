-- Safe resident-facing directory: only the public details needed to identify
-- Oyesile Estate's elected/appointed office administrators are returned.
CREATE OR REPLACE FUNCTION public.get_estate_admin_directory()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role public.app_role
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    profiles.id,
    profiles.full_name,
    profiles.phone,
    profiles.avatar_url,
    user_roles.role
  FROM public.user_roles
  JOIN public.profiles ON profiles.id = user_roles.user_id
  WHERE auth.uid() IS NOT NULL
    AND user_roles.estate_id = public.current_estate_id(auth.uid())
    AND user_roles.role IN (
      'community_chairman'::public.app_role,
      'community_secretary'::public.app_role,
      'treasurer'::public.app_role,
      'chief_security_officer'::public.app_role
    )
  ORDER BY CASE user_roles.role
    WHEN 'community_chairman'::public.app_role THEN 1
    WHEN 'community_secretary'::public.app_role THEN 2
    WHEN 'treasurer'::public.app_role THEN 3
    WHEN 'chief_security_officer'::public.app_role THEN 4
    ELSE 5
  END;
$$;

REVOKE ALL ON FUNCTION public.get_estate_admin_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_estate_admin_directory() TO authenticated;

-- Profile photographs are public because they appear in the resident
-- directory. Each signed-in user can only manage their own folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile_images_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_select_own" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_update_own" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_delete_own" ON storage.objects;

CREATE POLICY "profile_images_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "profile_images_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "profile_images_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "profile_images_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Estate documents remain private in Storage. Residents in the same estate
-- can read them, while office administrators are the only uploaders/editors.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'estate-documents',
  'estate-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "estate_documents_read" ON storage.objects;
DROP POLICY IF EXISTS "estate_documents_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "estate_documents_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "estate_documents_admin_delete" ON storage.objects;

CREATE POLICY "estate_documents_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'estate-documents'
    AND (storage.foldername(name))[1] = public.current_estate_id(auth.uid())::TEXT
  );

CREATE POLICY "estate_documents_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'estate-documents'
    AND (storage.foldername(name))[1] = public.current_estate_id(auth.uid())::TEXT
    AND public.is_estate_staff(
      auth.uid(),
      ((storage.foldername(name))[1])::UUID
    )
  );

CREATE POLICY "estate_documents_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'estate-documents'
    AND public.is_estate_staff(
      auth.uid(),
      ((storage.foldername(name))[1])::UUID
    )
  )
  WITH CHECK (
    bucket_id = 'estate-documents'
    AND public.is_estate_staff(
      auth.uid(),
      ((storage.foldername(name))[1])::UUID
    )
  );

CREATE POLICY "estate_documents_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'estate-documents'
    AND public.is_estate_staff(
      auth.uid(),
      ((storage.foldername(name))[1])::UUID
    )
  );

DROP POLICY IF EXISTS "documents_write" ON public.documents;
DROP POLICY IF EXISTS "documents_admin_write" ON public.documents;
CREATE POLICY "documents_admin_write" ON public.documents
  FOR ALL TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id))
  WITH CHECK (
    uploaded_by = auth.uid()
    AND scope = 'estate'::public.document_scope
    AND public.is_estate_staff(auth.uid(), estate_id)
  );
