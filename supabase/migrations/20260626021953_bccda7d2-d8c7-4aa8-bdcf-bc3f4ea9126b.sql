
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM (
  'super_admin', 'estate_admin', 'security_officer',
  'resident', 'household_member', 'domestic_staff'
);

CREATE TYPE public.property_status AS ENUM ('occupied', 'vacant', 'under_maintenance', 'reserved');
CREATE TYPE public.property_type AS ENUM ('detached', 'semi_detached', 'terrace', 'apartment', 'duplex', 'bungalow');
CREATE TYPE public.resident_type AS ENUM ('owner', 'tenant');
CREATE TYPE public.member_type AS ENUM ('spouse', 'child', 'parent', 'relative', 'driver', 'housekeeper', 'chef', 'gardener', 'security_aide', 'other');
CREATE TYPE public.visitor_status AS ENUM ('expected', 'checked_in', 'checked_out', 'expired', 'denied');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('card', 'transfer', 'cash', 'wallet');
CREATE TYPE public.complaint_status AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.incident_status AS ENUM ('reported', 'investigating', 'resolved', 'archived');
CREATE TYPE public.announcement_priority AS ENUM ('info', 'important', 'emergency');
CREATE TYPE public.document_scope AS ENUM ('estate', 'property', 'resident');

-- =========================================================
-- updated_at helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================================
-- ESTATES
-- =========================================================
CREATE TABLE public.estates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estates TO authenticated;
GRANT ALL ON public.estates TO service_role;
ALTER TABLE public.estates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_estates_updated BEFORE UPDATE ON public.estates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  estate_id UUID REFERENCES public.estates(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | suspended
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estate_id UUID REFERENCES public.estates(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, estate_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_estate_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT estate_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_estate_staff(_user_id UUID, _estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND estate_id = _estate_id
      AND role IN ('estate_admin','security_officer','super_admin')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- =========================================================
-- Auto-create profile on new auth user
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default role: resident (pending approval)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'resident')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- PROPERTIES
-- =========================================================
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  house_number TEXT NOT NULL,
  street TEXT,
  property_type public.property_type NOT NULL DEFAULT 'detached',
  status public.property_status NOT NULL DEFAULT 'vacant',
  bedrooms INT,
  bathrooms INT,
  electricity_meter TEXT,
  water_meter TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estate_id, house_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- HOUSEHOLDS
-- =========================================================
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  primary_resident_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resident_type public.resident_type NOT NULL DEFAULT 'owner',
  move_in_date DATE,
  move_out_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO authenticated;
GRANT ALL ON public.households TO service_role;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_households_updated BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- HOUSEHOLD MEMBERS
-- =========================================================
CREATE TABLE public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  member_type public.member_type NOT NULL DEFAULT 'relative',
  phone TEXT,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_members TO authenticated;
GRANT ALL ON public.household_members TO service_role;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_household_members_updated BEFORE UPDATE ON public.household_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- VEHICLES
-- =========================================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plate_number TEXT NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  year INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- VISITORS
-- =========================================================
CREATE TABLE public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  purpose TEXT,
  vehicle_plate TEXT,
  expected_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  status public.visitor_status NOT NULL DEFAULT 'expected',
  qr_code TEXT UNIQUE,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_out_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitors TO authenticated;
GRANT ALL ON public.visitors TO service_role;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_visitors_updated BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_visitors_estate_status ON public.visitors(estate_id, status);

-- =========================================================
-- INVOICES & PAYMENTS
-- =========================================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  resident_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  period_start DATE,
  period_end DATE,
  due_date DATE,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  line_items JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estate_id, invoice_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  resident_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  method public.payment_method NOT NULL DEFAULT 'transfer',
  reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- COMPLAINTS
-- =========================================================
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority public.complaint_priority NOT NULL DEFAULT 'medium',
  status public.complaint_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- ANNOUNCEMENTS
-- =========================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority public.announcement_priority NOT NULL DEFAULT 'info',
  audience TEXT NOT NULL DEFAULT 'all', -- all | owners | tenants | committee
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estate_id UUID REFERENCES public.estates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- DOCUMENTS
-- =========================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scope public.document_scope NOT NULL DEFAULT 'estate',
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  file_url TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- SECURITY INCIDENTS
-- =========================================================
CREATE TABLE public.security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity public.incident_severity NOT NULL DEFAULT 'low',
  status public.incident_status NOT NULL DEFAULT 'reported',
  location TEXT,
  description TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_incidents TO authenticated;
GRANT ALL ON public.security_incidents TO service_role;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- AUDIT LOGS
-- =========================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID REFERENCES public.estates(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- Estates
CREATE POLICY "estates_select" ON public.estates FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR id = public.current_estate_id(auth.uid())
  );
CREATE POLICY "estates_super_admin_all" ON public.estates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "estates_admin_update" ON public.estates FOR UPDATE TO authenticated
  USING (public.is_estate_staff(auth.uid(), id) AND public.has_role(auth.uid(), 'estate_admin'))
  WITH CHECK (public.is_estate_staff(auth.uid(), id) AND public.has_role(auth.uid(), 'estate_admin'));

-- Profiles
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_estate_staff(auth.uid(), estate_id));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_staff(auth.uid(), estate_id));
CREATE POLICY "profiles_admin_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

