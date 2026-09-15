-- Verrouille l'acces direct Supabase REST aux tables applicatives.
-- Le CRM accede aux donnees via le serveur Next/Prisma, pas depuis le navigateur
-- avec la cle publique Supabase. Les roles anon/authenticated ne doivent donc
-- pas pouvoir lire, modifier ou supprimer les donnees sensibles.

DO $$
DECLARE
  app_table text;
  app_tables text[] := ARRAY[
    '"_prisma_migrations"',
    '"User"',
    '"Association"',
    '"Donateur"',
    '"Cerfa"',
    '"Gala"',
    '"DonGala"',
    '"PromesseDon"',
    '"GoCardlessConnection"',
    '"GoCardlessPaymentIntent"',
    '"Settings"',
    '"AuditLog"'
  ];
  has_anon boolean := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon');
  has_authenticated boolean := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated');
  has_service_role boolean := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role');
BEGIN
  FOREACH app_table IN ARRAY app_tables LOOP
    IF to_regclass('public.' || app_table) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY', app_table);

      IF has_anon THEN
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%s FROM anon', app_table);
      END IF;

      IF has_authenticated THEN
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%s FROM authenticated', app_table);
      END IF;

      IF has_service_role THEN
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%s TO service_role', app_table);
      END IF;
    END IF;
  END LOOP;

  IF has_anon THEN
    REVOKE USAGE ON SCHEMA public FROM anon;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
  END IF;

  IF has_authenticated THEN
    REVOKE USAGE ON SCHEMA public FROM authenticated;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
  END IF;

  IF has_service_role THEN
    GRANT USAGE ON SCHEMA public TO service_role;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO service_role;
  END IF;
END $$;
