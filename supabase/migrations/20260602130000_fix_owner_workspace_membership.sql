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

  UPDATE public.workspace_members
  SET
    member_email = lower(v_email),
    role = 'owner',
    status = 'active',
    permissions = jsonb_build_object(
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
    invited_by = p_user_id,
    accepted_at = COALESCE(public.workspace_members.accepted_at, timezone('utc'::text, now())),
    updated_at = timezone('utc'::text, now())
  WHERE owner_user_id = p_user_id
    AND (
      member_user_id = p_user_id
      OR lower(COALESCE(member_email, '')) = lower(v_email)
    );

  IF FOUND THEN
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
    permissions = EXCLUDED.permissions,
    invited_by = EXCLUDED.invited_by,
    accepted_at = COALESCE(public.workspace_members.accepted_at, timezone('utc'::text, now())),
    updated_at = timezone('utc'::text, now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_owner_workspace_membership(UUID) TO authenticated;
