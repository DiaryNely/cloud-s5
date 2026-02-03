# API Backend - Signalements Routiers Antananarivo

## 🚀 Démarrage Rapide

### Prérequis
- Java 17+
- Maven 3.8+
- Docker & Docker Compose (optionnel)
- PostgreSQL 15+ (si sans Docker)

### Avec Docker (Recommandé)

```bash
# Cloner et démarrer
cd backend-api
docker-compose up -d

# L'API est disponible sur http://localhost:8080/api
# Swagger UI : http://localhost:8080/api/swagger-ui.html
# pgAdmin : http://localhost:5050 (profil dev)
```

### Sans Docker

```bash
# Configurer PostgreSQL localement
createdb signalements_db

# Configurer les variables d'environnement
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/signalements_db
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=votre_mot_de_passe

# Lancer l'application
./mvnw spring-boot:run
```

## 📚 Documentation API

Swagger UI disponible sur : `http://localhost:8080/api/swagger-ui.html`

### Endpoints Principaux

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/auth/login` | Authentification | Non |
| POST | `/auth/refresh` | Rafraîchir token | Non |
| POST | `/auth/logout` | Déconnexion | Oui |
| GET | `/signalements` | Liste signalements | Non |
| POST | `/signalements` | Créer signalement | Oui |
| GET | `/signalements/statistiques` | Stats globales | Non |
| GET | `/signalements/mes-signalements` | Mes signalements | Oui |
| GET | `/users` | Liste utilisateurs | MANAGER |
| GET | `/users/me` | Profil utilisateur | Oui |
| GET | `/config/map` | Config carte | Non |
| GET | `/entreprises` | Liste entreprises | Non |

## 🔐 Authentification

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@manager.mg", "password": "Manager2026!"}'
```

Réponse :
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJI...",
    "refreshToken": "abc123...",
    "expiresIn": 3600,
    "utilisateur": {
      "id": 1,
      "email": "admin@manager.mg",
      "nom": "Admin Manager",
      "role": "MANAGER"
    }
  }
}
```

### Utiliser le token
```bash
curl http://localhost:8080/api/signalements/mes-signalements \
  -H "Authorization: Bearer eyJhbGciOiJI..."
```

## 🔄 Intégration Frontend

### Configuration Axios (React/Vue)

```javascript
// api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('token', data.data.token);
          error.config.headers.Authorization = `Bearer ${data.data.token}`;
          return api.request(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Signalements (React)

```javascript
// services/signalementService.js
import api from './api';

export const signalementService = {
  getAll: () => api.get('/signalements'),
  getById: (id) => api.get(`/signalements/${id}`),
  create: (data) => api.post('/signalements', data),
  update: (id, data) => api.put(`/signalements/${id}`, data),
  updateStatut: (id, statut) => api.patch(`/signalements/${id}/statut?statut=${statut}`),
  delete: (id) => api.delete(`/signalements/${id}`),
  getStatistiques: () => api.get('/signalements/statistiques'),
  getMesSignalements: () => api.get('/signalements/mes-signalements')
};
```

### Service Auth (Vue 3 Composable)

```javascript
// composables/useAuth.js
import { ref } from 'vue';
import api from '@/services/api';

const user = ref(null);
const token = ref(localStorage.getItem('token'));

export function useAuth() {
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      token.value = data.data.token;
      user.value = data.data.utilisateur;
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      token.value = null;
      user.value = null;
      localStorage.clear();
    }
  };

  const isAuthenticated = () => !!token.value;
  const isManager = () => user.value?.role === 'MANAGER';

  return { user, token, login, logout, isAuthenticated, isManager };
}
```

### Configuration Carte Leaflet

```javascript
// Récupérer la config depuis l'API
const { data } = await api.get('/config/map');
const mapConfig = data.data;

// Initialiser Leaflet
const map = L.map('map').setView(
  [mapConfig.center.lat, mapConfig.center.lng], 
  mapConfig.defaultZoom
);

L.tileLayer(mapConfig.tileUrl, {
  attribution: mapConfig.attribution,
  maxZoom: mapConfig.maxZoom
}).addTo(map);
```

## 🗄️ Migration des Données Statiques

### Étape 1 : Remplacer signalements.js

**Avant (données statiques)** :
```javascript
// data/signalements.js
export const signalements = [...];
```

**Après (API)** :
```javascript
// services/signalementService.js
import api from './api';

export async function getSignalements() {
  const { data } = await api.get('/signalements');
  return data.data;
}
```

### Étape 2 : Remplacer utilisateurs.js

**Avant** :
```javascript
export const utilisateurs = [...];
```

**Après** :
```javascript
import api from './api';

export async function getUtilisateurs() {
  const { data } = await api.get('/users');
  return data.data;
}
```

## 🐳 Architecture Docker

```
┌─────────────────────────────────────────────────────────────┐
│                    sig-network                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   postgres   │  │  tileserver  │  │   backend    │      │
│  │   :5432      │  │   :8081      │  │   :8080      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                                   │               │
│         └───────────────────────────────────┘               │
│                                                             │
│  ┌──────────────┐                                          │
│  │   pgadmin    │  (profil dev uniquement)                 │
│  │   :5050      │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `SPRING_PROFILES_ACTIVE` | Profil Spring | `dev` |
| `SPRING_DATASOURCE_URL` | URL PostgreSQL | `jdbc:postgresql://localhost:5432/signalements_db` |
| `JWT_SECRET` | Clé secrète JWT (64+ chars) | Valeur dev |
| `FIREBASE_CREDENTIALS_PATH` | Chemin credentials Firebase | - |
| `MAP_TILES_URL` | URL serveur tuiles | OSM |

### Fichier .env

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

## 📊 Comptes de Test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@manager.mg` | `Manager2026!` | MANAGER |
| `user@app.mg` | `User2026!` | USER |

## 🛠️ Développement

### Lancer les tests
```bash
./mvnw test
```

### Générer le rapport de couverture
```bash
./mvnw verify
```

### Reconstruire les images Docker
```bash
docker-compose build --no-cache
docker-compose up -d
```

## 📝 Notes

- Les signalements ont un historique de changements de statut
- Le système de blocage compte les tentatives de connexion échouées
- Firebase est optionnel : le système fonctionne en mode offline avec PostgreSQL
- Les tuiles OSM peuvent être hébergées localement pour le mode hors-ligne
