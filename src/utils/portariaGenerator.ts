import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';

// Tipagem básica esperada para a solicitação de viagem com os dados do usuário anexados
export interface TravelRequestForPortaria {
    id: string; // Vai servir como matrícula temporária ou podemos usar o userId
    destino: string;
    data_ida: string;
    data_retorno: string;
    fonte_recurso: string;
    profiles: {
        nome?: string; // Assumindo que num sistema real o profile tenha 'nome' ou pegaremos do email
        email?: string;
    };
}

/**
 * Busca o template da portaria no banco de dados, substitui as variáveis com os dados
 * da solicitação de viagem e retorna o texto formatado.
 */
export async function generatePortariaText(request: TravelRequestForPortaria): Promise<string> {
    // 1. Busca o template no banco
    const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'portaria_template')
        .single();

    let template = 'O Secretário de Estado da Fazenda, no uso de suas atribuições... resolve AUTORIZAR o deslocamento do servidor [Nome], matrícula [ID], para [Destino], no período de [Data Início] a [Data Fim], com ônus para [Fonte de Recurso].';

    if (!error && data) {
        template = data.value;
    } else {
        console.error('Erro ao buscar template de portaria, usando fallback:', error);
    }

    // 2. Extrai e formata os dados
    // Simulando Matrícula com os primeiros 8 caracteres do ID, ou um campo matrícula se existir no schema futuro
    const matricula = request.id.substring(0, 8).toUpperCase();
    const nomeServidor = request.profiles?.nome || request.profiles?.email?.split('@')[0] || 'Servidor Não Identificado';

    const dataInicioFormatted = new Date(request.data_ida).toLocaleDateString('pt-BR');
    const dataFimFormatted = new Date(request.data_retorno).toLocaleDateString('pt-BR');

    // 3. Substitui as variáveis (Case insensitive replacement para maior robustez)
    template = template.replace(/\[Nome\]/gi, nomeServidor);
    template = template.replace(/\[ID\]/gi, matricula);
    template = template.replace(/\[Destino\]/gi, request.destino);
    template = template.replace(/\[Data Início\]/gi, dataInicioFormatted);
    template = template.replace(/\[Data Fim\]/gi, dataFimFormatted);
    template = template.replace(/\[Fonte de Recurso\]/gi, request.fonte_recurso);

    return template;
}

/**
 * Gera um arquivo PDF no navegador e dispara o download.
 */
export async function exportPortariaPDF(request: TravelRequestForPortaria): Promise<void> {
    try {
        const text = await generatePortariaText(request);

        // Configura o jsPDF (retrato, milímetros, formato A4)
        const doc = new jsPDF('p', 'mm', 'a4');

        // Adiciona o Cabeçalho (Fictício)
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text('GOVERNO DO ESTADO DO PARÁ', 105, 20, { align: 'center' });
        doc.text('SECRETARIA DE ESTADO DA FAZENDA - SEFA', 105, 28, { align: 'center' });

        doc.setFontSize(16);
        const idPortaria = request.id.substring(0, 6).toUpperCase();
        doc.text(`PORTARIA DE VIAGEM Nº ${idPortaria}/2026`, 105, 45, { align: 'center' });

        // Adiciona o corpo do texto processado
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");

        // splitTextToSize garante que o texto quebre as linhas na largura da folha A4 (tamanho 210mm, margens ajustadas)
        const lines = doc.splitTextToSize(text, 170);
        doc.text(lines, 20, 65, { align: 'justify', maxWidth: 170 });

        // Espaço para Assinatura
        doc.text('__________________________________________________', 105, 200, { align: 'center' });
        doc.text('Secretário de Estado da Fazenda', 105, 210, { align: 'center' });
        doc.setFontSize(10);
        doc.text('(Assinado Digitalmente)', 105, 215, { align: 'center' });

        // Salva o documento
        const shortId = request.id.substring(0, 8);
        doc.save(`Portaria_Viagem_${shortId}.pdf`);
    } catch (error) {
        console.error('Erro ao gerar PDF da portaria:', error);
        alert('Não foi possível gerar o PDF da portaria.');
    }
}
