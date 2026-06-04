ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS form_details JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.create_public_appointment(
    p_client_name TEXT,
    p_title TEXT,
    p_email TEXT,
    p_date DATE,
    p_time TEXT,
    p_whatsapp TEXT DEFAULT NULL,
    p_form_details JSONB DEFAULT '{}'::jsonb
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    owner_id UUID;
    created_appointment public.appointments;
BEGIN
    SELECT id
    INTO owner_id
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1;

    IF owner_id IS NULL THEN
        RAISE EXCEPTION 'Public booking owner profile was not found';
    END IF;

    IF NULLIF(TRIM(COALESCE(p_client_name, '')), '') IS NULL THEN
        RAISE EXCEPTION 'Client name is required';
    END IF;

    IF NULLIF(TRIM(COALESCE(p_title, '')), '') IS NULL THEN
        RAISE EXCEPTION 'Booking title is required';
    END IF;

    IF p_date IS NULL THEN
        RAISE EXCEPTION 'Booking date is required';
    END IF;

    IF NULLIF(TRIM(COALESCE(p_time, '')), '') IS NULL THEN
        RAISE EXCEPTION 'Booking time is required';
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
        owner_id,
        TRIM(p_client_name),
        TRIM(p_title),
        NULLIF(TRIM(COALESCE(p_email, '')), ''),
        NULLIF(TRIM(COALESCE(p_whatsapp, '')), ''),
        COALESCE(p_form_details, '{}'::jsonb),
        p_date,
        TRIM(p_time),
        'confirmed'
    )
    RETURNING * INTO created_appointment;

    RETURN created_appointment;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_public_appointment(
    p_client_name TEXT,
    p_title TEXT,
    p_email TEXT,
    p_date DATE,
    p_time TEXT
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.create_public_appointment(
        p_client_name,
        p_title,
        p_email,
        p_date,
        p_time,
        NULL,
        '{}'::jsonb
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_appointment(TEXT, TEXT, TEXT, DATE, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_appointment(TEXT, TEXT, TEXT, DATE, TEXT, TEXT, JSONB) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.create_public_appointment(TEXT, TEXT, TEXT, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_appointment(TEXT, TEXT, TEXT, DATE, TEXT) TO anon, authenticated;
