-- Houses are created by estate administrators and grouped by compound name.
-- Ownership is separate from platform membership so an owner's relatives can
-- also have accounts without being treated as the property's main owner.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_phone TEXT;

ALTER TABLE public.property_occupants
  ADD COLUMN IF NOT EXISTS household_size INTEGER;

ALTER TABLE public.property_occupants
  DROP CONSTRAINT IF EXISTS property_occupants_household_size_check;

ALTER TABLE public.property_occupants
  ADD CONSTRAINT property_occupants_household_size_check
  CHECK (household_size IS NULL OR household_size > 0);

-- Preserve landlord details already entered under the previous model.
WITH current_landlords AS (
  SELECT DISTINCT ON (occupant.property_id)
    occupant.property_id,
    occupant.resident_id,
    occupant.full_name,
    occupant.phone
  FROM public.property_occupants AS occupant
  WHERE occupant.occupant_type = 'landlord'::public.resident_type
    AND occupant.is_current = true
  ORDER BY
    occupant.property_id,
    occupant.is_primary DESC,
    occupant.created_at ASC
)
UPDATE public.properties AS property
SET
  owner_id = landlord.resident_id,
  owner_name = landlord.full_name,
  owner_phone = landlord.phone
FROM current_landlords AS landlord
WHERE landlord.property_id = property.id
  AND property.owner_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_properties_owner
  ON public.properties(owner_id);

-- Residents may only link themselves as tenants to an existing admin-created
-- house. They cannot insert or alter property records.
DROP POLICY IF EXISTS "property_occupants_self_insert" ON public.property_occupants;
DROP POLICY IF EXISTS "property_occupants_self_update" ON public.property_occupants;

CREATE POLICY "property_occupants_tenant_self_insert" ON public.property_occupants
  FOR INSERT TO authenticated
  WITH CHECK (
    resident_id = auth.uid()
    AND occupant_type = 'tenant'::public.resident_type
    AND estate_id = public.current_estate_id(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.properties
      WHERE properties.id = property_id
        AND properties.estate_id = property_occupants.estate_id
    )
  );

CREATE POLICY "property_occupants_tenant_self_update" ON public.property_occupants
  FOR UPDATE TO authenticated
  USING (
    resident_id = auth.uid()
    AND occupant_type = 'tenant'::public.resident_type
    AND estate_id = public.current_estate_id(auth.uid())
  )
  WITH CHECK (
    resident_id = auth.uid()
    AND occupant_type = 'tenant'::public.resident_type
    AND estate_id = public.current_estate_id(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.properties
      WHERE properties.id = property_id
        AND properties.estate_id = property_occupants.estate_id
    )
  );

CREATE OR REPLACE FUNCTION public.refresh_house_occupancy_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    UPDATE public.properties
    SET status = CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.property_occupants
        WHERE property_id = OLD.property_id
          AND occupant_type = 'tenant'::public.resident_type
          AND is_current = true
      ) THEN 'occupied'::public.property_status
      ELSE 'vacant'::public.property_status
    END
    WHERE id = OLD.property_id
      AND status IN (
        'occupied'::public.property_status,
        'vacant'::public.property_status
      );
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE public.properties
    SET status = CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.property_occupants
        WHERE property_id = NEW.property_id
          AND occupant_type = 'tenant'::public.resident_type
          AND is_current = true
      ) THEN 'occupied'::public.property_status
      ELSE 'vacant'::public.property_status
    END
    WHERE id = NEW.property_id
      AND status IN (
        'occupied'::public.property_status,
        'vacant'::public.property_status
      );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_house_occupancy_status
  ON public.property_occupants;
CREATE TRIGGER trg_refresh_house_occupancy_status
  AFTER INSERT OR UPDATE OR DELETE ON public.property_occupants
  FOR EACH ROW EXECUTE FUNCTION public.refresh_house_occupancy_status();
