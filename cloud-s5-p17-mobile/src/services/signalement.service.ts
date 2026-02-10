import { ref as dbRef, push, set, onValue, off, get } from 'firebase/database';
import { database, auth } from './firebase';

export interface Signalement {
  id?: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  status?: string;
  surfaceM2?: number;
  budgetAr?: number;
  entreprise?: string;
  userUid?: string;
  userEmail?: string;
  createdAt?: string;
  photoUrl?: string;
  dateNouveau?: string;
  dateEnCours?: string;
  dateTermine?: string;
}

export interface SignalementCreateRequest {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  surfaceM2?: number;
  budgetAr?: number;
  entreprise?: string;
}

export const signalementService = {
  // Écouter les signalements en temps réel
  onSignalementsChange(callback: (signalements: Signalement[]) => void): () => void {
    const signalementRef = dbRef(database, 'signalements');
    
    const listener = onValue(signalementRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        callback(items);
      } else {
        callback([]);
      }
    });

    // Retourner une fonction pour se désabonner
    return () => off(signalementRef);
  },

  async getAll(mine = false): Promise<Signalement[]> {
    const signalementRef = dbRef(database, 'signalements');
    const snapshot = await get(signalementRef);
    const data = snapshot.val();
    
    if (!data) return [];

    const items = Object.entries(data).map(([key, value]: [string, any]) => ({
      id: key,
      ...value,
    }));

    if (mine && auth.currentUser) {
      return items.filter((item) => item.userUid === auth.currentUser!.uid);
    }

    return items;
  },

  async create(payload: SignalementCreateRequest): Promise<Signalement> {
    const user = auth.currentUser;
    const signalementRef = dbRef(database, 'signalements');
    const newRef = push(signalementRef);

    const signalement: Signalement = {
      ...payload,
      id: newRef.key!,
      status: 'NOUVEAU',
      userUid: user?.uid || '',
      userEmail: user?.email || '',
      createdAt: new Date().toISOString(),
      dateNouveau: new Date().toISOString(),
    };

    await set(newRef, signalement);
    return signalement;
  },

  async update(id: string, payload: Partial<Signalement>): Promise<Signalement> {
    const signalementRef = dbRef(database, `signalements/${id}`);
    const snapshot = await get(signalementRef);
    const existing = snapshot.val();
    
    const updated = { ...existing, ...payload };
    await set(signalementRef, updated);
    return updated;
  },

  async uploadPhoto(id: string, formData: FormData): Promise<any> {
    // Pour l'instant, les photos ne sont pas uploadées via Firebase
    // TODO: Utiliser Firebase Storage pour les photos
    console.log('Upload photo pour signalement', id);
  },
};
