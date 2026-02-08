<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <div class="header-brand">
            <span class="brand-icon">◆</span>
            Infrastructure Hub
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="!isAuthenticated" @click="goToLogin" class="header-action-btn">
            <ion-icon slot="start" :icon="logInOutline"></ion-icon>
            <span class="btn-text">Accès</span>
          </ion-button>
          <ion-button v-else @click="handleLogout" class="header-action-btn">
            <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
            <span class="btn-text">Quitter</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <!-- Stats Cards -->
      <div class="stats-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ stats.total }}</ion-card-title>
            <ion-card-subtitle>Projets actifs</ion-card-subtitle>
          </ion-card-header>
        </ion-card>
        
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ stats.enCours }}</ion-card-title>
            <ion-card-subtitle>En progression</ion-card-subtitle>
          </ion-card-header>
        </ion-card>
        
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ formatBudget(stats.budgetTotal) }}</ion-card-title>
            <ion-card-subtitle>Investissement</ion-card-subtitle>
          </ion-card-header>
        </ion-card>
      </div>

      <!-- Map -->
      <div class="map-container">
        <div id="map" ref="mapContainer"></div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
  IonCardSubtitle,
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/vue';
import { logInOutline, logOutOutline } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSignalements, getStatistiques, getStatutColor } from '../services/signalementService';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { isAuthenticated, logout } = useAuth();
const stats = ref({ total: 0, enCours: 0, budgetTotal: 0, termines: 0 });
const signalements = ref([]);
const mapContainer = ref(null);
let map = null;

const formatBudget = (budget) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0
  }).format(budget);
};

const goToLogin = () => {
  router.push('/login');
};

const handleLogout = async () => {
  await logout();
  router.push('/tabs/home');
};

const loadData = async () => {
  try {
    const [sigData, statsData] = await Promise.all([
      getSignalements(),
      getStatistiques()
    ]);
    signalements.value = sigData;
    stats.value = statsData;
    updateMap();
  } catch (error) {
    console.error('Erreur chargement données:', error);
  }
};

const updateMap = () => {
  if (!map) return;
  
  signalements.value.forEach(sig => {
    const color = getStatutColor(sig.statut);
    const colors = {
      'primary': '#0f766e',
      'warning': '#f59e0b',
      'success': '#059669',
      'medium': '#64748b'
    };

    const marker = L.circleMarker([sig.latitude, sig.longitude], {
      radius: 10,
      fillColor: colors[color],
      color: '#ffffff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
        <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 6px;">${sig.localisation}</div>
        <div style="font-size: 13px; color: #475569; margin-bottom: 8px; line-height: 1.4;">${sig.description}</div>
        <div style="font-size: 12px; color: #0f766e; font-weight: 600;">Budget: ${formatBudget(sig.budgetEstime)}</div>
      </div>
    `, {
      className: 'nexus-popup'
    });
  });
};

onMounted(() => {
  setTimeout(() => {
    map = L.map('map').setView([-18.9137, 47.5267], 13);

    L.tileLayer('http://localhost:8081/styles/basic-preview/{z}/{x}/{y}.png', {
      attribution: '© TileServer GL'
    }).addTo(map);

    loadData();
  }, 100);
});
</script>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 24px 20px 16px;
}

.stats-container ion-card {
  margin: 0;
  text-align: center;
  padding: 0;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(15, 118, 110, 0.08);
  position: relative;
  overflow: hidden;
}

.stats-container ion-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--ion-color-primary), #14b8a6);
}

.stats-container ion-card:nth-child(2)::before {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.stats-container ion-card:nth-child(3)::before {
  background: linear-gradient(90deg, #059669, #34d399);
}

.stats-container ion-card-header {
  padding: 20px 16px;
}

.stats-container ion-card-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--nexus-text-primary);
  letter-spacing: -0.03em;
  line-height: 1;
}

.stats-container ion-card-subtitle {
  font-size: 0.6875rem;
  color: var(--nexus-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  margin-top: 8px;
}

.map-container {
  padding: 0 16px 24px;
}

#map {
  width: 100%;
  height: calc(100vh - 280px);
  min-height: 400px;
  border-radius: var(--nexus-radius-xl);
  box-shadow: var(--nexus-shadow-lg);
  border: 1px solid var(--nexus-border-color);
  overflow: hidden;
}

/* Animation for cards */
.stats-container ion-card {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}

.stats-container ion-card:nth-child(1) { animation-delay: 0.1s; }
.stats-container ion-card:nth-child(2) { animation-delay: 0.2s; }
.stats-container ion-card:nth-child(3) { animation-delay: 0.3s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
  }
  
  .stats-container ion-card {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  
  .stats-container ion-card::before {
    width: 4px;
    height: 100%;
    top: 0;
    left: 0;
    right: auto;
  }
  
  .stats-container ion-card-header {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    width: 100%;
  }
  
  .stats-container ion-card-title {
    font-size: 1.5rem;
  }
  
  .stats-container ion-card-subtitle {
    margin-top: 0;
  }
  
  #map {
    height: calc(100vh - 320px);
    min-height: 350px;
    border-radius: var(--nexus-radius-lg);
  }
}

/* Header Brand Styling */
.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.brand-icon {
  font-size: 1.25rem;
  opacity: 0.9;
}

.header-action-btn {
  --padding-start: 16px;
  --padding-end: 16px;
  font-weight: 600;
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
}

.header-action-btn .btn-text {
  margin-left: 6px;
}

@media (max-width: 360px) {
  .header-action-btn .btn-text {
    display: none;
  }
}
</style>
