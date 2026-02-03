<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/signalements"></ion-back-button>
        </ion-buttons>
        <ion-title>Nouvelle intervention</ion-title>
      </ion-toolbar>
      
      <!-- Progress Stepper -->
      <ion-toolbar class="stepper-toolbar">
        <div class="progress-stepper">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: activeStep === 0 ? '50%' : '100%' }"></div>
          </div>
          <div class="steps-container">
            <div 
              class="step-item" 
              :class="{ active: activeStep === 0, completed: activeStep > 0 }"
            >
              <div class="step-indicator">
                <span v-if="activeStep > 0">✓</span>
                <span v-else>1</span>
              </div>
              <span class="step-text">Localisation</span>
            </div>
            <div 
              class="step-item" 
              :class="{ active: activeStep === 1 }"
            >
              <div class="step-indicator">2</div>
              <span class="step-text">Informations</span>
            </div>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <!-- Step 1: Map -->
      <div v-show="activeStep === 0" class="step-content">
        <div class="step-header">
          <h2>Sélectionnez la position</h2>
          <p>Touchez la carte pour marquer l'emplacement exact de l'intervention</p>
        </div>
        
        <div class="map-wrapper">
          <div id="map" ref="mapContainer"></div>
        </div>
        
        <div v-if="formData.latitude" class="coordinates-display">
          <div class="coord-card">
            <div class="coord-icon">
              <ion-icon :icon="navigateOutline"></ion-icon>
            </div>
            <div class="coord-info">
              <span class="coord-label">Latitude</span>
              <span class="coord-value">{{ formData.latitude.toFixed(6) }}</span>
            </div>
          </div>
          <div class="coord-card">
            <div class="coord-icon">
              <ion-icon :icon="navigateOutline"></ion-icon>
            </div>
            <div class="coord-info">
              <span class="coord-label">Longitude</span>
              <span class="coord-value">{{ formData.longitude.toFixed(6) }}</span>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <ion-button expand="block" @click="handleNext" :disabled="!formData.latitude" class="primary-action">
            Continuer
            <ion-icon slot="end" :icon="arrowForwardOutline"></ion-icon>
          </ion-button>
        </div>
      </div>

      <!-- Step 2: Form -->
      <div v-show="activeStep === 1" class="step-content">
        <div class="step-header">
          <h2>Détails de l'intervention</h2>
          <p>Renseignez les informations nécessaires</p>
        </div>
        
        <form @submit.prevent="handleSubmit" class="intervention-form">
          <div class="form-section">
            <label class="field-label">Localisation</label>
            <ion-item class="form-field">
              <ion-icon :icon="businessOutline" slot="start"></ion-icon>
              <ion-input
                v-model="formData.localisation"
                placeholder="Ex: Avenue de l'Indépendance"
                required
              ></ion-input>
            </ion-item>
          </div>

          <div class="form-section">
            <label class="field-label">Description des travaux</label>
            <ion-item class="form-field textarea-field">
              <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
              <ion-textarea
                v-model="formData.description"
                placeholder="Décrivez la nature et l'étendue des travaux..."
                rows="4"
                required
              ></ion-textarea>
            </ion-item>
          </div>

          <div class="form-row">
            <div class="form-section">
              <label class="field-label">Surface (m²)</label>
              <ion-item class="form-field">
                <ion-icon :icon="resizeOutline" slot="start"></ion-icon>
                <ion-input
                  v-model.number="formData.surface"
                  type="number"
                  placeholder="0"
                  required
                ></ion-input>
              </ion-item>
            </div>

            <div class="form-section">
              <label class="field-label">Budget (MGA)</label>
              <ion-item class="form-field">
                <ion-icon :icon="cashOutline" slot="start"></ion-icon>
                <ion-input
                  v-model.number="formData.budgetEstime"
                  type="number"
                  placeholder="0"
                  required
                ></ion-input>
              </ion-item>
            </div>
          </div>

          <div class="form-actions">
            <ion-button fill="outline" @click="activeStep = 0" class="back-action">
              <ion-icon slot="start" :icon="arrowBackOutline"></ion-icon>
              Retour
            </ion-button>
            <ion-button type="submit" :disabled="loading" class="submit-action">
              <span v-if="loading" class="loading-indicator">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </span>
              <span v-else>Soumettre</span>
            </ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonItem,
  IonInput,
  IonTextarea,
  IonIcon,
  toastController,
  onIonViewDidEnter
} from '@ionic/vue';
import {
  navigateOutline,
  businessOutline,
  documentTextOutline,
  resizeOutline,
  cashOutline,
  arrowForwardOutline,
  arrowBackOutline
} from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createSignalementWithOfflineSupport, isOnline as checkOnline } from '../services/offlineService';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { user } = useAuth();
const activeStep = ref(0);
const loading = ref(false);
const mapContainer = ref(null);
let map = null;
let marker = null;

const formData = ref({
  localisation: '',
  latitude: null,
  longitude: null,
  description: '',
  surface: null,
  budgetEstime: null
});

