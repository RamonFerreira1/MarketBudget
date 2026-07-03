import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';
import { initializeAuth, inMemoryPersistence } from 'firebase/auth';

// ─── Credenciais do projeto Firebase ──────────────────────
// Carregadas do arquivo .env (que não é commitado)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
// ─────────────────────────────────────────────────────────────────────────────

// Evita re-inicialização em hot reload
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firestore com persistência offline habilitada
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  db = getFirestore(firebaseApp);
}

// Auth — usa inMemoryPersistence no Expo Managed.
// Para persistência real entre sessões, migre para @react-native-firebase.
const auth = initializeAuth(firebaseApp, {
  persistence: inMemoryPersistence,
});

export { firebaseApp as app, db, auth };
