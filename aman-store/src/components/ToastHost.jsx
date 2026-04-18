import { useToastStore } from '../store/toastStore.js';

const ToastHost = () => {
  const message = useToastStore((s) => s.message);
  if (!message) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-24 left-1/2 z-[60] max-w-[min(92vw,24rem)] -translate-x-1/2 px-3 md:bottom-8"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto rounded-2xl border border-slate-700/30 bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg dark:border-slate-200/20 dark:bg-slate-100 dark:text-slate-900">
        {message}
      </div>
    </div>
  );
};

export default ToastHost;
