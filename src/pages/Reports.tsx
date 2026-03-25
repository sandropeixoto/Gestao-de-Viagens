import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { FileText, Download, Filter, Landmark, CreditCard, Calendar } from 'lucide-react';

export default function Reports() {
    const { profile } = useAuth();
    const { showNotification } = useNotification();
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (profile?.cargo === 'DAD' || profile?.cargo === 'Auditoria') {
            fetchReportData();
        }
    }, [profile, filterStatus]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('travel_requests')
                .select(`
                    *,
                    profile:user_id (
                        departamento,
                        cargo
                    )
                `)
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;
            if (error) throw error;
            setReportData(data || []);
        } catch (err) {
            console.error(err);
            showNotification('Erro ao carregar dados do relatório.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (reportData.length === 0) {
            showNotification('Não há dados para exportar.', 'warning');
            return;
        }

        const headers = ["ID", "Destino", "Data Ida", "Data Retorno", "Valor Previsto", "Status", "Fonte Recurso", "Departamento", "Cargo"];
        const rows = reportData.map(r => [
            r.id,
            r.destino,
            r.data_ida,
            r.data_retorno,
            r.valor_previsto,
            r.status,
            r.fonte_recurso,
            r.profile?.departamento,
            r.profile?.cargo
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_viagens_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Relatório exportado com sucesso!', 'success');
    };

    if (profile?.cargo !== 'DAD' && profile?.cargo !== 'Auditoria') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                    <p className="text-gray-600">Esta área é restrita ao DAD e Auditoria.</p>
                </div>
            </div>
        );
    }

    const totalSpent = reportData.reduce((acc, curr) => acc + (curr.valor_previsto || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-10">
                <div className="space-y-4">
                    <div className="bg-accent-50 w-fit p-3 rounded-2xl border border-accent-100 mb-2">
                        <FileText className="text-accent-600 h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                        Relatórios Financeiros
                    </h1>
                    <p className="text-lg text-slate-500 font-medium">Consolidação de gastos e acompanhamento orçamentário.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent-500 transition-colors">
                            <Filter size={18} />
                        </div>
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-12 pr-10 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all font-bold text-slate-700 appearance-none shadow-sm cursor-pointer"
                        >
                            <option value="all">Todos os Estados</option>
                            <option value="Aprovado">Aprovados</option>
                            <option value="Concluido">Concluídos</option>
                            <option value="Rejeitado">Rejeitados</option>
                        </select>
                    </div>

                    <button
                        onClick={exportToCSV}
                        className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 group"
                    >
                        <Download size={20} className="group-hover:translate-y-0.5 transition-transform" /> 
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 rounded-3xl border border-white/20 shadow-xl space-y-4 bg-gradient-to-br from-white/60 to-accent-50/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent-100 rounded-2xl text-accent-700">
                            <Landmark size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Consolidado</p>
                            <h2 className="text-3xl font-black text-slate-900 mt-1">
                                R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                    </div>
                </div>
                
                <div className="glass-card p-8 rounded-3xl border border-white/20 shadow-xl space-y-4 bg-white/40">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Qtd. Solicitações</p>
                            <h2 className="text-3xl font-black text-slate-900 mt-1">{reportData.length}</h2>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-8 rounded-3xl border border-white/20 shadow-xl space-y-4 bg-white/40">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent-100 rounded-2xl text-accent-700">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Período Atual</p>
                            <h2 className="text-2xl font-bold text-slate-800 mt-1">Março 2026</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="glass-card rounded-[32px] overflow-hidden border border-white/20 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Servidor / Cargo</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Destino / Período</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Recurso</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Custo Total (R$)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white/40">
                            {loading ? (
                                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold text-lg animate-pulse">Processando dados financeiros...</td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold text-lg">Nenhum dado encontrado para os filtros aplicados.</td></tr>
                            ) : (
                                reportData.map((r) => (
                                    <tr key={r.id} className="hover:bg-accent-50/20 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-accent-500" />
                                                    <span className="font-extrabold text-slate-900">ID: {r.id.split('-')[0]}...</span>
                                                </div>
                                                <p className="text-slate-500 text-sm font-bold ml-4 uppercase">{r.profile?.departamento} - {r.profile?.cargo}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="font-extrabold text-slate-800">{r.destino}</p>
                                                <p className="text-slate-400 text-xs font-bold leading-none">{new Date(r.data_ida).toLocaleDateString()} ▸ {new Date(r.data_retorno).toLocaleDateString()}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-1.5 bg-accent-100 text-accent-700 rounded-full text-xs font-black tracking-widest uppercase">
                                                {r.fonte_recurso}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="font-mono text-xl font-bold text-slate-900">
                                                {r.valor_previsto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
