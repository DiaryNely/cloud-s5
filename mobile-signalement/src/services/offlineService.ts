import { Storage } from '@ionic/storage';
import { Network } from '@capacitor/network';
import { Signalement } from './api';
import signalementService from './signalementService';

// Note: Avec la stratégie "Firebase First", ce service est un wrapper de compatibilité
// Il délègue la plupart des opérations à signalementService qui utilise le SDK Firebase
// Le SDK Firebase gère nativement le mode offline (queuing + synchronisation)

const STORAGE_KEYS = {
  SIGNALEMENTS: 'offline_signalements',
  PENDING_SIGNALEMENTS: 'pending_signalements',
  LAST_SYNC: 'last_sync_timestamp',
  USER_DATA: 'user_data'
};

let storageInstance: Storage | null = null;

const getStorage = async (): Promise<Storage> => {
  if (!storageInstance) {
    storageInstance = new Storage();
    await storageInstance.create();
  }
  return storageInstance;
};

/**
 * Vérifie si l'appareil est en ligne
 */
export const isOnline = async (): Promise<boolean> => {
  const status = await Network.getStatus();
  return status.connected;
};

/**
 * Écoute les changements de connexion
 */
export const onNetworkChange = (callback: (isConnected: boolean) => void) => {
  Network.addListener('networkStatusChange', (status) => {
    callback(status.connected);
  });
};

/**
 * Sauvegarde les signalements localement
 */
export const saveSignalementsLocally = async (signalements: Signalement[]): Promise<void> => {
  const storage = await getStorage();
  await storage.set(STORAGE_KEYS.SIGNALEMENTS, signalements);
  await storage.set(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

/**
 * Récupère les signalements stockés localement
 */
export const getLocalSignalements = async (): Promise<Signalement[]> => {
  const storage = await getStorage();
  return (await storage.get(STORAGE_KEYS.SIGNALEMENTS)) || [];
};

/**
 * Ajoute un signalement en attente de synchronisation
 * @deprecated Avec Firebase First, cela est géré nativement par le SDK, mais gardé pour compatibilité
 */
export const addPendingSignalement = async (signalement: Omit<Signalement, 'id'>): Promise<void> => {
  // On delègue directement à signalementService qui gère le optimistic write
  await signalementService.createSignalement(signalement as any);
};

/**
 * Récupère les signalements en attente de synchronisation
 */
export const getPendingSignalements = async (): Promise<any[]> => {
  return []; // Plus de file d'attente manuelle
};

/**
 * Synchronise les signalements en attente avec le serveur
 * @deprecated Firebase SDK gère ça automatiquement
 */
export const syncPendingSignalements = async (): Promise<{ success: number; failed: number }> => {
  return { success: 0, failed: 0 };
};

/**
 * Rafraîchit les données locales depuis le serveur (Firebase)
 */
export const refreshLocalData = async (): Promise<boolean> => {
  // Firebase onValue gère le refresh
  return true;
};

/**
 * Récupère les signalements (online ou offline)
 */
export const getSignalementsWithOfflineSupport = async (): Promise<{
  signalements: Signalement[];
  isFromCache: boolean;
  pendingCount: number;
}> => {
  // Avec Firebase, on appelle juste le service qui a le listener
  // Utilisation de Promise wrapper simple ici
  try {
    // Note: getSignalements dans signalementService utilise onValue
    // Pour cet appel unique, on pourrait utiliser get() mais onValue est mieux
    // On va faire un appel unique via le service
    const signalements = await signalementService.getSignalements();
    return {
      signalements,
      isFromCache: false, // Difficile à dire avec Firebase, on assume false (synced)
      pendingCount: 0
    };
  } catch (error) {
    const cached = await getLocalSignalements();
    return {
      signalements: cached,
      isFromCache: true,
      pendingCount: 0
    };
  }
};

/**
 * Crée un signalement (online ou offline)
 */
export const createSignalementWithOfflineSupport = async (data: {
  localisation: string;
  latitude: number;
  longitude: number;
  description: string;
  surface: number;
  budgetEstime: number;
  photos?: string[];
}): Promise<{ success: boolean; offline: boolean; signalement?: Signalement }> => {

  // Firebase First: on écrit toujours, le SDK gère le offline
  try {
    const result = await signalementService.createSignalement(data as any);
    return {
      success: true,
      offline: false, // On considère success immédiat (optimistic)
      signalement: result
    };
  } catch (e) {
    console.error("Erreur create signalement", e);
    return { success: false, offline: true };
  }
};

/**
 * Récupère la date de dernière synchronisation
 */
export const getLastSyncDate = async (): Promise<string | null> => {
  const storage = await getStorage();
  return storage.get(STORAGE_KEYS.LAST_SYNC);
};

/**
 * Nettoie toutes les données locales
 */
export const clearLocalData = async (): Promise<void> => {
  const storage = await getStorage();
  await storage.remove(STORAGE_KEYS.SIGNALEMENTS);
  await storage.remove(STORAGE_KEYS.PENDING_SIGNALEMENTS);
  await storage.remove(STORAGE_KEYS.LAST_SYNC);
};

export default {
  isOnline,
  onNetworkChange,
  saveSignalementsLocally,
  getLocalSignalements,
  addPendingSignalement,
  getPendingSignalements,
  syncPendingSignalements,
  refreshLocalData,
  getSignalementsWithOfflineSupport,
  createSignalementWithOfflineSupport,
  getLastSyncDate,
  clearLocalData
};
