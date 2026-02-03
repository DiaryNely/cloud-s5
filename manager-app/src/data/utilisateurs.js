// Données statiques des utilisateurs
export const utilisateurs = [
  {
    id: 1,
    email: 'admin@manager.mg',
    nom: 'Admin',
    prenom: 'Manager',
    role: 'manager',
    dateCreation: '2025-12-01T10:00:00',
    actif: true,
    bloque: false,
    derniereConnexion: '2026-01-20T08:30:00'
  },
  {
    id: 2,
    email: 'jean.rakoto@mobile.mg',
    nom: 'Rakoto',
    prenom: 'Jean',
    role: 'mobile',
    dateCreation: '2025-12-15T14:20:00',
    actif: true,
    bloque: false,
    derniereConnexion: '2026-01-19T16:45:00'
  },
  {
    id: 3,
    email: 'marie.andrianina@mobile.mg',
    nom: 'Andrianina',
    prenom: 'Marie',
    role: 'mobile',
    dateCreation: '2025-12-18T09:30:00',
    actif: true,
    bloque: false,
    derniereConnexion: '2026-01-18T11:20:00'
  },
  {
    id: 4,
    email: 'paul.randria@mobile.mg',
    nom: 'Randria',
    prenom: 'Paul',
    role: 'mobile',
    dateCreation: '2026-01-05T11:00:00',
    actif: true,
    bloque: false,
    derniereConnexion: '2026-01-17T14:15:00'
  },
  {
    id: 5,
    email: 'sophie.raharison@mobile.mg',
    nom: 'Raharison',
    prenom: 'Sophie',
    role: 'mobile',
    dateCreation: '2026-01-08T15:45:00',
    actif: true,
    bloque: true,
    derniereConnexion: '2026-01-16T09:00:00'
  },
  {
    id: 6,
    email: 'michel.razafy@mobile.mg',
    nom: 'Razafy',
    prenom: 'Michel',
    role: 'mobile',
    dateCreation: '2026-01-10T10:30:00',
    actif: true,
    bloque: false,
    derniereConnexion: '2026-01-19T13:30:00'
  }
];

// Journal d'audit des actions sensibles
export const journalAudit = [
  {
    id: 1,
    date: '2026-01-20T08:30:00',
    action: 'CONNEXION',
    utilisateur: 'admin@manager.mg',
    details: 'Connexion réussie depuis l\'application web',
    ipAddress: '192.168.1.100'
  },
  {
    id: 2,
    date: '2026-01-19T16:20:00',
    action: 'MODIFICATION_STATUT',
    utilisateur: 'admin@manager.mg',
    details: 'Modification du statut du signalement #2 : nouveau → en_cours',
    ipAddress: '192.168.1.100'
  },
  {
    id: 3,
    date: '2026-01-19T14:15:00',
    action: 'CREATION_UTILISATEUR',
    utilisateur: 'admin@manager.mg',
    details: 'Création du compte utilisateur michel.razafy@mobile.mg',
    ipAddress: '192.168.1.100'
  },
  {
    id: 4,
    date: '2026-01-18T10:00:00',
    action: 'DEBLOCAGE_COMPTE',
    utilisateur: 'admin@manager.mg',
    details: 'Déblocage du compte sophie.raharison@mobile.mg',
    ipAddress: '192.168.1.100'
  },
  {
    id: 5,
    date: '2026-01-18T09:45:00',
    action: 'TENTATIVE_CONNEXION_ECHOUEE',
    utilisateur: 'sophie.raharison@mobile.mg',
    details: 'Tentative de connexion échouée (3ème échec - compte bloqué)',
    ipAddress: '197.158.92.45'
  },
  {
    id: 6,
    date: '2026-01-17T16:30:00',
    action: 'SYNCHRONISATION',
    utilisateur: 'admin@manager.mg',
    details: 'Synchronisation Firebase réussie : 3 signalements envoyés',
    ipAddress: '192.168.1.100'
  },
  {
    id: 7,
    date: '2026-01-17T11:20:00',
    action: 'MODIFICATION_SIGNALEMENT',
    utilisateur: 'admin@manager.mg',
    details: 'Mise à jour du signalement #5 : ajout entreprise et budget',
    ipAddress: '192.168.1.100'
  }
];

// Comptes par défaut pour l'authentification
export const comptesUtilisateurs = [
  {
    email: 'admin@manager.mg',
    password: 'Manager2026!',
    nom: 'Admin',
    prenom: 'Manager',
    role: 'manager'
  },
  {
    email: 'user@app.mg',
    password: 'User2026!',
    nom: 'Utilisateur',
    prenom: 'Demo',
    role: 'utilisateur'
  },
  {
    email: 'rakoto@app.mg',
    password: 'User2026!',
    nom: 'Rakoto',
    prenom: 'Jean',
    role: 'utilisateur'
  }
];

// Fonction pour simuler l'authentification
export const authentifier = (email, password) => {
  const compte = comptesUtilisateurs.find(c => c.email === email && c.password === password);
  
  if (compte) {
    return {
      success: true,
      user: {
        email: compte.email,
        nom: compte.nom,
        prenom: compte.prenom,
        role: compte.role
      },
      token: 'mock-jwt-token-' + Date.now()
    };
  }
  
  return {
    success: false,
    message: 'Email ou mot de passe incorrect'
  };
};
