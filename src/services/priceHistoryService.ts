import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProductPriceHistory, PriceRecord, PriceVariation } from '../types';

const COLLECTION = 'price_history';

// Normaliza o nome do produto para uso como chave de busca
export const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Busca o preço mais recente do produto para comparação
export async function getLastPrice(
  productName: string,
  userId: string
): Promise<PriceRecord | null> {
  const normalized = normalizeName(productName);

  const q = query(
    collection(db, COLLECTION),
    where('productName', '==', normalized),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const data = snap.docs[0].data();
  // Pega o registro mais recente dentro do array
  if (!data.records || data.records.length === 0) return null;

  const sorted = [...data.records].sort(
    (a, b) => b.date.toMillis() - a.date.toMillis()
  );
  return {
    date: sorted[0].date.toDate(),
    unitPrice: sorted[0].unitPrice,
    sessionId: sorted[0].sessionId,
  };
}

// Calcula a variação percentual em relação ao preço anterior
export async function getPriceVariation(
  productName: string,
  currentPrice: number,
  userId: string
): Promise<PriceVariation | null> {
  const lastRecord = await getLastPrice(productName, userId);
  if (!lastRecord) return null;

  const diff = currentPrice - lastRecord.unitPrice;
  const variation = (diff / lastRecord.unitPrice) * 100;

  if (Math.abs(variation) < 0.5) return null; // Variação insignificante

  return {
    percentage: Math.abs(variation).toFixed(1),
    direction: variation > 0 ? 'up' : 'down',
    previousPrice: lastRecord.unitPrice,
  };
}

// Salva ou atualiza o histórico de preços de um produto
export async function savePriceRecord(
  productName: string,
  userId: string,
  record: Omit<PriceRecord, 'date'> & { sessionId: string }
): Promise<void> {
  const normalized = normalizeName(productName);

  // Verifica se já existe documento para este produto+usuário
  const q = query(
    collection(db, COLLECTION),
    where('productName', '==', normalized),
    where('userId', '==', userId)
  );

  const snap = await getDocs(q);

  const newRecord = {
    date: Timestamp.now(),
    unitPrice: record.unitPrice,
    sessionId: record.sessionId,
  };

  if (snap.empty) {
    // Cria novo documento
    await addDoc(collection(db, COLLECTION), {
      productName: normalized,
      userId,
      records: [newRecord],
    });
  } else {
    // Adiciona ao array existente (mantém histórico dos últimos 12 meses)
    const docRef = snap.docs[0].ref;
    const existingRecords = snap.docs[0].data().records ?? [];
    const updatedRecords = [...existingRecords, newRecord].slice(-24); // mantém 24 registros
    await updateDoc(docRef, { records: updatedRecords });
  }
}
