import { create } from 'zustand';
import { BudgetStatus } from '../types';

interface BudgetStore {
  budget: number;
  totalSpent: number;
  alreadyAlerted: boolean;

  // Computed
  remaining: () => number;
  percentage: () => number;
  status: () => BudgetStatus;

  // Actions
  setBudget: (value: number) => void;
  setTotalSpent: (value: number) => void;
  setAlreadyAlerted: (value: boolean) => void;
  reset: () => void;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budget: 0,
  totalSpent: 0,
  alreadyAlerted: false,

  remaining: () => get().budget - get().totalSpent,
  percentage: () => {
    const { budget, totalSpent } = get();
    if (budget <= 0) return 0;
    return Math.min((totalSpent / budget) * 100, 100);
  },
  status: (): BudgetStatus => {
    const pct = get().percentage();
    if (pct >= 100) return 'exceeded';
    if (pct >= 75) return 'warning';
    return 'safe';
  },

  setBudget: (value) => set({ budget: value, alreadyAlerted: false }),
  setTotalSpent: (value) => set({ totalSpent: value }),
  setAlreadyAlerted: (value) => set({ alreadyAlerted: value }),
  reset: () => set({ budget: 0, totalSpent: 0, alreadyAlerted: false }),
}));
