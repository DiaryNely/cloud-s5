import { ref as dbRef, push, set, onValue, off, get, update } from 'firebase/database';
import { database, auth } from './firebase';
import {
  ImagePixelData,
  encodeImageToPixelString,
  decodeMultipleImages,
  encodeMultipleImages,
} from './imageUtils';

export interface Signalement {
  id?: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  status?: string;
  surfaceM2?: number;
  entreprise?: string;
  userUid?: string;
  userEmail?: string;
  createdAt?: string;
  photoUrl?: string;
  /** Photos encodées en pixels base64 pour stockage Firebase */
  photos?: ImagePixelData[];
  /** URLs reconstituées des photos (non stocké, calculé côté client) */
  photoUrls?: string[];
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
  entreprise?: string;
  /** Blobs des photos à encoder et stocker */
  photoBlobs?: Blob[];
}

export const signalementService = {
  /**
   * Reconstitue les URLs des photos à partir des données pixels stockées dans Firebase
   */
  _reconstructPhotoUrls(signalement: Signalement): Signalement {
    if (signalement.photos && Array.isArray(signalement.photos)) {
      signalement.photoUrls = decodeMultipleImages(signalement.photos);
    } else {
      signalement.photoUrls = [];
    }
    return signalement;
  },

  // Écouter les signalements en temps réel
  onSignalementsChange(callback: (signalements: Signalement[]) => void): () => void {
    const signalementRef = dbRef(database, 'signalements');
    
    onValue(signalementRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data).map(([key, value]: [string, any]) => {
          const sig: Signalement = { id: key, ...value };
          return this._reconstructPhotoUrls(sig);
        });
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

    const items = Object.entries(data).map(([key, value]: [string, any]) => {
      const sig: Signalement = { id: key, ...value };
      return this._reconstructPhotoUrls(sig);
    });

    if (mine && auth.currentUser) {
      return items.filter((item) => item.userUid === auth.currentUser!.uid);
    }

    return items;
  },

  async create(payload: SignalementCreateRequest): Promise<Signalement> {
    const user = auth.currentUser;
    const signalementRef = dbRef(database, 'signalements');
    const newRef = push(signalementRef);

    // Encoder les photos en pixels si présentes
    let encodedPhotos: ImagePixelData[] = [];
    if (payload.photoBlobs && payload.photoBlobs.length > 0) {
      encodedPhotos = await encodeMultipleImages(payload.photoBlobs);
    }

    const { photoBlobs, ...payloadWithoutBlobs } = payload;

    const signalement: Signalement = {
      ...payloadWithoutBlobs,
      id: newRef.key!,
      status: 'NOUVEAU',
      photos: encodedPhotos.length > 0 ? encodedPhotos : undefined,
      userUid: user?.uid || '',
      userEmail: user?.email || '',
      createdAt: new Date().toISOString(),
      dateNouveau: new Date().toISOString(),
    };

    await set(newRef, signalement);

    // Reconstituer les URLs pour l'affichage immédiat
    return this._reconstructPhotoUrls(signalement);
  },

  async update(id: string, payload: Partial<Signalement>): Promise<Signalement> {
    const signalementRef = dbRef(database, `signalements/${id}`);
    const snapshot = await get(signalementRef);
    const existing = snapshot.val();
    
    const updated = { ...existing, ...payload };
    await set(signalementRef, updated);
    return this._reconstructPhotoUrls(updated);
  },

  /**
   * Upload une photo pour un signalement existant :
   * encode les pixels en string et les stocke dans Firebase
   */
  async uploadPhoto(id: string, photoBlob: Blob): Promise<ImagePixelData> {
    // Encoder l'image en chaîne de pixels
    const encodedPhoto = await encodeImageToPixelString(photoBlob);

    // Récupérer les photos existantes
    const signalementRef = dbRef(database, `signalements/${id}`);
    const snapshot = await get(signalementRef);
    const existing = snapshot.val();

    const existingPhotos: ImagePixelData[] = existing?.photos || [];
    existingPhotos.push(encodedPhoto);

    // Mettre à jour Firebase avec la nouvelle photo
    await update(signalementRef, { photos: existingPhotos });

    return encodedPhoto;
  },

  /**
   * Récupère les photos d'un signalement et les décode en URLs affichables
   */
  async getPhotoUrls(id: string): Promise<string[]> {
    const signalementRef = dbRef(database, `signalements/${id}/photos`);
    const snapshot = await get(signalementRef);
    const photos: ImagePixelData[] = snapshot.val();

    if (!photos || !Array.isArray(photos)) {
      return [];
    }

    return decodeMultipleImages(photos);
  },

  /**
   * Supprime une photo d'un signalement par son index
   */
  async removePhoto(id: string, photoIndex: number): Promise<void> {
    const signalementRef = dbRef(database, `signalements/${id}`);
    const snapshot = await get(signalementRef);
    const existing = snapshot.val();

    if (existing?.photos && Array.isArray(existing.photos)) {
      existing.photos.splice(photoIndex, 1);
      await update(signalementRef, { photos: existing.photos });
    }
  },
};
