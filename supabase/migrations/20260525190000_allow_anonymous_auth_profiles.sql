-- Allow Supabase anonymous auth users to pass the public.profiles sync trigger.
-- Anonymous users do not have an email, so the trigger must create a stable
-- placeholder profile email instead of inserting NULL into profiles.email.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        new.id,
        COALESCE(NULLIF(new.email, ''), 'anonymous-' || new.id::text || '@anonymous.local'),
        COALESCE(
            NULLIF(new.raw_user_meta_data->>'full_name', ''),
            NULLIF(split_part(COALESCE(new.email, ''), '@', 1), ''),
            'Assistant'
        )
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
