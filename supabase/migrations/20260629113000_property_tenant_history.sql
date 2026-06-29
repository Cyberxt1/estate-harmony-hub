ALTER TABLE public.property_occupants
  ADD COLUMN IF NOT EXISTS resident_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS occupant_type public.resident_type,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS move_in_date DATE,
  ADD COLUMN IF NOT EXISTS move_out_date DATE,
  ADD COLUMN IF NOT EXISTS landlord_name TEXT,
  ADD COLUMN IF NOT EXISTS landlord_phone TEXT,
  ADD COLUMN IF NOT EXISTS stay_duration TEXT;

UPDATE public.property_occupants
SET is_current = true
WHERE is_current IS DISTINCT FROM true;

CREATE INDEX IF NOT EXISTS idx_property_occupants_resident
  ON public.property_occupants(resident_id);

CREATE INDEX IF NOT EXISTS idx_property_occupants_current
  ON public.property_occupants(property_id, is_current);

CREATE UNIQUE INDEX IF NOT EXISTS property_occupants_current_resident_unique
  ON public.property_occupants(resident_id)
  WHERE resident_id IS NOT NULL AND is_current = true;

DROP POLICY IF EXISTS "property_occupants_admin_write" ON public.property_occupants;
CREATE POLICY "property_occupants_admin_write" ON public.property_occupants
  FOR ALL TO authenticated
  USING (public.is_estate_admin(auth.uid(), estate_id))
  WITH CHECK (public.is_estate_admin(auth.uid(), estate_id));

CREATE POLICY "property_occupants_self_insert" ON public.property_occupants
  FOR INSERT TO authenticated
  WITH CHECK (
    resident_id = auth.uid()
    AND estate_id = public.current_estate_id(auth.uid())
  );

CREATE POLICY "property_occupants_self_update" ON public.property_occupants
  FOR UPDATE TO authenticated
  USING (
    resident_id = auth.uid()
    AND estate_id = public.current_estate_id(auth.uid())
  )
  WITH CHECK (
    resident_id = auth.uid()
    AND estate_id = public.current_estate_id(auth.uid())
  );
