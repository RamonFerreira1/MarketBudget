// ─── Price Variation ────────────────────────────────────────────────────────
export interface PriceVariation {
  percentage: string;        // "7.2"
  direction: 'up' | 'down'; // ⬆️ ou ⬇️
  previousPrice: number;     // preço do mês anterior
}

// ─── Supermarket ──────────────────────────────────────────────────────────────
export interface Supermarket {
  id: string;
  name: string;
  address?: string;
  createdAt: string; // ISO string
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
  qtyChangeReason?: string;
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
  supermarketId?: string;
  supermarketName?: string;
}

// ─── Price Record ────────────────────────────────────────────────────────────
export interface PriceRecord {
  date: Date;
  unitPrice: number;
  sessionId: string;
  supermarketId?: string;
  supermarketName?: string;
}

export interface ProductPriceHistory {
  productName: string; // normalized lowercase
  userId: string;
  records: PriceRecord[];
}

// ─── Market Comparison ───────────────────────────────────────────────────────
export interface MarketPriceStat {
  supermarketId: string;
  supermarketName: string;
  lastPrice: number;
  avgPrice: number;
  priceCount: number;
  trend: 'up' | 'down' | 'stable'; // comparado à penúltima compra nesse mercado
  trendPercent: string;
}

export interface ProductMarketComparison {
  productName: string;
  stats: MarketPriceStat[]; // ordenado do mais barato ao mais caro
  cheapestMarket: string;
  mostExpensiveMarket: string;
  priceDiff: number;        // diferença em R$ entre mais barato e mais caro
  priceDiffPercent: string; // diferença em %
}

// ─── Budget State ─────────────────────────────────────────────────────────────
export type BudgetStatus = 'safe' | 'warning' | 'exceeded';

