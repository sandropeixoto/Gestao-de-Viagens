import { useAuth } from '../contexts/AuthContext';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Home, FileText, CheckCircle, UploadCloud, Settings, PieChart, User } from 'lucide-react';

export default function Layout() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900">
            {/* Sidebar */}
            <aside className="w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 hidden md:flex flex-col z-30 sticky top-0 h-screen">
                <div className="p-10 cursor-pointer group transition-all" onClick={() => navigate('/dashboard')}>
                    <div className="flex items-center gap-4">
                        <div className="bg-accent-600 p-2.5 rounded-2xl shadow-lg shadow-accent-200 group-hover:scale-110 transition-transform">
                            <Home className="text-white h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-slate-900">SGPD</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gestão de Viagens</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu Principal</p>
                    
                    <NavItem 
                        icon={<Home size={20} />} 
                        label="Dashboard" 
                        onClick={() => navigate('/dashboard')} 
                        active={window.location.pathname === '/dashboard'}
                    />
                    
                    <NavItem 
                        icon={<FileText size={20} />} 
                        label="Nova Viagem" 
                        onClick={() => navigate('/solicitar')} 
                        active={window.location.pathname === '/solicitar'}
                        color="blue"
                    />

                    <NavItem 
                        icon={<UploadCloud size={20} />} 
                        label="Prestação de Contas" 
                        onClick={() => navigate('/prestacao-contas')} 
                        active={window.location.pathname === '/prestacao-contas'}
                        color="green"
                    />

                    {profile?.cargo !== 'Servidor' && (
                        <>
                            <p className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestão</p>
                            <NavItem 
                                icon={<CheckCircle size={20} />} 
                                label="Aprovações" 
                                onClick={() => navigate('/aprovacoes')} 
                                active={window.location.pathname === '/aprovacoes'}
                                color="amber"
                            />
                        </>
                    )}

                    {(profile?.cargo === 'DAD' || profile?.cargo === 'Auditoria') && (
                        <>
                            <p className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administração</p>
                            <NavItem 
                                icon={<PieChart size={20} />} 
                                label="Relatórios" 
                                onClick={() => navigate('/relatorios')} 
                                active={window.location.pathname === '/relatorios'}
                                color="purple"
                            />
                            {profile?.cargo === 'DAD' && (
                                <NavItem 
                                    icon={<Settings size={20} />} 
                                    label="Configurações" 
                                    onClick={() => navigate('/admin')} 
                                    active={window.location.pathname === '/admin'}
                                    color="slate"
                                />
                            )}
                        </>
                    )}
                </nav>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                            <User size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">
                                {user?.email?.split('@')[0]}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-accent-50 text-accent-700 uppercase tracking-tighter border border-accent-100">
                                {profile?.cargo || 'Servidor'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center justify-center gap-3 w-full py-4 text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-all group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white -z-10" />
                <div className="p-8 lg:p-12 overflow-y-auto h-screen custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, onClick, active, color = 'blue' }: any) {
    const colors: any = {
        blue: active ? 'bg-accent-600 text-white shadow-lg shadow-accent-200' : 'text-slate-600 hover:bg-accent-50 hover:text-accent-600',
        amber: active ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-slate-600 hover:bg-amber-50 hover:text-amber-600',
        green: active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600',
        purple: active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600',
        slate: active ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    };

    return (
        <a
            onClick={onClick}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold cursor-pointer transition-all active:scale-95 ${colors[color]}`}
        >
            <span className={active ? 'scale-110 transition-transform' : ''}>{icon}</span>
            <span className="tracking-tight">{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
        </a>
    );
}
