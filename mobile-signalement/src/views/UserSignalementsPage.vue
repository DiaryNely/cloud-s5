<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <div class="header-content">
            <span class="header-icon">◈</span>
            Tableau de bord
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout" class="logout-btn">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Offline banner -->
      <div v-if="!isOnline" class="offline-banner">
        <ion-icon :icon="cloudOfflineOutline"></ion-icon>
        <span>Mode hors ligne - Données en cache</span>
      </div>

      <!-- Pending sync indicator -->
      <div v-if="pendingCount > 0" class="sync-banner" @click="syncPending">
        <ion-icon :icon="syncOutline"></ion-icon>
        <span>{{ pendingCount }} signalement(s) en attente de synchronisation</span>
        <ion-spinner v-if="syncing" name="crescent"></ion-spinner>
      </div>

      <!-- Section Header -->
      <div class="section-header">
        <h2 class="section-title">Mes interventions</h2>
        <p class="section-subtitle">
          {{ isFromCache ? 'Données hors ligne' : 'Gérez vos signalements d\'infrastructure' }}
        </p>
      </div>

      <!-- Filter chips -->
      <div class="filter-container">
        <ion-chip 
          :class="{ 'chip-active': selectedFilter === 'tous' }" 
          @click="selectedFilter = 'tous'"
        >
          <span class="chip-count">{{ mesSignalements.length }}</span>
          <ion-label>Tous</ion-label>
        </ion-chip>
        <ion-chip 
          :class="{ 'chip-active chip-warning': selectedFilter === 'en_cours' }" 
          @click="selectedFilter = 'en_cours'"
        >
          <ion-label>En cours</ion-label>
        </ion-chip>
        <ion-chip 
          :class="{ 'chip-active chip-success': selectedFilter === 'termine' }" 
          @click="selectedFilter = 'termine'"
        >
          <ion-label>Terminé</ion-label>
        </ion-chip>
      </div>

      <!-- Map Section -->
      <div class="map-section">
        <h3 class="map-title">Carte des interventions</h3>
        <div id="user-map" ref="mapContainer" class="user-map"></div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredSignalements.length === 0" class="empty-state">
        <div class="empty-illustration">
          <ion-icon :icon="documentTextOutline"></ion-icon>
        </div>
        <h2>Aucune donnée</h2>
        <p v-if="selectedFilter === 'tous'">Démarrez en créant votre première intervention</p>
        <p v-else>Aucune intervention avec ce statut</p>
        <ion-button @click="goToCreate" v-if="selectedFilter === 'tous'" class="empty-cta">
          <ion-icon slot="start" :icon="addCircleOutline"></ion-icon>
          Nouvelle intervention
        </ion-button>
      </div>

      <!-- Signalements list -->
      <div v-else class="cards-grid">
        <ion-card v-for="sig in filteredSignalements" :key="sig.id" class="signalement-card">
          <div class="card-status-indicator" :class="getStatutColor(sig.statut)"></div>
          <ion-card-header>
            <div class="card-header-row">
              <ion-card-title>{{ sig.localisation }}</ion-card-title>
              <ion-badge :color="getStatutColor(sig.statut)">
                {{ getStatutLabel(sig.statut) }}
              </ion-badge>
            </div>
            <p class="card-description">{{ sig.description }}</p>
          </ion-card-header>
          <ion-card-content>
            <div class="card-metrics">
              <div class="metric">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <div class="metric-content">
                  <span class="metric-value">{{ formatDate(sig.dateCreation) }}</span>
                  <span class="metric-label">Date</span>
                </div>
              </div>
              <div class="metric">
                <ion-icon :icon="cashOutline"></ion-icon>
                <div class="metric-content">
                  <span class="metric-value">{{ formatBudget(sig.budgetEstime) }}</span>
                  <span class="metric-label">Budget</span>
                </div>
              </div>
              <div class="metric">
                <ion-icon :icon="squareOutline"></ion-icon>
                <div class="metric-content">
                  <span class="metric-value">{{ sig.surface }} m²</span>
                  <span class="metric-label">Surface</span>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- FAB -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="goToCreate">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonIcon,
  IonButton,
  IonButtons,
  IonChip,
  IonLabel,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/vue';
