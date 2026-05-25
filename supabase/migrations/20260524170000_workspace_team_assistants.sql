-- Team assistants, role-based workspace access, and permission-aware RLS.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Team members table (single-owner workspace sharing)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'assistant' CHECK (role IN ('owner', 'assistant', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  permissions JSONB NOT NULL DEFAULT jsonb_build_object(
    'tasks', true,
    'reservations', true,
    'orders', true,
    'crm', true,
    'finance', true,
    'reports', true,
    'notes', false,
    'integrations', false,
    'settings', false
  ),
  invite_token TEXT NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 18),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (owner_user_id, member_email),
  UNIQUE (owner_user_id, member_user_id),
  UNIQUE (invite_token)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_owner ON public.workspace_members(owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_members_member ON public.workspace_members(member_user_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_members_email ON public.workspace_members(lower(member_email));

CREATE OR REPLACE FUNCTION public.touch_workspace_members_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_workspace_members_updated_at ON public.workspace_members;
CREATE TRIGGER trg_touch_workspace_members_updated_at
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_workspace_members_updated_at();

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner mengelola anggota workspace" ON public.workspace_members;
CREATE POLICY "Owner mengelola anggota workspace"
  ON public.workspace_members
  FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Member dapat melihat barisnya sendiri" ON public.workspace_members;
CREATE POLICY "Member dapat melihat barisnya sendiri"
  ON public.workspace_members
  FOR SELECT
  USING (auth.uid() = member_user_id);

-- 2) Membership helpers
CREATE OR REPLACE FUNCTION public.ensure_owner_workspace_membership(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT email INTO v_email FROM public.profiles WHERE id = p_user_id LIMIT 1;
  IF v_email IS NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = p_user_id LIMIT 1;
  END IF;
  IF v_email IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.workspace_members (
    owner_user_id,
    member_user_id,
    member_email,
    role,
    status,
    permissions,
    invited_by,
    accepted_at
  )
  VALUES (
    p_user_id,
    p_user_id,
    lower(v_email),
    'owner',
    'active',
    jsonb_build_object(
      'tasks', true,
      'reservations', true,
      'orders', true,
      'crm', true,
      'finance', true,
      'reports', true,
      'notes', true,
      'integrations', true,
      'settings', true
    ),
    p_user_id,
    timezone('utc'::text, now())
  )
  ON CONFLICT (owner_user_id, member_email)
  DO UPDATE SET
    member_user_id = EXCLUDED.member_user_id,
    role = EXCLUDED.role,
    status = 'active',
    accepted_at = COALESCE(public.workspace_members.accepted_at, timezone('utc'::text, now()));
END;
$$;

-- backfill owners for existing users
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.profiles LOOP
    PERFORM public.ensure_owner_workspace_membership(rec.id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_workspace_context()
RETURNS TABLE(owner_user_id UUID, role TEXT, permissions JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  PERFORM public.ensure_owner_workspace_membership(v_uid);

  RETURN QUERY
  SELECT
    wm.owner_user_id,
    wm.role,
    wm.permissions
  FROM public.workspace_members wm
  WHERE wm.status = 'active'
    AND (
      wm.member_user_id = v_uid
      OR (wm.member_user_id IS NULL AND lower(wm.member_email) = lower(COALESCE(auth.jwt()->>'email', '')))
    )
  ORDER BY
    CASE
      WHEN wm.member_user_id = v_uid AND wm.owner_user_id <> v_uid THEN 0
      WHEN wm.role = 'owner' AND wm.owner_user_id = v_uid THEN 1
      ELSE 2
    END,
    wm.created_at ASC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_workspace_owner_label(p_owner_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_label TEXT;
BEGIN
  IF v_uid IS NULL OR p_owner_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.owner_user_id = p_owner_user_id
      AND wm.status = 'active'
      AND (
        wm.member_user_id = v_uid
        OR (wm.member_user_id IS NULL AND lower(wm.member_email) = lower(COALESCE(auth.jwt()->>'email', '')))
      )
  ) THEN
    RETURN NULL;
  END IF;

  SELECT NULLIF(trim(u.raw_user_meta_data->>'full_name'), '')
  INTO v_label
  FROM auth.users u
  WHERE u.id = p_owner_user_id
  LIMIT 1;

  IF v_label IS NOT NULL THEN
    RETURN v_label;
  END IF;

  SELECT NULLIF(trim(p.full_name), '')
  INTO v_label
  FROM public.profiles p
  WHERE p.id = p_owner_user_id
  LIMIT 1;

  IF v_label IS NOT NULL THEN
    RETURN v_label;
  END IF;

  SELECT NULLIF(split_part(lower(u.email), '@', 1), '')
  INTO v_label
  FROM auth.users u
  WHERE u.id = p_owner_user_id
  LIMIT 1;

  RETURN v_label;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_workspace_member(
  p_email TEXT,
  p_role TEXT DEFAULT 'assistant',
  p_permissions JSONB DEFAULT NULL
)
RETURNS public.workspace_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT := lower(trim(COALESCE(p_email, '')));
  v_role TEXT := lower(trim(COALESCE(p_role, 'assistant')));
  v_target_user UUID;
  v_row public.workspace_members;
  v_permissions JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'Email tidak valid';
  END IF;

  IF v_role NOT IN ('assistant', 'viewer') THEN
    RAISE EXCEPTION 'Role hanya boleh assistant/viewer';
  END IF;

  PERFORM public.ensure_owner_workspace_membership(v_uid);

  SELECT id INTO v_target_user
  FROM public.profiles
  WHERE lower(email) = v_email
  LIMIT 1;

  v_permissions := COALESCE(
    p_permissions,
    CASE
      WHEN v_role = 'viewer' THEN jsonb_build_object(
        'tasks', false,
        'reservations', false,
        'orders', false,
        'crm', false,
        'finance', false,
        'reports', true,
        'notes', false,
        'integrations', false,
        'settings', false
      )
      ELSE jsonb_build_object(
        'tasks', true,
        'reservations', true,
        'orders', true,
        'crm', true,
        'finance', true,
        'reports', true,
        'notes', false,
        'integrations', false,
        'settings', false
      )
    END
  );

  INSERT INTO public.workspace_members (
    owner_user_id,
    member_user_id,
    member_email,
    role,
    status,
    permissions,
    invited_by,
    accepted_at
  )
  VALUES (
    v_uid,
    v_target_user,
    v_email,
    v_role,
    CASE WHEN v_target_user IS NULL THEN 'pending' ELSE 'active' END,
    v_permissions,
    v_uid,
    CASE WHEN v_target_user IS NULL THEN NULL ELSE timezone('utc'::text, now()) END
  )
  ON CONFLICT (owner_user_id, member_email)
  DO UPDATE SET
    member_user_id = COALESCE(EXCLUDED.member_user_id, public.workspace_members.member_user_id),
    role = EXCLUDED.role,
    status = CASE WHEN COALESCE(EXCLUDED.member_user_id, public.workspace_members.member_user_id) IS NULL THEN 'pending' ELSE 'active' END,
    permissions = EXCLUDED.permissions,
    invited_by = EXCLUDED.invited_by,
    invite_token = CASE WHEN public.workspace_members.status = 'revoked' THEN EXCLUDED.invite_token ELSE public.workspace_members.invite_token END,
    accepted_at = CASE WHEN COALESCE(EXCLUDED.member_user_id, public.workspace_members.member_user_id) IS NULL THEN NULL ELSE COALESCE(public.workspace_members.accepted_at, timezone('utc'::text, now())) END
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_workspace_invite(p_invite_token TEXT)
RETURNS public.workspace_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT := lower(COALESCE(auth.jwt()->>'email', ''));
  v_row public.workspace_members;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF trim(COALESCE(p_invite_token, '')) = '' THEN
    RAISE EXCEPTION 'Token undangan wajib diisi';
  END IF;

  PERFORM public.ensure_owner_workspace_membership(v_uid);

  UPDATE public.workspace_members wm
  SET
    member_user_id = v_uid,
    status = 'active',
    accepted_at = timezone('utc'::text, now())
  WHERE wm.invite_token = p_invite_token
    AND wm.status = 'pending'
    AND lower(wm.member_email) = v_email
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Undangan tidak ditemukan atau email akun tidak sesuai';
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_workspace_invite_token_only(p_invite_token TEXT)
RETURNS public.workspace_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT := lower(COALESCE(auth.jwt()->>'email', ''));
  v_row public.workspace_members;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF trim(COALESCE(p_invite_token, '')) = '' THEN
    RAISE EXCEPTION 'Token undangan wajib diisi';
  END IF;

  PERFORM public.ensure_owner_workspace_membership(v_uid);

  UPDATE public.workspace_members wm
  SET
    member_user_id = v_uid,
    status = 'active',
    accepted_at = timezone('utc'::text, now())
  WHERE wm.invite_token = p_invite_token
    AND wm.status = 'pending'
  RETURNING * INTO v_row;

  IF v_row.id IS NOT NULL THEN
    RETURN v_row;
  END IF;

  -- Idempotent login path: token yang sama boleh dipakai lagi oleh akun assistant yang sama.
  SELECT wm.*
  INTO v_row
  FROM public.workspace_members wm
  WHERE wm.invite_token = p_invite_token
    AND wm.status = 'active'
    AND (
      wm.member_user_id = v_uid
      OR lower(wm.member_email) = v_email
    )
  ORDER BY wm.created_at DESC
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Undangan tidak ditemukan atau sudah dipakai';
  END IF;

  RETURN v_row;
END;
$$;

-- 3) Access helpers for workspace-shared rows
CREATE OR REPLACE FUNCTION public.workspace_can_read_area(p_owner_user_id UUID, p_area TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_owner_user_id IS NULL OR p_area IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_uid = p_owner_user_id THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.owner_user_id = p_owner_user_id
      AND wm.member_user_id = v_uid
      AND wm.status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.workspace_can_write_area(p_owner_user_id UUID, p_area TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_owner_user_id IS NULL OR p_area IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_uid = p_owner_user_id THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.owner_user_id = p_owner_user_id
      AND wm.member_user_id = v_uid
      AND wm.status = 'active'
      AND wm.role IN ('assistant')
      AND COALESCE((wm.permissions ->> p_area)::boolean, FALSE) = TRUE
  );
END;
$$;

-- 4) Replace RLS policies on shared business tables

-- tasks
DROP POLICY IF EXISTS "Pengguna dapat mengakses tugas mereka sendiri" ON public.tasks;
DROP POLICY IF EXISTS "workspace tasks read" ON public.tasks;
DROP POLICY IF EXISTS "workspace tasks write" ON public.tasks;
CREATE POLICY "workspace tasks read"
  ON public.tasks FOR SELECT
  USING (public.workspace_can_read_area(user_id, 'tasks'));
CREATE POLICY "workspace tasks write"
  ON public.tasks FOR ALL
  USING (public.workspace_can_write_area(user_id, 'tasks'))
  WITH CHECK (public.workspace_can_write_area(user_id, 'tasks'));

-- project folders
DROP POLICY IF EXISTS "Pengguna dapat mengakses folder project mereka sendiri" ON public.project_folders;
DROP POLICY IF EXISTS "workspace folders read" ON public.project_folders;
DROP POLICY IF EXISTS "workspace folders write" ON public.project_folders;
CREATE POLICY "workspace folders read"
  ON public.project_folders FOR SELECT
  USING (public.workspace_can_read_area(user_id, 'tasks'));
CREATE POLICY "workspace folders write"
  ON public.project_folders FOR ALL
  USING (public.workspace_can_write_area(user_id, 'tasks'))
  WITH CHECK (public.workspace_can_write_area(user_id, 'tasks'));

-- appointments
DROP POLICY IF EXISTS "Pengguna dapat mengakses reservasi mereka sendiri" ON public.appointments;
DROP POLICY IF EXISTS "workspace appointments read" ON public.appointments;
DROP POLICY IF EXISTS "workspace appointments write" ON public.appointments;
CREATE POLICY "workspace appointments read"
  ON public.appointments FOR SELECT
  USING (public.workspace_can_read_area(user_id, 'reservations'));
CREATE POLICY "workspace appointments write"
  ON public.appointments FOR ALL
  USING (public.workspace_can_write_area(user_id, 'reservations'))
  WITH CHECK (public.workspace_can_write_area(user_id, 'reservations'));

-- spreadsheet orders
DROP POLICY IF EXISTS "Pengguna dapat mengakses order spreadsheet mereka sendiri" ON public.spreadsheet_orders;
DROP POLICY IF EXISTS "workspace orders read" ON public.spreadsheet_orders;
DROP POLICY IF EXISTS "workspace orders write" ON public.spreadsheet_orders;
CREATE POLICY "workspace orders read"
  ON public.spreadsheet_orders FOR SELECT
  USING (public.workspace_can_read_area(user_id, 'orders'));
CREATE POLICY "workspace orders write"
  ON public.spreadsheet_orders FOR ALL
  USING (public.workspace_can_write_area(user_id, 'orders'))
  WITH CHECK (public.workspace_can_write_area(user_id, 'orders'));

-- spreadsheet order timeline
DROP POLICY IF EXISTS "Pengguna dapat mengakses timeline order spreadsheet mereka sendiri" ON public.spreadsheet_order_timeline;
DROP POLICY IF EXISTS "workspace order timeline read" ON public.spreadsheet_order_timeline;
DROP POLICY IF EXISTS "workspace order timeline write" ON public.spreadsheet_order_timeline;
CREATE POLICY "workspace order timeline read"
  ON public.spreadsheet_order_timeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.spreadsheet_orders o
      WHERE o.id = spreadsheet_order_timeline.order_id
        AND public.workspace_can_read_area(o.user_id, 'orders')
    )
  );
CREATE POLICY "workspace order timeline write"
  ON public.spreadsheet_order_timeline FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.spreadsheet_orders o
      WHERE o.id = spreadsheet_order_timeline.order_id
        AND public.workspace_can_write_area(o.user_id, 'orders')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.spreadsheet_orders o
      WHERE o.id = spreadsheet_order_timeline.order_id
        AND public.workspace_can_write_area(o.user_id, 'orders')
    )
  );

