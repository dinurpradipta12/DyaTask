-- Finance, CRM, payment status, and realtime activity audit logs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

ALTER TABLE public.spreadsheet_orders
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'belum_bayar'
    CHECK (payment_status IN ('belum_bayar', 'dp', 'cicilan', 'lunas', 'paid'));

CREATE TABLE IF NOT EXISTS public.finance_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    title TEXT NOT NULL,
    order_type TEXT NOT NULL DEFAULT 'Custom Spreadsheet',
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.crm_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'negotiation', 'active', 'retainer', 'inactive')),
    next_follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_key TEXT,
    client_name TEXT,
    client_email TEXT,
    title TEXT NOT NULL,
    note TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    tone TEXT NOT NULL DEFAULT 'purple' CHECK (tone IN ('purple', 'green', 'blue', 'amber', 'slate', 'red')),
    source_table TEXT,
    source_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_finance_invoices_user_status ON public.finance_invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_invoices_due_date ON public.finance_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_crm_clients_user_status ON public.crm_clients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_clients_next_follow_up ON public.crm_clients(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_crm_activities_user_client ON public.crm_activities(user_id, client_key);
CREATE INDEX IF NOT EXISTS idx_crm_activities_due_date ON public.crm_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_touch_finance_invoices_updated_at ON public.finance_invoices;
CREATE TRIGGER trg_touch_finance_invoices_updated_at
    BEFORE UPDATE ON public.finance_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_crm_clients_updated_at ON public.crm_clients;
CREATE TRIGGER trg_touch_crm_clients_updated_at
    BEFORE UPDATE ON public.crm_clients
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_crm_activities_updated_at ON public.crm_activities;
CREATE TRIGGER trg_touch_crm_activities_updated_at
    BEFORE UPDATE ON public.crm_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.finance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pengguna dapat mengakses invoice mereka sendiri" ON public.finance_invoices;
CREATE POLICY "Pengguna dapat mengakses invoice mereka sendiri"
    ON public.finance_invoices
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat mengakses client CRM mereka sendiri" ON public.crm_clients;
CREATE POLICY "Pengguna dapat mengakses client CRM mereka sendiri"
    ON public.crm_clients
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat mengakses activity CRM mereka sendiri" ON public.crm_activities;
CREATE POLICY "Pengguna dapat mengakses activity CRM mereka sendiri"
    ON public.crm_activities
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Pengguna dapat mengakses log mereka sendiri" ON public.activity_logs;
CREATE POLICY "Pengguna dapat mengakses log mereka sendiri"
    ON public.activity_logs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.insert_activity_log(
    p_user_id UUID,
    p_event_type TEXT,
    p_title TEXT,
    p_detail TEXT DEFAULT NULL,
    p_tone TEXT DEFAULT 'purple',
    p_source_table TEXT DEFAULT NULL,
    p_source_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_user_id IS NULL OR p_title IS NULL OR trim(p_title) = '' THEN
        RETURN;
    END IF;

    INSERT INTO public.activity_logs (
        user_id,
        event_type,
        title,
        detail,
        tone,
        source_table,
        source_id,
        metadata
    )
    VALUES (
        p_user_id,
        p_event_type,
        p_title,
        p_detail,
        COALESCE(NULLIF(p_tone, ''), 'purple'),
        p_source_table,
        p_source_id,
        COALESCE(p_metadata, '{}'::jsonb)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_spreadsheet_order_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.insert_activity_log(
            NEW.user_id,
            'Order',
            'Order dibuat: ' || NEW.order_name,
            NEW.customer_name || ' • ' || NEW.order_type || ' • Rp ' || to_char(COALESCE(NEW.budget, 0), 'FM999G999G999G999'),
            'blue',
            TG_TABLE_NAME,
            NEW.id::text,
            jsonb_build_object('status', NEW.status, 'payment_status', NEW.payment_status)
        );
    ELSIF TG_OP = 'UPDATE' AND (
        NEW.status IS DISTINCT FROM OLD.status OR
        NEW.payment_status IS DISTINCT FROM OLD.payment_status OR
        NEW.budget IS DISTINCT FROM OLD.budget
    ) THEN
        PERFORM public.insert_activity_log(
            NEW.user_id,
            'Status',
            'Status order: ' || NEW.status,
            NEW.order_name || ' • pembayaran ' || NEW.payment_status,
            CASE WHEN NEW.status IN ('completed', 'done') OR NEW.payment_status IN ('lunas', 'paid') THEN 'green' ELSE 'amber' END,
            TG_TABLE_NAME,
            NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'old_payment_status', OLD.payment_status, 'new_payment_status', NEW.payment_status)
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_spreadsheet_order_activity ON public.spreadsheet_orders;
CREATE TRIGGER trg_log_spreadsheet_order_activity
    AFTER INSERT OR UPDATE ON public.spreadsheet_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.log_spreadsheet_order_activity();

CREATE OR REPLACE FUNCTION public.log_appointment_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.insert_activity_log(
            NEW.user_id,
            'Reservasi',
            'Reservasi masuk: ' || COALESCE(NEW.client_name, 'Client'),
            COALESCE(NEW.title, '1:1 Consultation') || ' • ' || COALESCE(NEW.date::text, '-') || ' ' || COALESCE(NEW.time, ''),
            'green',
            TG_TABLE_NAME,
            NEW.id::text,
            jsonb_build_object('email', NEW.email, 'status', NEW.status)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM public.insert_activity_log(
            NEW.user_id,
            'Reservasi',
            'Reservasi diperbarui: ' || COALESCE(NEW.client_name, 'Client'),
            COALESCE(NEW.title, '1:1 Consultation') || ' • ' || COALESCE(NEW.date::text, '-') || ' ' || COALESCE(NEW.time, ''),
            'amber',
            TG_TABLE_NAME,
            NEW.id::text,
            jsonb_build_object('status', NEW.status)
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_appointment_activity ON public.appointments;
CREATE TRIGGER trg_log_appointment_activity
    AFTER INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.log_appointment_activity();

CREATE OR REPLACE FUNCTION public.log_finance_invoice_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.insert_activity_log(
            NEW.user_id,
            'Invoice',
            'Invoice dibuat: ' || NEW.title,
            NEW.client_name || ' • Rp ' || to_char(COALESCE(NEW.amount, 0), 'FM999G999G999G999'),
            'blue',
            TG_TABLE_NAME,
            NEW.id::text,
            jsonb_build_object('status', NEW.status)
        );
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        PERFORM public.insert_activity_log(
            NEW.user_id,
            'Invoice',
            CASE WHEN NEW.status = 'paid' THEN 'Invoice lunas: ' ELSE 'Status invoice: ' END || NEW.title,
            NEW.client_name || ' • Rp ' || to_char(COALESCE(NEW.amount, 0), 'FM999G999G999G999'),
            CASE WHEN NEW.status = 'paid' THEN 'green' ELSE 'amber' END,
            TG_TABLE_NAME,
            NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_finance_invoice_activity ON public.finance_invoices;
CREATE TRIGGER trg_log_finance_invoice_activity
    AFTER INSERT OR UPDATE ON public.finance_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.log_finance_invoice_activity();

CREATE OR REPLACE FUNCTION public.log_crm_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.insert_activity_log(
            NEW.user_id,
            'CRM',
            'Follow-up dibuat: ' || NEW.title,
            COALESCE(NEW.client_name, 'Client CRM') || COALESCE(' • ' || NEW.due_date::text, ''),
            'purple',
            TG_TABLE_NAME,
            NEW.id::text,
            jsonb_build_object('status', NEW.status, 'client_key', NEW.client_key)
        );
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        PERFORM public.insert_activity_log(
            NEW.user_id,
            'CRM',
            'Follow-up ' || CASE WHEN NEW.status = 'done' THEN 'selesai: ' ELSE 'dibuka ulang: ' END || NEW.title,
            COALESCE(NEW.client_name, 'Client CRM'),
            CASE WHEN NEW.status = 'done' THEN 'green' ELSE 'amber' END,
            TG_TABLE_NAME,
            NEW.id::text,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_crm_activity ON public.crm_activities;
CREATE TRIGGER trg_log_crm_activity
    AFTER INSERT OR UPDATE ON public.crm_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.log_crm_activity();

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_invoices;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_clients;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_activities;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
