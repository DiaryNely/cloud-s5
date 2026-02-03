import api from './api';

/**
 * Récupère la configuration de la carte
 */
export const getMapConfig = async () => {
  const response = await api.get('/config/map');
  return response.data.data;
};

export default {
  getMapConfig
};
