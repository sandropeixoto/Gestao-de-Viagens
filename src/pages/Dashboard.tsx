import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const { profile } = useAuth();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Bem-vindo(a) ao SGPD</h2>
                <p className="text-gray-600">
                    Você está autenticado como <strong>{profile?.cargo || 'Servidor'}</strong> do departamento <strong>{profile?.departamento || 'Não definido'}</strong>.
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="text-blue-800 font-semibold mb-2">Minhas Viagens</h3>
                        <p className="text-3xl font-bold text-blue-600">0</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-6">
                        <h3 className="text-amber-800 font-semibold mb-2">Em Análise</h3>
                        <p className="text-3xl font-bold text-amber-600">0</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6">
                        <h3 className="text-green-800 font-semibold mb-2">Aprovadas</h3>
                        <p className="text-3xl font-bold text-green-600">0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
