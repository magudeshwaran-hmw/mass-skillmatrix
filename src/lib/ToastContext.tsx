import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const toast = {
  success: (m: string, d?: number) => window.dispatchEvent(new CustomEvent('SHOW_TOAST', { detail: { type: 'success', message: m, duration: d } })),
  error: (m: string, d?: number) => window.dispatchEvent(new CustomEvent('SHOW_TOAST', { detail: { type: 'error', message: m, duration: d } })),
  warning: (m: string, d?: number) => window.dispatchEvent(new CustomEvent('SHOW_TOAST', { detail: { type: 'warning', message: m, duration: d } })),
  info: (m: string, d?: number) => window.dispatchEvent(new CustomEvent('SHOW_TOAST', { detail: { type: 'info', message: m, duration: d } })),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }].slice(-3));

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  React.useEffect(() => {
    const handler = (e: any) => {
      addToast(e.detail.type, e.detail.message, e.detail.duration);
    };
    window.addEventListener('SHOW_TOAST', handler);
    return () => window.removeEventListener('SHOW_TOAST', handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              background: getToastBackground(toast.type),
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              pointerEvents: 'auto',
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {getToastIcon(toast.type)}
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function getToastBackground(type: ToastType) {
  switch (type) {
    case 'success': return '#10B981';
    case 'error': return '#EF4444';
    case 'warning': return '#F59E0B';
    case 'info': return '#3B82F6';
    default: return '#333';
  }
}

function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '🔴';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '';
  }
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
