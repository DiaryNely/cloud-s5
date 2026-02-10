<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="logout">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Filtre -->
      <ion-segment v-model="filter" @ionChange="handleFilterChange">
        <ion-segment-button value="all">
          <ion-label>Tous</ion-label>
        </ion-segment-button>
        <ion-segment-button value="mine">
          <ion-label>Mes signalements</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Carte -->
      <div id="map" style="height: 60vh"></div>

      <!-- Bouton créer -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openCreateModal">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Liste des signalements -->
      <ion-list>
        <ion-item v-for="signalement in signalements" :key="signalement.id">
          <ion-label>
            <h2>{{ signalement.title }}</h2>
            <p>{{ signalement.description }}</p>
            <p>
              <ion-badge :color="getStatusColor(signalement.status)">
                {{ signalement.status }}
              </ion-badge>
            </p>
            <!-- Affichage des photos reconstituées depuis les pixels Firebase -->
            <div v-if="signalement.photoUrls && signalement.photoUrls.length > 0" class="photo-thumbnails">
              <img
                v-for="(url, idx) in signalement.photoUrls"
                :key="idx"
                :src="url"
                alt="Photo signalement"
                class="photo-thumb"
              />
            </div>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonBadge,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButton,
  IonButtons,
  modalController,
} from '@ionic/vue';
import { addOutline, logOutOutline } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { signalementService, Signalement } from '@/services/signalement.service';
import { authService } from '@/services/auth.service';
import CreateSignalement from '@/components/CreateSignalement.vue';
import { auth } from '@/services/firebase';

const router = useRouter();
const filter = ref('all');
const signalements = ref<Signalement[]>([]);
let map: L.Map | null = null;
let markers: L.Marker[] = [];
let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  initMap();
  // Écouter les signalements en temps réel depuis Firebase
  unsubscribe = signalementService.onSignalementsChange((items) => {
    if (filter.value === 'mine' && auth.currentUser) {
      signalements.value = items.filter(s => s.userUid === auth.currentUser!.uid);
    } else {
      signalements.value = items;
    }
    updateMapMarkers();
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

function initMap() {
  // Initialiser la carte centrée sur Madagascar (décalée à gauche)
  map = L.map('map', {
    center: [-18.8792, 46.5],
    zoom: 6,
    minZoom: 6,
    maxZoom: 18,
    maxBounds: [
      [-25.6, 43.2],  // Sud-Ouest de Madagascar
      [-11.9, 50.5]   // Nord-Est de Madagascar
    ],
    maxBoundsViscosity: 1.0
  });

  // Utiliser OpenStreetMap directement
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Forcer le recalcul de la taille de la carte
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 100);
}

function updateMapMarkers() {
  // Supprimer les anciens marqueurs
  markers.forEach(marker => marker.remove());
  markers = [];

  // Ajouter les nouveaux marqueurs
  signalements.value.forEach((sig) => {
    // Construire le HTML du popup avec les photos reconstituées
    let photosHtml = '';
    if (sig.photoUrls && sig.photoUrls.length > 0) {
      photosHtml = '<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">' +
        sig.photoUrls.map(url => `<img src="${url}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />`).join('') +
        '</div>';
    }

    const marker = L.marker([sig.latitude, sig.longitude])
      .addTo(map!)
      .bindPopup(`
        <b>${sig.title}</b><br>
        ${sig.description || ''}<br>
        <span style="color: ${getStatusColorHex(sig.status)}">${sig.status}</span>
        ${photosHtml}
      `);
    markers.push(marker);
  });

  // Ajuster le zoom pour voir tous les marqueurs
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map?.fitBounds(group.getBounds());
  }
}

async function handleFilterChange() {
  // Recharger avec le bon filtre
  const items = await signalementService.getAll(filter.value === 'mine');
  signalements.value = items;
  updateMapMarkers();
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'NOUVEAU':
      return 'primary';
    case 'EN_COURS':
      return 'warning';
    case 'TERMINE':
      return 'success';
    default:
      return 'medium';
  }
}

function getStatusColorHex(status?: string) {
  switch (status) {
    case 'NOUVEAU':
      return '#3880ff';
    case 'EN_COURS':
      return '#ffc409';
    case 'TERMINE':
      return '#2dd36f';
    default:
      return '#92949c';
  }
}

async function openCreateModal() {
  const modal = await modalController.create({
    component: CreateSignalement,
  });

  modal.onDidDismiss().then(() => {
    // Les données se mettent à jour automatiquement via Firebase listener
  });

  return modal.present();
}

function logout() {
  authService.logout();
  router.replace('/login');
}
</script>

<style scoped>
#map {
  width: 100%;
  z-index: 0;
}

ion-segment {
  margin: 10px;
}

.photo-thumbnails {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.photo-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--ion-color-light-shade);
}
</style>
