import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';

export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const register = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
