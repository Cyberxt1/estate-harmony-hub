ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'security_gateman';

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_emergency_contacts_updated ON public.emergency_contacts;
CREATE TRIGGER trg_emergency_contacts_updated
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "emergency_contacts_select" ON public.emergency_contacts
  FOR SELECT TO authenticated
  USING (
    estate_id = public.current_estate_id(auth.uid())
    OR public.is_estate_staff(auth.uid(), estate_id)
  );

CREATE POLICY "emergency_contacts_admin_write" ON public.emergency_contacts
  FOR ALL TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_staff(auth.uid(), estate_id));

CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_invitations_pending_unique
  ON public.admin_invitations (estate_id, lower(email), role)
  WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invitations TO authenticated;
GRANT ALL ON public.admin_invitations TO service_role;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_invitations_select" ON public.admin_invitations
  FOR SELECT TO authenticated
  USING (
    public.is_estate_admin(auth.uid(), estate_id)
    OR lower(email) = lower(coalesce((SELECT email FROM public.profiles WHERE id = auth.uid()), ''))
  );

CREATE POLICY "admin_invitations_admin_write" ON public.admin_invitations
  FOR ALL TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

CREATE TABLE IF NOT EXISTS public.staff_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_role public.app_role,
  assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT staff_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'done'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_tasks TO authenticated;
GRANT ALL ON public.staff_tasks TO service_role;
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_staff_tasks_updated ON public.staff_tasks;
CREATE TRIGGER trg_staff_tasks_updated
  BEFORE UPDATE ON public.staff_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "staff_tasks_select" ON public.staff_tasks
  FOR SELECT TO authenticated
  USING (
    public.is_estate_admin(auth.uid(), estate_id)
    OR assigned_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.estate_id = staff_tasks.estate_id
        AND ur.role = staff_tasks.assigned_role
    )
  );

CREATE POLICY "staff_tasks_admin_write" ON public.staff_tasks
  FOR ALL TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

DROP POLICY IF EXISTS "notifications_self" ON public.notifications;
CREATE POLICY "notifications_self" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_self_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_admin_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

CREATE POLICY "notifications_admin_delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id));

DROP POLICY IF EXISTS "user_roles_self_select" ON public.user_roles;
CREATE POLICY "user_roles_self_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_estate_staff(auth.uid(), estate_id));

CREATE POLICY "user_roles_admin_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

CREATE POLICY "user_roles_admin_update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

CREATE POLICY "user_roles_admin_delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id));

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_estate_priority
  ON public.emergency_contacts(estate_id, priority);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_estate_status
  ON public.admin_invitations(estate_id, status);

CREATE INDEX IF NOT EXISTS idx_staff_tasks_assigned_user
  ON public.staff_tasks(assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_staff_tasks_estate_status
  ON public.staff_tasks(estate_id, status);
