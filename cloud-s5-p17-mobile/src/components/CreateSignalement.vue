<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Nouveau Signalement</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismiss">Annuler</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <!-- Mini carte pour sélectionner la position -->
    <div style="margin-bottom: 16px;">
      <ion-label style="font-weight: bold; margin-bottom: 8px; display: block;">Sélectionnez la position *</ion-label>
      <div id="create-map" style="height: 200px; width: 100%; border-radius: 8px;"></div>
      <ion-text color="medium" style="font-size: 12px; display: block; margin-top: 4px;">
        <p>Cliquez sur la carte ou utilisez votre position</p>
      </ion-text>
    </div>

    <form @submit.prevent="handleSubmit">
      <ion-item>
        <ion-label position="stacked">Titre *</ion-label>
        <ion-input
          v-model="form.title"
          placeholder="Ex: Nid de poule"
          required
        ></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Description</ion-label>
        <ion-textarea
          v-model="form.description"
          placeholder="Décrivez le problème..."
          :rows="3"
        ></ion-textarea>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Localisation *</ion-label>
        <ion-text color="medium">
          <p v-if="form.latitude && form.longitude">
            📍 {{ form.latitude.toFixed(6) }}, {{ form.longitude.toFixed(6) }}
          </p>
          <p v-else style="color: var(--ion-color-danger);">Cliquez sur la carte ou utilisez votre position</p>
        </ion-text>
      </ion-item>

      <ion-button expand="block" @click="getCurrentLocation" :disabled="loading">
        <ion-icon slot="start" :icon="locationOutline"></ion-icon>
        {{ loading ? 'Chargement...' : 'Utiliser ma position' }}
      </ion-button>

      <ion-item>
        <ion-label position="stacked">Surface (m²)</ion-label>
        <ion-input
          v-model="form.surfaceM2"
          type="number"
          placeholder="0"
        ></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Budget estimé (Ar)</ion-label>
        <ion-input
          v-model="form.budgetAr"
          type="number"
          placeholder="0"
        ></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Entreprise</ion-label>
        <ion-input
          v-model="form.entreprise"
          placeholder="Nom de l'entreprise"
        ></ion-input>
      </ion-item>

      <!-- Section Photos -->
      <div class="photo-section">
        <ion-label style="font-weight: bold; margin-bottom: 8px; display: block;">Photos ({{ photos.length }}/5)</ion-label>
        
        <div class="photo-grid">
          <div v-for="(photo, index) in photos" :key="index" class="photo-item">
            <img :src="photo.webPath" alt="Photo" />
            <ion-button 
              fill="clear" 
              size="small" 
              color="danger" 
              class="remove-btn"
              @click="removePhoto(index)"
            >
              <ion-icon :icon="closeCircleOutline"></ion-icon>
            </ion-button>
          </div>
        </div>
        
        <!-- Boutons Caméra et Galerie -->
        <div v-if="photos.length < 5" class="photo-actions">
          <ion-button expand="block" @click="takePhotoFromCamera" size="default">
            <ion-icon slot="start" :icon="cameraOutline"></ion-icon>
            Prendre photo (caméra)
          </ion-button>
          <ion-button expand="block" @click="selectFromGallery" fill="outline" size="default">
            <ion-icon slot="start" :icon="imagesOutline"></ion-icon>
            Choisir depuis la galerie
          </ion-button>
        </div>
      </div>

      <ion-button
        type="submit"
        expand="block"
        color="success"
        class="ion-margin-top"
        :disabled="!form.title || !form.latitude || !form.longitude || uploading"
      >
        <ion-icon slot="start" :icon="checkmarkOutline"></ion-icon>
        {{ uploading ? 'Envoi en cours...' : 'Créer le signalement' }}
      </ion-button>

      <ion-text color="danger" v-if="error">
        <p>{{ error }}</p>
      </ion-text>
    </form>
  </ion-content>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  modalController,
  toastController,
} from '@ionic/vue';
import { locationOutline, checkmarkOutline, cameraOutline, closeCircleOutline, imagesOutline } from 'ionicons/icons';
import { signalementService } from '@/services/signalement.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let map: L.Map | null = null;
let marker: L.Marker | null = null;

const form = ref({
  title: '',
  description: '',
  latitude: null as number | null,
  longitude: null as number | null,
  surfaceM2: null as number | null,
  budgetAr: null as number | null,
  entreprise: '',
});

const loading = ref(false);
const error = ref('');
const photos = ref<Array<{ webPath: string; blob: Blob }>>([]);
const uploading = ref(false);

onMounted(() => {
  // Attendre que l'élément soit dans le DOM
  setTimeout(() => {
    const mapElement = document.getElementById('create-map');
    if (mapElement) {
      initMap();
    } else {
      console.error('Element create-map not found');
    }
  }, 300);
});

onUnmounted(() => {
  if (marker) {
    marker.remove();
    marker = null;
  }
  if (map) {
    map.off();
    map.remove();
    map = null;
  }
});

