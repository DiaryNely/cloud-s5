// Données statiques des utilisateurs
export const utilisateurs = [
  {
    id: 2,
    nom: 'Rakoto',
    prenom: 'Jean',
    email: 'jean.rakoto@sig.mg',
    role: 'utilisateur',
    dateInscription: '2025-12-01',
    bloque: false
  },
  {
    id: 3,
    nom: 'Rasoa',
    prenom: 'Marie',
    email: 'marie.rasoa@sig.mg',
    role: 'utilisateur',
    dateInscription: '2025-12-15',
    bloque: false
  }
];

const comptesUtilisateurs = [
  { email: 'jean.rakoto@sig.mg', password: 'User2026!', userId: 2 },
  { email: 'marie.rasoa@sig.mg', password: 'User2026!', userId: 3 }
];

export const authentifier = (email, password) => {
  const compte = comptesUtilisateurs.find(c => c.email === email && c.password === password);
  
  if (compte) {
    const utilisateur = utilisateurs.find(u => u.id === compte.userId);
    return {
      success: true,
      user: utilisateur,
      token: `token_${Date.now()}_${utilisateur.id}`
    };
  }
  
  return {
    success: false,
    message: 'Email ou mot de passe incorrect'
  };
};
