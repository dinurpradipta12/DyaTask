WITH mentoring_appointments AS (
  SELECT
    a.id,
    CASE
      WHEN COALESCE(a.form_details->>'ownerUserId', '') ~* '^[0-9a-f-]{36}$'
        THEN (a.form_details->>'ownerUserId')::uuid
      ELSE NULL
    END AS desired_owner_id
  FROM public.appointments a
  WHERE COALESCE(a.form_details->>'source', '') = 'public-1on1-mentoring-form'
    OR COALESCE(a.form_details->>'bookingKind', '') = 'mentoring'
    OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringNeed', a.form_details->>'mentoring_need', '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringGoal', a.form_details->>'mentoring_goal', '')), '') IS NOT NULL
),
updated_appointments AS (
  UPDATE public.appointments a
  SET
    user_id = ma.desired_owner_id
  FROM mentoring_appointments ma
  WHERE a.id = ma.id
    AND ma.desired_owner_id IS NOT NULL
    AND a.user_id IS DISTINCT FROM ma.desired_owner_id
  RETURNING a.id, a.user_id
),
mentoring_orders AS (
  SELECT
    so.id,
    COALESCE(
      CASE
        WHEN COALESCE(so.meta->'formDetails'->>'ownerUserId', '') ~* '^[0-9a-f-]{36}$'
          THEN (so.meta->'formDetails'->>'ownerUserId')::uuid
        ELSE NULL
      END,
      a.user_id
    ) AS desired_owner_id,
    a.id AS appointment_id,
    a.client_name,
    a.email,
    a.whatsapp,
    a.title,
    a.date,
    a.time
  FROM public.spreadsheet_orders so
  LEFT JOIN public.appointments a
    ON (so.meta->>'appointmentId') = a.id::text
  WHERE COALESCE(so.order_type, '') = '1:1 Mentoring Session'
    OR COALESCE(so.meta->>'source', '') = 'public-1on1-mentoring-form'
    OR COALESCE(so.meta->'formDetails'->>'bookingKind', '') = 'mentoring'
    OR NULLIF(TRIM(COALESCE(so.meta->'formDetails'->>'mentoringNeed', so.meta->'formDetails'->>'mentoring_need', '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(so.meta->'formDetails'->>'mentoringGoal', so.meta->'formDetails'->>'mentoring_goal', '')), '') IS NOT NULL
),
updated_orders AS (
  UPDATE public.spreadsheet_orders so
  SET
    user_id = mo.desired_owner_id,
    meta = COALESCE(so.meta, '{}'::jsonb)
      || jsonb_build_object(
        'source', 'public-1on1-mentoring-form',
        'appointmentId', COALESCE((COALESCE(so.meta, '{}'::jsonb)->>'appointmentId'), mo.appointment_id::text, ''),
        'session', jsonb_build_object(
          'date', mo.date,
          'time', mo.time
        ),
        'formDetails',
        COALESCE(so.meta->'formDetails', '{}'::jsonb)
          || jsonb_build_object(
            'source', 'public-1on1-mentoring-form',
            'bookingKind', 'mentoring',
            'ownerUserId', mo.desired_owner_id::text,
            'clientName', mo.client_name,
            'email', mo.email,
            'whatsapp', mo.whatsapp,
            'title', mo.title,
            'date', mo.date,
            'time', mo.time
          )
      ),
    updated_at = timezone('utc'::text, now())
  FROM mentoring_orders mo
  WHERE so.id = mo.id
    AND mo.desired_owner_id IS NOT NULL
    AND (
      so.user_id IS DISTINCT FROM mo.desired_owner_id
      OR COALESCE(so.meta->'formDetails'->>'ownerUserId', '') IS DISTINCT FROM mo.desired_owner_id::text
    )
  RETURNING so.id, so.user_id
)
UPDATE public.mentoring_session_notes msn
SET
  user_id = resolved.desired_owner_id,
  order_id = COALESCE(msn.order_id, resolved.order_id),
  appointment_id = COALESCE(msn.appointment_id, resolved.appointment_id),
  client_name = COALESCE(NULLIF(msn.client_name, ''), resolved.client_name, 'Client mentoring'),
  session_date = COALESCE(msn.session_date, resolved.session_date),
  topic = COALESCE(NULLIF(msn.topic, ''), resolved.topic, '1:1 Mentoring Session')
FROM (
  SELECT
    msn.id,
    COALESCE(
      so.user_id,
      a.user_id,
      CASE
        WHEN COALESCE(a.form_details->>'ownerUserId', so.meta->'formDetails'->>'ownerUserId', '') ~* '^[0-9a-f-]{36}$'
          THEN COALESCE(a.form_details->>'ownerUserId', so.meta->'formDetails'->>'ownerUserId')::uuid
        ELSE NULL
      END
    ) AS desired_owner_id,
    so.id AS order_id,
    a.id AS appointment_id,
    COALESCE(NULLIF(msn.client_name, ''), a.client_name, so.customer_name) AS client_name,
    COALESCE(msn.session_date, a.date, so.due_date) AS session_date,
    COALESCE(NULLIF(msn.topic, ''), a.title, so.order_name) AS topic
  FROM public.mentoring_session_notes msn
  LEFT JOIN public.spreadsheet_orders so
    ON so.id = msn.order_id
  LEFT JOIN public.appointments a
    ON a.id = msn.appointment_id
      OR (so.meta->>'appointmentId') = a.id::text
) AS resolved
WHERE msn.id = resolved.id
  AND resolved.desired_owner_id IS NOT NULL
  AND (
    msn.user_id IS DISTINCT FROM resolved.desired_owner_id
    OR msn.order_id IS NULL
    OR msn.appointment_id IS NULL
    OR COALESCE(msn.client_name, '') = ''
  );

WITH mentoring_appointments AS (
  SELECT a.*
  FROM public.appointments a
  WHERE COALESCE(a.form_details->>'source', '') = 'public-1on1-mentoring-form'
    OR COALESCE(a.form_details->>'bookingKind', '') = 'mentoring'
    OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringNeed', a.form_details->>'mentoring_need', '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(a.form_details->>'mentoringGoal', a.form_details->>'mentoring_goal', '')), '') IS NOT NULL
)
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
FROM mentoring_appointments a
JOIN public.spreadsheet_orders so
  ON (so.meta->>'appointmentId') = a.id::text
LEFT JOIN public.mentoring_session_notes msn
  ON msn.appointment_id = a.id
WHERE msn.id IS NULL;
