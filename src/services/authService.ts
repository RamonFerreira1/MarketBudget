// Sem Firebase Auth — app local com ID fixo.
// Para adicionar Google Auth no futuro, instale expo-auth-session.

/** ID local fixo do usuário neste dispositivo */
export const LOCAL_USER_ID = 'local_user';

/** Retorna o usuário atual (local) */
export function getCurrentUserId(): string {
  return LOCAL_USER_ID;
}
