/**
 * Service Utilisateurs - API REST
 * À placer dans : manager-app/src/services/userService.js
 * 
 * Remplace l'import statique de data/utilisateurs.js
 */
import api from './api';

/**
 * Récupère tous les utilisateurs (MANAGER uniquement)
 */
export const getUtilisateurs = async () => {
  const response = await api.get('/users');
  return response.data.data;
};

/**
 * Récupère un utilisateur par son ID
 */
export const getUtilisateurById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
};

/**
 * Récupère le profil de l'utilisateur connecté
 */
export const getMonProfil = async () => {
  const response = await api.get('/users/me');
  return response.data.data;
};

/**
 * Récupère les stats de l'utilisateur connecté
 */
export const getMesStats = async () => {
  const response = await api.get('/users/stats');
  return response.data.data;
};

/**
 * Crée un nouvel utilisateur (MANAGER uniquement)
 */
export const createUtilisateur = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data.data;
};

/**
 * Met à jour un utilisateur
 */
export const updateUtilisateur = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data.data;
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
  return response.data.data;
};

/**
 * Récupère la liste des entreprises
 */
export const getEntreprises = async () => {
  const response = await api.get('/entreprises');
  return response.data.data;
};

export default {
  getUtilisateurs,
  getUtilisateurById,
  getMonProfil,
  getMesStats,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  debloquerUtilisateur,
  getEntreprises
};
