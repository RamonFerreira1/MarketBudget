import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { checkShoppingReminder } from './alertsService';
import * as Notifications from 'expo-notifications';

const GEOFENCE_TASK_NAME = 'MARKET_GEOFENCE_TASK';

// Registrando a tarefa em background
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Erro no geofencing:', error);
    return;
  }
  if (data) {
    const { eventType, region } = data as any;
    if (eventType === Location.GeofencingEventType.Enter) {
      // O usuário entrou num raio de mercado.
      // Vamos verificar se ele precisa fazer compras.
      const needsToShop = await checkShoppingReminder();
      if (needsToShop) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Você está perto de um mercado! 🛒',
            body: 'Já faz um tempo desde sua última compra. Que tal conferir sua lista?',
          },
          trigger: null,
        });
      }
    }
  }
});

/**
 * Pede permissão e inicia o monitoramento de geofence.
 * @param regions - Array de { latitude, longitude, radius, identifier }
 */
export async function startGeofencing(regions: Location.LocationRegion[]) {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return false;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') return false;

  await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
  return true;
}

export async function stopGeofencing() {
  const hasTask = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
  if (hasTask) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
  }
}
