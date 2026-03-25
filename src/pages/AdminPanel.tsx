import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Settings, Plus, Edit2, Trash2, Save, X, MapPin, UserCheck, DollarSign } from 'lucide-react';

type DiemRate = {
    id: string;
    destino: string;
    cargo: string;
    valor: number;
    updated_at: string;
};

export default function AdminPanel() {
    const { profile } = useAuth();
    const { showNotification } = useNotification();
    const [rates, setRates] = useState<DiemRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        destino: '',
        cargo: '',
        valor: ''
    });

    useEffect(() => {
        if (profile?.cargo === 'DAD') {
            fetchRates();
        }
    }, [profile]);

    const fetchRates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('diem_rates')
                .select('*')
                .order('destino', { ascending: true });
            if (error) throw error;
            setRates(data || []);
        } catch (err) {
            console.error(err);
            showNotification('Erro ao carregar taxas de diárias.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (id?: string) => {
        if (!formData.destino || !formData.cargo || !formData.valor) {
            showNotification('Preencha todos os campos.', 'warning');
            return;
        }

        try {
            const payload = {
                destino: formData.destino,
                cargo: formData.cargo,
                valor: parseFloat(formData.valor)
            };

            if (id) {
                const { error } = await supabase
                    .from('diem_rates')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
                showNotification('Taxa atualizada com sucesso!', 'success');
            } else {
                const { error } = await supabase
                    .from('diem_rates')
                    .insert(payload);
                if (error) throw error;
                showNotification('Nova taxa criada com sucesso!', 'success');
            }

            setEditingId(null);
            setIsAdding(false);
            setFormData({ destino: '', cargo: '', valor: '' });
            fetchRates();
        } catch (err: any) {
            console.error(err);
            showNotification(err.message || 'Erro ao salvar taxa.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta taxa?')) return;

        try {
            const { error } = await supabase
                .from('diem_rates')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showNotification('Taxa excluída com sucesso.', 'success');
            fetchRates();
        } catch (err) {
            console.error(err);
            showNotification('Erro ao excluir taxa.', 'error');
        }
    };

    const startEdit = (rate: DiemRate) => {
        setEditingId(rate.id);
        setIsAdding(false);
        setFormData({
            destino: rate.destino,
            cargo: rate.cargo,
            valor: rate.valor.toString()
        });
    };

    if (profile?.cargo !== 'DAD') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                    <p className="text-gray-600">Esta área é restrita ao Departamento de Administração (DAD).</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <Settings className="text-accent-600 h-10 w-10" />
                        Painel Administrativo
                    </h1>
                    <p className="mt-4 text-lg text-slate-500">Gestão de Parâmetros e Diárias do Sistema.</p>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-accent-200 hover:scale-105"
                    >
                        <Plus size={20} /> Nova Regra
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rules List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass-card rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Destino</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Diária</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white/40">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Carregando parâmetros...</td>
                                        </tr>
                                    ) : rates.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Nenhuma regra cadastrada.</td>
                                        </tr>
                                    ) : (
                                        rates.map((rate) => (
                                            <tr key={rate.id} className="hover:bg-accent-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={16} className="text-accent-500" />
                                                        <span className="font-bold text-slate-900">{rate.destino}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck size={16} className="text-slate-400" />
                                                        <span className="text-slate-600 font-medium">{rate.cargo}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 font-mono text-accent-700 font-bold">
                                                        <span>R$</span>
                                                        <span>{rate.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEdit(rate)} className="p-2 text-slate-400 hover:text-accent-600 hover:bg-white rounded-lg transition-all" title="Editar">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(rate.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all" title="Excluir">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Edit/Add Form Overlay Style in Sidebar */}
                <div className="lg:col-span-1">
                    {(isAdding || editingId) ? (
                        <div className="glass-card p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-900">{isAdding ? 'Nova Regra' : 'Editar Regra'}</h3>
                                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Destino</label>
                                    <input
                                        type="text"
                                        value={formData.destino}
                                        onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                                        placeholder="Ex: Brasília, Nacional, Internacional"
                                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cargo/Nível</label>
                                    <input
                                        type="text"
                                        value={formData.cargo}
                                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                        placeholder="Ex: Auditor, Chefia, Consultor"
                                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor da Diária (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.valor}
                                            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition-all font-mono font-bold text-accent-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => handleSave(editingId || undefined)}
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Salvar Regra
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
                            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                                <DollarSign className="text-slate-300 h-8 w-8" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Gerenciar Tarifas</h4>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">Selecione uma regra para editar ou clique em "Nova Regra" para adicionar novos parâmetros de cálculo.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
