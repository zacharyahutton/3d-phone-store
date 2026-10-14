// components/store.js

import { create } from 'zustand';



export const useStore = create((set) => ({

  scrollProgress: 0,

  setScrollProgress: (progress) => set({ scrollProgress: progress }),

}));