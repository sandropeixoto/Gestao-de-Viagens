-- Database function to check for overdue travel requests
-- E se passar de 5 dias úteis após o retorno e não houver upload na tabela travel_documents com tipo 'prestacao_contas', marque o status como 'Em Atraso' e registre um log de alerta na tabela de notificações.

CREATE OR REPLACE FUNCTION public.check_overdue_travel_requests()
RETURNS void AS $$
DECLARE
    tr RECORD;
BEGIN
    -- 1. Automate 'Aguardando Prestacao de Contas'
    -- Find requests that are Approved and their return date has passed
    FOR tr IN 
        SELECT id, user_id FROM public.travel_requests
        WHERE status = 'Aprovado' 
        AND data_retorno < CURRENT_DATE
    LOOP
        UPDATE public.travel_requests
        SET status = 'Aguardando Prestacao de Contas',
            updated_at = NOW()
        WHERE id = tr.id;
        
        -- Opcional: Notificar o usuário
        INSERT INTO public.notifications (user_id, mensagem)
        VALUES (tr.user_id, 'Sua viagem concluiu. Por favor, inicie a prestação de contas.');
    END LOOP;

    -- 2. Automate 'Em Atraso' (5 dias úteis = aprox 7 dias corridos para simplificação na query, 
    -- idealmente usar uma função de dias úteis, mas aqui usamos dias corridos + 2 fim de semanas)
    FOR tr IN
        SELECT id, user_id FROM public.travel_requests
        WHERE status = 'Aguardando Prestacao de Contas'
        AND data_retorno < (CURRENT_DATE - INTERVAL '7 days') 
        AND NOT EXISTS (
            SELECT 1 FROM public.travel_documents
            WHERE travel_id = public.travel_requests.id
            AND tipo = 'prestacao_contas'
        )
    LOOP
        -- Marcar como Em Atraso
        UPDATE public.travel_requests
        SET status = 'Em Atraso',
            updated_at = NOW()
        WHERE id = tr.id;
        
        -- Registrar um log de alerta na tabela de notificações
        INSERT INTO public.notifications (user_id, mensagem)
        VALUES (tr.user_id, 'ALERTA: Sua prestação de contas está ATRASADA (mais de 5 dias úteis).');
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Para rodar isso automaticamente, o ideal é usar a extensão pg_cron no Supabase:
-- Ative a extensão pg_cron no painel do Supabase.
-- Depois rode:
-- SELECT cron.schedule('check_travel_status', '0 0 * * *', 'SELECT public.check_overdue_travel_requests()');
-- Isso rodará a verificação todos os dias à meia-noite.
