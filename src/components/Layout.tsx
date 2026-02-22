import { useAuth } from '../contexts/AuthContext';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Home, FileText, CheckCircle, UploadCloud } from 'lucide-react';

export default function Layout() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <h1 className="text-2xl font-bold text-blue-600">SGPD</h1>
                    <p className="text-xs text-gray-500">Gestão de Viagens</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <a
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100"
                    >
                        <Home size={20} />
                        <span>Dashboard</span>
                    </a>
                    <a
                        onClick={() => navigate('/solicitar')}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-md cursor-pointer hover:bg-blue-50"
                    >
                        <FileText size={20} />
                        <span>Nova Viagem</span>
                    </a>

                    {profile?.cargo !== 'Servidor' && (
                        <a
                            onClick={() => navigate('/aprovacoes')}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-md cursor-pointer hover:bg-amber-50"
                        >
                            <CheckCircle size={20} />
                            <span>Aprovações</span>
                        </a>
                    )}

                    <a
                        onClick={() => navigate('/prestacao-contas')}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-md cursor-pointer hover:bg-green-50"
                    >
                        <UploadCloud size={20} />
                        <span>Prestação de Contas</span>
                    </a>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.email}
                        </p>
                        <p className="text-xs text-gray-500">
                            {profile?.cargo || 'Servidor'}
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 w-full"
                    >
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="p-8 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
