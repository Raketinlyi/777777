import { createContext, useContext, useState, ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogPortal,
  AlertDialogOverlay,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmCtx {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmCtx | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<(v: boolean) => void>(() => {});

  const confirm = (o: ConfirmOptions) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>(res => {
      setResolver(() => res);
    });
  };

  const handleClose = (result: boolean) => {
    setOpen(false);
    if (result) {
      toast({
        title: opts?.title || 'Confirmed',
        description: '👍 Action confirmed',
        duration: 4000,
      });
    }
    resolver(result);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {opts && (
        <AlertDialog open={open} onOpenChange={v => !v && handleClose(false)}>
          <AlertDialogPortal>
            <AlertDialogOverlay className='bg-black/40 backdrop-blur-sm' />
            <AlertDialogContent className='bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-pink-500/40 shadow-xl max-w-sm'>
              <AlertDialogHeader>
                <AlertDialogTitle className='text-pink-300 text-lg font-bold'>
                  {opts.title || 'Confirm action'}
                </AlertDialogTitle>
                <AlertDialogDescription className='text-slate-300 text-sm'>
                  {opts.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => handleClose(false)}
                  className='border-pink-400/50 text-pink-300 hover:bg-pink-500/10'
                >
                  {opts.cancelText || 'Cancel'}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleClose(true)}
                  className='bg-pink-600 hover:bg-pink-500 text-white'
                >
                  {opts.confirmText || 'Confirm'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be inside ConfirmProvider');
  return ctx.confirm;
}
