import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Storage } from '@ionic/storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

let storageInstance: Storage | null = null;

const getStorage = async (): Promise<Storage> => {
  if (!storageInstance) {
    storageInstance = new Storage();
    await storageInstance.create();
  }
  return storageInstance;
};

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur requête : ajouter le token JWT
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const storage = await getStorage();
      const token = await storage.get('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Intercepteur réponse : gérer le refresh token
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const storage = await getStorage();
        const refreshToken = await storage.get('refreshToken');

        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const newToken = response.data.data.token;

          await storage.set('token', newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          return api(originalRequest);
        }
      } catch {
        const storage = await getStorage();
        await storage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Types
export interface Signalement {
  id: number;
  firebaseId?: string;
  localisation: string;
  latitude: number;
  longitude: number;
  description: string;
  surface: number;
  budgetEstime: number;
  statut: string;
  dateCreation: string;
  dateModification?: string;
  creePar: string;
  entreprise?: string;
  photos: string[];
}

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  role: string;
  statut: string;
  entreprise?: string;
  dateCreation: string;
  derniereConnexion?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  utilisateur: Utilisateur;
}

export interface Statistiques {
  total: number;
  totalSignalements: number;
  enCours: number;
  termine: number;
  termines: number;
  nouveaux: number;
  planifie: number;
  surfaceTotale: number;
  budgetTotal: number;
  pourcentageAvancement: number;
}
