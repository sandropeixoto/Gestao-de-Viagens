import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
    try {
        // Este código deve ser invocado via cron trigger do Supabase

        console.log("Iniciando rotina de alerta de prestação de contas pendente (Cron)...")

        // Busca viagens concluídas onde data_retorno foi há 3 dias.
        // 3 dias passados = faltam 2 dias do prazo de 5 dias
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const dateStr = threeDaysAgo.toISOString().split('T')[0];

        const { data: requests, error } = await supabase
            .from('travel_requests')
            .select('id, user_id, data_retorno, profiles(cargo, departamento)')
            .eq('status', 'Aguardando Prestacao de Contas')
            .eq('data_retorno', dateStr);

        if (error) {
            throw error;
        }

        if (!requests || requests.length === 0) {
            return new Response(JSON.stringify({ message: "Sem alertas pendentes para a data atual." }), { headers: { "Content-Type": "application/json" } })
        }

        // Simulando o envio de mensagens (WhatsApp / Twilio / SendGrid)
        const alertsSent = [];

        for (const req of requests) {
            // Simulação do Nome baseada no ID (já que auth.users name não está na query)
            const serverName = `ID-${req.user_id.substring(0, 8)}`;

            const message = `Atenção, servidor ${serverName}. Faltam 2 dias para o fim do seu prazo legal de prestação de contas conforme Decreto 3.792/2024.`;

            // TODO: Implementar chamadas reais de API WhatsApp/SendGrid aqui.
            console.log(`[SIMULAÇÃO TWILIO/WHATSAPP] Enviando p/ Usuário ${req.user_id}: ${message}`);

            // Registrar log na tabela de notificações do sistema por segurança
            await supabase.from('notifications').insert({
                user_id: req.user_id,
                mensagem: message
            });

            alertsSent.push({ user_id: req.user_id, message });
        }

        return new Response(
            JSON.stringify({
                message: `Sucesso. ${alertsSent.length} alertas disparados.`,
                alerts: alertsSent
            }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error: any) {
        console.error("Erro ao rodar cron job:", error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
    }
})
