/**
 * Service Signalements - API REST
 * À placer dans : manager-app/src/services/signalementService.js
 * 
 * Remplace l'import statique de data/signalements.js
 */
import api from './api';

/**
 * Récupère tous les signalements
 * @param {Object} params - Paramètres de filtre (statut, page, size)
 */
export const getSignalements = async (params = {}) => {
  const response = await api.get('/signalements', { params });
  return response.data.data;
};

/**
 * Récupère un signalement par son ID
 */
export const getSignalementById = async (id) => {
  const response = await api.get(`/signalements/${id}`);
  return response.data.data;
};

/**
 * Récupère les signalements par statut
 */
export const getSignalementsByStatut = async (statut) => {
  const response = await api.get(`/signalements/statut/${statut}`);
  return response.data.data;
};

/**
 * Récupère les signalements de l'utilisateur connecté
 */
export const getMesSignalements = async () => {
  const response = await api.get('/signalements/mes-signalements');
  return response.data.data;
};

/**
 * Crée un nouveau signalement
 */
export const createSignalement = async (signalementData) => {
  const response = await api.post('/signalements', signalementData);
  return response.data.data;
};

/**
 * Met à jour un signalement
 */
export const updateSignalement = async (id, signalementData) => {
  const response = await api.put(`/signalements/${id}`, signalementData);
  return response.data.data;
};

/**
 * Met à jour uniquement le statut d'un signalement
 */
export const updateSignalementStatut = async (id, statut) => {
  const response = await api.patch(`/signalements/${id}/statut?statut=${statut}`);
  return response.data.data;
};

/**
 * Supprime un signalement
 */
export const deleteSignalement = async (id) => {
  await api.delete(`/signalements/${id}`);
};

/**
 * Récupère les statistiques globales
 */
export const getStatistiques = async () => {
  const response = await api.get('/signalements/statistiques');
  return response.data.data;
};

/**
 * Récupère l'historique des changements de statut
 */
export const getHistorique = async (signalementId) => {
  const response = await api.get(`/signalements/${signalementId}/historique`);
  return response.data.data;
};

export default {
  getSignalements,
  getSignalementById,
  getSignalementsByStatut,
  getMesSignalements,
  createSignalement,
  updateSignalement,
  updateSignalementStatut,
  deleteSignalement,
  getStatistiques,
  getHistorique
};
