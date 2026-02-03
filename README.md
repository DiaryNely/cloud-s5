# Projet Signalements de Travaux Routiers - Antananarivo

Application complète pour la gestion et le suivi des signalements de travaux routiers à Antananarivo, Madagascar.

## Structure du Projet

Le projet est composé de trois applications principales:

### 1. Backend API (`backend-api/`)
- **Framework**: Spring Boot (Java)
- **Base de données**: PostgreSQL avec migrations Flyway
- **Authentification**: Firebase
- **Fonctionnalités**:
  - API REST pour la gestion des signalements
  - Gestion des utilisateurs
  - Système de notifications en temps réel
  - Stockage des cartes hors ligne (MBTiles)

### 2. Application Manager (`manager-app/`)
- **Framework**: React.js
- **Développement**: Vite
- **Fonctionnalités**:
  - Tableau de bord pour les gestionnaires
  - Gestion des signalements
  - Gestion des utilisateurs
  - Synchronisation des données

### 3. Application Mobile (`mobile-signalement/`)
- **Framework**: Ionic Vue.js
- **Capacitor**: Pour l'accès aux APIs natives
- **Fonctionnalités**:
  - Application mobile pour les signalements
  - Fonctionnement hors ligne
  - Capture de localisation
  - Synchronisation automatique

## Installation

### Prérequis
- Node.js (v16+)
- Java JDK (v11+)
- Maven
- Git

### Installation globale

```bash
# Clone le repository
git clone <repository-url>
cd formation

# Backend
cd backend-api
mvn clean install

# Manager App
cd ../manager-app
npm install

# Mobile App
cd ../mobile-signalement
npm install
```

## Démarrage

### Backend
```bash
cd backend-api
mvn spring-boot:run
```

### Manager App
```bash
cd manager-app
npm run dev
```

### Mobile App (Web)
```bash
cd mobile-signalement
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         Mobile App (Ionic Vue.js)           │
│  ┌──────────────────────────────────────┐   │
│  │    GPS, Caméra, Stockage Local       │   │
│  │    (via Capacitor)                   │   │
│  └──────────────────────────────────────┘   │
└─────────────────┬───────────────────────────┘
                  │
         ┌────────▼─────────┐
         │   Backend API    │
         │   (Spring Boot)  │
         │   - REST API     │
         │   - Firebase Auth│
         │   - PostgreSQL   │
         └────────┬─────────┘
                  │
     ┌────────────┴────────────┐
     │                         │
┌────▼────┐            ┌──────▼──┐
│ Manager  │            │ Mobile  │
│   App    │            │   App   │
│ (React)  │            │ (Ionic) │
└──────────┘            └─────────┘
```

## Variables d'Environnement

Créez un fichier `.env` dans chaque projet selon les modèles fournis.

## Documentation

- [Backend API Docs](backend-api/README.md)
- [Manager App Docs](manager-app/README.md)
- [Mobile App Docs](mobile-signalement/README.md)

## Contribution

1. Créer une branche pour votre feature
2. Commiter vos changements
3. Pusher vers la branche
4. Ouvrir une Pull Request

## Licence

MIT

## Contact

Pour plus d'informations, consultez les README individuels de chaque application.
