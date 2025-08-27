'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  description?: string | undefined;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function SimpleToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const toastWithId = { ...newToast, id };

    setToasts(prev => {
      // Removed duplicate check
      // Keep max 3 toasts
      const newToasts = [toastWithId, ...prev.slice(0, 2)];
      return newToasts;
    });

    // Auto dismiss after 5 seconds
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timeoutsRef.current.delete(id);
    }, 5000);

    timeoutsRef.current.set(id, timeoutId);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));

    // Clear timeout if exists
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  // Listen to global toast events
  useEffect(() => {
    const handler = (event: Event) => {
      try {
        const custom = event as CustomEvent;
        const detail = (custom?.detail || {}) as {
          title?: string;
          description?: string;
          variant?: 'default' | 'destructive';
        };
        if (detail && detail.title) {
          toast({
            title: String(detail.title),
            description: detail.description ? String(detail.description) : undefined,
            variant: detail.variant === 'destructive' ? 'destructive' : 'default',
          });
        }
      } catch (_) {
        // ignore
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('crazycube:toast', handler);
      return () => window.removeEventListener('crazycube:toast', handler);
    }
    return undefined;
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <SimpleToastContainer />
    </ToastContext.Provider>
  );
}

function SimpleToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, dismiss } = context;

  if (toasts.length === 0) return null;

  return (
    <div className='fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none'>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full bg-black/90 border rounded-lg p-4 shadow-lg pointer-events-auto
            animate-in slide-in-from-bottom-2 duration-300
            ${
              toast.variant === 'destructive'
                ? 'border-red-500/50 text-red-200'
                : 'border-cyan-500/50 text-cyan-200'
            }
          `}
        >
          <div className='flex items-start justify-between'>
            <div className='flex-1 min-w-0'>
              <div className='font-semibold text-white truncate'>
                {toast.title}
              </div>
              {toast.description && (
                <div className='text-sm opacity-90 mt-1 break-words'>
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className='ml-2 text-white/60 hover:text-white transition-colors flex-shrink-0'
              type='button'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function useSimpleToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback for when context is not available
    return {
      toast: (toast: Omit<Toast, 'id'>) => {
        },
      dismiss: () => {},
      toasts: [],
    };
  }
  return context;
}
