// Données statiques des signalements routiers d'Antananarivo
// Stockage local (modifiable à l'exécution)
let signalementsList = [
  {
    id: 1,
    latitude: -18.8792,
    longitude: 47.5079,
    dateCreation: '2026-01-15T10:30:00',
    dateDebutTravaux: null,
    dateFinTravaux: null,
    statut: 'nouveau',
    avancement: 0,
    surface: 150,
    budgetEstime: 45000000,
    entreprise: 'COLAS Madagascar',
    description: 'Nids de poule importants sur la route principale',
    creePar: 'Jean Rakoto',
    localisation: 'Avenue de l\'Indépendance',
    syncedWithFirebase: false
  },
  {
    id: 2,
    latitude: -18.9134,
    longitude: 47.5361,
    dateCreation: '2026-01-10T14:20:00',
    dateDebutTravaux: '2026-01-12T09:00:00',
    dateFinTravaux: null,
    statut: 'en_cours',
    avancement: 50,
    surface: 320,
    budgetEstime: 96000000,
    entreprise: 'Entreprise Rasoanaivo',
    description: 'Affaissement de chaussée nécessitant réfection complète',
    creePar: 'Marie Andrianina',
    localisation: 'Route de Talatamaty',
    syncedWithFirebase: true
  },
  {
    id: 3,
    latitude: -18.8656,
    longitude: 47.5208,
    dateCreation: '2026-01-08T09:15:00',
    dateDebutTravaux: '2026-01-09T10:00:00',
    dateFinTravaux: '2026-01-11T16:30:00',
    statut: 'termine',
    avancement: 100,
    surface: 85,
    budgetEstime: 25500000,
    entreprise: 'SOGEA',
    description: 'Revêtement dégradé suite aux pluies',
    creePar: 'Paul Randria',
    localisation: 'Analakely - Centre ville',
    syncedWithFirebase: true
  },
  {
    id: 4,
    latitude: -18.9088,
    longitude: 47.5267,
    dateCreation: '2026-01-18T16:45:00',
    dateDebutTravaux: null,
    dateFinTravaux: null,
    statut: 'nouveau',
    avancement: 0,
    surface: 220,
    budgetEstime: 66000000,
    entreprise: null,
    description: 'Fissures importantes et déformation de la voie',
    creePar: 'Sophie Raharison',
    localisation: 'Ankorondrano',
    syncedWithFirebase: false
  },
  {
    id: 5,
    latitude: -18.8845,
    longitude: 47.5156,
    dateCreation: '2026-01-12T11:30:00',
    dateDebutTravaux: '2026-01-13T14:00:00',
    dateFinTravaux: null,
    statut: 'en_cours',
    avancement: 50,
    surface: 180,
    budgetEstime: 54000000,
    entreprise: 'Tsarafara Construction',
    description: 'Dégradation avancée de la couche de roulement',
    creePar: 'Michel Razafy',
    localisation: 'Ambohijatovo',
    syncedWithFirebase: true
  },
  {
    id: 6,
    latitude: -18.9201,
    longitude: 47.5418,
    dateCreation: '2026-01-05T08:00:00',
    dateDebutTravaux: '2026-01-06T09:30:00',
    dateFinTravaux: '2026-01-07T17:00:00',
    statut: 'termine',
    avancement: 100,
    surface: 95,
    budgetEstime: 28500000,
    entreprise: 'Groupe Zanaka',
    description: 'Réparation de zones affaissées',
    creePar: 'Hery Ramanana',
    localisation: 'Ivandry',
    syncedWithFirebase: true
  },
  {
    id: 7,
    latitude: -18.8923,
    longitude: 47.5324,
    dateCreation: '2026-01-14T13:00:00',
    dateDebutTravaux: '2026-01-15T08:00:00',
    dateFinTravaux: null,
    statut: 'en_cours',
    avancement: 50,
    surface: 275,
    budgetEstime: 82500000,
    entreprise: 'COLAS Madagascar',
    description: 'Réfection complète du tronçon dégradé',
    creePar: 'Nadia Rakotobe',
    localisation: 'Andohalo',
    syncedWithFirebase: true
  },
  {
    id: 8,
    latitude: -18.8712,
    longitude: 47.5112,
    dateCreation: '2026-01-17T10:15:00',
    dateDebutTravaux: null,
    dateFinTravaux: null,
    statut: 'nouveau',
    avancement: 0,
    surface: 140,
    budgetEstime: 42000000,
    entreprise: null,
    description: 'Multiples nids de poule dangereux',
    creePar: 'Liva Andriamaro',
    localisation: 'Faravohitra',
    syncedWithFirebase: false
  }
];

