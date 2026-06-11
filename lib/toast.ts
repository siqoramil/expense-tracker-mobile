export type ToastType = 'success' | 'error' | 'info';

type ToastFn = (msg: string, type: ToastType) => void;

let toastFn: ToastFn | null = null;

export const setToastFn = (fn: ToastFn | null) => {
  toastFn = fn;
};

// toast('Saved') -> success (default). toast.error('...') / toast.info('...')
// for the other styles. Backward compatible with existing call sites.
export const toast = Object.assign(
  (msg: string, type: ToastType = 'success') => toastFn?.(msg, type),
  {
    success: (msg: string) => toastFn?.(msg, 'success'),
    error: (msg: string) => toastFn?.(msg, 'error'),
    info: (msg: string) => toastFn?.(msg, 'info'),
  },
);
