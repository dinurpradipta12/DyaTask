ALTER TABLE public.spreadsheet_orders
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.mentoring_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NULL REFERENCES public.spreadsheet_orders(id) ON DELETE CASCADE,
  appointment_id UUID NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL DEFAULT '',
  session_date DATE NOT NULL,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  action_items TEXT NOT NULL DEFAULT '',
  next_step TEXT NOT NULL DEFAULT '',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT NOT NULL DEFAULT 'system',
  is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS mentoring_session_notes_user_id_idx
  ON public.mentoring_session_notes(user_id, session_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS mentoring_session_notes_order_id_idx
  ON public.mentoring_session_notes(order_id);

CREATE INDEX IF NOT EXISTS mentoring_session_notes_appointment_id_idx
  ON public.mentoring_session_notes(appointment_id);

ALTER TABLE public.mentoring_session_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentoring session notes read own" ON public.mentoring_session_notes;
CREATE POLICY "mentoring session notes read own"
  ON public.mentoring_session_notes
  FOR SELECT
  USING (public.workspace_can_read_area(user_id, 'orders'));

DROP POLICY IF EXISTS "mentoring session notes write own" ON public.mentoring_session_notes;
CREATE POLICY "mentoring session notes write own"
  ON public.mentoring_session_notes
  FOR ALL
  USING (public.workspace_can_write_area(user_id, 'orders'))
  WITH CHECK (public.workspace_can_write_area(user_id, 'orders'));

CREATE OR REPLACE FUNCTION public.create_public_mentoring_booking(
    p_owner_user_id UUID DEFAULT NULL,
    p_client_name TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_date DATE DEFAULT NULL,
    p_time TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_form_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner_id UUID;
    v_appointment public.appointments%ROWTYPE;
    v_order public.spreadsheet_orders%ROWTYPE;
    v_form_details JSONB;
BEGIN
    IF p_owner_user_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = p_owner_user_id
    ) THEN
      RAISE EXCEPTION 'Public mentoring booking owner profile was not found';
    END IF;

    v_owner_id := p_owner_user_id;

    IF NULLIF(TRIM(COALESCE(p_client_name, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Client name is required';
    END IF;

    IF NULLIF(TRIM(COALESCE(p_title, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Mentoring title is required';
    END IF;

    IF p_date IS NULL THEN
      RAISE EXCEPTION 'Mentoring date is required';
    END IF;

    IF NULLIF(TRIM(COALESCE(p_time, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Mentoring time is required';
    END IF;

    v_form_details := COALESCE(p_form_details, '{}'::jsonb)
      || jsonb_build_object(
        'source', 'public-1on1-mentoring-form',
        'bookingKind', 'mentoring',
        'ownerUserId', v_owner_id::text,
        'clientName', TRIM(p_client_name),
        'email', NULLIF(TRIM(COALESCE(p_email, '')), ''),
        'whatsapp', NULLIF(TRIM(COALESCE(p_whatsapp, '')), ''),
        'title', TRIM(p_title),
        'date', p_date,
        'time', TRIM(p_time)
      );

    INSERT INTO public.appointments (
      user_id,
      client_name,
      title,
      email,
      whatsapp,
      form_details,
      date,
      time,
      status
    )
    VALUES (
      v_owner_id,
      TRIM(p_client_name),
      TRIM(p_title),
      NULLIF(TRIM(COALESCE(p_email, '')), ''),
      NULLIF(TRIM(COALESCE(p_whatsapp, '')), ''),
      v_form_details,
      p_date,
      TRIM(p_time),
      'confirmed'
    )
    RETURNING * INTO v_appointment;

    INSERT INTO public.spreadsheet_orders (
      user_id,
      customer_name,
      order_name,
      order_type,
      budget,
      status,
      due_date,
      meta
    )
    VALUES (
      v_owner_id,
      TRIM(p_client_name),
      TRIM(p_title),
      '1:1 Mentoring Session',
      0,
      'new',
      p_date,
      jsonb_build_object(
        'source', 'public-1on1-mentoring-form',
        'appointmentId', v_appointment.id,
        'formDetails', v_form_details,
        'session', jsonb_build_object(
          'date', p_date,
          'time', TRIM(p_time)
        )
      )
    )
    RETURNING * INTO v_order;

    INSERT INTO public.spreadsheet_order_timeline (
      order_id,
      title,
      note,
      progress_percent,
      updated_by
    )
    VALUES
      (
        v_order.id,
        'Booking Terkonfirmasi',
        'Reservasi mentoring sudah tercatat dan siap dijadwalkan.',
        10,
        'system'
      ),
      (
        v_order.id,
        'Konteks & Objective Review',
        'Review kebutuhan client dan siapkan objective sesi mentoring.',
        25,
        'system'
      );

    INSERT INTO public.mentoring_session_notes (
      user_id,
      order_id,
      appointment_id,
      client_name,
      session_date,
      topic,
      summary,
      action_items,
      next_step,
      progress_percent,
      updated_by,
      is_auto_generated
    )
    VALUES (
      v_owner_id,
      v_order.id,
      v_appointment.id,
      TRIM(p_client_name),
      p_date,
      TRIM(p_title),
      CONCAT(
        'Kondisi awal: ', COALESCE(NULLIF(TRIM(COALESCE(v_form_details->>'mentoringNeed', v_form_details->>'mentoring_need', '')), ''), '-'),
        E'\n',
        'Target hasil: ', COALESCE(NULLIF(TRIM(COALESCE(v_form_details->>'mentoringGoal', v_form_details->>'mentoring_goal', '')), ''), '-'),
        E'\n',
        'Catatan ini dibuat otomatis dari form booking mentoring.'
      ),
      '',
      'Lakukan review kebutuhan client dan jadwalkan sesi mentoring pertama.',
      10,
      TRIM(p_client_name),
      true
    );

    RETURN jsonb_build_object(
      'appointment', to_jsonb(v_appointment),
      'order', to_jsonb(v_order)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_mentoring_booking(
  UUID, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, JSONB
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_public_mentoring_booking(
  UUID, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, JSONB
) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_mentoring_bookings_for_owner(
  p_owner_user_id UUID,
  p_share_token TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  client_name TEXT,
  title TEXT,
  email TEXT,
  whatsapp TEXT,
  form_details JSONB,
  booking_date DATE,
  booking_time TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
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
    RAISE EXCEPTION 'Not allowed to read mentoring bookings for this owner';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    a.client_name,
    a.title,
    a.email,
    a.whatsapp,
    COALESCE(a.form_details, '{}'::jsonb) AS form_details,
    a.date AS booking_date,
    a.time AS booking_time,
    a.status,
    a.created_at
  FROM public.appointments a
  WHERE (
      a.user_id = p_owner_user_id
      OR COALESCE(a.form_details->>'ownerUserId', '') = p_owner_user_id::text
      OR (
        NULLIF(TRIM(COALESCE(p_share_token, '')), '') IS NOT NULL
        AND COALESCE(a.form_details->>'shareToken', '') = TRIM(p_share_token)
      )
    )
    AND (
      COALESCE(a.form_details->>'source', '') = 'public-1on1-mentoring-form'
      OR COALESCE(a.form_details->>'bookingKind', '') = 'mentoring'
      OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringNeed', a.form_details->>'mentoring_need', '')), '') IS NOT NULL
      OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringGoal', a.form_details->>'mentoring_goal', '')), '') IS NOT NULL
    )
  ORDER BY a.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_mentoring_bookings_for_owner(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_mentoring_bookings_for_owner(UUID, TEXT) TO authenticated;

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

WITH mentoring_appointments AS (
  SELECT a.*
  FROM public.appointments a
  WHERE COALESCE(a.form_details->>'source', '') = 'public-1on1-mentoring-form'
    OR COALESCE(a.form_details->>'bookingKind', '') = 'mentoring'
    OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringNeed', a.form_details->>'mentoring_need', '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringGoal', a.form_details->>'mentoring_goal', '')), '') IS NOT NULL
),
inserted_orders AS (
  INSERT INTO public.spreadsheet_orders (
    user_id,
    customer_name,
    order_name,
    order_type,
    budget,
    status,
    due_date,
    meta
  )
  SELECT
    a.user_id,
    a.client_name,
    a.title,
    '1:1 Mentoring Session',
    0,
    'new',
    a.date,
    jsonb_build_object(
      'source', 'public-1on1-mentoring-form',
      'appointmentId', a.id,
      'formDetails', COALESCE(a.form_details, '{}'::jsonb)
        || jsonb_build_object(
          'source', 'public-1on1-mentoring-form',
          'bookingKind', 'mentoring',
          'clientName', a.client_name,
          'email', a.email,
          'whatsapp', a.whatsapp,
          'title', a.title,
          'date', a.date,
          'time', a.time
        ),
      'session', jsonb_build_object(
        'date', a.date,
        'time', a.time
      )
    )
  FROM mentoring_appointments a
  LEFT JOIN public.spreadsheet_orders existing
    ON (existing.meta->>'appointmentId') = a.id::text
  WHERE existing.id IS NULL
  RETURNING id, user_id, customer_name, order_name, due_date, meta
)
INSERT INTO public.spreadsheet_order_timeline (
  order_id,
  title,
  note,
  progress_percent,
  updated_by
)
SELECT
  io.id,
  'Booking Terkonfirmasi',
  'Reservasi mentoring sudah tercatat dan siap dijadwalkan.',
  10,
  'system'
FROM inserted_orders io;

INSERT INTO public.mentoring_session_notes (
  user_id,
  order_id,
  appointment_id,
  client_name,
  session_date,
  topic,
  summary,
  action_items,
  next_step,
  progress_percent,
  updated_by,
  is_auto_generated
)
SELECT
  a.user_id,
  so.id,
  a.id,
  a.client_name,
  a.date,
  a.title,
  CONCAT(
    'Kondisi awal: ', COALESCE(NULLIF(TRIM(COALESCE(a.form_details->>'mentoringNeed', a.form_details->>'mentoring_need', '')), ''), '-'),
    E'\n',
    'Target hasil: ', COALESCE(NULLIF(TRIM(COALESCE(a.form_details->>'mentoringGoal', a.form_details->>'mentoring_goal', '')), ''), '-'),
    E'\n',
    'Catatan ini dibuat otomatis dari form booking mentoring.'
  ),
  '',
  'Lakukan review kebutuhan client dan jadwalkan sesi mentoring pertama.',
  10,
  a.client_name,
  true
FROM public.appointments a
JOIN public.spreadsheet_orders so
  ON (so.meta->>'appointmentId') = a.id::text
LEFT JOIN public.mentoring_session_notes msn
  ON msn.appointment_id = a.id
WHERE (
    COALESCE(a.form_details->>'source', '') = 'public-1on1-mentoring-form'
    OR COALESCE(a.form_details->>'bookingKind', '') = 'mentoring'
    OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringNeed', a.form_details->>'mentoring_need', '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringGoal', a.form_details->>'mentoring_goal', '')), '') IS NOT NULL
  )
  AND msn.id IS NULL;
