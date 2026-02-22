-- 20260222000004_dashboard_metrics.sql
-- Migration to create the dashboard metrics aggregated function

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(p_user_id UUID, p_cargo TEXT, p_departamento TEXT)
RETURNS JSON AS $$
DECLARE
    v_viagens_andamento INT := 0;
    v_aprovacoes_pendentes INT := 0;
    v_prestacoes_pendentes INT := 0;
    v_total_gasto_mes NUMERIC := 0;
    v_fontes_recurso JSON := '[]';
BEGIN
    -- 1. Viagens em andamento (do usuário)
    SELECT COUNT(*) INTO v_viagens_andamento
    FROM public.travel_requests
    WHERE user_id = p_user_id 
    AND status NOT IN ('Concluido', 'Rejeitado');

    -- 2. Aprovações pendentes (para o cargo/departamento)
    IF p_cargo = 'Chefia' THEN
        SELECT COUNT(*) INTO v_aprovacoes_pendentes
        FROM public.travel_requests tr
        JOIN public.profiles pr ON tr.user_id = pr.id
        WHERE tr.status = 'Aguardando Chefia'
        AND pr.departamento = p_departamento;
    ELSIF p_cargo = 'Subsecretario' THEN
        SELECT COUNT(*) INTO v_aprovacoes_pendentes
        FROM public.travel_requests tr
        JOIN public.profiles pr ON tr.user_id = pr.id
        WHERE tr.status = 'Aguardando Subsecretario'
        AND pr.departamento = p_departamento;
    ELSIF p_cargo = 'DAD' THEN
        SELECT COUNT(*) INTO v_aprovacoes_pendentes
        FROM public.travel_requests
        WHERE status = 'Aguardando DAD';
    END IF;

    -- 3. Prestações de Contas pendentes ou em atraso (do usuário)
    SELECT COUNT(*) INTO v_prestacoes_pendentes
    FROM public.travel_requests
    WHERE user_id = p_user_id
    AND status IN ('Aguardando Prestacao de Contas', 'Em Atraso');

    -- 4. Total Gasto no Mês Atual (do usuário ou global se admin? Vamos fazer do usuário para a visão pessoal ou do depto se chefia. Simplificado para o usuário logado para o "Meu Resumo")
    SELECT COALESCE(SUM(valor_previsto), 0) INTO v_total_gasto_mes
    FROM public.travel_requests
    WHERE user_id = p_user_id
    AND EXTRACT(MONTH FROM data_ida) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM data_ida) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND status != 'Rejeitado';

    -- 5. Execução por Fonte de Recurso (do usuário)
    SELECT COALESCE(json_agg(json_build_object('fonte', fonte_recurso, 'total', total)), '[]'::json) INTO v_fontes_recurso
    FROM (
        SELECT fonte_recurso, SUM(valor_previsto) as total
        FROM public.travel_requests
        WHERE user_id = p_user_id
        AND status != 'Rejeitado'
        GROUP BY fonte_recurso
    ) sub;

    RETURN json_build_object(
        'viagens_andamento', v_viagens_andamento,
        'aprovacoes_pendentes', v_aprovacoes_pendentes,
        'prestacoes_pendentes', v_prestacoes_pendentes,
        'total_gasto_mes', v_total_gasto_mes,
        'fontes_recurso', v_fontes_recurso
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
