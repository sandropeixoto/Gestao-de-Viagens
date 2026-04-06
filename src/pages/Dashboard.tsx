import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import {
    Luggage,
    CheckCircle,
    AlertTriangle,
    DollarSign,
    PlusCircle,
    FileText,
    TrendingUp,
    CalendarClock
} from 'lucide-react';

interface DashboardMetrics {
    viagens_andamento: number;
    aprovacoes_pendentes: number;
    prestacoes_pendentes: number;
    total_gasto_mes: number;
    fontes_recurso: { fonte: string; total: number }[];
}

export default function Dashboard() {
    const { profile, user } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recentRequests, setRecentRequests] = useState<any[]>([]);

    useEffect(() => {
        if (user && profile) {
            fetchDashboardData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, profile]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch aggregated metrics via RPC
            const { data: metricsData, error: metricsError } = await supabase.rpc('get_dashboard_metrics', {
                p_user_id: user?.id,
                p_cargo: profile?.cargo,
                p_departamento: profile?.departamento
            });

            if (metricsError) throw metricsError;
            setMetrics(metricsData as DashboardMetrics);

            // Fetch recent requests (limit 5)
            const { data: recentData, error: recentError } = await supabase
                .from('travel_requests')
                .select('id, destino, data_ida, data_retorno, status, valor_previsto')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentError) throw recentError;
            setRecentRequests(recentData || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Perfil Incompleto</h2>
                    <p className="mt-2 text-sm text-gray-500">Por favor, contate o administrador ("sandro.peixoto") para configurar seu cargo e departamento.</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-700">
            {/* Cabeçalho */}
            <div className="relative pb-8 border-b border-slate-200">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                    Bem-vindo, <span className="text-accent-600">{profile?.nome || user?.email?.split('@')[0]}</span>
                </h1>
                <p className="mt-4 text-lg text-slate-500 max-w-3xl">
                    Resumo do seu painel como <span className="font-semibold text-slate-700">{profile?.cargo}</span> do {profile?.departamento}.
                </p>
            </div>
            {/* Grid de Cards Principais */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Viagens em Andamento */}
                <div className="glass-card overflow-hidden rounded-2xl p-6 relative group">
                    <div className="absolute inset-0 bg-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-50/50 backdrop-blur-sm rounded-xl p-3 border border-blue-100">
                            <Luggage className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Viagens em Andamento</dt>
                                <dd className="flex items-baseline">
                                    <div className="text-3xl font-bold text-slate-900">{metrics?.viagens_andamento || 0}</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Card 2: Aprovações Pendentes */}
                <div className="glass-card overflow-hidden rounded-2xl relative group flex flex-col">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-6 flex-1">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-emerald-50/50 backdrop-blur-sm rounded-xl p-3 border border-emerald-100">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-500 truncate">Aprovações Pendentes</dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-3xl font-bold text-slate-900">{metrics?.aprovacoes_pendentes || 0}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    {(metrics?.aprovacoes_pendentes || 0) > 0 && (
                        <div className="bg-emerald-50/50 backdrop-blur-sm px-6 py-3 border-t border-emerald-100">
                            <div className="text-sm">
                                <Link to="/aprovacoes" className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center">
                                    Revisar agora <TrendingUp className="ml-1 h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Card 3: Prestações Pendentes */}
                <div className="glass-card overflow-hidden rounded-2xl relative group flex flex-col">
                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {(metrics?.prestacoes_pendentes || 0) > 0 && (
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500/40 animate-pulse"></div>
                    )}
                    <div className="p-6 flex-1">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-red-50/50 backdrop-blur-sm rounded-xl p-3 border border-red-100">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-500 truncate">Prestações Pendentes</dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-3xl font-bold text-slate-900">{metrics?.prestacoes_pendentes || 0}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    {(metrics?.prestacoes_pendentes || 0) > 0 && (
                        <div className="bg-red-50/50 backdrop-blur-sm px-6 py-3 border-t border-red-100">
                            <div className="text-sm">
                                <Link to="/prestacao-contas" className="font-semibold text-red-700 hover:text-red-900">
                                    Ação imediata necessária
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Card 4: Gasto Total */}
                <div className="glass-card overflow-hidden rounded-2xl p-6 relative group">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-50/50 backdrop-blur-sm rounded-xl p-3 border border-green-100">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Total Gasto (Mês)</dt>
                                <dd className="flex items-baseline">
                                    <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(metrics?.total_gasto_mes || 0)}</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seção Inferior: Gráficos e Ações Rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

                {/* Esquerda: Agrupamento por Fonte */}
                <div className="lg:col-span-2 glass-card rounded-2xl p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-accent-500" />
                        Execução Financeira por Fonte
                    </h3>

                    {metrics?.fontes_recurso && metrics.fontes_recurso.length > 0 ? (
                        <div className="space-y-4">
                            {metrics.fontes_recurso.map((item, idx) => {
                                // Calculate a pseudo-percentage for the bar width (relative to total spent)
                                const percentage = metrics.total_gasto_mes > 0 ? (item.total / metrics.total_gasto_mes) * 100 : 0;
                                return (
                                    <div key={idx}>
                                        <div className="flex items-center justify-between text-sm font-medium text-gray-900 mb-1">
                                            <span>{item.fonte}</span>
                                            <span>{formatCurrency(item.total)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.max(percentage, 2)}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Nenhuma despesa registrada no mês atual.
                        </div>
                    )}
                </div>

                {/* Direita: Ações Rápidas */}
                <div className="glass-card rounded-2xl p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Tarefas Rápidas</h3>
                    <div className="space-y-3">
                        <Link to="/solicitar" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                            <PlusCircle className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Nova Solicitação</p>
                                <p className="text-xs text-gray-500">Criar um pedido de viagem</p>
                            </div>
                        </Link>

                        <Link to="/prestacao-contas" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group">
                            <FileText className="h-6 w-6 text-gray-400 group-hover:text-emerald-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Anexar Comprovantes</p>
                                <p className="text-xs text-gray-500">Realizar prestação de contas pendente</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Lista Inferior: Recentes */}
            <div className="glass-card rounded-2xl overflow-hidden mt-8">
                <div className="px-8 py-6 border-b border-slate-200 bg-white/30">
                    <h3 className="text-xl font-bold text-slate-900">Solicitações Recentes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Início</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Estimado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {req.destino}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                                        <CalendarClock className="h-4 w-4 mr-1 text-gray-400" />
                                        {new Date(req.data_ida).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status.includes('Aprovado') ? 'bg-green-100 text-green-800' :
                                            req.status.includes('Rejeitado') ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {req.status}
                                        </span>
                                        {req.status === 'Aguardando Prestacao de Contas' && (
                                            (() => {
                                                const returnDate = new Date(req.data_retorno || req.data_ida);
                                                const dueDate = new Date(returnDate);
                                                dueDate.setDate(dueDate.getDate() + 5);
                                                const isOverdue = new Date() > dueDate;

                                                return isOverdue ? (
                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-red-600 font-black uppercase animate-pulse">
                                                        <AlertTriangle size={10} /> Prazo Excedido
                                                    </div>
                                                ) : null;
                                            })()
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-medium">
                                        {formatCurrency(req.valor_previsto)}
                                    </td>
                                </tr>
                            ))}
                            {recentRequests.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                                        Você não possui solicitações de viagem recentes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div >
    );
}
