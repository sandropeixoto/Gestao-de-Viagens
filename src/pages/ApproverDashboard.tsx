import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

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
        departamento: string;
        cargo: string;
        auth: { email?: string }; // Simulated join fetch
    };
};

export default function ApproverDashboard() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<TravelRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
    const [comment, setComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            // Fetch pendings based on RLS (Aprovadores can see their department)
            const { data, error } = await supabase
                .from('travel_requests')
                .select(`
          *,
          profiles (departamento, cargo)
        `)
                .in('status', ['Aguardando Chefia', 'Aguardando Subsecretario', 'Aguardando DAD']);

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
            alert('Motivo obrigatório para devolução.');
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

            // 2. Update Request Status (Simplificada: se Chefia aprovou -> subsecretario, etc. Aqui vamos direto)
            const newStatus = action === 'Aprovado' ? 'Aprovado' : 'Rejeitado';

            await supabase.from('travel_requests')
                .update({ status: newStatus })
                .eq('id', selectedRequest.id);

            setSelectedRequest(null);
            setComment('');
            fetchRequests();
        } catch (err) {
            console.error(err);
            alert('Erro ao processar aprovação.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div>Carregando solicitações...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Painel do Aprovador</h1>
            <p className="text-gray-600">Confira as solicitações de viagem pendentes para o seu departamento.</p>

            <div className="bg-white shadow overflow-hidden sm:rounded-md mt-6 border border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {requests.length === 0 ? (
                        <li className="p-6 text-center text-gray-500">Não há viagens pendentes de aprovação no momento.</li>
                    ) : (
                        requests.map((req) => (
                            <li key={req.id}>
                                <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedRequest(req)}>
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
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => !actionLoading && setSelectedRequest(null)} />
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2">Detalhes da Solicitação</h3>
                                <div className="mt-4 space-y-3 text-sm text-gray-600">
                                    <p><strong>Destino:</strong> {selectedRequest.destino}</p>
                                    <p><strong>Período:</strong> {new Date(selectedRequest.data_ida).toLocaleDateString()} a {new Date(selectedRequest.data_retorno).toLocaleDateString()}</p>
                                    <p><strong>Fonte de Recurso:</strong> {selectedRequest.fonte_recurso}</p>
                                    <p><strong>Justificativa:</strong> {selectedRequest.justificativa}</p>
                                    <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                                        <p className="font-semibold text-gray-900">Cálculo de Diárias Estimado</p>
                                        <p className="text-2xl text-blue-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRequest.valor_previsto)}</p>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700">Comentários / Motivo da Devolução</label>
                                        <textarea
                                            className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows={3}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Obrigatório em caso de devolução..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
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
                                                        nome: selectedRequest.profiles?.auth?.email?.split('@')[0],
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

// Temporary ChevronRight icon since I forgot to import it above. Good practice is to put it here if missed.
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
    );
}
