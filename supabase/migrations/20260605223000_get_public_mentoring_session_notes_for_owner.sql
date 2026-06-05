CREATE OR REPLACE FUNCTION public.get_public_mentoring_session_notes_for_owner(
  p_owner_user_id UUID,
  p_share_token TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  order_id UUID,
  appointment_id UUID,
  client_name TEXT,
  session_date DATE,
  topic TEXT,
  summary TEXT,
  action_items TEXT,
  next_step TEXT,
  progress_percent INTEGER,
  updated_by TEXT,
  is_auto_generated BOOLEAN,
  created_at TIMESTAMPTZ,
  form_details JSONB,
  order_meta JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Owner user id is required';
  END IF;

  IF NOT public.workspace_can_read_area(p_owner_user_id, 'orders')
    AND NOT public.workspace_can_read_area(p_owner_user_id, 'reservations') THEN
    RAISE EXCEPTION 'Not allowed to read mentoring notes for this owner';
  END IF;

  RETURN QUERY
  SELECT
    msn.id,
    msn.user_id,
    msn.order_id,
    msn.appointment_id,
    msn.client_name,
    msn.session_date,
    msn.topic,
    msn.summary,
    msn.action_items,
    msn.next_step,
    msn.progress_percent,
    msn.updated_by,
    msn.is_auto_generated,
    msn.created_at,
    COALESCE(a.form_details, so.meta->'formDetails', '{}'::jsonb) AS form_details,
    COALESCE(so.meta, '{}'::jsonb) AS order_meta
  FROM public.mentoring_session_notes msn
  LEFT JOIN public.spreadsheet_orders so
    ON so.id = msn.order_id
  LEFT JOIN public.appointments a
    ON a.id = msn.appointment_id
  WHERE (
      msn.user_id = p_owner_user_id
      OR so.user_id = p_owner_user_id
      OR a.user_id = p_owner_user_id
      OR COALESCE(a.form_details->>'ownerUserId', so.meta->'formDetails'->>'ownerUserId', '') = p_owner_user_id::text
      OR (
        NULLIF(TRIM(COALESCE(p_share_token, '')), '') IS NOT NULL
        AND (
          COALESCE(a.form_details->>'shareToken', '') = TRIM(p_share_token)
          OR COALESCE(so.meta->'formDetails'->>'shareToken', '') = TRIM(p_share_token)
        )
      )
    )
  ORDER BY msn.session_date DESC, msn.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_mentoring_session_notes_for_owner(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_mentoring_session_notes_for_owner(UUID, TEXT) TO authenticated;
