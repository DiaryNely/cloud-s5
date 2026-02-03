import api from './api';

/**
 * Récupère tous les utilisateurs (MANAGER uniquement)
 */
export const getUtilisateurs = async () => {
  const response = await api.get('/users');
  return response.data;
};

/**
 * Récupère un utilisateur par son ID
 */
export const getUtilisateurById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

/**
 * Récupère le profil de l'utilisateur connecté
 */
export const getMonProfil = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

/**
 * Crée un nouvel utilisateur (MANAGER uniquement)
 */
export const createUtilisateur = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

/**
 * Supprime un utilisateur (MANAGER uniquement)
 */
export const deleteUtilisateur = async (id) => {
  await api.delete(`/users/${id}`);
};

/**
 * Débloque un utilisateur bloqué (MANAGER uniquement)
 */
export const debloquerUtilisateur = async (id) => {
  const response = await api.post(`/users/${id}/unblock`);
  return response.data;
};

/**
 * Réinitialise le mot de passe d'un utilisateur (MANAGER uniquement)
 */
export const resetPassword = async (id) => {
  const response = await api.post(`/users/${id}/reset-password`);
  return response.data;
};

/**
 * Récupère les logs d'audit (MANAGER uniquement)
 */
export const getAuditLogs = async (limit = 50) => {
  const response = await api.get(`/audit?limit=${limit}`);
  return response.data;
};

/**
 * Récupère la liste des entreprises
 */
export const getEntreprises = async () => {
  const response = await api.get('/entreprises');
  return response.data;
};

/**
 * Synchronise avec Firebase (MANAGER uniquement)
 */
export const syncFirebase = async () => {
  const response = await api.post('/config/sync/firebase');
  return response.data;
};

export default {
  getUtilisateurs,
  getUtilisateurById,
  getMonProfil,
  createUtilisateur,
  deleteUtilisateur,
  debloquerUtilisateur,
  resetPassword,
  getAuditLogs,
  getEntreprises,
  syncFirebase
};
