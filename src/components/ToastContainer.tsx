import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, X, UserCheck, Clock, CheckCircle2 } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-lg shadow-slate-900/5 transition-all duration-200 animate-in slide-in-from-bottom-3"
        >
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
            {toast.type === 'assignment' ? (
              <UserCheck className="w-4 h-4" />
            ) : toast.type === 'due_reminder' ? (
              <Clock className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-slate-900 tracking-tight truncate">
                {toast.title}
              </h4>
              <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                Just now
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => dismissToast(toast.id)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
