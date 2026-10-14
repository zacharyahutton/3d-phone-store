import { create } from 'zustand';

export const useStore = create((set) => ({
  // --- 1. THEME & COLOR STATES ---
  // Null means keep the original material colors from the GLB file.
  frameColor: null, 
  setFrameColor: (color) => set({ frameColor: color }),

  // --- 2. DYNAMIC MODEL DIMENSION SLIDER STATES ---
  // Baseline scaling coefficient tracking (1.0 = 100% size)
  modelScale: 1.0,
  setModelScale: (scale) => set({ modelScale: Math.min(1, Math.max(0.75, scale)) }),

  // --- 3. HARDWARE CAPACITIES CONFIG STATES ---
  activeStorage: '256GB',
  setActiveStorage: (storage) => set({ activeStorage: storage }),
}));
