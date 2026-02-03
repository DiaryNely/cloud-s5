// Données statiques des signalements
export const signalements = [
  {
    id: 1,
    localisation: 'Avenue de l\'Indépendance, Analakely',
    latitude: -18.9137,
    longitude: 47.5214,
    description: 'Réfection complète de la chaussée principale',
    statut: 'en_cours',
    dateCreation: '2026-01-10T08:00:00Z',
    surface: 1500,
    budgetEstime: 25000000,
    creePar: 'user@app.mg'
  },
  {
    id: 2,
    localisation: 'Route Digue, près du Lac Anosy',
    latitude: -18.9204,
    longitude: 47.5267,
    description: 'Nettoyage et élargissement de la voie',
    statut: 'planifie',
    dateCreation: '2026-01-12T09:30:00Z',
    surface: 800,
    budgetEstime: 12000000,
    creePar: 'rakoto@app.mg'
  },
  {
    id: 3,
    localisation: 'Avenue Rainilaiarivony, Isoraka',
    latitude: -18.9089,
    longitude: 47.5289,
    description: 'Réparation des nids-de-poule',
    statut: 'termine',
    dateCreation: '2025-12-20T10:00:00Z',
    surface: 600,
    budgetEstime: 8000000,
    creePar: 'user@app.mg'
  },
  {
    id: 4,
    localisation: 'Boulevard de l\'Europe, Ambohijatovo',
    latitude: -18.9176,
    longitude: 47.5342,
    description: 'Construction d\'un passage piéton',
    statut: 'en_cours',
    dateCreation: '2026-01-08T08:30:00Z',
    surface: 400,
    budgetEstime: 9000000,
    creePar: 'user@app.mg'
  }
];

export const calculerStatistiques = () => {
  return {
    total: signalements.length,
    enCours: signalements.filter(s => s.statut === 'en_cours').length,
    termine: signalements.filter(s => s.statut === 'termine').length,
    planifie: signalements.filter(s => s.statut === 'planifie').length,
    budgetTotal: signalements.reduce((sum, s) => sum + s.budgetEstime, 0)
  };
};

export const getStatutLabel = (statut) => {
  const labels = {
    'en_cours': 'En cours',
    'planifie': 'Planifié',
    'termine': 'Terminé',
    'en_attente': 'En attente'
  };
  return labels[statut] || statut;
};

export const getStatutColor = (statut) => {
  const colors = {
    'en_cours': 'primary',
    'planifie': 'warning',
    'termine': 'success',
    'en_attente': 'medium'
  };
  return colors[statut] || 'medium';
};
