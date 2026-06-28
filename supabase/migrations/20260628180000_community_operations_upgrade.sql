ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS compound_name TEXT,
  ADD COLUMN IF NOT EXISTS apartment_name TEXT,
  ADD COLUMN IF NOT EXISTS occupant_capacity INTEGER;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_estate_id_house_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS properties_location_unique
  ON public.properties (
    estate_id,
    COALESCE(compound_name, ''),
    house_number,
    COALESCE(apartment_name, '')
  );

CREATE TABLE IF NOT EXISTS public.property_occupants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES public.estates(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_occupants TO authenticated;
GRANT ALL ON public.property_occupants TO service_role;
ALTER TABLE public.property_occupants ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_property_occupants_updated ON public.property_occupants;
CREATE TRIGGER trg_property_occupants_updated
  BEFORE UPDATE ON public.property_occupants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "property_occupants_select" ON public.property_occupants
  FOR SELECT TO authenticated
  USING (
    estate_id = public.current_estate_id(auth.uid())
    OR public.is_estate_staff(auth.uid(), estate_id)
  );

CREATE POLICY "property_occupants_admin_write" ON public.property_occupants
  FOR ALL TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

CREATE TABLE IF NOT EXISTS public.announcement_recipients (
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.announcement_recipients TO authenticated;
GRANT ALL ON public.announcement_recipients TO service_role;
ALTER TABLE public.announcement_recipients ENABLE ROW LEVEL SECURITY;

UPDATE public.announcements
SET audience = CASE
  WHEN audience = 'tenants' THEN 'tenant'
  WHEN audience = 'owners' THEN 'landlord'
  WHEN audience = 'committee' THEN 'all'
  ELSE audience
END;

CREATE OR REPLACE FUNCTION public.can_view_announcement(
  _user_id UUID,
  _announcement_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.announcements a
    LEFT JOIN public.profiles p ON p.id = _user_id
    WHERE a.id = _announcement_id
      AND (
        public.is_estate_staff(_user_id, a.estate_id)
        OR (
          p.estate_id = a.estate_id
          AND (
            a.audience = 'all'
            OR a.audience = p.resident_type::text
            OR (
              a.audience = 'selected'
              AND EXISTS (
                SELECT 1
                FROM public.announcement_recipients ar
                WHERE ar.announcement_id = a.id
                  AND ar.user_id = _user_id
              )
            )
          )
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_view_announcement(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT TO authenticated
  USING (public.can_view_announcement(auth.uid(), id));

CREATE POLICY "announcement_recipients_select" ON public.announcement_recipients
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.announcements a
      WHERE a.id = announcement_id
        AND public.is_estate_admin(auth.uid(), a.estate_id)
    )
  );

CREATE POLICY "announcement_recipients_admin_write" ON public.announcement_recipients
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.announcements a
      WHERE a.id = announcement_id
        AND public.is_estate_admin(auth.uid(), a.estate_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.announcements a
      WHERE a.id = announcement_id
        AND public.is_estate_admin(auth.uid(), a.estate_id)
    )
  );

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id));

CREATE INDEX IF NOT EXISTS idx_property_occupants_property
  ON public.property_occupants(property_id);
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_user
  ON public.announcement_recipients(user_id);
