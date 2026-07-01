ALTER TABLE public.security_incidents
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.is_estate_cso(_user_id UUID, _estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND estate_id = _estate_id
      AND role = 'chief_security_officer'::public.app_role
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_estate_dues_manager(_user_id UUID, _estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND estate_id = _estate_id
      AND role IN (
        'community_chairman'::public.app_role,
        'treasurer'::public.app_role,
        'chief_security_officer'::public.app_role,
        'estate_admin'::public.app_role,
        'super_admin'::public.app_role
      )
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_estate_dues_viewer(_user_id UUID, _estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_estate_dues_manager(_user_id, _estate_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND estate_id = _estate_id
        AND role = 'community_secretary'::public.app_role
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_estate_cso(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_estate_dues_manager(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_estate_dues_viewer(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "admin_invitations_select" ON public.admin_invitations;
CREATE POLICY "admin_invitations_select" ON public.admin_invitations
  FOR SELECT TO authenticated
  USING (
    public.is_estate_chairman(auth.uid(), estate_id)
    OR (
      public.is_estate_cso(auth.uid(), estate_id)
      AND role = 'security_gateman'::public.app_role
    )
    OR lower(email) = lower(coalesce((SELECT email FROM public.profiles WHERE id = auth.uid()), ''))
  );

DROP POLICY IF EXISTS "admin_invitations_chairman_write" ON public.admin_invitations;
DROP POLICY IF EXISTS "admin_invitations_office_write" ON public.admin_invitations;
CREATE POLICY "admin_invitations_office_write" ON public.admin_invitations
  FOR ALL TO authenticated
  USING (
    public.is_estate_chairman(auth.uid(), estate_id)
    OR (
      public.is_estate_cso(auth.uid(), estate_id)
      AND role = 'security_gateman'::public.app_role
    )
  )
  WITH CHECK (
    (
      public.is_estate_chairman(auth.uid(), estate_id)
      AND role IN (
        'community_secretary'::public.app_role,
        'treasurer'::public.app_role,
        'chief_security_officer'::public.app_role,
        'security_gateman'::public.app_role
      )
    )
    OR (
      public.is_estate_cso(auth.uid(), estate_id)
      AND role = 'security_gateman'::public.app_role
    )
  );

DROP POLICY IF EXISTS "user_roles_chairman_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_chairman_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_chairman_delete" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_office_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_office_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_office_delete" ON public.user_roles;

CREATE POLICY "user_roles_office_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      public.is_estate_chairman(auth.uid(), estate_id)
      AND role IN (
        'community_secretary'::public.app_role,
        'treasurer'::public.app_role,
        'chief_security_officer'::public.app_role,
        'security_gateman'::public.app_role
      )
    )
    OR (
      public.is_estate_cso(auth.uid(), estate_id)
      AND role = 'security_gateman'::public.app_role
    )
  );

CREATE POLICY "user_roles_office_update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    public.is_estate_chairman(auth.uid(), estate_id)
    OR (
      public.is_estate_cso(auth.uid(), estate_id)
      AND role = 'security_gateman'::public.app_role
    )
  )
  WITH CHECK (
    (
      public.is_estate_chairman(auth.uid(), estate_id)
      AND role IN (
        'community_secretary'::public.app_role,
        'treasurer'::public.app_role,
        'chief_security_officer'::public.app_role,
        'security_gateman'::public.app_role
      )
    )
    OR (
      public.is_estate_cso(auth.uid(), estate_id)
      AND role = 'security_gateman'::public.app_role
    )
  );

CREATE POLICY "user_roles_office_delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.is_estate_chairman(auth.uid(), estate_id)
    OR (
      public.is_estate_cso(auth.uid(), estate_id)
      AND role = 'security_gateman'::public.app_role
    )
  );

DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    resident_id = auth.uid()
    OR public.is_estate_dues_viewer(auth.uid(), estate_id)
  );

DROP POLICY IF EXISTS "invoices_treasurer_write" ON public.invoices;
DROP POLICY IF EXISTS "invoices_admin_write" ON public.invoices;
DROP POLICY IF EXISTS "invoices_dues_manager_write" ON public.invoices;
CREATE POLICY "invoices_dues_manager_write" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_estate_dues_manager(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_dues_manager(auth.uid(), estate_id));

DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated
  USING (
    resident_id = auth.uid()
    OR public.is_estate_dues_viewer(auth.uid(), estate_id)
  );

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    resident_id = auth.uid()
    OR public.is_estate_dues_manager(auth.uid(), estate_id)
  );

DROP POLICY IF EXISTS "payments_treasurer_update" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
DROP POLICY IF EXISTS "payments_dues_manager_update" ON public.payments;
CREATE POLICY "payments_dues_manager_update" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.is_estate_dues_manager(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_dues_manager(auth.uid(), estate_id));
