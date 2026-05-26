-- Global app settings and shared login visual asset.
-- The login visual is stored once in Supabase Storage and referenced from a
-- public-readable settings row so it can sync before users log in.

CREATE TABLE IF NOT EXISTS public.app_global_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.app_global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app global settings public read" ON public.app_global_settings;
CREATE POLICY "app global settings public read"
    ON public.app_global_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "app global settings authenticated insert" ON public.app_global_settings;
CREATE POLICY "app global settings authenticated insert"
    ON public.app_global_settings FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "app global settings authenticated update" ON public.app_global_settings;
CREATE POLICY "app global settings authenticated update"
    ON public.app_global_settings FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "app global settings authenticated delete" ON public.app_global_settings;
CREATE POLICY "app global settings authenticated delete"
    ON public.app_global_settings FOR DELETE
    TO authenticated
    USING (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'app-assets',
    'app-assets',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "app assets public read" ON storage.objects;
CREATE POLICY "app assets public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'app-assets');

DROP POLICY IF EXISTS "app assets authenticated insert" ON storage.objects;
CREATE POLICY "app assets authenticated insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'app-assets');

DROP POLICY IF EXISTS "app assets authenticated update" ON storage.objects;
CREATE POLICY "app assets authenticated update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'app-assets')
    WITH CHECK (bucket_id = 'app-assets');

DROP POLICY IF EXISTS "app assets authenticated delete" ON storage.objects;
CREATE POLICY "app assets authenticated delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'app-assets');

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_global_settings;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END;
$$;
