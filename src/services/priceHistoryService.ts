import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceVariation } from '../types';

const HISTORY_KEY = '@marketbudget:price_history';

// ─── Tipos internos ───────────────────────────────────────────────────────────

export interface StoredRecord {
  date: string; // ISO string
  unitPrice: number;
  sessionId: string;
}

interface StoredHistory {
  [normalizedName: string]: StoredRecord[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normaliza o nome do produto: minúsculas e sem acentos */
export const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

async function loadHistory(): Promise<StoredHistory> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveHistory(history: StoredHistory): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Retorna a variação percentual do produto em relação à última compra.
 * Retorna null se não houver histórico ou variação insignificante.
 */
export async function getPriceVariation(
  productName: string,
  currentPrice: number
): Promise<PriceVariation | null> {
  const key = normalizeName(productName);
  const history = await loadHistory();
  const records = history[key];

  if (!records || records.length === 0) return null;

  // Pega o registro mais recente
  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastPrice = sorted[0].unitPrice;

  const diff = currentPrice - lastPrice;
  const variation = (diff / lastPrice) * 100;

  // Ignora variações menores que 0.5%
  if (Math.abs(variation) < 0.5) return null;

  return {
    percentage: Math.abs(variation).toFixed(1),
    direction: variation > 0 ? 'up' : 'down',
    previousPrice: lastPrice,
  };
}

/**
 * Salva um novo registro de preço para o produto.
 * Mantém no máximo os últimos 24 registros por produto.
 */
export async function savePriceRecord(
  productName: string,
  record: { unitPrice: number; sessionId: string }
): Promise<void> {
  const key = normalizeName(productName);
  const history = await loadHistory();

  const existing = history[key] ?? [];
  const newRecord: StoredRecord = {
    date: new Date().toISOString(),
    unitPrice: record.unitPrice,
    sessionId: record.sessionId,
  };

  // Mantém os últimos 24 registros
  history[key] = [...existing, newRecord].slice(-24);
  await saveHistory(history);
}

/** Retorna todo o histórico de um produto (para gráficos futuros) */
export async function getProductHistory(
  productName: string
): Promise<StoredRecord[]> {
  const key = normalizeName(productName);
  const history = await loadHistory();
  return (history[key] ?? []).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/** Retorna a lista de nomes normalizados de todos os produtos com histórico */
export async function getAllTrackedProducts(): Promise<string[]> {
  const history = await loadHistory();
  return Object.keys(history).sort();
}

/** Apaga todo o histórico de preços (útil para testes) */
export async function clearAllHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

/** Apaga os registros de preço vinculados a uma sessão específica */
export async function removeRecordsForSession(sessionId: string): Promise<void> {
  const history = await loadHistory();
  let changed = false;

  for (const product of Object.keys(history)) {
    const originalLen = history[product].length;
    history[product] = history[product].filter(r => r.sessionId !== sessionId);
    
    // Se a array ficou vazia, remove a chave para limpar
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
