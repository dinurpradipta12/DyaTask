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
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mentoring session notes write own" ON public.mentoring_session_notes;
CREATE POLICY "mentoring session notes write own"
  ON public.mentoring_session_notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
BEGIN
    IF p_owner_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = p_owner_user_id
    ) THEN
      v_owner_id := p_owner_user_id;
    ELSE
      SELECT id
      INTO v_owner_id
      FROM public.profiles
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;

    IF v_owner_id IS NULL THEN
      RAISE EXCEPTION 'Public mentoring booking owner profile was not found';
    END IF;

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
      COALESCE(p_form_details, '{}'::jsonb) || jsonb_build_object('source', 'public-1on1-mentoring-form'),
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
        'formDetails', COALESCE(p_form_details, '{}'::jsonb) || jsonb_build_object(
          'clientName', TRIM(p_client_name),
          'email', NULLIF(TRIM(COALESCE(p_email, '')), ''),
          'whatsapp', NULLIF(TRIM(COALESCE(p_whatsapp, '')), ''),
          'title', TRIM(p_title),
          'date', p_date,
          'time', TRIM(p_time)
        ),
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
        'Kondisi awal: ', COALESCE(NULLIF(TRIM(COALESCE(p_form_details->>'mentoringNeed', '')), ''), '-'),
        E'\n',
        'Target hasil: ', COALESCE(NULLIF(TRIM(COALESCE(p_form_details->>'mentoringGoal', '')), ''), '-'),
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

REVOKE ALL ON FUNCTION public.create_public_mentoring_booking(UUID, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_mentoring_booking(UUID, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, JSONB) TO anon, authenticated;
