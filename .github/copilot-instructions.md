# Cloud S5 P17 - Mobile App Setup Instructions

## Project Overview
Ionic Vue.js mobile application for road incident reporting system (signalements).

## Setup Checklist

- [x] Create project instructions file
- [ ] Scaffold Ionic Vue.js project
- [ ] Setup API client and authentication
- [ ] Create map view with Leaflet
- [ ] Create signalement form
- [ ] Install dependencies and compile
- [ ] Test and launch application

## Technology Stack
- Ionic Framework 7+
- Vue 3 (Composition API)
- TypeScript
- Capacitor (native features)
- Leaflet (maps)
- Axios (API client)

## Backend API
- Base URL: http://localhost:8083
- Endpoints: /api/auth, /api/signalements

## Project Structure
```
cloud-s5-p17-mobile/
├── src/
│   ├── views/          # Page components
│   ├── components/     # Reusable components
│   ├── services/       # API clients
│   ├── composables/    # Vue composables
│   └── router/         # Vue router config
├── public/             # Static assets
└── capacitor.config.ts # Capacitor config
```
