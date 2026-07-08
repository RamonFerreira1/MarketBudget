import { collection, doc, setDoc, getDocs, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUserId } from './authService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Promotion {
  id: string;
  productName: string;
  price: number;
  supermarketName: string;
  expiresAt: string; // ISO string
  createdAt: string; // ISO string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getCollectionRef() {
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Usuário não autenticado');
  return collection(db, 'users', uid, 'promotions');
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/** Salva uma nova promoção */
export async function savePromotion(
  data: Omit<Promotion, 'id' | 'createdAt'>
): Promise<string> {
  const colRef = await getCollectionRef();
  const id = `promo_${Date.now()}`;
  const promo: Promotion = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(colRef, id), promo);
  return id;
}

/** Retorna promoções ainda válidas (expiresAt > agora) */
export async function getActivePromotions(): Promise<Promotion[]> {
  try {
    const colRef = await getCollectionRef();
    const snap = await getDocs(colRef);
    const now = new Date().toISOString();
    return snap.docs
      .map((d) => d.data() as Promotion)
      .filter((p) => p.expiresAt > now)
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  } catch (err) {
    console.error('Erro ao carregar promoções:', err);
    return [];
  }
}

/** Remove uma promoção */
export async function deletePromotion(id: string): Promise<void> {
  const colRef = await getCollectionRef();
  await deleteDoc(doc(colRef, id));
}

/** Retorna quantos dias restam para a promoção expirar */
export function daysUntilExpiry(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
