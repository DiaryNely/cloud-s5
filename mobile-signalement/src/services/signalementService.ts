import { db } from '../firebase';
import { ref, push, set, onValue, query, orderByChild, get, child } from 'firebase/database';
import api, { Signalement, Statistiques } from './api';
import { Network } from '@capacitor/network';

const DB_PATH = 'signalements';

/**
 * Checks if there is an internet connection
 */
const isConnectedToInternet = async (): Promise<boolean> => {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch (e) {
    console.error("Error checking network status", e);
    return true; // Default to true to attempt Firebase
  }
};

/**
 * Récupère tous les signalements (écoute en temps réel ou fallback API)
 */
export const getSignalements = async (callback?: (signalements: Signalement[]) => void): Promise<Signalement[]> => {
  const isConnected = await isConnectedToInternet();

  // Mode Online / Firebase
  if (isConnected) {
    if (callback) {
      // Mode Realtime (Listener)
      const signalementsRef = query(ref(db, DB_PATH), orderByChild('dateCreation'));
      onValue(signalementsRef, (snapshot) => {
        const data = snapshot.val();
        const signalements: Signalement[] = [];

        if (data) {
          Object.keys(data).forEach((key) => {
            const item = data[key];
            signalements.push(mapFirebaseItemToSignalement(key, item));
          });
        }
        signalements.reverse();
        callback(signalements);
      }, (error) => {
        console.error("Firebase connection failed, switching to fallback API", error);
        // Fallback en cas d'erreur Firebase même si "online"
        fetchFromApi().then(callback);
      });
      return []; // Retour immédiat vide, le callback fera le travail
    } else {
      // Mode Promise (One-shot)
      try {
        const snapshot = await get(query(ref(db, DB_PATH), orderByChild('dateCreation')));
        const data = snapshot.val();
        const signalements: Signalement[] = [];
        if (data) {
          Object.keys(data).forEach((key) => {
            signalements.push(mapFirebaseItemToSignalement(key, data[key]));
          });
        }
        return signalements.reverse();
      } catch (e) {
        console.error("Firebase get failed, using fallback API", e);
        return fetchFromApi();
      }
    }
  } else {
    // Mode Offline / Fallback Postgres
    console.log("No internet connection, using fallback API (Postgres)...");
    const result = await fetchFromApi();
    if (callback) callback(result);
    return result;
  }
};

// Helper pour l'API REST
const fetchFromApi = async (): Promise<Signalement[]> => {
  try {
    const response = await api.get('/signalements/mes-signalements');
    return response.data;
  } catch (error) {
    console.error("API fallback failed", error);
    return [];
  }
};

// Helper mapping
const mapFirebaseItemToSignalement = (key: string, item: any): Signalement => {
  return {
    id: Number(key) || 0,
    firebaseId: key,
    localisation: item.localisation || '',
    latitude: item.latitude || 0,
    longitude: item.longitude || 0,
    description: item.description || '',
    surface: item.surface || 0,
    budgetEstime: item.budgetEstime || 0,
    statut: item.statut || 'NOUVEAU',
    dateCreation: item.dateCreation || new Date().toISOString(),
    creePar: item.creePar || '',
    photos: item.photos || []
  };
};

/**
 * Récupère les signalements de l'utilisateur connecté
 */
export const getMesSignalements = async (): Promise<Signalement[]> => {
  return getSignalements();
};

/**
 * Récupère un signalement par son ID
 */
export const getSignalementById = async (id: number | string): Promise<Signalement> => {
  const isConnected = await isConnectedToInternet();

  if (isConnected) {
    const dbRef = ref(db);
    try {
      let snapshot = await get(child(dbRef, `${DB_PATH}/${id}`));
      if (snapshot.exists()) {
        return mapFirebaseItemToSignalement(String(id), snapshot.val());
      }
    } catch (error) {
      console.error("Firebase sync error, attempting API fallback", error);
    }
  }

  // Fallback API if offline or firebase failed (and not found)
  try {
    // Note: L'ID peut etre un string firebase, l'API attend peut-etre un ID numérique
    // Si c'est un ID numérique, ça marche. Si c'est un UUID firebase, l'API ne le trouvera surement pas
    // sauf si on a une synchro inverse parfaite.
    const response = await api.get(`/signalements/${id}`);
    return response.data;
  } catch (e) {
    return {} as Signalement;
  }
};

