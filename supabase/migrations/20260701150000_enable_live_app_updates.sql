-- Broadcast changes from the estate's app tables to authenticated Supabase
-- Realtime clients. Row-level security still controls which rows each user
-- is allowed to receive.
DO $$
DECLARE
  table_name text;
  live_tables text[] := ARRAY[
    'estates',
    'profiles',
    'user_roles',
    'properties',
    'households',
    'household_members',
    'property_occupants',
    'vehicles',
    'visitors',
    'invoices',
    'payments',
    'complaints',
    'announcements',
    'announcement_recipients',
    'notifications',
    'documents',
    'security_incidents',
    'emergency_contacts',
    'admin_invitations',
    'staff_tasks'
  ];
BEGIN
  FOREACH table_name IN ARRAY live_tables
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = table_name
      )
    THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        table_name
      );
    END IF;
  END LOOP;
END
$$;
