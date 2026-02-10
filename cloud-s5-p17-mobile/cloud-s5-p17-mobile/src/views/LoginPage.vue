<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="login-container">
        <h1>Bienvenue</h1>
        <p>Connectez-vous pour signaler des incidents</p>

        <form @submit.prevent="handleLogin">
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input
              v-model="email"
              type="email"
              required
              autocomplete="email"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Mot de passe</ion-label>
            <ion-input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
            ></ion-input>
          </ion-item>

          <ion-button type="submit" expand="block" class="ion-margin-top">
            Se connecter
          </ion-button>

          <ion-text color="danger" v-if="error">
            <p class="ion-text-center">{{ error }}</p>
          </ion-text>

          <ion-text color="medium" class="ion-text-center">
            <p>
              Pas de compte ?
              <a @click="router.push('/register')" style="cursor: pointer; color: var(--ion-color-primary);">S'inscrire</a>
            </p>
          </ion-text>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from '@ionic/vue';
import { authService } from '@/services/auth.service';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');

async function handleLogin() {
  error.value = '';
  
  try {
    await authService.login({
      email: email.value,
      password: password.value,
    });
    router.replace('/home');
  } catch (err: any) {
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      error.value = 'Email ou mot de passe incorrect';
    } else if (err.code === 'auth/user-not-found') {
      error.value = 'Aucun compte avec cet email';
    } else if (err.code === 'auth/too-many-requests') {
      error.value = 'Trop de tentatives, réessayez plus tard';
    } else {
      error.value = err.message || 'Erreur de connexion';
    }
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding-top: 40px;
}

h1 {
  text-align: center;
  margin-bottom: 8px;
}

p {
  text-align: center;
  color: var(--ion-color-medium);
  margin-bottom: 32px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
