-- SEED DATA FOR GESTÃO DE VIAGENS (SGPD)
-- Run this in the Supabase SQL Editor

-- 1. Ensure 'nome' column exists in profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='nome') THEN
        ALTER TABLE public.profiles ADD COLUMN nome TEXT;
    END IF;
END $$;

-- 2. Create User in auth.users (to satisfy foreign key constraint)
-- Note: Replace with real user ID from the Auth tab if already signed up.
INSERT INTO auth.users (id, email, aud, role)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'sandro.peixoto@sefa.pa.gov.br', 
    'authenticated', 
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 3. Create Profile for Sandro Peixoto
-- Note: Replace '00000000-0000-0000-0000-000000000000' with the actual ID from auth.users if already created via SSO/Login
-- For now, we use a consistent UUID to match the code bypass.
INSERT INTO public.profiles (id, nome, cargo, departamento)
VALUES ('00000000-0000-0000-0000-000000000000', 'Sandro Peixoto', 'DAD', 'SEFA')
ON CONFLICT (id) DO UPDATE SET 
    nome = EXCLUDED.nome,
    cargo = EXCLUDED.cargo,
    departamento = EXCLUDED.departamento;

-- 3. Diem Rates (Administrative Parameters)
INSERT INTO public.diem_rates (destino, cargo, valor)
VALUES 
    ('Brasília', 'Auditor', 650.00),
    ('Brasília', 'Chefia', 850.00),
    ('Nacional', 'Auditor', 450.00),
    ('Nacional', 'Analista', 350.00),
    ('Internacional', 'Todos', 1200.00)
ON CONFLICT DO NOTHING;

-- 4. Sample Travel Requests
INSERT INTO public.travel_requests (id, user_id, destino, data_ida, data_retorno, justificativa, fonte_recurso, valor_previsto, status)
VALUES 
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Santarém', '2026-03-30', '2026-04-02', 'Fiscalização de obras ambientais no Baixo Amazonas.', 'Tesouro', 1850.00, 'Aguardando DAD'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Marabá', '2026-04-05', '2026-04-10', 'Auditoria financeira descentralizada.', 'FIPAT', 3200.00, 'Aprovado'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Belém', '2026-03-15', '2026-03-20', 'Alinhamento estratégico na sede.', 'BID', 5400.00, 'Concluido'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'Altamira', '2026-03-22', '2026-03-25', 'Vistoria técnica de campo.', 'Tesouro', 3100.00, 'Aguardando Chefia')
ON CONFLICT DO NOTHING;

-- 4. Sample Documents (Optional/References)
-- Assuming we have documents for the completed/approved requests
-- INSERT INTO public.travel_documents (travel_id, tipo, storage_path) ...
