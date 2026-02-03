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
  const response = await api.patch(`/signalements/${id}/statut`, { statut });
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
 * Récupère les statistiques détaillées de traitement
 */
export const getStatistiquesDetaillees = async () => {
  const response = await api.get('/signalements/statistiques/detaillees');
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

/**
 * Synchronise les signalements vers Firebase
 */
export const syncToFirebase = async () => {
  const response = await api.post('/sync/signalements');
  return response.data;
};

// Helper pour calculer l'avancement selon le statut
export const getAvancementFromStatut = (statut) => {
  const avancements = {
    'nouveau': 0,
    'en_cours': 50,
    'termine': 100
  };
  return avancements[statut] || 0;
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

// Helper pour formater les dates
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper pour calculer la durée de traitement
export const calculerDureeTraitement = (dateDebut, dateFin) => {
  if (!dateDebut || !dateFin) return null;
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const diffMs = fin - debut;
  const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHeures = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffJours > 0) {
    return `${diffJours}j ${diffHeures}h`;
  }
  return `${diffHeures}h`;
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
  getStatistiquesDetaillees,
  getHistorique,
  getMesSignalements,
  syncToFirebase,
  getAvancementFromStatut,
  getStatutLabel,
  getStatutColor,
  formatDate,
  calculerDureeTraitement
};
