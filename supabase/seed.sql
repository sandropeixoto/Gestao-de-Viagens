-- Seed Data for SGPD (Sistema de Gestão de Passagens e Diárias)
-- Purpose: Provide initial data for QA and development testing

-- 1. Insert Initial Diem Rates (based on typical decree values)
INSERT INTO public.diem_rates (destino, cargo, valor)
VALUES 
    ('Belém (Capital)', 'Secretário', 650.00),
    ('Belém (Capital)', 'Subsecretário', 580.00),
    ('Belém (Capital)', 'Chefia', 500.00),
    ('Belém (Capital)', 'Auditor', 450.00),
    ('Belém (Capital)', 'Técnico', 380.00),
    ('Interior do Estado', 'Secretário', 550.00),
    ('Interior do Estado', 'Subsecretário', 480.00),
    ('Interior do Estado', 'Chefia', 400.00),
    ('Interior do Estado', 'Auditor', 350.00),
    ('Interior do Estado', 'Técnico', 280.00),
    ('Brasília/Outras Capitais', 'Secretário', 850.00),
    ('Brasília/Outras Capitais', 'Subsecretário', 780.00),
    ('Brasília/Outras Capitais', 'Chefia', 700.00),
    ('Brasília/Outras Capitais', 'Auditor', 650.00),
    ('Brasília/Outras Capitais', 'Técnico', 580.00),
    ('Internacional', 'Secretário', 1500.00),
    ('Internacional', 'Auditor', 1200.00)
ON CONFLICT (destino, cargo) DO UPDATE SET valor = EXCLUDED.valor;

-- 2. Create Departments/Structure (implicitly handled by 'departamento' field in profiles)
-- Note: In a real scenario, we would link this to the Auth system users.

-- 3. Create Sample Profiles for Testing (These UUIDs should match auth.users IDs if used locally)
-- For QA, we typically use the placeholders which are replaced by the auth hook or manual insert.
/*
-- Example manual insert for a test DAD user:
INSERT INTO public.profiles (id, cargo, departamento, banco, agencia, conta)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'DAD', 'DAD-FINANCEIRO', '001', '1234', '56789-0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, cargo, departamento, banco, agencia, conta)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'Auditor', 'FISCALIZACAO', '001', '4321', '98765-0')
ON CONFLICT (id) DO NOTHING;
*/

-- 4. Sample Travel Requests (Optional - for UI testing)
/*
INSERT INTO public.travel_requests (user_id, destino, data_ida, data_retorno, justificativa, fonte_recurso, status)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'Brasília/Outras Capitais', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 'Reunião Técnica sobre Padrões de Auditoria.', 'Tesouro', 'Aguardando Chefia')
ON CONFLICT DO NOTHING;
*/

COMMENT ON TABLE public.diem_rates IS 'Tabela de diárias populada para ambiente de QA conforme Decreto 4025/2024';
