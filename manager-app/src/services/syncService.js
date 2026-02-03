import api from './api';

/**
 * Service de synchronisation Firebase/PostgreSQL
 */

/**
 * Déclenche une synchronisation manuelle vers Firebase
 * @returns {Promise<Object>} Résultat de la synchronisation
 */
export const manualSync = async () => {
  const response = await api.post('/sync/manual');
  return response.data;
};

/**
 * Obtient le statut de la synchronisation
 * @returns {Promise<Object>} Statut actuel (isSyncing, lastSyncDate, isOnline)
 */
export const getSyncStatus = async () => {
  const response = await api.get('/sync/status');
  return response.data;
};

/**
 * Force la vérification de la connectivité Firebase
 * @returns {Promise<Object>} État de la connexion
 */
export const checkConnectivity = async () => {
  const response = await api.post('/sync/check-connectivity');
  return response.data;
};

export default {
  manualSync,
  getSyncStatus,
  checkConnectivity
};