-- crm clients
DROP POLICY IF EXISTS "Pengguna dapat mengakses client CRM mereka sendiri" ON public.crm_clients;
DROP POLICY IF EXISTS "workspace crm clients read" ON public.crm_clients;
DROP POLICY IF EXISTS "workspace crm clients write" ON public.crm_clients;
CREATE POLICY "workspace crm clients read"
  ON public.crm_clients FOR SELECT
  USING (public.workspace_can_read_area(user_id, 'crm'));
CREATE POLICY "workspace crm clients write"
  ON public.crm_clients FOR ALL
  USING (public.workspace_can_write_area(user_id, 'crm'))
  WITH CHECK (public.workspace_can_write_area(user_id, 'crm'));

-- crm activities
DROP POLICY IF EXISTS "Pengguna dapat mengakses activity CRM mereka sendiri" ON public.crm_activities;
DROP POLICY IF EXISTS "workspace crm activities read" ON public.crm_activities;
DROP POLICY IF EXISTS "workspace crm activities write" ON public.crm_activities;
CREATE POLICY "workspace crm activities read"
  ON public.crm_activities FOR SELECT
  USING (public.workspace_can_read_area(user_id, 'crm'));
CREATE POLICY "workspace crm activities write"
  ON public.crm_activities FOR ALL
  USING (public.workspace_can_write_area(user_id, 'crm'))
  WITH CHECK (public.workspace_can_write_area(user_id, 'crm'));

