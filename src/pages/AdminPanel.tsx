import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Settings, Plus, Edit2, Trash2, Save, X, MapPin, UserCheck, DollarSign, Truck } from 'lucide-react';

type DiemRate = {
    id: string;
    destino: string;
    cargo: string;
    valor: number;
    status: string;
    effective_from: string;
    updated_at: string;
};

type TransportType = {
    id: string;
    name: string;
    active: boolean;
};

export default function AdminPanel() {
    const { profile } = useAuth();
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<'rates' | 'transport'>('rates');
    
    // Rates State
    const [rates, setRates] = useState<DiemRate[]>([]);
    const [transportTypes, setTransportTypes] = useState<TransportType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form states
    const [rateFormData, setRateFormData] = useState({
        destino: '',
        cargo: '',
        valor: '',
        status: 'active',
        effective_from: new Date().toISOString().split('T')[0]
    });

    const [transportFormData, setTransportFormData] = useState({
        name: '',
        active: true
    });

    useEffect(() => {
        if (profile?.cargo === 'DAD') {
            if (activeTab === 'rates') fetchRates();
            if (activeTab === 'transport') fetchTransportTypes();
        }
    }, [profile, activeTab]);

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

    const fetchTransportTypes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transport_types')
                .select('*')
                .order('name', { ascending: true });
            if (error) throw error;
            setTransportTypes(data || []);
        } catch (err) {
            console.error(err);
            showNotification('Erro ao carregar tipos de transporte.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRate = async (id?: string) => {
        if (!rateFormData.destino || !rateFormData.cargo || !rateFormData.valor) {
            showNotification('Preencha todos os campos.', 'warning');
            return;
        }

        try {
            const payload = {
                destino: rateFormData.destino,
                cargo: rateFormData.cargo,
                valor: parseFloat(rateFormData.valor),
                status: rateFormData.status,
                effective_from: rateFormData.effective_from
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

            resetForm();
            fetchRates();
        } catch (err: any) {
            console.error(err);
            showNotification(err.message || 'Erro ao salvar taxa.', 'error');
        }
    };

    const handleSaveTransport = async (id?: string) => {
        if (!transportFormData.name) {
            showNotification('Preencha o nome do transporte.', 'warning');
            return;
        }

        try {
            const payload = {
                name: transportFormData.name,
                active: transportFormData.active
            };

            if (id) {
                const { error } = await supabase
                    .from('transport_types')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
                showNotification('Transporte atualizado!', 'success');
            } else {
                const { error } = await supabase
                    .from('transport_types')
                    .insert(payload);
                if (error) throw error;
                showNotification('Transporte cadastrado!', 'success');
            }

            resetForm();
            fetchTransportTypes();
        } catch (err: any) {
            console.error(err);
            showNotification(err.message || 'Erro ao salvar transporte.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;

        try {
            const table = activeTab === 'rates' ? 'diem_rates' : 'transport_types';
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);
            if (error) throw error;
            showNotification('Excluído com sucesso.', 'success');
            activeTab === 'rates' ? fetchRates() : fetchTransportTypes();
        } catch (err) {
            console.error(err);
            showNotification('Erro ao excluir.', 'error');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setIsAdding(false);
        setRateFormData({ destino: '', cargo: '', valor: '', status: 'active', effective_from: new Date().toISOString().split('T')[0] });
        setTransportFormData({ name: '', active: true });
    };

    const startEditRate = (rate: DiemRate) => {
        setEditingId(rate.id);
        setIsAdding(false);
        setRateFormData({
            destino: rate.destino,
            cargo: rate.cargo,
            valor: rate.valor.toString(),
            status: rate.status || 'active',
            effective_from: rate.effective_from ? new Date(rate.effective_from).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
    };

    const startEditTransport = (t: TransportType) => {
        setEditingId(t.id);
        setIsAdding(false);
        setTransportFormData({
            name: t.name,
            active: t.active
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
            <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-slate-200 pb-8 gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <Settings className="text-accent-600 h-10 w-10" />
                        Painel Administrativo
                    </h1>
                    <div className="mt-6 flex gap-4">
                        <button 
                            onClick={() => { setActiveTab('rates'); resetForm(); }}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'rates' ? 'bg-accent-600 text-white shadow-lg shadow-accent-100' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Tabela de Diárias
                        </button>
                        <button 
                            onClick={() => { setActiveTab('transport'); resetForm(); }}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'transport' ? 'bg-accent-600 text-white shadow-lg shadow-accent-100' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Tipos de Transporte
                        </button>
                    </div>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-accent-200 hover:scale-105"
                    >
                        <Plus size={20} /> {activeTab === 'rates' ? 'Nova Regra' : 'Novo Transporte'}
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
                                    {activeTab === 'rates' ? (
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Destino</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Diária</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Transporte</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white/40">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Carregando...</td>
                                        </tr>
                                    ) : activeTab === 'rates' ? (
                                        rates.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-12 text-center">Vazio</td></tr>
                                        ) : rates.map((rate) => (
                                            <tr key={rate.id} className="hover:bg-accent-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={16} className="text-accent-500" />
                                                        <span className="font-bold text-slate-900">{rate.destino}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-600 font-medium">{rate.cargo}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-mono text-accent-700 font-bold">
                                                        R$ {rate.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditRate(rate)} className="p-2 text-slate-400 hover:text-accent-600 hover:bg-white rounded-lg transition-all"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDelete(rate.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        transportTypes.length === 0 ? (
                                            <tr><td colSpan={3} className="px-6 py-12 text-center">Vazio</td></tr>
                                        ) : transportTypes.map((t) => (
                                            <tr key={t.id} className="hover:bg-accent-50/30 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                                                    <Truck size={16} className="text-accent-500" />
                                                    {t.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {t.active ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditTransport(t)} className="p-2 text-slate-400 hover:text-accent-600 hover:bg-white rounded-lg transition-all"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
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
                                <h3 className="text-xl font-bold text-slate-900">
                                    {activeTab === 'rates' ? (isAdding ? 'Nova Regra' : 'Editar Regra') : (isAdding ? 'Novo Transporte' : 'Editar Transporte')}
                                </h3>
                                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            {activeTab === 'rates' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Destino</label>
                                        <input
                                            type="text"
                                            value={rateFormData.destino}
                                            onChange={(e) => setRateFormData({ ...rateFormData, destino: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none font-medium"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cargo</label>
                                            <input
                                                type="text"
                                                value={rateFormData.cargo}
                                                onChange={(e) => setRateFormData({ ...rateFormData, cargo: e.target.value })}
                                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                            <select
                                                value={rateFormData.status}
                                                onChange={(e) => setRateFormData({ ...rateFormData, status: e.target.value })}
                                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl font-bold text-slate-700"
                                            >
                                                <option value="active">Ativo</option>
                                                <option value="inactive">Inativo</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={rateFormData.valor}
                                            onChange={(e) => setRateFormData({ ...rateFormData, valor: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl font-mono font-bold text-accent-700"
                                        />
                                    </div>
                                    <button onClick={() => handleSaveRate(editingId || undefined)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                                        <Save size={18} /> Salvar
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Transporte</label>
                                        <input
                                            type="text"
                                            value={transportFormData.name}
                                            onChange={(e) => setTransportFormData({ ...transportFormData, name: e.target.value })}
                                            placeholder="Ex: Aéreo, Terrestre..."
                                            className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                id="t-active"
                                                checked={transportFormData.active}
                                                onChange={(e) => setTransportFormData({...transportFormData, active: e.target.checked})}
                                                className="w-5 h-5 accent-accent-600"
                                            />
                                            <label htmlFor="t-active" className="text-sm font-bold text-slate-700">Ativo para novas solicitações</label>
                                        </div>
                                    </div>
                                    <button onClick={() => handleSaveTransport(editingId || undefined)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                                        <Save size={18} /> Salvar
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
                            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                                {activeTab === 'rates' ? <DollarSign className="text-slate-300 h-8 w-8" /> : <Truck className="text-slate-300 h-8 w-8" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Gerenciar {activeTab === 'rates' ? 'Tarifas' : 'Transportes'}</h4>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">Selecione um item para editar ou crie um novo para atualizar os parâmetros do sistema.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
