type ToastFn = (msg: string) => void;

let toastFn: ToastFn | null = null;

export const setToastFn = (fn: ToastFn | null) => {
  toastFn = fn;
};

export const toast = (msg: string) => {
  toastFn?.(msg);
};
