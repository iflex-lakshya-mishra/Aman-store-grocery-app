import { create } from 'zustand';

let hideTimer;

export const useToastStore = create((set) => ({
  message: '',
  show: (message) => {
    const text = String(message || '').trim().slice(0, 140);
    if (!text) return;
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: text });
    hideTimer = setTimeout(() => set({ message: '' }), 2600);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    set({ message: '' });
  },
}));
