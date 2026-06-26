DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'public.resident_type'::regtype
      AND enumlabel = 'owner'
  ) THEN
    ALTER TYPE public.resident_type RENAME VALUE 'owner' TO 'landlord';
  END IF;
END $$;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS resident_type public.resident_type,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE public.profiles
ALTER COLUMN resident_type DROP NOT NULL,
ALTER COLUMN resident_type DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, estate_id, full_name, email)
  VALUES (
    NEW.id,
    '11111111-1111-1111-1111-111111111111'::uuid,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET
    estate_id = COALESCE(public.profiles.estate_id, EXCLUDED.estate_id),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    email = COALESCE(public.profiles.email, EXCLUDED.email);

  INSERT INTO public.user_roles (user_id, estate_id, role)
  VALUES (NEW.id, '11111111-1111-1111-1111-111111111111'::uuid, 'resident')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
