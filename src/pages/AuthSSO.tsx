import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthSSO() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        handleSSO();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSSO = async () => {
        const payload = searchParams.get('sso_payload');
        const sig = searchParams.get('sso_sig');

        if (!payload || !sig) {
            setStatus('error');
            setErrorMessage('Parâmetros SSO ausentes. Por favor, acesse através do Portal GestorGov.');
            return;
        }

        try {
            // Call the Edge Function
            const { data, error } = await supabase.functions.invoke('auth-sso', {
                method: 'GET',
                queries: {
                    sso_payload: payload,
                    sso_sig: sig
                }
            });

            if (error) throw error;

            if (data.login_url) {
                setStatus('success');
                // Redirect to the login link provided by Supabase Admin (Magic Link)
                // This link will verify the token and establish the session
                window.location.href = data.login_url;
            } else {
                throw new Error('Falha na autenticação: Link de login não recebido.');
            }

        } catch (err: any) {
            console.error('SSO Login Error:', err);
            setStatus('error');
            setErrorMessage(err.message || 'Erro inesperado durante a autenticação SSO.');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
                <div className="glass-card p-12 rounded-3xl border border-white/20 shadow-2xl max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex justify-center">
                        <div className="relative">
                            <ShieldCheck className="h-20 w-20 text-accent-600 animate-pulse drop-shadow-lg" />
                            <div className="absolute inset-0 h-20 w-20 border-4 border-accent-200 rounded-full animate-ping opacity-25"></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Autenticando...</h1>
                        <p className="text-slate-500 font-medium">Validando sua assinatura com o <br /><span className="text-accent-700 font-bold">Portal GestorGov</span>.</p>
                    </div>
                    <div className="flex justify-center pt-4">
                        <div className="flex items-center gap-3 px-6 py-3 bg-slate-900/5 rounded-2xl border border-slate-200/50">
                            <Loader2 className="h-5 w-5 text-accent-600 animate-spin" />
                            <span className="text-sm font-bold text-slate-700">Verificando Credenciais</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
                <div className="glass-card p-12 rounded-3xl border border-red-100 shadow-2xl max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-center">
                        <div className="bg-red-50 p-4 rounded-2xl">
                            <AlertCircle className="h-16 w-16 text-red-500" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Falha na Autenticação</h1>
                        <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                            <p className="text-red-700 text-sm font-bold leading-relaxed">{errorMessage}</p>
                        </div>
                    </div>
                    <div className="pt-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 px-6 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg hover:shadow-slate-200 group flex items-center justify-center gap-2"
                        >
                            Voltar para o Login
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                        Se o problema persistir, entre em contato com o suporte do <span className="font-bold">GestorGov</span>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="text-center space-y-6">
                <div className="relative mx-auto h-16 w-16">
                    <Loader2 className="h-16 w-16 text-accent-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 bg-white rounded-full border border-slate-100 shadow-sm" />
                    </div>
                </div>
                <p className="text-slate-800 font-extrabold text-xl tracking-tight">Redirecionando para o seu dashboard...</p>
            </div>
        </div>
    );
}
