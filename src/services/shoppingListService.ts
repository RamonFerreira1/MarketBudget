import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingSession, ShoppingItem } from '../types';

const SESSIONS_KEY = '@marketbudget:sessions';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loadSessions(): Promise<ShoppingSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw, (key, value) => {
      // Reconverte strings de data em objetos Date
      if (key === 'createdAt') return new Date(value);
      return value;
    });
  } catch {
    return [];
  }
}

async function saveSessions(sessions: ShoppingSession[]): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/** Cria uma nova sessão e retorna o ID gerado */
export async function createSession(
  session: Omit<ShoppingSession, 'id' | 'items' | 'totalSpent'>
): Promise<string> {
  const id = `session_${Date.now()}`;
  const newSession: ShoppingSession = {
    ...session,
    id,
    createdAt: new Date(),
    totalSpent: 0,
    items: [],
  };

  const sessions = await loadSessions();
  sessions.unshift(newSession); // mais recente primeiro
  await saveSessions(sessions);
  return id;
}

/** Atualiza o status de uma sessão */
export async function updateSessionStatus(
  sessionId: string,
  status: ShoppingSession['status']
): Promise<void> {
  const sessions = await loadSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx !== -1) {
    sessions[idx].status = status;
    await saveSessions(sessions);
  }
}

/** Finaliza a sessão salvando itens e total. Se não existir, cria. */
export async function finalizeSession(
  session: ShoppingSession
): Promise<void> {
  const sessions = await loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  
  const completedSession = {
    ...session,
    status: 'completed' as const,
  };

  if (idx !== -1) {
    sessions[idx] = completedSession;
  } else {
    sessions.unshift(completedSession);
  }
  
  await saveSessions(sessions);
}

/** Retorna todas as sessões do usuário (mais recentes primeiro) */
export async function getUserSessions(): Promise<ShoppingSession[]> {
  return loadSessions();
}

/** Apaga todas as sessões (útil para testes) */
export async function clearAllSessions(): Promise<void> {
  await AsyncStorage.removeItem(SESSIONS_KEY);
}

/** Apaga uma sessão específica */
export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await loadSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  await saveSessions(filtered);
}
