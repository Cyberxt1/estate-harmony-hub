INSERT INTO public.estates (id, name, slug, country)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Oyesile Estate',
  'oyesile-estate',
  'Nigeria'
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  updated_at = now();

UPDATE public.profiles
SET estate_id = '11111111-1111-1111-1111-111111111111'
WHERE estate_id IS NULL;

INSERT INTO public.user_roles (user_id, estate_id, role)
SELECT DISTINCT
  user_id,
  '11111111-1111-1111-1111-111111111111',
  role
FROM public.user_roles
WHERE estate_id IS NULL;

DELETE FROM public.user_roles
WHERE estate_id IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, estate_id, full_name, email)
  VALUES (
    NEW.id,
    '11111111-1111-1111-1111-111111111111',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET
    estate_id = COALESCE(public.profiles.estate_id, EXCLUDED.estate_id),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    email = COALESCE(public.profiles.email, EXCLUDED.email);

  INSERT INTO public.user_roles (user_id, estate_id, role)
  VALUES (NEW.id, '11111111-1111-1111-1111-111111111111', 'resident')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
