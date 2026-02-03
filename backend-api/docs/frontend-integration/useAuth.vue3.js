/**
 * Composable Vue 3 - useAuth
 * À placer dans : mobile-signalement/src/composables/useAuth.js
 * 
 * Remplace le composable existant pour utiliser l'API REST
 */
import { ref, computed } from 'vue';
import api from '@/services/api';

// État global réactif
const user = ref(null);
const token = ref(null);
const loading = ref(false);
const error = ref(null);

// Initialiser depuis le localStorage
const initFromStorage = () => {
  token.value = localStorage.getItem('token');
  const storedUser = localStorage.getItem('utilisateur');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }
};

// Appeler à l'initialisation
initFromStorage();

export function useAuth() {
  
  /**
   * Connexion utilisateur
   */
  const login = async (email, password) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const data = response.data.data;
        
        token.value = data.token;
        user.value = data.utilisateur;
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
        
        return { success: true, utilisateur: data.utilisateur };
      } else {
        error.value = response.data.message;
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion';
      error.value = message;
      return { success: false, message };
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Déconnexion
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignorer les erreurs de logout
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('utilisateur');
    }
  };
  
  /**
   * Vérifier l'authentification
   */
  const checkAuth = async () => {
    if (!token.value) return false;
    
    try {
      const response = await api.get('/users/me');
      user.value = response.data.data;
      return true;
    } catch {
      await logout();
      return false;
    }
  };
  
  /**
   * Computed
   */
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isManager = computed(() => user.value?.role === 'MANAGER');
  const userName = computed(() => user.value?.nom || '');
  
  return {
    // État
    user,
    token,
    loading,
    error,
    
    // Actions
    login,
    logout,
    checkAuth,
    
    // Computed
    isAuthenticated,
    isManager,
    userName
  };
}

export default useAuth;
