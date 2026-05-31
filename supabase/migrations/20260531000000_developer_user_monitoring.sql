-- Developer-only monitoring helpers for app signup and workspace invites.

CREATE OR REPLACE FUNCTION public.is_app_developer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND (
        lower(COALESCE(u.email, '')) = ANY (ARRAY[
          'arunika.dyatask@gmail.com',
          'dinur.dyatask@gmail.com',
          'dinurm.pradipta.dyatask@gmail.com'
        ])
        OR lower(split_part(COALESCE(u.email, ''), '@', 1)) = ANY (ARRAY[
          'arunika.dyatask',
          'dinur',
          'dinurm.pradipta'
        ])
        OR lower(COALESCE(u.raw_user_meta_data->>'full_name', '')) = ANY (ARRAY[
          'arunika',
          'dinur',
          'dinur pradipta',
          'dinurm pradipta',
          'dinurm.pradipta'
        ])
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_developer_user_monitoring()
RETURNS TABLE (
  record_type TEXT,
  source_table TEXT,
  subject_user_id UUID,
  owner_user_id UUID,
  member_user_id UUID,
  invited_by UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  invite_token TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    'signup'::TEXT AS record_type,
    'public.profiles'::TEXT AS source_table,
    p.id AS subject_user_id,
    NULL::UUID AS owner_user_id,
    NULL::UUID AS member_user_id,
    NULL::UUID AS invited_by,
    p.full_name,
    p.email,
    NULL::TEXT AS role,
    NULL::TEXT AS status,
    NULL::TEXT AS invite_token,
    p.created_at,
    p.updated_at,
    NULL::TIMESTAMPTZ AS accepted_at
  FROM public.profiles p

  UNION ALL

  SELECT
    'invite'::TEXT AS record_type,
    'public.workspace_members'::TEXT AS source_table,
    COALESCE(wm.member_user_id, wm.owner_user_id) AS subject_user_id,
    wm.owner_user_id,
    wm.member_user_id,
    wm.invited_by,
    COALESCE(NULLIF(p.full_name, ''), split_part(lower(wm.member_email), '@', 1), 'Assistant') AS full_name,
    wm.member_email AS email,
    wm.role,
    wm.status,
    wm.invite_token,
    wm.created_at,
    wm.updated_at,
    wm.accepted_at
  FROM public.workspace_members wm
  LEFT JOIN public.profiles p
    ON p.id = wm.member_user_id
  WHERE wm.role <> 'owner'
  ORDER BY created_at DESC, record_type DESC;
$$;

GRANT EXECUTE ON FUNCTION public.is_app_developer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_developer_user_monitoring() TO authenticated;
