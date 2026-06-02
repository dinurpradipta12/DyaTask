CREATE TABLE IF NOT EXISTS public.app_user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  owner_user_id UUID,
  workspace_role TEXT NOT NULL DEFAULT 'owner',
  full_name TEXT,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user feedback insert own" ON public.app_user_feedback;
CREATE POLICY "user feedback insert own"
  ON public.app_user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "developer feedback read" ON public.app_user_feedback;
CREATE POLICY "developer feedback read"
  ON public.app_user_feedback
  FOR SELECT
  TO authenticated
  USING (public.is_app_developer());

GRANT SELECT, INSERT ON public.app_user_feedback TO authenticated;
