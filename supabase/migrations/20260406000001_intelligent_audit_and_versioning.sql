-- Migration: 20260406000001_intelligent_audit_and_versioning.sql
-- Goal: Epic 3 (Management) & Epic 4 (Intelligent Audit)

-- 1. Enhance diem_rates with status and versioning
ALTER TABLE public.diem_rates ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
ALTER TABLE public.diem_rates ADD COLUMN effective_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Create Audit Log for Diem Rates
CREATE TABLE public.diem_rates_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_id UUID REFERENCES public.diem_rates(id),
    old_value DECIMAL(10, 2),
    new_value DECIMAL(10, 2),
    changed_by UUID REFERENCES public.profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger Function for Diem Rate Audit
CREATE OR REPLACE FUNCTION audit_diem_rate_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.valor <> NEW.valor) THEN
        INSERT INTO public.diem_rates_audit (rate_id, old_value, new_value, changed_by, changed_at)
        VALUES (OLD.id, OLD.valor, NEW.valor, auth.uid(), now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_diem_rate_change
AFTER UPDATE ON public.diem_rates
FOR EACH ROW EXECUTE FUNCTION audit_diem_rate_change();

-- 3. Enhance travel_requests with alert_flags
ALTER TABLE public.travel_requests ADD COLUMN alert_flags JSONB DEFAULT '{}'::jsonb;

-- 4. Overlap Prevention Function
CREATE OR REPLACE FUNCTION check_travel_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INT;
BEGIN
    -- Check for overlapping approved/pending requests for the same user
    SELECT COUNT(*) INTO overlap_count
    FROM public.travel_requests
    WHERE user_id = NEW.user_id
    AND id <> NEW.id
    AND status NOT IN ('Rejeitado', 'Rascunho')
    AND (
        (NEW.data_ida BETWEEN data_ida AND data_retorno) OR
        (NEW.data_retorno BETWEEN data_ida AND data_retorno) OR
        (data_ida BETWEEN NEW.data_ida AND NEW.data_retorno)
    );

    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'O servidor já possui uma viagem agendada para este período.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_travel_overlap
BEFORE INSERT OR UPDATE OF data_ida, data_retorno ON public.travel_requests
FOR EACH ROW EXECUTE FUNCTION check_travel_overlap();

-- 5. Automated Audit Engine (Alert Flags)
-- This function runs on insert/update of travel requests to flag anomalies
CREATE OR REPLACE FUNCTION perform_automated_audit()
RETURNS TRIGGER AS $$
DECLARE
    anomaly_found BOOLEAN := false;
    flags JSONB := '{}'::jsonb;
    creation_date DATE := NEW.created_at::DATE;
BEGIN
    -- Rule 1: Retroactive Request (Created after or too close to start date)
    IF (NEW.data_ida < creation_date + INTERVAL '3 days') THEN
        flags := flags || '{"retroactive": true}';
    END IF;

    -- Rule 2: Exceptionally high frequency (Placeholder logic: > 3 travels in 30 days)
    -- This would normally be handled by a weekly job, but we flag based on recent history here.
    
    NEW.alert_flags := flags;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_automated_audit
BEFORE INSERT OR UPDATE OF data_ida, data_retorno ON public.travel_requests
FOR EACH ROW EXECUTE FUNCTION perform_automated_audit();
