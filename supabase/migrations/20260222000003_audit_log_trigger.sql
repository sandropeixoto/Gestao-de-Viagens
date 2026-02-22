-- Migration para criação da tabela de auditoria (audit_trails) e triggers relacionados
-- Este é um requisito legal para rastreabilidade de todas as alterações.

CREATE TABLE IF NOT EXISTS public.audit_trails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurando RLS para a tabela de auditoria
ALTER TABLE public.audit_trails ENABLE ROW LEVEL SECURITY;

-- Somente perfis autorizados como 'DAD' ou 'Admin' podem ver os rastros de auditoria
CREATE POLICY "Admins e DAD podem visualizar trilhas de auditoria" 
ON public.audit_trails FOR SELECT 
TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.cargo = 'DAD' OR profiles.cargo = 'Admin')
    )
);

-- Nenhum usuário pode modificar ou deletar a auditoria via API (Segurança/Imutabilidade)
-- (Sem políticas definidas para INSERT/UPDATE/DELETE via role 'authenticated')

-- Função Genérica de Trigger para capturar as informações
CREATE OR REPLACE FUNCTION public.process_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    changed_by_user UUID;
    record_id_val TEXT;
    old_row_data JSONB;
    new_row_data JSONB;
BEGIN
    -- Captura o ID do usuário que fez a requisição (pelo token JWT no Supabase)
    changed_by_user := auth.uid();
    
    IF (TG_OP = 'DELETE') THEN
        old_row_data := row_to_json(OLD)::JSONB;
        -- Usa o campo id ou key (para system_settings) dinamicamente como fallback
        record_id_val := COALESCE(old_row_data->>'id', old_row_data->>'key', 'N/A');
        
        INSERT INTO public.audit_trails (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, record_id_val, 'DELETE', old_row_data, changed_by_user);
        
        RETURN OLD;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        new_row_data := row_to_json(NEW)::JSONB;
        old_row_data := row_to_json(OLD)::JSONB;
        record_id_val := COALESCE(new_row_data->>'id', new_row_data->>'key', 'N/A');
        
        -- Registra apenas se algo realmente mudou
        IF old_row_data IS DISTINCT FROM new_row_data THEN
            INSERT INTO public.audit_trails (table_name, record_id, action, old_data, new_data, changed_by)
            VALUES (TG_TABLE_NAME, record_id_val, 'UPDATE', old_row_data, new_row_data, changed_by_user);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associando o Trigger às tabelas que requerem rastreabilidade legal
-- travel_requests
DROP TRIGGER IF EXISTS tr_audit_travel_requests ON public.travel_requests;
CREATE TRIGGER tr_audit_travel_requests
AFTER UPDATE OR DELETE ON public.travel_requests
FOR EACH ROW EXECUTE FUNCTION public.process_audit_trail();

-- approval_workflow
DROP TRIGGER IF EXISTS tr_audit_approval_workflow ON public.approval_workflow;
CREATE TRIGGER tr_audit_approval_workflow
AFTER UPDATE OR DELETE ON public.approval_workflow
FOR EACH ROW EXECUTE FUNCTION public.process_audit_trail();

-- diem_rates
DROP TRIGGER IF EXISTS tr_audit_diem_rates ON public.diem_rates;
CREATE TRIGGER tr_audit_diem_rates
AFTER UPDATE OR DELETE ON public.diem_rates
FOR EACH ROW EXECUTE FUNCTION public.process_audit_trail();

-- system_settings
DROP TRIGGER IF EXISTS tr_audit_system_settings ON public.system_settings;
CREATE TRIGGER tr_audit_system_settings
AFTER UPDATE OR DELETE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.process_audit_trail();