function initMap() {
  try {
    // Initialiser la carte centrée sur Madagascar
    map = L.map('create-map', {
      center: [-18.8792, 46.5],
      zoom: 6,
      minZoom: 6,
      maxZoom: 18,
      maxBounds: [
        [-25.6, 43.2],
        [-11.9, 50.5]
      ],
      maxBoundsViscosity: 1.0
    });

    // Utiliser OpenStreetMap directement pour éviter les problèmes de tuiles locales
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

    // Écouter les clics sur la carte
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLocation(lat, lng);
    });
  } catch (err) {
    console.error('Erreur initialisation carte:', err);
  }
}

function setLocation(lat: number, lng: number) {
  form.value.latitude = lat;
  form.value.longitude = lng;

  // Supprimer l'ancien marqueur
  if (marker) {
    marker.remove();
  }

  // Ajouter un nouveau marqueur
  marker = L.marker([lat, lng]).addTo(map!);
  map!.setView([lat, lng], 13);
}

async function getCurrentLocation() {
  loading.value = true;
  error.value = '';

  try {
    // Utiliser l'API de géolocalisation du navigateur pour le web
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords.latitude, position.coords.longitude);
          
          toastController.create({
            message: 'Position obtenue avec succès',
            duration: 2000,
            color: 'success',
          }).then(toast => toast.present());
          
          loading.value = false;
        },
        (err) => {
          error.value = 'Impossible d\'obtenir la position: ' + err.message;
          loading.value = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      error.value = 'La géolocalisation n\'est pas supportée par votre navigateur';
      loading.value = false;
    }
  } catch (err: any) {
    error.value = 'Impossible d\'obtenir la position: ' + err.message;
    loading.value = false;
  }
}

async function takePhotoFromCamera() {
  if (photos.value.length >= 5) {
    const toast = await toastController.create({
      message: 'Maximum 5 photos',
      duration: 2000,
      color: 'warning',
    });
    await toast.present();
    return;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    if (image.webPath) {
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      photos.value.push({
        webPath: image.webPath,
        blob: blob
      });
    }
  } catch (err: any) {
    console.error('Erreur prise de photo:', err);
    if (err.message !== 'User cancelled photos app') {
      const toast = await toastController.create({
        message: 'Erreur lors de la prise de photo',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }
}

async function selectFromGallery() {
  if (photos.value.length >= 5) {
    const toast = await toastController.create({
      message: 'Maximum 5 photos',
      duration: 2000,
      color: 'warning',
    });
    await toast.present();
    return;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });

    if (image.webPath) {
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      photos.value.push({
        webPath: image.webPath,
        blob: blob
      });
    }
  } catch (err: any) {
    console.error('Erreur sélection de photo:', err);
    if (err.message !== 'User cancelled photos app') {
      const toast = await toastController.create({
        message: 'Erreur lors de la sélection de photo',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }
}

function removePhoto(index: number) {
  photos.value.splice(index, 1);
}

async function uploadPhotos(signalementId: string) {
  for (const photo of photos.value) {
    try {
      const formData = new FormData();
      formData.append('photo', photo.blob, `photo_${Date.now()}.jpg`);
      
      await signalementService.uploadPhoto(signalementId, formData);
    } catch (err) {
      console.error('Erreur upload photo:', err);
    }
  }
}

async function handleSubmit() {
  if (!form.value.title || !form.value.latitude || !form.value.longitude) {
    error.value = 'Veuillez remplir tous les champs requis';
    return;
  }

  uploading.value = true;
  error.value = '';

  try {
    // 1. Créer le signalement directement dans Firebase
    const created = await signalementService.create({
      title: form.value.title,
      description: form.value.description,
      latitude: form.value.latitude!,
      longitude: form.value.longitude!,
      surfaceM2: form.value.surfaceM2 || undefined,
      budgetAr: form.value.budgetAr || undefined,
      entreprise: form.value.entreprise || undefined,
    });

    const toast = await toastController.create({
      message: `Signalement créé avec succès !`,
      duration: 2000,
      color: 'success',
    });
    await toast.present();

    modalController.dismiss({ created: true });
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la création';
  } finally {
    uploading.value = false;
  }
}

function dismiss() {
  modalController.dismiss();
}
</script>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

#create-map {
  height: 200px;
  width: 100%;
  border-radius: 8px;
  border: 2px solid var(--ion-color-medium);
  z-index: 1;
}

/* Fix pour les tuiles Leaflet */
:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}

:deep(.leaflet-tile-pane) {
  z-index: 1;
}

:deep(.leaflet-control-zoom) {
  z-index: 400;
}

:deep(.leaflet-pane) {
  z-index: 400;
}

.photo-section {
  margin: 16px 0;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--ion-color-light);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-item .remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  --padding-start: 4px;
  --padding-end: 4px;
  margin: 0;
  height: 28px;
  width: 28px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
}

.photo-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.photo-actions ion-button {
  flex: 1;
}
</style>
