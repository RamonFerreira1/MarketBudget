import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUserId } from './authService';
import { ShoppingSession } from '../types';

export type BadgeId = 'mao_de_vaca' | 'detetive' | 'carrinho_cheio' | 'primeira_compra';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export const BADGES_META: Record<BadgeId, Omit<Badge, 'isUnlocked' | 'id'>> = {
  primeira_compra: {
    name: 'Iniciante',
    description: 'Finalizou a primeira compra com sucesso.',
    icon: '👶',
  },
  mao_de_vaca: {
    name: 'Mão de Vaca',
    description: 'Gastou menos do que o orçamento definido.',
    icon: '🥇',
  },
  detetive: {
    name: 'Detetive de Preços',
    description: 'Comprou 5 produtos que estavam com preço em baixa.',
    icon: '🕵️‍♂️',
    maxProgress: 5,
  },
  carrinho_cheio: {
    name: 'Carrinho Cheio',
    description: 'Fez uma compra com mais de 30 itens.',
    icon: '🛒',
  },
};

/** Retorna todas as conquistas do usuário */
export async function getUserBadges(): Promise<Badge[]> {
  const uid = getCurrentUserId();
  if (!uid) return [];

  const badgesRef = doc(db, 'users', uid, 'data', 'badges');
  const d = await getDoc(badgesRef);
  const data = d.exists() ? d.data() : {};

  return (Object.keys(BADGES_META) as BadgeId[]).map((id) => {
    const meta = BADGES_META[id];
    const userBadge = data[id];
    return {
      id,
      ...meta,
      isUnlocked: !!userBadge?.unlockedAt,
      unlockedAt: userBadge?.unlockedAt ? new Date(userBadge.unlockedAt) : undefined,
      progress: userBadge?.progress ?? 0,
    };
  });
}

/** Avalia e desbloqueia badges após uma sessão */
export async function evaluateSessionForBadges(session: ShoppingSession): Promise<Badge[]> {
  const uid = getCurrentUserId();
  if (!uid) return [];

  const badgesRef = doc(db, 'users', uid, 'data', 'badges');
  const d = await getDoc(badgesRef);
  const data = d.exists() ? d.data() : {};

  const unlockedNow: Badge[] = [];
  const updates: any = {};

  const checkAndUnlock = (id: BadgeId, condition: boolean) => {
    if (!data[id]?.unlockedAt && condition) {
      const now = new Date().toISOString();
      updates[id] = { ...data[id], unlockedAt: now };
      unlockedNow.push({ id, ...BADGES_META[id], isUnlocked: true, unlockedAt: new Date(now) });
    }
  };

  // 1. Primeira compra
  checkAndUnlock('primeira_compra', true);

  // 2. Mão de vaca (gastou menos que o budget e budget > 0)
  checkAndUnlock('mao_de_vaca', session.budget > 0 && session.totalSpent < session.budget);

  // 3. Carrinho cheio (> 30 itens reais)
  const actualItemsCount = session.items.reduce((acc, i) => acc + (i.addedToCart ? (i.actualQty ?? 0) : 0), 0);
  checkAndUnlock('carrinho_cheio', actualItemsCount > 30);

  // 4. Detetive (progressivo)
  if (!data['detetive']?.unlockedAt) {
    const discountedItems = session.items.filter(i => i.priceVariation?.direction === 'down').length;
    if (discountedItems > 0) {
      const currentProgress = data['detetive']?.progress || 0;
      const newProgress = currentProgress + discountedItems;
      
      if (newProgress >= BADGES_META['detetive'].maxProgress!) {
        const now = new Date().toISOString();
        updates['detetive'] = { progress: newProgress, unlockedAt: now };
        unlockedNow.push({ id: 'detetive', ...BADGES_META['detetive'], isUnlocked: true, unlockedAt: new Date(now) });
      } else {
        updates['detetive'] = { progress: newProgress };
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    await setDoc(badgesRef, updates, { merge: true });
  }

  return unlockedNow;
}
