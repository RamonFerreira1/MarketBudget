import { create } from 'zustand';
import { ShoppingItem, ShoppingSession, SessionStatus } from '../types';
import { useBudgetStore } from './useBudgetStore';

interface ShoppingStore {
  session: ShoppingSession | null;
  items: ShoppingItem[];

  // Session actions
  createSession: (budget: number, userId: string, supermarketId?: string, supermarketName?: string) => void;
  setSessionStatus: (status: SessionStatus) => void;
  setSessionId: (id: string) => void;
  clearSession: () => void;

  // Item actions
  addItem: (item: Omit<ShoppingItem, 'id' | 'actualQty' | 'unitPrice' | 'totalPrice' | 'addedToCart' | 'priceVariation'>) => void;
  editItem: (id: string, updates: Partial<Omit<ShoppingItem, 'id' | 'actualQty' | 'unitPrice' | 'totalPrice' | 'addedToCart' | 'priceVariation'>>) => void;
  removeItem: (id: string) => void;
  updateItemInMarket: (id: string, actualQty: number, unitPrice: number, reason?: string) => void;
  updateItemPriceVariation: (id: string, variation: ShoppingItem['priceVariation']) => void;
  toggleItemCart: (id: string) => void;
  // Reseta os itens para o estado de lista prévia (apaga preços/qtds do mercado)
  resetItemsToPreList: () => void;
}

const recalcTotalSpent = (items: ShoppingItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);
  useBudgetStore.getState().setTotalSpent(total);
};

export const useShoppingStore = create<ShoppingStore>((set, get) => ({
  session: null,
  items: [],

  createSession: (budget, userId, supermarketId, supermarketName) => {
    const session: ShoppingSession = {
      id: '',
      createdAt: new Date(),
      budget,
      totalSpent: 0,
      status: 'pre-list',
      userId,
      items: [],
      supermarketId,
      supermarketName,
    };
    set({ session, items: [] });
    useBudgetStore.getState().setBudget(budget);
  },

  setSessionStatus: (status) =>
    set((state) => ({
      session: state.session ? { ...state.session, status } : null,
    })),

  setSessionId: (id) =>
    set((state) => ({
      session: state.session ? { ...state.session, id } : null,
    })),

  clearSession: () => {
    set({ session: null, items: [] });
    useBudgetStore.getState().reset();
  },

  addItem: (itemData) => {
    const newItem: ShoppingItem = {
      ...itemData,
      id: Date.now().toString(),
      actualQty: null,
      unitPrice: null,
      totalPrice: null,
      addedToCart: false,
      priceVariation: null,
    };
    set((state) => ({ items: [...state.items, newItem] }));
  },

  removeItem: (id) => {
    set((state) => {
      const items = state.items.filter((i) => i.id !== id);
      recalcTotalSpent(items);
      return { items };
    });
  },

  editItem: (id, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  updateItemInMarket: (id, actualQty, unitPrice, reason) => {
    set((state) => {
      const items = state.items.map((item) => {
        if (item.id !== id) return item;
        const totalPrice = parseFloat((actualQty * unitPrice).toFixed(2));
        return { ...item, actualQty, unitPrice, totalPrice, addedToCart: true, qtyChangeReason: reason };
      });
      recalcTotalSpent(items);
      return { items };
    });
  },

  updateItemPriceVariation: (id, variation) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, priceVariation: variation } : item
      ),
    }));
  },

  toggleItemCart: (id) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, addedToCart: !item.addedToCart } : item
      ),
    }));
  },

  // Volta todos os itens para o estado "não adicionado" preservando os nomes
  resetItemsToPreList: () => {
    set((state) => {
      const items = state.items.map((item) => ({
        ...item,
        actualQty: null,
        unitPrice: null,
        totalPrice: null,
        addedToCart: false,
        priceVariation: null,
      }));
      recalcTotalSpent(items);
      return { items };
    });
  },
}));