import {
  logOutOutline,
  documentTextOutline,
  addCircleOutline,
  calendarOutline,
  cashOutline,
  squareOutline,
  addOutline,
  cloudOfflineOutline,
  syncOutline
} from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getStatutLabel, getStatutColor } from '../services/signalementService';
import api from '../services/api';
import { 
  syncPendingSignalements,
  isOnline as checkOnline,
  onNetworkChange,
  getLocalSignalements
} from '../services/offlineService';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { user, logout } = useAuth();
const selectedFilter = ref('tous');
const mesSignalements = ref([]);
const loading = ref(false);
const isOnline = ref(true);
const isFromCache = ref(false);
const pendingCount = ref(0);
const syncing = ref(false);
const mapContainer = ref(null);
let map = null;

const filteredSignalements = computed(() => {
  if (!mesSignalements.value || !Array.isArray(mesSignalements.value)) {
    return [];
  }
  if (selectedFilter.value === 'tous') {
    return mesSignalements.value;
  }
  return mesSignalements.value.filter(s => {
    const statut = (s.statut || '').toUpperCase();
    const filter = selectedFilter.value.toUpperCase();
    return statut === filter;
  });
});

const loadSignalements = async () => {
  loading.value = true;
  try {
    const online = await checkOnline();
    if (online) {
      // Utiliser l'API REST qui filtre côté serveur par l'utilisateur connecté (JWT)
      const response = await api.get('/signalements/mes-signalements');
      mesSignalements.value = response.data || [];
      isFromCache.value = false;
    } else {
      // Mode offline : données locales filtrées par email
      const cached = await getLocalSignalements();
      const userEmail = user.value?.email || '';
      mesSignalements.value = userEmail
        ? cached.filter(s => s.creePar === userEmail)
        : cached;
      isFromCache.value = true;
    }
    pendingCount.value = 0;
    updateMap();
  } catch (error) {
    console.error('Erreur chargement signalements:', error);
    // Fallback : données locales
    try {
      const cached = await getLocalSignalements();
      mesSignalements.value = cached;
      isFromCache.value = true;
    } catch (e) {
      mesSignalements.value = [];
    }
  } finally {
    loading.value = false;
  }
};

const initMap = () => {
  if (map || !mapContainer.value) return;
  
  map = L.map('user-map').setView([-18.8792, 47.5079], 12);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  updateMap();
};

