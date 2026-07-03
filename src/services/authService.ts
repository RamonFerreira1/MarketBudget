import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// ─── Para usar Google Sign-In em produção, instale:
// expo install expo-auth-session expo-web-browser
// e configure o clientId do Google no Firebase Console.
// Esta é uma implementação base — configure conforme seu ambiente Expo.

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    // Expo Go não suporta signInWithPopup nativamente.
    // Use expo-auth-session para obter o idToken e autenticar:
    // const credential = GoogleAuthProvider.credential(idToken);
    // const result = await signInWithCredential(auth, credential);
    // return result.user;

    // Placeholder: retorna null até configurar expo-auth-session
    console.warn('Configure expo-auth-session para Google Sign-In em produção.');
    return null;
  } catch (error) {
    console.error('Erro no login com Google:', error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const onUserChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
