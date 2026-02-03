# Manager App - Application de Suivi des Travaux Routiers

Application React complète pour la gestion des travaux routiers à Antananarivo avec des données statiques.

## 🚀 Fonctionnalités

### Pour les Visiteurs (sans authentification)
- **Carte interactive** : Visualisation de tous les signalements sur une carte d'Antananarivo
- **Statistiques globales** : Vue d'ensemble des travaux (nouveaux, en cours, terminés)
- **Tableau récapitulatif** : Surface totale, budget total, pourcentage d'avancement

### Pour les Utilisateurs (avec authentification)
- **Création de signalements** : Signaler des problèmes routiers avec localisation GPS
- **Mes signalements** : 
  - Voir uniquement ses propres signalements
  - Carte personnalisée avec ses signalements
  - Statistiques de ses signalements
  - Suivi de l'évolution des statuts

### Pour les Managers (avec authentification)
- **Tableau de bord** : Vue d'ensemble avec statistiques en temps réel
- **Gestion des signalements** :
  - Liste complète avec filtres
  - Modification du statut (nouveau, en cours, terminé)
  - Mise à jour des informations (surface, budget, entreprise)
  - Consultation de l'historique des modifications
- **Gestion des utilisateurs** :
  - Création de nouveaux comptes utilisateurs mobiles
  - Déblocage des comptes bloqués
  - Consultation du journal d'audit
- **Synchronisation** : Bouton pour simuler la synchronisation avec Firebase

## 📦 Installation

1. **Installer les dépendances**
```bash
cd manager-app
npm install
```

2. **Lancer l'application**
```bash
npm start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🔑 Identifiants de connexion

**Compte Manager :**
- Email: `admin@manager.mg`
- Mot de passe: `Manager2026!`
- Accès : Gestion complète des signalements et utilisateurs

**Comptes Utilisateur :**
- Email: `user@app.mg`
- Mot de passe: `User2026!`
- Accès : Création de signalements et consultation de ses propres signalements

OU

- Email: `rakoto@app.mg`
- Mot de passe: `User2026!`
- Accès : Création de signalements et consultation de ses propres signalements

**Visiteur :**
- Aucune connexion requise
- Accès : Consultation de la carte et des statistiques uniquement

## 🗺️ Structure du projet

```
manager-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js              # En-tête avec navigation adaptative
│   │   ├── MapComponent.js        # Carte Leaflet avec marqueurs
│   │   ├── ProtectedRoute.js      # Protection routes Manager
│   │   └── ProtectedUserRoute.js  # Protection routes Utilisateur
│   ├── context/
│   │   └── AuthContext.js         # Gestion authentification multi-rôles
│   ├── data/
│   │   ├── signalements.js        # Données des signalements
│   │   └── utilisateurs.js        # Données des utilisateurs et comptes
│   ├── pages/
│   │   ├── HomePage.js            # Page d'accueil visiteur
│   │   ├── LoginPage.js           # Page de connexion manager
│   │   ├── LoginUserPage.js       # Page de connexion utilisateur
│   │   ├── DashboardPage.js       # Tableau de bord manager
│   │   ├── SignalementsPage.js    # Gestion signalements (manager)
│   │   ├── UsersPage.js           # Gestion des utilisateurs (manager)
│   │   ├── CreateSignalementPage.js    # Création signalement (utilisateur)
│   │   └── UserSignalementsPage.js     # Mes signalements (utilisateur)
│   ├── App.js                     # Configuration des routes
│   ├── App.css                    # Styles globaux
│   ├── index.js                   # Point d'entrée
│   └── index.css
├── package.json
└── README.md
```

## 🛠️ Technologies utilisées

- **React 18** : Framework JavaScript
- **React Router 6** : Gestion du routage
- **Material-UI (MUI) 5** : Composants UI
- **React-Leaflet** : Intégration de cartes interactives
- **Leaflet** : Bibliothèque de cartographie

## 📊 Données statiques

### Signalements
- 8 signalements répartis à Antananarivo
- Statuts variés : nouveau, en cours, terminé
- Informations complètes : localisation, surface, budget, entreprise

### Utilisateurs
- 6 utilisateurs (1 manager, 5 mobiles)
- Gestion des comptes bloqués
- Journal d'audit des actions

### Comptes de connexion
- 1 compte Manager (gestion complète)
- 2 comptes Utilisateur (création et suivi de signalements)
- Visiteurs (accès sans connexion)

## 🎨 Fonctionnalités détaillées

### Carte interactive
- Marqueurs colorés par statut (rouge: nouveau, orange: en cours, vert: terminé)
- Popups avec informations détaillées
- Centrage automatique sur Antananarivo
- Filtrage des signalements par utilisateur (pour les utilisateurs connectés)

### Gestion des signalements (Manager)
- Tableau avec tous les signalements
- Modification en temps réel du statut
- Dialog d'édition avec formulaire complet
- Historique avec liste visuelle

### Création de signalements (Utilisateur)
- Formulaire complet avec coordonnées GPS
- Champs : localisation, latitude, longitude, description, surface, budget
- Validation des données
- Sauvegarde dans localStorage

### Mes signalements (Utilisateur)
- Liste filtrée des signalements personnels
- Carte interactive avec uniquement ses signalements
- Statistiques personnelles
- Suivi de l'évolution des statuts

### Gestion des utilisateurs (Manager)
- Statistiques des comptes
- Création de nouveaux utilisateurs
- Déblocage en un clic
- Journal d'audit complet

## 🚀 Build pour production

```bash
npm run build
```

Le build sera créé dans le dossier `build/` et sera prêt pour le déploiement.

## 📝 Notes importantes

- **Données statiques uniquement** : Toutes les modifications sont en mémoire et disparaissent au rechargement
- **Pas de backend** : L'authentification et toutes les opérations sont simulées côté client
- **Carte centrée sur Antananarivo** : Coordonnées : -18.8792, 47.5079
- **Responsive** : L'application s'adapte aux différentes tailles d'écran

## 🔮 Évolutions possibles

Pour transformer cette application en version production :
1. Connecter à une vraie API REST
2. Intégrer Firebase Authentication
3. Ajouter PostgreSQL pour la persistance
4. Implémenter la synchronisation offline/online réelle
5. Ajouter plus de filtres et de recherches
6. Exporter les données en PDF/Excel

## 🆘 Support

Pour toute question ou problème, consultez la documentation React ou Material-UI :
- [Documentation React](https://react.dev)
- [Documentation Material-UI](https://mui.com)
- [Documentation React-Leaflet](https://react-leaflet.js.org)
