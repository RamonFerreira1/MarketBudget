import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUserId } from './authService';
import { ShoppingSession } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getCollectionRef() {
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Usuário não autenticado');
  return collection(db, 'users', uid, 'sessions');
}

/**
 * Percorre recursivamente um objeto e substitui todos os valores `undefined`
 * por `null`, pois o Firestore rejeita campos com valor `undefined`.
 */
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) return null as unknown as T;
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    sanitized[key] = sanitizeForFirestore((obj as Record<string, unknown>)[key]);
  }
  return sanitized as T;
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/** Retorna todas as sessões do usuário (mais recentes primeiro) */
export async function getUserSessions(): Promise<ShoppingSession[]> {
  const uid = getCurrentUserId();
  if (!uid) return [];
  
  try {
    const q = query(collection(db, 'users', uid, 'sessions'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      } as ShoppingSession;
    });
  } catch (err) {
    console.error('Erro ao ler sessões:', err);
    return [];
  }
}

/** Cria uma nova sessão e retorna o ID gerado */
export async function createSession(
  session: Omit<ShoppingSession, 'id' | 'items' | 'totalSpent'>
): Promise<string> {
  const colRef = await getCollectionRef();
  const id = `session_${Date.now()}`;
  const newSession: ShoppingSession = {
    ...session,
    id,
    createdAt: new Date(),
    totalSpent: 0,
    items: [],
  };

  await setDoc(doc(colRef, id), sanitizeForFirestore({
    ...newSession,
    createdAt: new Date(newSession.createdAt.toISOString()), // Garante serialização
  }));
  return id;
}

/** Atualiza o status de uma sessão */
export async function updateSessionStatus(
  sessionId: string,
  status: ShoppingSession['status']
): Promise<void> {
  const colRef = await getCollectionRef();
  await setDoc(doc(colRef, sessionId), { status }, { merge: true });
}

/** Finaliza a sessão salvando itens e total. Se não existir, cria. */
export async function finalizeSession(
  session: ShoppingSession
): Promise<void> {
  const colRef = await getCollectionRef();
  const completedSession = {
    ...session,
    status: 'completed' as const,
  };
  
  await setDoc(doc(colRef, session.id), sanitizeForFirestore({
    ...completedSession,
    createdAt: new Date(completedSession.createdAt.toISOString()),
  }));
}

/** Apaga todas as sessões (útil para testes) */
export async function clearAllSessions(): Promise<void> {
  const sessions = await getUserSessions();
  const colRef = await getCollectionRef();
  for (const s of sessions) {
    await deleteDoc(doc(colRef, s.id));
  }
}

/** Apaga uma sessão específica */
export async function deleteSession(sessionId: string): Promise<void> {
  const colRef = await getCollectionRef();
  await deleteDoc(doc(colRef, sessionId));
}
