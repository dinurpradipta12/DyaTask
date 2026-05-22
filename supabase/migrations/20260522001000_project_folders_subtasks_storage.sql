-- Project folders, task/subtask hierarchy, and avatar storage for DyaTask.
-- This migration is idempotent and safe to run on an existing Supabase project.

CREATE TABLE IF NOT EXISTS public.project_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#8B5CF6' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, name)
);

ALTER TABLE public.project_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pengguna dapat mengakses folder project mereka sendiri" ON public.project_folders;
CREATE POLICY "Pengguna dapat mengakses folder project mereka sendiri"
    ON public.project_folders FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_folders_user ON public.project_folders(user_id);

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'task' NOT NULL,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;

UPDATE public.tasks
SET task_type = 'task'
WHERE task_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_task_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Avatar dapat dilihat publik" ON storage.objects;
CREATE POLICY "Avatar dapat dilihat publik"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Pengguna dapat mengunggah avatar sendiri" ON storage.objects;
CREATE POLICY "Pengguna dapat mengunggah avatar sendiri"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Pengguna dapat memperbarui avatar sendiri" ON storage.objects;
CREATE POLICY "Pengguna dapat memperbarui avatar sendiri"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Pengguna dapat menghapus avatar sendiri" ON storage.objects;
CREATE POLICY "Pengguna dapat menghapus avatar sendiri"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