// Getter pour les signalements (retourne une copie)
export const signalements = signalementsList;

// Fonction pour obtenir l'avancement selon le statut
export const getAvancementFromStatut = (statut) => {
  const avancements = {
    'nouveau': 0,
    'en_cours': 50,
    'termine': 100
  };
  return avancements[statut] || 0;
};

// Mettre à jour un signalement localement
export const updateSignalementLocal = (id, updates) => {
  const index = signalementsList.findIndex(s => s.id === id);
  if (index !== -1) {
    const oldStatut = signalementsList[index].statut;
    const newStatut = updates.statut || oldStatut;
    
    // Gérer les dates d'avancement automatiquement
    const now = new Date().toISOString();
    let dateDebutTravaux = signalementsList[index].dateDebutTravaux;
    let dateFinTravaux = signalementsList[index].dateFinTravaux;
    
    if (oldStatut === 'nouveau' && newStatut === 'en_cours') {
      dateDebutTravaux = now;
    }
    if (newStatut === 'termine' && !dateFinTravaux) {
      dateFinTravaux = now;
      if (!dateDebutTravaux) {
        dateDebutTravaux = now; // Si on passe directement à terminé
      }
    }
    
    // Calculer l'avancement
    const avancement = getAvancementFromStatut(newStatut);
    
    signalementsList[index] = {
      ...signalementsList[index],
      ...updates,
      dateDebutTravaux,
      dateFinTravaux,
      avancement,
      syncedWithFirebase: false // Marquer comme non synchronisé
    };
    
    // Ajouter à l'historique
    if (oldStatut !== newStatut) {
      addHistoriqueEntry(id, {
        date: now,
        ancienStatut: oldStatut,
        nouveauStatut: newStatut,
        modifiePar: 'Manager Admin',
        commentaire: `Statut changé de ${getStatutLabel(oldStatut)} à ${getStatutLabel(newStatut)}`
      });
    }
    
    return signalementsList[index];
  }
  return null;
};

// Obtenir tous les signalements
export const getSignalementsLocal = () => {
  return [...signalementsList];
};

// Obtenir un signalement par ID
export const getSignalementByIdLocal = (id) => {
  return signalementsList.find(s => s.id === id);
};

// Ajouter un nouveau signalement
export const addSignalementLocal = (signalement) => {
  const newId = Math.max(...signalementsList.map(s => s.id)) + 1;
  const now = new Date().toISOString();
  const newSignalement = {
    ...signalement,
    id: newId,
    dateCreation: now,
    dateDebutTravaux: null,
    dateFinTravaux: null,
    statut: 'nouveau',
    avancement: 0,
    syncedWithFirebase: false
  };
  signalementsList.push(newSignalement);
  
  // Initialiser l'historique
  historiqueStatuts[newId] = [
    { date: now, statut: 'nouveau', modifiePar: 'Système', commentaire: 'Signalement créé' }
  ];
  
  return newSignalement;
};

// Obtenir les signalements non synchronisés
export const getUnsyncedSignalements = () => {
  return signalementsList.filter(s => !s.syncedWithFirebase);
};

