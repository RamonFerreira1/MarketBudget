import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUserId } from './authService';
import { normalizeName } from './priceHistoryService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDocRef() {
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Usuário não logado');
  return doc(db, 'users', uid, 'data', 'favorites');
}

async function loadFavorites(): Promise<string[]> {
  try {
    const d = await getDoc(getDocRef());
    if (!d.exists()) return [];
    const data = d.data();
    return Array.isArray(data?.items) ? data.items : [];
  } catch (err) {
    console.warn('Erro ao carregar favoritos:', err);
    return [];
  }
}

async function saveFavorites(items: string[]): Promise<void> {
  try {
    await setDoc(getDocRef(), { items });
  } catch (err) {
    console.warn('Erro ao salvar favoritos:', err);
  }
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/** Retorna lista de nomes normalizados favoritos */
export async function getFavorites(): Promise<string[]> {
  return loadFavorites();
}

/**
 * Adiciona ou remove um produto dos favoritos.
 * Retorna a lista atualizada.
 */
export async function toggleFavorite(productName: string): Promise<string[]> {
  const normalized = normalizeName(productName);
  const current = await loadFavorites();

  const idx = current.indexOf(normalized);
  const updated = idx >= 0
    ? current.filter((n) => n !== normalized)
    : [...current, normalized];

  await saveFavorites(updated);
  return updated;
}

/** Verifica se um produto está nos favoritos */
export async function isFavorite(productName: string): Promise<boolean> {
  const normalized = normalizeName(productName);
  const current = await loadFavorites();
  return current.includes(normalized);
}