const updateMap = () => {
  if (!map) return;
  
  // Supprimer les anciens marqueurs
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
  
  // Ajouter les nouveaux marqueurs
  const validSignalements = mesSignalements.value.filter(s => s.latitude && s.longitude);
  
  if (validSignalements.length > 0) {
    const bounds = [];
    
    validSignalements.forEach(sig => {
      const lat = parseFloat(sig.latitude);
      const lng = parseFloat(sig.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        bounds.push([lat, lng]);
        
        // Couleur du marqueur selon le statut
        const colorMap = {
          'nouveau': '#ef4444',
          'en_cours': '#f59e0b',
          'termine': '#10b981',
          'planifie': '#3b82f6',
          'en_attente': '#6b7280'
        };
        const color = colorMap[sig.statut] || '#6b7280';
        
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map);
        
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${sig.localisation}</h3>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${sig.description}</p>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #888;">
              <span>${sig.surface} m²</span>
              <span style="color: ${color}; font-weight: 600;">${getStatutLabel(sig.statut)}</span>
            </div>
          </div>
        `);
      }
    });
    
    // Ajuster la vue pour montrer tous les marqueurs
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
};

const syncPending = async () => {
  if (syncing.value || !isOnline.value) return;
  
  syncing.value = true;
  try {
    const result = await syncPendingSignalements();
    if (result.success > 0) {
      await loadSignalements();
    }
  } finally {
    syncing.value = false;
  }
};

onMounted(async () => {
  // Vérifier l'état initial de la connexion
  isOnline.value = await checkOnline();
  
  // Écouter les changements de connexion
  onNetworkChange(async (connected) => {
    isOnline.value = connected;
    if (connected) {
      // Synchroniser automatiquement quand on revient en ligne
      await syncPending();
    }
  });
  
  await loadSignalements();
  
  // Initialiser la carte après un court délai
  setTimeout(() => {
    initMap();
  }, 300);
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatBudget = (budget) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0
  }).format(budget);
};

const goToCreate = () => {
  router.push('/tabs/create');
};

const handleLogout = async () => {
  await logout();
  router.push('/tabs/home');
};

const handleRefresh = async (event) => {
  await loadSignalements();
  event.target.complete();
};
</script>

<style scoped>
.offline-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.sync-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #ffa726, #ff9800);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.sync-banner ion-spinner {
  width: 16px;
  height: 16px;
  --color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 1.125rem;
  opacity: 0.9;
}

.logout-btn {
  --padding-start: 12px;
  --padding-end: 12px;
}

.section-header {
  padding: 24px 20px 8px;
}

.section-title {
  margin: 0 0 4px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--nexus-text-primary);
  letter-spacing: -0.03em;
}

.section-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--nexus-text-muted);
}

.filter-container {
  display: flex;
  gap: 10px;
  padding: 12px 20px 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-container::-webkit-scrollbar {
  display: none;
}

.filter-container ion-chip {
  --background: var(--nexus-bg-secondary);
  --color: var(--nexus-text-secondary);
  border: 1.5px solid var(--nexus-border-color);
  padding: 8px 16px;
  height: 38px;
  flex-shrink: 0;
}

.filter-container .chip-active {
  --background: rgba(15, 118, 110, 0.1);
  --color: var(--ion-color-primary);
  border-color: rgba(15, 118, 110, 0.3);
}

.filter-container .chip-active.chip-warning {
  --background: rgba(245, 158, 11, 0.1);
  --color: #b45309;
  border-color: rgba(245, 158, 11, 0.3);
}

.filter-container .chip-active.chip-success {
  --background: rgba(5, 150, 105, 0.1);
  --color: var(--ion-color-success);
  border-color: rgba(5, 150, 105, 0.3);
}

.chip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: rgba(15, 118, 110, 0.15);
  border-radius: 11px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-right: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-illustration {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background: linear-gradient(145deg, #f0fdfa 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-illustration ion-icon {
  font-size: 52px;
  color: var(--ion-color-primary);
  opacity: 0.6;
}

.empty-state h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--nexus-text-primary);
}

.empty-state p {
  margin: 0 0 24px;
  color: var(--nexus-text-muted);
  font-size: 0.9375rem;
  max-width: 260px;
}

.empty-cta {
  --background: linear-gradient(135deg, var(--ion-color-primary), #14b8a6);
  --box-shadow: 0 8px 20px rgba(15, 118, 110, 0.25);
}

.cards-grid {
  padding: 0 16px 100px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.signalement-card {
  position: relative;
  overflow: hidden;
  margin: 0;
}

.card-status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
}

.card-status-indicator.primary { background: var(--ion-color-primary); }
.card-status-indicator.warning { background: var(--ion-color-warning); }
.card-status-indicator.success { background: var(--ion-color-success); }
.card-status-indicator.medium { background: var(--ion-color-medium); }

.signalement-card ion-card-header {
  padding: 20px 20px 12px 24px;
}

.signalement-card ion-card-content {
  padding: 0 20px 20px 24px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.signalement-card ion-card-title {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  flex: 1;
}

.card-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--nexus-text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--nexus-border-light);
}

.metric {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.metric ion-icon {
  font-size: 18px;
  color: var(--ion-color-primary);
  margin-top: 2px;
  flex-shrink: 0;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.metric-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--nexus-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-label {
  font-size: 0.6875rem;
  color: var(--nexus-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 400px) {
  .card-metrics {
    grid-template-columns: 1fr 1fr;
  }
  
  .card-metrics .metric:last-child {
    grid-column: span 2;
  }
}

/* Animation for cards */
.signalement-card {
  animation: slideInUp 0.4s ease-out forwards;
  opacity: 0;
}

.signalement-card:nth-child(1) { animation-delay: 0.05s; }
.signalement-card:nth-child(2) { animation-delay: 0.1s; }
.signalement-card:nth-child(3) { animation-delay: 0.15s; }
.signalement-card:nth-child(4) { animation-delay: 0.2s; }
.signalement-card:nth-child(5) { animation-delay: 0.25s; }

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Map Section */
.map-section {
  margin: 16px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.map-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--nexus-text-primary);
  padding: 16px 16px 12px;
  margin: 0;
}

.user-map {
  width: 100%;
  height: calc(100vh - 280px);
  min-height: 400px;
  background: #f5f5f5;
  border-radius: var(--nexus-radius-xl);
  box-shadow: var(--nexus-shadow-lg);
}

/* Custom marker styles */
:deep(.custom-marker) {
  background: transparent;
  border: none;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-popup-content) {
  margin: 12px;
}
</style>