// Marquer les signalements comme synchronisés
export const markAsSynced = (ids) => {
  ids.forEach(id => {
    const index = signalementsList.findIndex(s => s.id === id);
    if (index !== -1) {
      signalementsList[index].syncedWithFirebase = true;
    }
  });
};

// Historique des changements de statut
export const historiqueStatuts = {
  1: [
    { date: '2026-01-15T10:30:00', statut: 'nouveau', modifiePar: 'Système', commentaire: 'Signalement créé' }
  ],
  2: [
    { date: '2026-01-10T14:20:00', statut: 'nouveau', modifiePar: 'Système', commentaire: 'Signalement créé' },
    { date: '2026-01-12T09:00:00', statut: 'en_cours', modifiePar: 'Manager Admin', commentaire: 'Travaux démarrés par Entreprise Rasoanaivo' }
  ],
  3: [
    { date: '2026-01-08T09:15:00', statut: 'nouveau', modifiePar: 'Système', commentaire: 'Signalement créé' },
    { date: '2026-01-09T10:00:00', statut: 'en_cours', modifiePar: 'Manager Admin', commentaire: 'Intervention SOGEA programmée' },
    { date: '2026-01-11T16:30:00', statut: 'termine', modifiePar: 'Manager Admin', commentaire: 'Travaux terminés avec succès' }
  ],
  4: [
    { date: '2026-01-18T16:45:00', statut: 'nouveau', modifiePar: 'Système', commentaire: 'Signalement créé' }
  ],
  5: [
    { date: '2026-01-12T11:30:00', statut: 'nouveau', modifiePar: 'Système', commentaire: 'Signalement créé' },
    { date: '2026-01-13T14:00:00', statut: 'en_cours', modifiePar: 'Manager Admin', commentaire: 'Début des travaux' }
  ],
  6: [
    { date: '2026-01-05T08:00:00', statut: 'nouveau', modifiePar: 'Système', commentaire: 'Signalement créé' },
    { date: '2026-01-06T09:30:00', statut: 'en_cours', modifiePar: 'Manager Admin', commentaire: 'Groupe Zanaka commence les réparations' },
    { date: '2026-01-07T17:00:00', statut: 'termine', modifiePar: 'Manager Admin', commentaire: 'Réparations achevées' }
  ],
  7: [
    { date: '2026-01-14T13:00:00', statut: 'nouveau', modifiePar: 'Système', commentaire: 'Signalement créé' },
    { date: '2026-01-15T08:00:00', statut: 'en_cours', modifiePar: 'Manager Admin', commentaire: 'COLAS Madagascar débute la réfection' }
  ],
  8: [
    { date: '2026-01-17T10:15:00', statut: 'nouveau', modifiePar: 'Système', commentaire: 'Signalement créé' }
  ]
};

// Statistiques globales
export const calculerStatistiques = () => {
  const total = signalements.length;
  const surfaceTotale = signalements.reduce((acc, s) => acc + s.surface, 0);
  const budgetTotal = signalements.reduce((acc, s) => acc + s.budgetEstime, 0);
  
  const termines = signalements.filter(s => s.statut === 'termine').length;
  const enCours = signalements.filter(s => s.statut === 'en_cours').length;
  const nouveaux = signalements.filter(s => s.statut === 'nouveau').length;
  
  const pourcentageAvancement = ((termines / total) * 100).toFixed(1);
  
  return {
    totalSignalements: total,
    surfaceTotale,
    budgetTotal,
    termines,
    enCours,
    nouveaux,
    pourcentageAvancement
  };
};

// Fonction pour obtenir le label du statut
export const getStatutLabel = (statut) => {
  const labels = {
    'nouveau': 'Nouveau',
    'en_cours': 'En cours',
    'termine': 'Terminé'
  };
  return labels[statut] || statut;
};

// Fonction pour obtenir la couleur du statut
export const getStatutColor = (statut) => {
  const colors = {
    'nouveau': '#f44336',
    'en_cours': '#ff9800',
    'termine': '#4caf50'
  };
  return colors[statut] || '#757575';
};
