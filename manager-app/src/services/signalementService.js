import api from './api';

/**
 * Récupère tous les signalements
 */
export const getSignalements = async () => {
  const response = await api.get('/signalements');
  return response.data;
};

/**
 * Récupère un signalement par son ID
 */
export const getSignalementById = async (id) => {
  const response = await api.get(`/signalements/${id}`);
  return response.data;
};

/**
 * Récupère les signalements par statut
 */
export const getSignalementsByStatut = async (statut) => {
  const response = await api.get(`/signalements/statut/${statut}`);
  return response.data;
};

/**
 * Crée un nouveau signalement
 */
export const createSignalement = async (signalementData) => {
  const response = await api.post('/signalements', signalementData);
  return response.data;
};

/**
 * Met à jour un signalement
 */
export const updateSignalement = async (id, signalementData) => {
  const response = await api.put(`/signalements/${id}`, signalementData);
  return response.data;
};

/**
 * Met à jour uniquement le statut d'un signalement
 */
export const updateSignalementStatut = async (id, statut) => {
  const response = await api.patch(`/signalements/${id}/statut?statut=${statut}`);
  return response.data;
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
  return response.data;
};

/**
 * Récupère l'historique des changements de statut
 */
export const getHistorique = async (signalementId) => {
  const response = await api.get(`/signalements/${signalementId}/historique`);
  return response.data;
};

/**
 * Récupère les signalements de l'utilisateur connecté
 */
export const getMesSignalements = async () => {
  const response = await api.get('/signalements/mes-signalements');
  return response.data;
};

// Helper pour les labels de statut
export const getStatutLabel = (statut) => {
  const labels = {
    'nouveau': 'Nouveau',
    'en_cours': 'En cours',
    'termine': 'Terminé',
    'planifie': 'Planifié',
    'en_attente': 'En attente'
  };
  return labels[statut] || statut;
};

// Helper pour les couleurs de statut
export const getStatutColor = (statut) => {
  const colors = {
    'nouveau': '#f44336',
    'en_cours': '#ff9800',
    'termine': '#4caf50',
    'planifie': '#2196f3',
    'en_attente': '#9c27b0'
  };
  return colors[statut] || '#757575';
};

export default {
  getSignalements,
  getSignalementById,
  getSignalementsByStatut,
  createSignalement,
  updateSignalement,
  updateSignalementStatut,
  deleteSignalement,
  getStatistiques,
  getHistorique,
  getMesSignalements,
  getStatutLabel,
  getStatutColor
};
