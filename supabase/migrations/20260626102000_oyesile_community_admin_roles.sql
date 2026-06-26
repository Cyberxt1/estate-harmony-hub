ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'community_chairman';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'community_secretary';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'treasurer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chief_security_officer';

CREATE OR REPLACE FUNCTION public.is_estate_staff(_user_id UUID, _estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND estate_id = _estate_id
      AND role::text IN (
        'estate_admin',
        'community_chairman',
        'community_secretary',
        'treasurer',
        'chief_security_officer',
        'security_officer',
        'super_admin'
      )
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_estate_admin(_user_id UUID, _estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND estate_id = _estate_id
      AND role::text IN (
        'estate_admin',
        'community_chairman',
        'community_secretary',
        'treasurer',
        'chief_security_officer',
        'super_admin'
      )
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_estate_admin(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "estates_admin_update" ON public.estates;
CREATE POLICY "estates_admin_update" ON public.estates FOR UPDATE TO authenticated
  USING (public.is_estate_admin(auth.uid(), id))
  WITH CHECK (public.is_estate_admin(auth.uid(), id));

DROP POLICY IF EXISTS "properties_admin_write" ON public.properties;
CREATE POLICY "properties_admin_write" ON public.properties FOR ALL TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

DROP POLICY IF EXISTS "households_admin_write" ON public.households;
CREATE POLICY "households_admin_write" ON public.households FOR ALL TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

DROP POLICY IF EXISTS "invoices_admin_write" ON public.invoices;
CREATE POLICY "invoices_admin_write" ON public.invoices FOR ALL TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

DROP POLICY IF EXISTS "announcements_admin_write" ON public.announcements;
CREATE POLICY "announcements_admin_write" ON public.announcements FOR ALL TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));