-- User roles
CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_estate_staff(auth.uid(), estate_id));

-- Properties
CREATE POLICY "properties_select" ON public.properties FOR SELECT TO authenticated
  USING (
    public.is_estate_staff(auth.uid(), estate_id)
    OR estate_id = public.current_estate_id(auth.uid())
  );
CREATE POLICY "properties_admin_write" ON public.properties FOR ALL TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id) AND public.has_role(auth.uid(), 'estate_admin'))
  WITH CHECK (public.is_estate_staff(auth.uid(), estate_id) AND public.has_role(auth.uid(), 'estate_admin'));

-- Households
CREATE POLICY "households_select" ON public.households FOR SELECT TO authenticated
  USING (
    primary_resident_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );
CREATE POLICY "households_admin_write" ON public.households FOR ALL TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id) AND public.has_role(auth.uid(), 'estate_admin'))
  WITH CHECK (public.is_estate_staff(auth.uid(), estate_id) AND public.has_role(auth.uid(), 'estate_admin'));

-- Household members
CREATE POLICY "household_members_select" ON public.household_members FOR SELECT TO authenticated
  USING (
    public.is_estate_staff(auth.uid(), estate_id)
    OR EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = household_id AND h.primary_resident_id = auth.uid()
    )
  );
CREATE POLICY "household_members_write" ON public.household_members FOR ALL TO authenticated
  USING (
    public.is_estate_staff(auth.uid(), estate_id)
    OR EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = household_id AND h.primary_resident_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_estate_staff(auth.uid(), estate_id)
    OR EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = household_id AND h.primary_resident_id = auth.uid()
    )
  );

-- Vehicles
CREATE POLICY "vehicles_select" ON public.vehicles FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );
CREATE POLICY "vehicles_write" ON public.vehicles FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );

-- Visitors
CREATE POLICY "visitors_select" ON public.visitors FOR SELECT TO authenticated
  USING (
    host_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );
CREATE POLICY "visitors_insert" ON public.visitors FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid() OR public.is_estate_staff(auth.uid(), estate_id));
CREATE POLICY "visitors_update" ON public.visitors FOR UPDATE TO authenticated
  USING (host_id = auth.uid() OR public.is_estate_staff(auth.uid(), estate_id))
  WITH CHECK (host_id = auth.uid() OR public.is_estate_staff(auth.uid(), estate_id));
CREATE POLICY "visitors_delete" ON public.visitors FOR DELETE TO authenticated
  USING (host_id = auth.uid() OR public.is_estate_staff(auth.uid(), estate_id));

-- Invoices
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated
  USING (
    resident_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );
CREATE POLICY "invoices_admin_write" ON public.invoices FOR ALL TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id) AND public.has_role(auth.uid(), 'estate_admin'))
  WITH CHECK (public.is_estate_staff(auth.uid(), estate_id) AND public.has_role(auth.uid(), 'estate_admin'));

-- Payments
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
  USING (
    resident_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (resident_id = auth.uid() OR public.is_estate_staff(auth.uid(), estate_id));
CREATE POLICY "payments_admin_update" ON public.payments FOR UPDATE TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_staff(auth.uid(), estate_id));

-- Complaints
CREATE POLICY "complaints_select" ON public.complaints FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR assignee_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );
CREATE POLICY "complaints_insert" ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "complaints_update" ON public.complaints FOR UPDATE TO authenticated
  USING (
    reporter_id = auth.uid()
    OR assignee_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  )
  WITH CHECK (
    reporter_id = auth.uid()
    OR assignee_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );

-- Announcements
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT TO authenticated
  USING (
    estate_id = public.current_estate_id(auth.uid())
    OR public.is_estate_staff(auth.uid(), estate_id)
  );
CREATE POLICY "announcements_admin_write" ON public.announcements FOR ALL TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id) AND public.has_role(auth.uid(), 'estate_admin'))
  WITH CHECK (public.is_estate_staff(auth.uid(), estate_id) AND public.has_role(auth.uid(), 'estate_admin'));

-- Notifications
CREATE POLICY "notifications_self" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Documents
CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated
  USING (
    (scope = 'resident' AND resident_id = auth.uid())
    OR (scope = 'estate' AND estate_id = public.current_estate_id(auth.uid()))
    OR public.is_estate_staff(auth.uid(), estate_id)
  );
CREATE POLICY "documents_write" ON public.documents FOR ALL TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );

-- Security incidents
CREATE POLICY "incidents_select" ON public.security_incidents FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR public.is_estate_staff(auth.uid(), estate_id)
  );
CREATE POLICY "incidents_insert" ON public.security_incidents FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "incidents_admin_update" ON public.security_incidents FOR UPDATE TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_staff(auth.uid(), estate_id));

-- Audit logs
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_estate_staff(auth.uid(), estate_id));
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
