import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ShoppingSession, ShoppingItem } from '../types';

const COLLECTION = 'shopping_sessions';

export async function createSession(
  session: Omit<ShoppingSession, 'id' | 'items' | 'totalSpent'>
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...session,
    createdAt: Timestamp.now(),
    totalSpent: 0,
    items: [],
  });
  return docRef.id;
}

export async function updateSessionStatus(
  sessionId: string,
  status: ShoppingSession['status']
): Promise<void> {
  const ref = doc(db, COLLECTION, sessionId);
  await updateDoc(ref, { status });
}

export async function finalizeSession(
  sessionId: string,
  items: ShoppingItem[],
  totalSpent: number
): Promise<void> {
  const ref = doc(db, COLLECTION, sessionId);
  await updateDoc(ref, {
    items,
    totalSpent,
    status: 'completed',
  });
}

export async function getUserSessions(userId: string): Promise<ShoppingSession[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt.toDate(),
  })) as ShoppingSession[];
}