/**
 * Crée un nouveau signalement
 */
export const createSignalement = async (data: {
  localisation: string;
  latitude: number;
  longitude: number;
  description: string;
  surface: number;
  budgetEstime: number;
}): Promise<Signalement> => {
  const isConnected = await isConnectedToInternet();

  if (isConnected) {
    try {
      const signalementsRef = ref(db, DB_PATH);
      const newSignalementRef = push(signalementsRef);

      const dataToSave = {
        ...data,
        dateCreation: new Date().toISOString(),
        statut: 'NOUVEAU',
        syncedWithPostgres: false
      };

      // Optimistic write (no await?) or wait for ack?
      // Si on est connecté, on attend pour être sûr
      await set(newSignalementRef, dataToSave);

      return {
        ...dataToSave,
        id: 0,
        firebaseId: newSignalementRef.key,
        creePar: '',
        photos: []
      } as unknown as Signalement;

    } catch (e) {
      console.error("Firebase write failed, attempting API fallback", e);
    }
  }

  // Fallback API (Postgres)
  console.log("Using API fallback for creation...");
  try {
    const response = await api.post('/signalements', data);
    return response.data;
  } catch (apiError) {
    console.error("API creation failed", apiError);
    throw apiError;
  }
};

/**
 * Récupère les statistiques globales
 */
export const getStatistiques = async (): Promise<Statistiques> => {
  try {
    const signalements = await getSignalements();
    const total = signalements.length;

    const termine = signalements.filter(s => s.statut === 'TERMINE').length;
    const planifie = signalements.filter(s => s.statut === 'PLANIFIE').length;
    const nouveaux = signalements.filter(s => s.statut === 'NOUVEAU').length;
    const enCours = signalements.filter(s => s.statut === 'EN_COURS').length;

    const surfaceTotale = signalements.reduce((acc, curr) => acc + (Number(curr.surface) || 0), 0);
    const budgetTotal = signalements.reduce((acc, curr) => acc + (Number(curr.budgetEstime) || 0), 0);

    const scoreTotal = (termine * 100) + (enCours * 50);
    const pourcentageAvancement = total > 0 ? Math.round(scoreTotal / total) : 0;

    return {
      total: total,
      totalSignalements: total,
      enCours: enCours,
      termine: termine,
      termines: termine,
      nouveaux: nouveaux,
      planifie: planifie,
      surfaceTotale: surfaceTotale,
      budgetTotal: budgetTotal,
      pourcentageAvancement: pourcentageAvancement
    };
  } catch (e) {
    console.error("Erreur calcul stats:", e);
    return {
      total: 0,
      totalSignalements: 0,
      enCours: 0,
      termine: 0,
      termines: 0,
      nouveaux: 0,
      planifie: 0,
      surfaceTotale: 0,
      budgetTotal: 0,
      pourcentageAvancement: 0
    };
  }
};

/**
 * Helper pour le label de statut
 */
export const getStatutLabel = (statut: string): string => {
  const labels: Record<string, string> = {
    'NOUVEAU': 'Nouveau',
    'EN_COURS': 'En cours',
    'TERMINE': 'Terminé',
    'PLANIFIE': 'Planifié',
    'EN_ATTENTE': 'En attente'
  };
  return labels[statut] || statut;
};

/**
 * Helper pour la couleur de statut (Ionic)
 */
export const getStatutColor = (statut: string): string => {
  const colors: Record<string, string> = {
    'NOUVEAU': 'danger',
    'EN_COURS': 'warning',
    'TERMINE': 'success',
    'PLANIFIE': 'primary',
    'EN_ATTENTE': 'medium'
  };
  return colors[statut] || 'medium';
};

export default {
  getSignalements,
  getMesSignalements,
  getSignalementById,
  createSignalement,
  getStatistiques,
  getStatutLabel,
  getStatutColor
};
