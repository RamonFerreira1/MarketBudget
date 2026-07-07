import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUserId } from './authService';
import { PriceVariation, MarketPriceStat, ProductMarketComparison } from '../types';

// ─── Tipos internos ───────────────────────────────────────────────────────────

export interface StoredRecord {
  date: string; // ISO string
  unitPrice: number;
  sessionId: string;
  supermarketId?: string;
  supermarketName?: string;
}

interface StoredHistory {
  [normalizedName: string]: StoredRecord[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

function getDocRef() {
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Usuário não logado');
  return doc(db, 'users', uid, 'data', 'priceHistory');
}

async function loadHistory(): Promise<StoredHistory> {
  try {
    const d = await getDoc(getDocRef());
    return d.exists() ? (d.data() as StoredHistory) : {};
  } catch (err) {
    console.warn('Erro ao carregar histórico de preços:', err);
    return {};
  }
}

async function saveHistory(history: StoredHistory): Promise<void> {
  try {
    await setDoc(getDocRef(), history);
  } catch (err) {
    console.warn('Erro ao salvar histórico de preços:', err);
  }
}

// ─── API Pública ──────────────────────────────────────────────────────────────

export async function getPriceVariation(
  productName: string,
  currentPrice: number
): Promise<PriceVariation | null> {
  const key = normalizeName(productName);
  const history = await loadHistory();
  const records = history[key];

  if (!records || records.length === 0) return null;

  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastPrice = sorted[0].unitPrice;

  const diff = currentPrice - lastPrice;
  const variation = (diff / lastPrice) * 100;

  if (Math.abs(variation) < 0.5) return null;

  return {
    percentage: Math.abs(variation).toFixed(1),
    direction: variation > 0 ? 'up' : 'down',
    previousPrice: lastPrice,
  };
}

export async function savePriceRecord(
  productName: string,
  record: { unitPrice: number; sessionId: string; supermarketId?: string; supermarketName?: string }
): Promise<void> {
  const key = normalizeName(productName);
  const history = await loadHistory();

  const existing = history[key] ?? [];
  const newRecord: StoredRecord = {
    date: new Date().toISOString(),
    unitPrice: record.unitPrice,
    sessionId: record.sessionId,
    supermarketId: record.supermarketId ?? null as any,
    supermarketName: record.supermarketName ?? null as any,
  };

  history[key] = [...existing, newRecord].slice(-24);
  await saveHistory(history);
}

export async function getProductHistory(
  productName: string
): Promise<StoredRecord[]> {
  const key = normalizeName(productName);
  const history = await loadHistory();
  return (history[key] ?? []).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function getAllTrackedProducts(): Promise<string[]> {
  const history = await loadHistory();
  return Object.keys(history).sort();
}

export async function clearAllHistory(): Promise<void> {
  try {
    await deleteDoc(getDocRef());
  } catch (e) {
    //
  }
}

export async function removeRecordsForSession(sessionId: string): Promise<void> {
  const history = await loadHistory();
  let changed = false;

  for (const product of Object.keys(history)) {
    const originalLen = history[product].length;
    history[product] = history[product].filter(r => r.sessionId !== sessionId);
    
    if (history[product].length === 0) {
      delete history[product];
      changed = true;
    } else if (history[product].length !== originalLen) {
      changed = true;
    }
  }

  if (changed) {
    await saveHistory(history);
  }
}

/**
 * Retorna estatísticas de preço por mercado para um produto.
 * Só inclui registros que possuam supermarketId/Name.
 */
export async function getMarketComparison(
  productName: string
): Promise<ProductMarketComparison | null> {
  const key = normalizeName(productName);
  const history = await loadHistory();
  const records = (history[key] ?? []).filter(
    (r) => r.supermarketId && r.supermarketName
  );

  if (records.length === 0) return null;

  // Agrupa por mercado
  const byMarket: Record<string, StoredRecord[]> = {};
  for (const r of records) {
    const mid = r.supermarketId!;
    if (!byMarket[mid]) byMarket[mid] = [];
    byMarket[mid].push(r);
  }

  if (Object.keys(byMarket).length < 2) return null; // precisa de ao menos 2 mercados

  const stats: MarketPriceStat[] = Object.entries(byMarket).map(([, recs]) => {
    const sorted = [...recs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastPrice = sorted[0].unitPrice;
    const avg = recs.reduce((s, r) => s + r.unitPrice, 0) / recs.length;

    let trend: MarketPriceStat['trend'] = 'stable';
    let trendPercent = '0';
    if (sorted.length >= 2) {
      const prev = sorted[1].unitPrice;
      const diff = ((lastPrice - prev) / prev) * 100;
      if (Math.abs(diff) >= 0.5) {
        trend = diff > 0 ? 'up' : 'down';
        trendPercent = Math.abs(diff).toFixed(1);
      }
    }

    return {
      supermarketId: sorted[0].supermarketId!,
      supermarketName: sorted[0].supermarketName!,
      lastPrice,
      avgPrice: parseFloat(avg.toFixed(2)),
      priceCount: recs.length,
      trend,
      trendPercent,
    };
  });

  // Ordena do mais barato ao mais caro (pelo último preço)
  stats.sort((a, b) => a.lastPrice - b.lastPrice);

  const cheapest = stats[0];
  const mostExpensive = stats[stats.length - 1];
  const priceDiff = parseFloat((mostExpensive.lastPrice - cheapest.lastPrice).toFixed(2));
  const priceDiffPercent = ((priceDiff / cheapest.lastPrice) * 100).toFixed(1);

  return {
    productName,
    stats,
    cheapestMarket: cheapest.supermarketName,
    mostExpensiveMarket: mostExpensive.supermarketName,
    priceDiff,
    priceDiffPercent,
  };
}

/** Retorna comparações de todos os produtos que têm dados de ao menos 2 mercados */
export async function getAllMarketsComparison(): Promise<ProductMarketComparison[]> {
  const history = await loadHistory();
  const products = Object.keys(history);
  const results: ProductMarketComparison[] = [];

  for (const key of products) {
    const comparison = await getMarketComparison(key);
    if (comparison) results.push(comparison);
  }

  return results.sort((a, b) => a.productName.localeCompare(b.productName));
}
