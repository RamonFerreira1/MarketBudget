import { getUserSessions } from './shoppingListService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PriceAlert {
  productName: string;
  currentAvg: number;   // média histórica
  lastPrice: number;    // último preço registrado
  savingPercent: string; // ex: "15.3"
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Verifica se algum produto favorito teve queda de preço relevante
 * (último preço > 10% abaixo da média histórica).
 * Não depende de push notifications — chamado ao focar na HomeScreen.
 */
export async function checkPriceAlerts(favorites: string[]): Promise<PriceAlert[]> {
  if (!favorites || favorites.length === 0) return [];

  try {
    const history = await loadPriceHistoryData();
    const alerts: PriceAlert[] = [];

    for (const favName of favorites) {
      const records = history[favName];
      if (!records || records.length < 2) continue;

      const sorted = [...records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const lastPrice = sorted[0].unitPrice;
      const avg = records.reduce((s, r) => s + r.unitPrice, 0) / records.length;

      // Só alerta se o último preço está mais de 10% abaixo da média
      const saving = ((avg - lastPrice) / avg) * 100;
      if (saving >= 10) {
        alerts.push({
          productName: favName,
          currentAvg: parseFloat(avg.toFixed(2)),
          lastPrice,
          savingPercent: saving.toFixed(1),
        });
      }
    }

    return alerts.sort((a, b) => parseFloat(b.savingPercent) - parseFloat(a.savingPercent));
  } catch (err) {
    console.warn('Erro ao verificar alertas:', err);
    return [];
  }
}

/**
 * Verifica se o usuário está "na hora" de fazer compras.
 * Retorna true se a última sessão foi há >= 7 dias.
 */
export async function checkShoppingReminder(): Promise<boolean> {
  try {
    const sessions = await getUserSessions();
    const completed = sessions.filter((s) => s.status === 'completed');
    if (completed.length === 0) return false;

    const lastDate = completed[0].createdAt instanceof Date
      ? completed[0].createdAt
      : new Date(completed[0].createdAt as any);

    const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 7;
  } catch (err) {
    console.warn('Erro ao verificar lembrete:', err);
    return false;
  }
}

// ─── Interno ─────────────────────────────────────────────────────────────────

async function loadPriceHistoryData(): Promise<Record<string, { date: string; unitPrice: number }[]>> {
  // Re-usa a função interna do priceHistoryService via importação direta do Firestore
  const { doc, getDoc } = await import('firebase/firestore');
  const { db } = await import('../config/firebase');
  const { getCurrentUserId } = await import('./authService');

  const uid = getCurrentUserId();
  if (!uid) return {};

  try {
    const d = await getDoc(doc(db, 'users', uid, 'data', 'priceHistory'));
    return d.exists() ? (d.data() as any) : {};
  } catch {
    return {};
  }
}
