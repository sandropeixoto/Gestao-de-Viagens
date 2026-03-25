import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
};

const bgColors = {
    success: 'bg-emerald-50/90 border-emerald-100',
    error: 'bg-red-50/90 border-red-100',
    warning: 'bg-amber-50/90 border-amber-100',
    info: 'bg-blue-50/90 border-blue-100',
};

export default function NotificationToast() {
    const { notifications, removeNotification } = useNotification();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className={`${bgColors[n.type]} border backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-start gap-3 min-w-[320px] max-w-md animate-in slide-in-from-right-full duration-300 pointer-events-auto`}
                >
                    <div className="flex-shrink-0 mt-0.5">{icons[n.type]}</div>
                    <div className="flex-1 text-sm font-semibold text-slate-800">{n.message}</div>
                    <button
                        onClick={() => removeNotification(n.id)}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
