import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { CheckCircle2, XCircle, Clock, Paperclip, ExternalLink, ChevronRight, LayoutDashboard } from 'lucide-react';
import { getDocumentUrl } from '../lib/storage';

type TravelRequest = {
    id: string;
    destino: string;
    data_ida: string;
    data_retorno: string;
    justificativa: string;
    fonte_recurso: string;
    status: string;
    valor_previsto: number;
    profiles: {
        id: string;
        nome: string;
        departamento: string;
        cargo: string;
    };
};

type TravelDocument = {
    id: string;
    tipo: string;
    storage_path: string;
};

export default function ApproverDashboard() {
    const { profile } = useAuth();
    const { showNotification } = useNotification();
    const [requests, setRequests] = useState<TravelRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
    const [attachments, setAttachments] = useState<TravelDocument[]>([]);
    const [comment, setComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (selectedRequest) {
            fetchAttachments(selectedRequest.id);
        } else {
            setAttachments([]);
        }
    }, [selectedRequest]);

    const fetchAttachments = async (travelId: string) => {
        const { data, error } = await supabase
            .from('travel_documents')
            .select('*')
            .eq('travel_id', travelId);
        if (!error) setAttachments(data || []);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
             // Fetch pendings based on RLS (Aprovadores can see their department)
             let query = supabase
                 .from('travel_requests')
                 .select(`
           *,
           profiles (id, nome, departamento, cargo)
         `);

             // Filter based on the approver's role
             if (profile?.cargo === 'Chefia') {
                 query = query.eq('status', 'Aguardando Chefia');
             } else if (profile?.cargo === 'Subsecretário') {
                 query = query.eq('status', 'Aguardando Subsecretário');
             } else if (profile?.cargo === 'DAD') {
                 query = query.in('status', ['Aguardando DAD', 'Aguardando Aprovação Prestação Contas']);
             } else {
                 // Devolve nada se não for aprovador conhecido
                 setRequests([]);
                 setLoading(false);
                 return;
             }

             const { data, error } = await query;

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'Aprovado' | 'Devolvido') => {
        if (!selectedRequest || !profile) return;
        if (action === 'Devolvido' && !comment.trim()) {
            showNotification('Motivo obrigatório para devolução.', 'warning');
            return;
        }

        setActionLoading(true);
        try {
            // 1. Log Workflow
            await supabase.from('approval_workflow').insert({
                travel_id: selectedRequest.id,
                aprovador_id: profile.id,
                papel_aprovador: profile.cargo,
                acao: action,
                comentarios: comment
            });

            // 2. Hierarchical Status Transition
            let newStatus = selectedRequest.status;

            if (action === 'Devolvido') {
                newStatus = 'Devolvido para Correção';
            } else {
                // Approval Logic
                if (selectedRequest.status === 'Aguardando Aprovação Prestação Contas') {
                    newStatus = 'Concluido';
                } else if (profile.cargo === 'Chefia') {
                    newStatus = 'Aguardando Subsecretário';
                } else if (profile.cargo === 'Subsecretário') {
                    newStatus = 'Aguardando DAD';
                } else if (profile.cargo === 'DAD') {
                    newStatus = 'Aprovado';
                }
            }

            await supabase.from('travel_requests')
                .update({ status: newStatus })
                .eq('id', selectedRequest.id);

            setSelectedRequest(null);
            setComment('');
            fetchRequests();
            showNotification(`Solicitação ${action === 'Aprovado' ? 'aprovada' : 'devolvida'} com sucesso!`, 'success');
        } catch (err) {
            console.error(err);
            showNotification('Erro ao processar ação.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div>Carregando solicitações...</div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative pb-8 border-b border-slate-200">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                    <LayoutDashboard className="text-accent-600 h-10 w-10" />
                    Painel do Aprovador
                </h1>
                <p className="mt-4 text-lg text-slate-500 max-w-3xl">
                    Gerencie e aprove solicitações de viagem do seu departamento com o fluxo de aprovação hierárquico.
                </p>
            </div>

            <div className="glass-card overflow-hidden rounded-2xl mt-8">
                <ul className="divide-y divide-gray-200">
                    {requests.length === 0 ? (
                        <li className="p-6 text-center text-gray-500">Não há viagens pendentes de aprovação no momento.</li>
                    ) : (
                        requests.map((req) => (
                            <li key={req.id} className="group">
                                <div className="px-8 py-6 flex items-center hover:bg-slate-50/50 cursor-pointer transition-all border-b border-slate-100 last:border-b-0" onClick={() => setSelectedRequest(req)}>
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600 truncate">{req.destino}</p>
                                            <p className="mt-2 flex items-center text-sm text-gray-500">
                                                <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-amber-400" />
                                                <span className="truncate">{req.status}</span>
                                            </p>
                                        </div>
                                        <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                                            <div className="flex space-x-2 text-sm text-gray-900 font-semibold">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(req.valor_previsto)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0">
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-slate-900/40 backdrop-blur-sm" onClick={() => !actionLoading && setSelectedRequest(null)} />
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom glass-modal rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full border border-white/20">
                            <div className="px-8 pt-8 pb-6">
                                <h3 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">Detalhes da Solicitação</h3>
                                <div className="mt-4 space-y-3 text-sm text-gray-600">
                                    <p><strong>Destino:</strong> {selectedRequest.destino}</p>
                                    <p><strong>Período:</strong> {new Date(selectedRequest.data_ida).toLocaleDateString()} a {new Date(selectedRequest.data_retorno).toLocaleDateString()}</p>
                                    <p><strong>Fonte de Recurso:</strong> {selectedRequest.fonte_recurso}</p>
                                    <p><strong>Solicitante:</strong> {selectedRequest.profiles?.nome || 'Não identificado'}</p>
                                    <p><strong>Justificativa:</strong> {selectedRequest.justificativa}</p>

                                    {/* Attachment Section */}
                                    <div className="mt-4">
                                        <p className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                            <Paperclip size={16} /> Anexos ({attachments.length})
                                        </p>
                                        {attachments.length === 0 ? (
                                            <p className="text-xs italic text-gray-400">Nenhum anexo enviado.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2">
                                                {attachments.map(doc => (
                                                    <button
                                                        key={doc.id}
                                                        type="button"
                                                        onClick={async () => {
                                                            const url = await getDocumentUrl(doc.storage_path);
                                                            window.open(url, '_blank');
                                                        }}
                                                        className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors text-xs"
                                                    >
                                                        <span className="font-medium text-blue-700 capitalize">{doc.tipo}</span>
                                                        <ExternalLink size={12} className="text-blue-500" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                                        <p className="font-semibold text-gray-900">Cálculo de Diárias Estimado</p>
                                        <p className="text-2xl text-blue-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRequest.valor_previsto)}</p>
                                    </div>
                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Comentários / Motivo da Devolução</label>
                                        <textarea
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all text-sm outline-none"
                                            rows={3}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Obrigatório em caso de devolução..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50/80 backdrop-blur-md px-8 py-6 sm:flex sm:flex-row-reverse border-t border-slate-100 gap-3">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => handleAction('Aprovado')}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-5 h-5 mr-1" /> Aprovar
                                </button>
                                {selectedRequest.status === 'Aprovado' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            import('../utils/portariaGenerator').then(({ exportPortariaPDF }) => {
                                                exportPortariaPDF({
                                                    id: selectedRequest.id,
                                                    destino: selectedRequest.destino,
                                                    data_ida: selectedRequest.data_ida,
                                                    data_retorno: selectedRequest.data_retorno,
                                                    fonte_recurso: selectedRequest.fonte_recurso,
                                                    profiles: {
                                                        nome: selectedRequest.profiles?.nome,
                                                    }
                                                });
                                            });
                                        }}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Gerar Portaria PDF
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => handleAction('Devolvido')}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    <XCircle className="w-5 h-5 mr-1" /> Devolver para Correção
                                </button>
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => setSelectedRequest(null)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