const initMap = async () => {
  if (map || !mapContainer.value) return;
  await nextTick();
  map = L.map(mapContainer.value).setView([-18.9137, 47.5267], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  map.on('click', (e) => {
    formData.value.latitude = e.latlng.lat;
    formData.value.longitude = e.latlng.lng;

    if (marker) {
      map.removeLayer(marker);
    }

    marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
  });

  setTimeout(() => {
    map?.invalidateSize();
  }, 0);
};

onIonViewDidEnter(() => {
  if (activeStep.value === 0) {
    initMap();
  }
});

onMounted(() => {
  if (activeStep.value === 0) {
    initMap();
  }
});

watch(activeStep, async (step) => {
  if (step === 0) {
    await initMap();
    setTimeout(() => {
      map?.invalidateSize();
    }, 0);
  }
});

const handleNext = () => {
  activeStep.value = 1;
};

const handleSubmit = async () => {
  loading.value = true;

  try {
    const signalementData = {
      localisation: formData.value.localisation,
      latitude: formData.value.latitude,
      longitude: formData.value.longitude,
      description: formData.value.description,
      surface: formData.value.surface,
      budgetEstime: formData.value.budgetEstime
    };

    const result = await createSignalementWithOfflineSupport(signalementData);

    let message = 'Signalement créé avec succès !';
    let color = 'success';
    
    if (result.offline) {
      message = 'Signalement sauvegardé localement. Il sera synchronisé quand vous serez en ligne.';
      color = 'warning';
    }

    const toast = await toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
    
    // Reset form
    formData.value = {
      localisation: '',
      latitude: null,
      longitude: null,
      description: '',
      surface: null,
      budgetEstime: null
    };
    activeStep.value = 0;
    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }
    
    router.push('/tabs/signalements');
  } catch (error) {
    console.error('Erreur création signalement:', error);
    const toast = await toastController.create({
      message: error.response?.data?.message || 'Erreur lors de la création',
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Progress Stepper */
.stepper-toolbar {
  --background: var(--nexus-bg-secondary);
  --border-width: 0;
  border-bottom: 1px solid var(--nexus-border-color);
  --padding-top: 16px;
  --padding-bottom: 16px;
}

.progress-stepper {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 0 20px;
}

.progress-track {
  height: 4px;
  background: var(--nexus-border-color);
  border-radius: 2px;
  margin-bottom: 16px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ion-color-primary), #14b8a6);
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.steps-container {
  display: flex;
  justify-content: space-between;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
  background: var(--nexus-border-color);
  color: var(--nexus-text-muted);
  transition: all 0.3s ease;
}

.step-item.active .step-indicator {
  background: var(--ion-color-primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
}

.step-item.completed .step-indicator {
  background: var(--ion-color-success);
  color: #fff;
}

.step-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--nexus-text-muted);
  transition: color 0.3s ease;
}

.step-item.active .step-text,
.step-item.completed .step-text {
  color: var(--nexus-text-primary);
}

/* Step Content */
.step-content {
  padding: 24px 20px 32px;
}

.step-header {
  margin-bottom: 24px;
}

.step-header h2 {
  margin: 0 0 6px;
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--nexus-text-primary);
  letter-spacing: -0.03em;
}

.step-header p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--nexus-text-muted);
}

/* Map Wrapper */
.map-wrapper {
  margin-bottom: 20px;
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

/* Coordinates Display */
.coordinates-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.coord-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--nexus-bg-secondary);
  border: 1px solid var(--nexus-border-light);
  border-radius: var(--nexus-radius-md);
}

.coord-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(15, 118, 110, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.coord-icon ion-icon {
  font-size: 20px;
  color: var(--ion-color-primary);
}

.coord-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.coord-label {
  font-size: 0.6875rem;
  color: var(--nexus-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.coord-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--nexus-text-primary);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* Action Bar */
.action-bar {
  padding-top: 8px;
}

.primary-action {
  height: 52px;
  font-weight: 700;
  font-size: 0.9375rem;
  --background: linear-gradient(135deg, var(--ion-color-primary), #14b8a6);
  --box-shadow: 0 8px 20px rgba(15, 118, 110, 0.25);
}

/* Form Styles */
.intervention-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--nexus-text-secondary);
  padding-left: 4px;
}

.form-field {
  --background: var(--nexus-bg-secondary);
  border: 1.5px solid var(--nexus-border-color);
  border-radius: var(--nexus-radius-md);
  transition: var(--nexus-transition);
  margin: 0;
}

.form-field:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
}

.textarea-field {
  --min-height: 120px;
  align-items: flex-start;
}

.textarea-field ion-icon[slot="start"] {
  margin-top: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Form Actions */
.form-actions {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding-top: 12px;
}

.back-action {
  --padding-start: 20px;
  --padding-end: 20px;
}

.submit-action {
  height: 52px;
  font-weight: 700;
  font-size: 0.9375rem;
  --background: linear-gradient(135deg, var(--ion-color-primary), #14b8a6);
  --box-shadow: 0 8px 20px rgba(15, 118, 110, 0.25);
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
}

.loading-indicator .dot {
  width: 7px;
  height: 7px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: bounce 1.2s ease-in-out infinite;
}

.loading-indicator .dot:nth-child(2) { animation-delay: 0.15s; }
.loading-indicator .dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

@media (max-width: 400px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .coordinates-display {
    grid-template-columns: 1fr;
  }
}
</style>
