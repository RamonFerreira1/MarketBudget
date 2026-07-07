import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUserId } from './authService';
import { Supermarket } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getColRef() {
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Usuário não autenticado');
  return collection(db, 'users', uid, 'supermarkets');
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/** Retorna todos os mercados cadastrados pelo usuário */
export async function getUserSupermarkets(): Promise<Supermarket[]> {
  try {
    const uid = getCurrentUserId();
    if (!uid) return [];
    const q = query(
      collection(db, 'users', uid, 'supermarkets'),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Supermarket);
  } catch (err) {
    console.warn('Erro ao buscar mercados:', err);
    return [];
  }
}

/** Cria um novo mercado e retorna o objeto completo */
export async function saveSupermarket(name: string): Promise<Supermarket> {
  const colRef = getColRef();
  const id = `mkt_${Date.now()}`;
  const supermarket: Supermarket = {
    id,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(colRef, id), supermarket);
  return supermarket;
}

/** Remove um mercado pelo id */
export async function deleteSupermarket(id: string): Promise<void> {
  const colRef = getColRef();
  await deleteDoc(doc(colRef, id));
}
