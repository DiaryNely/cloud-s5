/**
 * Service API pour Vue 3 / Ionic
 * À placer dans : mobile-signalement/src/services/api.ts
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur requête
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Intercepteur réponse
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const newToken = response.data.data.token;
          
          localStorage.setItem('token', newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

export interface Signalement {
  id: number;
  titre: string;
  description: string;
  latitude: number;
  longitude: number;
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
  enAttente: number;
  enCours: number;
  termine: number;
  rejete: number;
}