-- finance invoices
DROP POLICY IF EXISTS "Pengguna dapat mengakses invoice mereka sendiri" ON public.finance_invoices;
DROP POLICY IF EXISTS "workspace finance invoices read" ON public.finance_invoices;
DROP POLICY IF EXISTS "workspace finance invoices write" ON public.finance_invoices;
CREATE POLICY "workspace finance invoices read"
  ON public.finance_invoices FOR SELECT
  USING (public.workspace_can_read_area(user_id, 'finance'));
CREATE POLICY "workspace finance invoices write"
  ON public.finance_invoices FOR ALL
  USING (public.workspace_can_write_area(user_id, 'finance'))
  WITH CHECK (public.workspace_can_write_area(user_id, 'finance'));

-- activity logs
DROP POLICY IF EXISTS "Pengguna dapat mengakses log mereka sendiri" ON public.activity_logs;
DROP POLICY IF EXISTS "workspace activity logs read" ON public.activity_logs;
DROP POLICY IF EXISTS "workspace activity logs write" ON public.activity_logs;
CREATE POLICY "workspace activity logs read"
  ON public.activity_logs FOR SELECT
  USING (public.workspace_can_read_area(user_id, 'reports'));
CREATE POLICY "workspace activity logs write"
  ON public.activity_logs FOR INSERT
  WITH CHECK (public.workspace_can_write_area(user_id, 'reports'));

