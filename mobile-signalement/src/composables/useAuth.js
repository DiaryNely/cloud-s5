import { ref, computed, watch } from 'vue';
import { Storage } from '@ionic/storage';
import api from '../services/api';

let storageInstance = null;
const user = ref(null);
const loading = ref(true);
const isAuthenticated = ref(false);

const getStorage = async () => {
  if (!storageInstance) {
    storageInstance = new Storage();
    await storageInstance.create();
  }
  return storageInstance;
};

// Watcher pour mettre à jour isAuthenticated
watch(user, (newUser) => {
  isAuthenticated.value = !!newUser;
});

// Initialiser l'utilisateur
const initAuth = async () => {
  try {
    const storage = await getStorage();
    const storedUser = await storage.get('user');
    if (storedUser) {
      user.value = storedUser;
    }
  } catch (error) {
    console.error('Init auth error:', error);
  } finally {
    loading.value = false;
  }
};

initAuth();

export function useAuth() {
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        user.value = response.data.user;
        
        const storage = await getStorage();
        await storage.set('user', response.data.user);
        await storage.set('token', response.data.token);
        await storage.set('refreshToken', response.data.refreshToken);
        
        return { success: true, user: response.data.user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Erreur de connexion';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      user.value = null;
      isAuthenticated.value = false;
      const storage = await getStorage();
      await storage.remove('user');
      await storage.remove('token');
      await storage.remove('refreshToken');
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };
}
