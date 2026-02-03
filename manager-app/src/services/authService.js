import api from './api';

/**
 * Authentifie un utilisateur
 */
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.success) {
      const { token, refreshToken, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, user };
    }
    
    return { success: false, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur de connexion au serveur';
    return { success: false, message };
  }
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

/**
 * Rafraîchit le token JWT
 */
export const refreshToken = async () => {
  const currentRefreshToken = localStorage.getItem('refreshToken');
  
  if (!currentRefreshToken) {
    throw new Error('No refresh token');
  }
  
  const response = await api.post('/auth/refresh', { 
    refreshToken: currentRefreshToken 
  });
  
  if (response.data.success) {
    localStorage.setItem('token', response.data.data.token);
    return response.data.data.token;
  }
  
  throw new Error(response.data.message);
};

/**
 * Récupère l'utilisateur courant depuis le localStorage
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Vérifie si l'utilisateur est un manager
 */
export const isManager = () => {
  const user = getCurrentUser();
  return user?.role === 'MANAGER';
};

export default {
  login,
  logout,
  refreshToken,
  getCurrentUser,
  isAuthenticated,
  isManager
};
