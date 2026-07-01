CREATE OR REPLACE FUNCTION public.is_estate_staff(_user_id UUID, _estate_id UUID)
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
        'community_secretary'::public.app_role,
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

CREATE OR REPLACE FUNCTION public.is_estate_chairman(_user_id UUID, _estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND estate_id = _estate_id
      AND role = 'community_chairman'::public.app_role
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_estate_treasurer(_user_id UUID, _estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND estate_id = _estate_id
      AND role = 'treasurer'::public.app_role
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_estate_gate_staff(_user_id UUID, _estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND estate_id = _estate_id
      AND role = 'security_gateman'::public.app_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_estate_chairman(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_estate_treasurer(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_estate_gate_staff(UUID, UUID) TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_one_office_holder
  ON public.user_roles (estate_id, role)
  WHERE role IN (
    'community_chairman'::public.app_role,
    'community_secretary'::public.app_role,
    'treasurer'::public.app_role,
    'chief_security_officer'::public.app_role
  );

CREATE UNIQUE INDEX IF NOT EXISTS admin_invitations_one_pending_office_role
  ON public.admin_invitations (estate_id, role)
  WHERE status = 'pending'
    AND role IN (
      'community_secretary'::public.app_role,
      'treasurer'::public.app_role,
      'chief_security_officer'::public.app_role
    );

DROP POLICY IF EXISTS "admin_invitations_select" ON public.admin_invitations;
CREATE POLICY "admin_invitations_select" ON public.admin_invitations
  FOR SELECT TO authenticated
  USING (
    public.is_estate_chairman(auth.uid(), estate_id)
    OR lower(email) = lower(coalesce((SELECT email FROM public.profiles WHERE id = auth.uid()), ''))
  );

DROP POLICY IF EXISTS "admin_invitations_admin_write" ON public.admin_invitations;
CREATE POLICY "admin_invitations_chairman_write" ON public.admin_invitations
  FOR ALL TO authenticated
  USING (public.is_estate_chairman(auth.uid(), estate_id))
  WITH CHECK (
    public.is_estate_chairman(auth.uid(), estate_id)
    AND role IN (
      'community_secretary'::public.app_role,
      'treasurer'::public.app_role,
      'chief_security_officer'::public.app_role,
      'security_gateman'::public.app_role
    )
  );

DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;

CREATE POLICY "user_roles_chairman_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_estate_chairman(auth.uid(), estate_id)
    AND role IN (
      'community_secretary'::public.app_role,
      'treasurer'::public.app_role,
      'chief_security_officer'::public.app_role,
      'security_gateman'::public.app_role
    )
  );

CREATE POLICY "user_roles_chairman_update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_estate_chairman(auth.uid(), estate_id))
  WITH CHECK (
    public.is_estate_chairman(auth.uid(), estate_id)
    AND role IN (
      'community_secretary'::public.app_role,
      'treasurer'::public.app_role,
      'chief_security_officer'::public.app_role,
      'security_gateman'::public.app_role
    )
  );

CREATE POLICY "user_roles_chairman_delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.is_estate_chairman(auth.uid(), estate_id)
    AND role IN (
      'community_secretary'::public.app_role,
      'treasurer'::public.app_role,
      'chief_security_officer'::public.app_role,
      'security_gateman'::public.app_role
    )
  );

DROP POLICY IF EXISTS "visitors_select" ON public.visitors;
CREATE POLICY "visitors_select" ON public.visitors
  FOR SELECT TO authenticated
  USING (
    host_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
    OR public.is_estate_gate_staff(auth.uid(), estate_id)
  );

DROP POLICY IF EXISTS "visitors_update" ON public.visitors;
CREATE POLICY "visitors_update" ON public.visitors
  FOR UPDATE TO authenticated
  USING (
    host_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
    OR public.is_estate_gate_staff(auth.uid(), estate_id)
  )
  WITH CHECK (
    host_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
    OR public.is_estate_gate_staff(auth.uid(), estate_id)
  );

DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    resident_id = auth.uid()
    OR public.is_estate_treasurer(auth.uid(), estate_id)
  );

DROP POLICY IF EXISTS "invoices_admin_write" ON public.invoices;
CREATE POLICY "invoices_treasurer_write" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_estate_treasurer(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_treasurer(auth.uid(), estate_id));

DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated
  USING (
    resident_id = auth.uid()
    OR public.is_estate_treasurer(auth.uid(), estate_id)
  );

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    resident_id = auth.uid()
    OR public.is_estate_treasurer(auth.uid(), estate_id)
  );

DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
CREATE POLICY "payments_treasurer_update" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.is_estate_treasurer(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_treasurer(auth.uid(), estate_id));
