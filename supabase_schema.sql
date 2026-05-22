-- SQL Schema untuk DyaTask Manager di Supabase (PostgreSQL)
-- Berisi inisialisasi tabel, relasi, dan kebijakan Row-Level Security (RLS)

-- 1. Tabel Profil Pengguna (Sinkronisasi dari auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS pada Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna dapat melihat profil mereka sendiri" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Trigger otomatis untuk sinkronisasi dari auth.users ke public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Tabel Tugas (Tasks)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Work' NOT NULL,
    priority TEXT DEFAULT 'medium' NOT NULL,
    color_label TEXT DEFAULT '#8B5CF6' NOT NULL,
    status TEXT DEFAULT 'todo' NOT NULL,
    task_date DATE,
    due_time TEXT,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    task_type TEXT DEFAULT 'task' NOT NULL CHECK (task_type IN ('task', 'subtask')),
    sort_order INTEGER DEFAULT 0 NOT NULL,
    has_reminder BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS pada Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna dapat mengakses tugas mereka sendiri" 
    ON public.tasks FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 3. Tabel Agenda/Reservasi Pertemuan (Appointments)
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    title TEXT NOT NULL,
    email TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS pada Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna dapat mengakses reservasi mereka sendiri" 
    ON public.appointments FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 4. Tabel Catatan Rahasia Terenkripsi (Secure Notes)
CREATE TABLE public.secure_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cipher_text TEXT NOT NULL,
    iv TEXT NOT NULL,
    salt TEXT NOT NULL,
    plaintext_hint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS pada Secure Notes
ALTER TABLE public.secure_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna dapat mengakses catatan mereka sendiri" 
    ON public.secure_notes FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indeks untuk mengoptimalkan performa kueri
CREATE INDEX idx_tasks_user ON public.tasks(user_id);
CREATE INDEX idx_tasks_parent ON public.tasks(parent_task_id);
CREATE INDEX idx_appointments_user ON public.appointments(user_id);
CREATE INDEX idx_secure_notes_user ON public.secure_notes(user_id);

-- 5. Tabel Konfigurasi Integrasi Eksternal Per User
CREATE TABLE public.user_integration_configs (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    configs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_integration_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna dapat melihat konfigurasi integrasi mereka sendiri"
    ON public.user_integration_configs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menambah konfigurasi integrasi mereka sendiri"
    ON public.user_integration_configs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat memperbarui konfigurasi integrasi mereka sendiri"
    ON public.user_integration_configs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menghapus konfigurasi integrasi mereka sendiri"
    ON public.user_integration_configs FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX idx_user_integration_configs_user ON public.user_integration_configs(user_id);


-- 6. Tabel Folder Project untuk pengelompokan task
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


-- 7. Migration Project Folder & Subtask untuk tabel tasks yang sudah ada
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'task' NOT NULL,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;

UPDATE public.tasks
SET task_type = 'task'
WHERE task_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_task_id);


-- 8. Supabase Storage Bucket untuk Avatar Profil
-- Jalankan bagian ini juga di SQL Editor Supabase agar upload foto profil tidak gagal "Bucket not found".
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
