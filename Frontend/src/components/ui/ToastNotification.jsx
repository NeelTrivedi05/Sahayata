import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  const bgColor = isSuccess
    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
    : isError
    ? 'bg-rose-50 border-rose-500 text-rose-900'
    : 'bg-blue-50 border-blue-500 text-blue-900';

  const iconColor = isSuccess ? '#059669' : isError ? '#E11D48' : '#2563EB';

  return (
    <div
      className="fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl border-2 shadow-2xl max-w-md transition-all duration-300 animate-fade-in"
      style={{
        backgroundColor: isSuccess ? '#F0FDF4' : isError ? '#FFF1F2' : '#EFF6FF',
        borderColor: isSuccess ? '#10B981' : isError ? '#F43F5E' : '#3B82F6',
        color: '#0F172A',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="mt-0.5 shrink-0">
        {isSuccess && <CheckCircle2 size={22} color={iconColor} />}
        {isError && <AlertCircle size={22} color={iconColor} />}
        {isInfo && <Info size={22} color={iconColor} />}
      </div>

      <div className="flex-1 pr-2">
        {toast.title && (
          <h4
            className="text-sm font-bold tracking-tight mb-0.5"
            style={{ color: isSuccess ? '#065F46' : isError ? '#9F1239' : '#1E40AF' }}
          >
            {toast.title}
          </h4>
        )}
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-700">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
