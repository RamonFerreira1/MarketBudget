// ─── Price Variation ────────────────────────────────────────────────────────
export interface PriceVariation {
  percentage: string;        // "7.2"
  direction: 'up' | 'down'; // ⬆️ ou ⬇️
  previousPrice: number;     // preço do mês anterior
}

// ─── Shopping Item ───────────────────────────────────────────────────────────
export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  plannedQty: number;
  actualQty: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  addedToCart: boolean;
  priceVariation: PriceVariation | null;
}

// ─── Shopping Session ────────────────────────────────────────────────────────
export type SessionStatus = 'pre-list' | 'in-market' | 'completed';

export interface ShoppingSession {
  id: string;
  createdAt: Date;
  budget: number;
  totalSpent: number;
  status: SessionStatus;
  userId: string;
  items: ShoppingItem[];
}

// ─── Price Record ────────────────────────────────────────────────────────────
export interface PriceRecord {
  date: Date;
  unitPrice: number;
  sessionId: string;
}

export interface ProductPriceHistory {
  productName: string; // normalized lowercase
  userId: string;
  records: PriceRecord[];
}

// ─── Budget State ─────────────────────────────────────────────────────────────
export type BudgetStatus = 'safe' | 'warning' | 'exceeded';
