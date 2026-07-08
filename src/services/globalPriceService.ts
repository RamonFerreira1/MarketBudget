import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { normalizeName } from './priceHistoryService';

export interface GlobalPriceRecord {
  productName: string;
  unitPrice: number;
  supermarketId?: string;
  supermarketName?: string;
  date: string;
}

/**
 * Salva um preço anonimamente na base global comunitária.
 */
export async function saveGlobalPriceRecord(
  productName: string,
  record: { unitPrice: number; supermarketId?: string; supermarketName?: string }
): Promise<void> {
  const key = normalizeName(productName);
  const globalRef = doc(db, 'global_prices', key);
  
  const d = await getDoc(globalRef);
  let currentRecords: GlobalPriceRecord[] = [];
  
  if (d.exists()) {
    currentRecords = d.data().records ?? [];
  }

  const newRecord: GlobalPriceRecord = {
    productName,
    unitPrice: record.unitPrice,
    supermarketId: record.supermarketId ?? 'unknown',
    supermarketName: record.supermarketName ?? 'Mercado Desconhecido',
    date: new Date().toISOString(),
  };

  // Mantemos apenas os 50 registros mais recentes para não inflar o Firestore
  const updatedRecords = [newRecord, ...currentRecords].slice(0, 50);

  await setDoc(globalRef, {
    records: updatedRecords,
    lastUpdate: new Date().toISOString(),
    productName,
  }, { merge: true });
}

/**
 * Retorna os últimos preços registrados globalmente para um produto.
 */
export async function getGlobalPrices(productName: string): Promise<GlobalPriceRecord[]> {
  const key = normalizeName(productName);
  const globalRef = doc(db, 'global_prices', key);
  
  try {
    const d = await getDoc(globalRef);
    if (!d.exists()) return [];
    
    return d.data().records ?? [];
  } catch (error) {
    console.warn('Erro ao buscar preços globais:', error);
    return [];
  }
}
