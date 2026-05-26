-- Allow active workspace members to read only the owner's Google Calendar
-- integration config without granting access to the full Integrations page data.
CREATE OR REPLACE FUNCTION public.get_workspace_google_calendar_config(p_owner_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_config JSONB := '{}'::jsonb;
BEGIN
  IF v_uid IS NULL OR p_owner_user_id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  IF v_uid <> p_owner_user_id AND NOT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.owner_user_id = p_owner_user_id
      AND wm.member_user_id = v_uid
      AND wm.status = 'active'
  ) THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT COALESCE(uic.configs -> 'google_calendar', '{}'::jsonb)
    INTO v_config
  FROM public.user_integration_configs uic
  WHERE uic.user_id = p_owner_user_id;

  RETURN COALESCE(v_config, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_workspace_google_calendar_config(UUID) TO authenticated;
