import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UploadCloud, CheckSquare, Clock, AlertTriangle } from 'lucide-react';

type AccountabilityRequest = {
    id: string;
    destino: string;
    data_ida: string;
    data_retorno: string;
    status: string;
};

export default function AccountabilityForm() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<AccountabilityRequest[]>([]);
    const [selectedReq, setSelectedReq] = useState<string | null>(null);

    // Checklist State
    const [checklist, setChecklist] = useState({
        bilhetes: false,
        relatorio: false,
        devolucao: false // caso não use todo o recurso
    });

    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchRequests = async () => {
        try {
            // Find requests waiting for accountability for this user
            const { data, error } = await supabase
                .from('travel_requests')
                .select('id, destino, data_ida, data_retorno, status')
                .eq('user_id', user?.id)
                .in('status', ['Aguardando Prestacao de Contas', 'Em Atraso']);

            if (error) throw error;
            setRequests(data || []);
            if (data?.length === 1) setSelectedReq(data[0].id); // Auto-select if only 1
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const calculateDaysLeft = (dataRetorno: string) => {
        const retorno = new Date(dataRetorno);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - retorno.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Prazo legal de 5 dias úteis (aproximadamente 7 corridos)
        const daysLeft = 7 - diffDays;
        return daysLeft;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReq) return;

        if (!checklist.bilhetes || !checklist.relatorio) {
            alert("Por favor, confirme que enviou os bilhetes e o relatório.");
            return;
        }

        if (files.length === 0) {
            alert("Por favor, anexe os comprovantes necessários.");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Simular Upload 
            console.log(`Enviando ${files.length} arquivos para a prestação da viagem ${selectedReq}`);

            // 2. Mudar status para 'Aguardando Aprovação Prestação Contas' (Fluxo DAD)
            const { error } = await supabase
                .from('travel_requests')
                .update({ status: 'Concluido' }) // Simplificado: Ideal ir para auditoria DAD
                .eq('id', selectedReq);

            if (error) throw error;

            alert('Prestação de contas enviada com sucesso!');

            setSelectedReq(null);
            setChecklist({ bilhetes: false, relatorio: false, devolucao: false });
            setFiles([]);
            fetchRequests();

        } catch (err) {
            console.error(err);
            alert('Erro ao enviar prestação de contas.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Prestação de Contas</h1>
            <p className="text-gray-600">Envie seus comprovantes no prazo de 5 dias úteis após o retorno para evitar bloqueios no sistema.</p>

            {requests.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                    <CheckSquare className="mx-auto h-12 w-12 text-green-500 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">Tudo em dia!</h3>
                    <p className="text-gray-500">Você não tem viagens pendentes de prestação de contas.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                    {/* Lado Esquerdo: Viagens Pendentes */}
                    <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
                        <h3 className="p-4 font-semibold text-gray-700 uppercase text-xs tracking-wider border-b border-gray-200">Viagens Pendentes</h3>
                        <ul className="divide-y divide-gray-200">
                            {requests.map(req => {
                                const daysLeft = calculateDaysLeft(req.data_retorno);
                                const isLate = req.status === 'Em Atraso' || daysLeft < 0;

                                return (
                                    <li
                                        key={req.id}
                                        className={`p-4 cursor-pointer hover:bg-white transition-colors ${selectedReq === req.id ? 'bg-white border-l-4 border-l-blue-600' : ''}`}
                                        onClick={() => setSelectedReq(req.id)}
                                    >
                                        <div className="text-sm font-medium text-gray-900 truncate">{req.destino}</div>
                                        <div className="text-xs text-gray-500 mt-1">{new Date(req.data_retorno).toLocaleDateString()}</div>
                                        <div className={`mt-2 inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full ${isLate ? 'bg-red-100 text-red-700' : daysLeft <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                            {isLate ? <AlertTriangle size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                                            {isLate ? 'Em Atraso' : `${daysLeft} dias restantes`}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Lado Direito: Formulário */}
                    <div className="w-full md:w-2/3 p-6">
                        {!selectedReq ? (
                            <div className="text-center text-gray-500 py-12">Selecione uma viagem ao lado para prestar contas.</div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Visual Checklist */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Checklist Obrigatório</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                                            <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" checked={checklist.bilhetes} onChange={(e) => setChecklist({ ...checklist, bilhetes: e.target.checked })} />
                                            <div>
                                                <span className="font-medium text-gray-900">Bilhetes de Passagem</span>
                                                <p className="text-sm text-gray-500">Juntei todos os bilhetes de embarque (ida e volta).</p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                                            <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" checked={checklist.relatorio} onChange={(e) => setChecklist({ ...checklist, relatorio: e.target.checked })} />
                                            <div>
                                                <span className="font-medium text-gray-900">Relatório de Viagem</span>
                                                <p className="text-sm text-gray-500">Relatório assinado descrevendo as atividades realizadas.</p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                                            <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" checked={checklist.devolucao} onChange={(e) => setChecklist({ ...checklist, devolucao: e.target.checked })} />
                                            <div>
                                                <span className="font-medium text-gray-900">Devolução de Valores (Opcional)</span>
                                                <p className="text-sm text-gray-500">Anexei o comprovante de devolução das diárias não utilizadas via DAE.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Drag and Drop Area */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Upload de Comprovantes</h3>
                                    <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-8 text-center hover:bg-blue-100 transition-colors">
                                        <UploadCloud className="mx-auto h-10 w-10 text-blue-500" />
                                        <div className="mt-4 flex text-sm text-gray-600 justify-center">
                                            <label htmlFor="accountability-upload" className="relative cursor-pointer bg-white px-2 py-1 rounded-md font-medium text-blue-600 shadow-sm border border-blue-200 hover:bg-blue-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                <span>Selecionar Arquivos</span>
                                                <input id="accountability-upload" type="file" multiple className="sr-only" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                        <p className="text-xs text-blue-700 mt-3 font-medium">Arraste seus PDFs e imagens aqui</p>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Arquivos selecionados ({files.length})</h4>
                                            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                {files.map((file, i) => (
                                                    <li key={i} className="text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200 flex justify-between items-center group">
                                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                            <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                Remover
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-200 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Enviando...' : 'Enviar Prestação de Contas'}
                                    </button>
                                </div>

                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
