import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUserId } from './authService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TemplateItem {
  name: string;
  category: string;
  plannedQty: number;
}

export interface ShoppingTemplate {
  id: string;
  name: string;
  items: TemplateItem[];
  createdAt: string; // ISO string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getCollectionRef() {
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Usuário não autenticado');
  return collection(db, 'users', uid, 'templates');
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/** Salva a lista atual como template */
export async function saveTemplate(
  name: string,
  items: TemplateItem[]
): Promise<string> {
  const colRef = await getCollectionRef();
  const id = `tpl_${Date.now()}`;
  const template: ShoppingTemplate = {
    id,
    name: name.trim(),
    items: items.map(({ name: n, category, plannedQty }) => ({ name: n, category, plannedQty })),
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(colRef, id), template);
  return id;
}

/** Retorna todos os templates do usuário (mais recentes primeiro) */
export async function getTemplates(): Promise<ShoppingTemplate[]> {
  try {
    const colRef = await getCollectionRef();
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ShoppingTemplate);
  } catch (err) {
    console.error('Erro ao carregar templates:', err);
    return [];
  }
}

/** Remove um template */
export async function deleteTemplate(id: string): Promise<void> {
  const colRef = await getCollectionRef();
  await deleteDoc(doc(colRef, id));
}
