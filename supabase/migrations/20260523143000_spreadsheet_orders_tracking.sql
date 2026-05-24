-- Spreadsheet order tracker + public view-only timeline

CREATE TABLE IF NOT EXISTS public.spreadsheet_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    order_name TEXT NOT NULL,
    order_type TEXT NOT NULL DEFAULT 'Dashboard',
    budget NUMERIC(14,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'revision', 'completed', 'blocked')),
    due_date DATE,
    public_token TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 14),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.spreadsheet_order_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.spreadsheet_orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    note TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    updated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_spreadsheet_orders_user ON public.spreadsheet_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_spreadsheet_orders_token ON public.spreadsheet_orders(public_token);
CREATE INDEX IF NOT EXISTS idx_spreadsheet_order_timeline_order ON public.spreadsheet_order_timeline(order_id);

ALTER TABLE public.spreadsheet_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_order_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pengguna dapat mengakses order spreadsheet mereka sendiri" ON public.spreadsheet_orders;
CREATE POLICY "Pengguna dapat mengakses order spreadsheet mereka sendiri"
    ON public.spreadsheet_orders
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat mengakses timeline order spreadsheet mereka sendiri" ON public.spreadsheet_order_timeline;
CREATE POLICY "Pengguna dapat mengakses timeline order spreadsheet mereka sendiri"
    ON public.spreadsheet_order_timeline
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.spreadsheet_orders o
            WHERE o.id = spreadsheet_order_timeline.order_id
            AND o.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.spreadsheet_orders o
            WHERE o.id = spreadsheet_order_timeline.order_id
            AND o.user_id = auth.uid()
        )
    );

CREATE OR REPLACE FUNCTION public.touch_spreadsheet_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_spreadsheet_orders_updated_at ON public.spreadsheet_orders;
CREATE TRIGGER trg_touch_spreadsheet_orders_updated_at
    BEFORE UPDATE ON public.spreadsheet_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_spreadsheet_orders_updated_at();

CREATE OR REPLACE FUNCTION public.get_public_order_timeline(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_order public.spreadsheet_orders%ROWTYPE;
BEGIN
    SELECT *
    INTO target_order
    FROM public.spreadsheet_orders
    WHERE public_token = p_token
    LIMIT 1;

    IF target_order.id IS NULL THEN
        RETURN jsonb_build_object('error', 'Token tracking tidak ditemukan');
    END IF;

    RETURN jsonb_build_object(
        'order', jsonb_build_object(
            'id', target_order.id,
            'customer_name', target_order.customer_name,
            'order_name', target_order.order_name,
            'order_type', target_order.order_type,
            'budget', target_order.budget,
            'status', target_order.status,
            'due_date', target_order.due_date,
            'updated_at', target_order.updated_at
        ),
        'timeline', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'title', t.title,
                    'note', t.note,
                    'progress_percent', t.progress_percent,
                    'updated_by', t.updated_by,
                    'created_at', t.created_at
                )
                ORDER BY t.created_at ASC
            ), '[]'::jsonb)
            FROM public.spreadsheet_order_timeline t
            WHERE t.order_id = target_order.id
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_order_timeline(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order_timeline(TEXT) TO anon, authenticated;
