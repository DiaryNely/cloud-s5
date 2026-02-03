import api from './api';
import { Storage } from '@ionic/storage';

let storageInstance: Storage | null = null;

const getStorage = async (): Promise<Storage> => {
  if (!storageInstance) {
    storageInstance = new Storage();
    await storageInstance.create();
  }
  return storageInstance;
};

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    utilisateur: Utilisateur;
  };
  message?: string;
}

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  actif: boolean;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.success) {
      const data = response.data.data;
      const storage = await getStorage();
      await storage.set('user', data.utilisateur);
      await storage.set('token', data.token);
      await storage.set('refreshToken', data.refreshToken);
    }
    
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur de connexion'
    };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    const storage = await getStorage();
    await storage.remove('user');
    await storage.remove('token');
    await storage.remove('refreshToken');
  }
};

export const getCurrentUser = async (): Promise<Utilisateur | null> => {
  const storage = await getStorage();
  return storage.get('user');
};

export const isAuthenticated = async (): Promise<boolean> => {
  const storage = await getStorage();
  const token = await storage.get('token');
  return !!token;
};

export const refreshToken = async (): Promise<boolean> => {
  try {
    const storage = await getStorage();
    const refreshToken = await storage.get('refreshToken');
    
    if (!refreshToken) return false;
    
    const response = await api.post('/auth/refresh', { refreshToken });
    
    if (response.data.success) {
      await storage.set('token', response.data.data.token);
      await storage.set('refreshToken', response.data.data.refreshToken);
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};