-- keep strict owner-only access for sensitive tables
DROP POLICY IF EXISTS "Pengguna dapat mengakses catatan mereka sendiri" ON public.secure_notes;
CREATE POLICY "Pengguna dapat mengakses catatan mereka sendiri"
    ON public.secure_notes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat melihat konfigurasi integrasi mereka sendiri" ON public.user_integration_configs;
DROP POLICY IF EXISTS "Pengguna dapat menambah konfigurasi integrasi mereka sendiri" ON public.user_integration_configs;
DROP POLICY IF EXISTS "Pengguna dapat memperbarui konfigurasi integrasi mereka sendiri" ON public.user_integration_configs;
DROP POLICY IF EXISTS "Pengguna dapat menghapus konfigurasi integrasi mereka sendiri" ON public.user_integration_configs;
DROP POLICY IF EXISTS "workspace integrations configs read" ON public.user_integration_configs;
DROP POLICY IF EXISTS "workspace integrations configs insert" ON public.user_integration_configs;
DROP POLICY IF EXISTS "workspace integrations configs update" ON public.user_integration_configs;
DROP POLICY IF EXISTS "workspace integrations configs delete" ON public.user_integration_configs;
CREATE POLICY "workspace integrations configs read"
    ON public.user_integration_configs FOR SELECT
    USING (public.workspace_can_read_area(user_id, 'integrations'));
CREATE POLICY "workspace integrations configs insert"
    ON public.user_integration_configs FOR INSERT
    WITH CHECK (public.workspace_can_write_area(user_id, 'integrations'));
CREATE POLICY "workspace integrations configs update"
    ON public.user_integration_configs FOR UPDATE
    USING (public.workspace_can_write_area(user_id, 'integrations'))
    WITH CHECK (public.workspace_can_write_area(user_id, 'integrations'));
CREATE POLICY "workspace integrations configs delete"
    ON public.user_integration_configs FOR DELETE
    USING (public.workspace_can_write_area(user_id, 'integrations'));

-- realtime tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_owner_workspace_membership(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_context() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_owner_label(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_workspace_member(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invite_token_only(TEXT) TO authenticated;
