import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../config/firebase'; // Ensure app is exported or initializeAuth is used

const auth = getAuth(app);

export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const register = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
