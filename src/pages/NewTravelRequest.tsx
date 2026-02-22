import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, FileText, DollarSign } from 'lucide-react';

export default function NewTravelRequest() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [destino, setDestino] = useState('');
    const [dataIda, setDataIda] = useState('');
    const [dataRetorno, setDataRetorno] = useState('');
    const [justificativa, setJustificativa] = useState('');
    const [fonteRecurso, setFonteRecurso] = useState('Tesouro');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validação básica da data
        if (new Date(dataRetorno) < new Date(dataIda)) {
            setError('A data de retorno não pode ser anterior à data de ida.');
            setLoading(false);
            return;
        }

        try {
            const { error: insertError } = await supabase.from('travel_requests').insert({
                user_id: user?.id,
                destino,
                data_ida: dataIda,
                data_retorno: dataRetorno,
                justificativa,
                fonte_recurso: fonteRecurso,
                status: 'Rascunho' // Inicializa como rascunho
            });

            if (insertError) throw insertError;

            // Ao salvar com sucesso, navega para o dashboard (ou listagem de viagens)
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao criar a solicitação de viagem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Nova Solicitação de Viagem</h1>
                <p className="text-gray-600 mt-1">Preencha os dados abaixo para criar um novo pedido (Rascunho). O valor da diária será calculado automaticamente.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <MapPin size={16} /> Destino
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: Brasília, DF"
                            value={destino}
                            onChange={(e) => setDestino(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                <Calendar size={16} /> Data de Ida
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={dataIda}
                                onChange={(e) => setDataIda(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                <Calendar size={16} /> Data de Retorno
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={dataRetorno}
                                onChange={(e) => setDataRetorno(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <FileText size={16} /> Justificativa
                        </label>
                        <textarea
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Descreva o motivo da viagem, evento ou atividades que serão realizadas."
                            value={justificativa}
                            onChange={(e) => setJustificativa(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <DollarSign size={16} /> Fonte de Recursos
                        </label>
                        <select
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                            value={fonteRecurso}
                            onChange={(e) => setFonteRecurso(e.target.value)}
                        >
                            <option value="Tesouro">Tesouro</option>
                            <option value="FIPAT">FIPAT</option>
                            <option value="BID">BID</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Salvando...' : 'Salvar como Rascunho'}
                    </button>
                </div>
            </form>
        </div>
    );
}
