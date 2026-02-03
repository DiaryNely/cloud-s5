/**
 * Service Auth - API REST
 * À placer dans : manager-app/src/services/authService.js
 */
import api from './api';

/**
 * Authentifie un utilisateur
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  
  if (response.data.success) {
    const { token, refreshToken, utilisateur } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
    
    return utilisateur;
  }
  
  throw new Error(response.data.message);
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('utilisateur');
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
  const user = localStorage.getItem('utilisateur');
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
