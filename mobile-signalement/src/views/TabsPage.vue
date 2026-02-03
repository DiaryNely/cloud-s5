<script setup>
import { 
  IonTabBar, 
  IonTabButton, 
  IonTabs, 
  IonLabel, 
  IonIcon, 
  IonPage, 
  IonRouterOutlet 
} from '@ionic/vue';
import { 
  gridOutline, 
  layersOutline, 
  addOutline 
} from 'ionicons/icons';
import { useAuth } from '../composables/useAuth';

const { isAuthenticated, loading } = useAuth();
</script>

<template>
  <ion-page>
    <ion-tabs v-if="!loading">
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon aria-hidden="true" :icon="gridOutline" />
          <ion-label>Vue d'ensemble</ion-label>
        </ion-tab-button>
        
        <ion-tab-button v-if="isAuthenticated" tab="signalements" href="/tabs/signalements">
          <ion-icon aria-hidden="true" :icon="layersOutline" />
          <ion-label>Interventions</ion-label>
        </ion-tab-button>
        
        <ion-tab-button v-if="isAuthenticated" tab="create" href="/tabs/create">
          <ion-icon aria-hidden="true" :icon="addOutline" />
          <ion-label>Nouveau</ion-label>
        </ion-tab-button>

      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>
