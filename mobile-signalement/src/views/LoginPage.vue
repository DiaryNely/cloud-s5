<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Authentification</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" class="ion-padding">
      <div class="login-container">
        <div class="login-header">
          <div class="logo-wrapper">
            <div class="logo-icon">
              <ion-icon :icon="lockClosedOutline"></ion-icon>
            </div>
          </div>
          <h1>Bienvenue</h1>
          <p>Accédez à votre espace de gestion des infrastructures</p>
        </div>

        <ion-card class="hint-card">
          <ion-card-content>
            <div class="hint-header">
              <ion-icon :icon="informationCircleOutline" class="hint-icon"></ion-icon>
              <strong>Identifiants de démonstration</strong>
            </div>
            <div class="hint-credentials">
              <div class="credential-row">
                <span class="credential-label">Compte 1</span>
                <code>user@app.mg</code>
              </div>
              <div class="credential-row">
                <span class="credential-label">Compte 2</span>
                <code>rakoto@app.mg</code>
              </div>
              <div class="credential-row">
                <span class="credential-label">Mot de passe</span>
                <code>User2026!</code>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">Adresse email</label>
            <ion-item>
              <ion-icon :icon="mailOutline" slot="start"></ion-icon>
              <ion-input
                v-model="email"
                type="email"
                placeholder="votre@email.com"
                required
              ></ion-input>
            </ion-item>
          </div>

          <div class="form-group">
            <label class="form-label">Mot de passe</label>
            <ion-item>
              <ion-icon :icon="lockClosedOutline" slot="start"></ion-icon>
              <ion-input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
              ></ion-input>
              <ion-button slot="end" fill="clear" @click="showPassword = !showPassword" class="toggle-password">
                <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
              </ion-button>
            </ion-item>
          </div>

          <ion-button expand="block" type="submit" class="login-button" :disabled="loading">
            <span v-if="loading" class="loading-state">
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
            </span>
            <span v-else>Se connecter</span>
          </ion-button>
        </form>

        <ion-text color="danger" v-if="error">
          <p class="error-text">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            {{ error }}
          </p>
        </ion-text>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  toastController
} from '@ionic/vue';
import { 
  lockClosedOutline, 
  mailOutline, 
  eyeOutline, 
  eyeOffOutline,
  informationCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { login } = useAuth();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  if (!email.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs';
    loading.value = false;
    return;
  }

  const result = await login(email.value, password.value);
  loading.value = false;

  if (result.success) {
    const toast = await toastController.create({
      message: `Bienvenue ${result.user.prenom} !`,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    router.push('/tabs/signalements');
  } else {
    error.value = result.message;
  }
};
</script>

<style scoped>
.login-container {
  max-width: 420px;
  margin: 0 auto;
  padding-top: 32px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: linear-gradient(145deg, var(--ion-color-primary), #14b8a6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(15, 118, 110, 0.25);
}

.logo-icon ion-icon {
  font-size: 36px;
  color: #ffffff;
}

.login-header h1 {
  margin: 0 0 8px 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--nexus-text-primary);
  letter-spacing: -0.03em;
}

.login-header p {
  margin: 0;
  color: var(--nexus-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.hint-card {
  margin-bottom: 28px;
  background: linear-gradient(145deg, #f0fdfa 0%, #f8fafc 100%);
  border: 1px solid rgba(15, 118, 110, 0.15);
}

.hint-card ion-card-content {
  padding: 16px 20px;
}

.hint-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.875rem;
  color: var(--ion-color-primary);
}

.hint-icon {
  font-size: 18px;
}

.hint-credentials {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.credential-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid var(--nexus-border-light);
}

.credential-label {
  font-size: 0.75rem;
  color: var(--nexus-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.credential-row code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  color: var(--nexus-text-primary);
  background: transparent;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--nexus-text-secondary);
  padding-left: 4px;
}

.form-group ion-item {
  --background: var(--nexus-bg-secondary);
  border: 1.5px solid var(--nexus-border-color);
  border-radius: var(--nexus-radius-md);
  transition: var(--nexus-transition);
}

.form-group ion-item:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
}

.toggle-password {
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
}

.toggle-password ion-icon {
  color: var(--nexus-text-muted);
}

.login-button {
  margin-top: 12px;
  height: 52px;
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: 0.02em;
  --background: linear-gradient(135deg, var(--ion-color-primary), #14b8a6);
  --box-shadow: 0 8px 20px rgba(15, 118, 110, 0.3);
}

.login-button:hover {
  --box-shadow: 0 12px 28px rgba(15, 118, 110, 0.4);
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 6px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: loadingPulse 1.2s ease-in-out infinite;
}

.loading-dot:nth-child(2) { animation-delay: 0.15s; }
.loading-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes loadingPulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.error-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  margin-top: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 12px 16px;
  background: rgba(225, 29, 72, 0.08);
  border-radius: var(--nexus-radius-md);
  border: 1px solid rgba(225, 29, 72, 0.2);
}

.error-text ion-icon {
  font-size: 18px;
}
</style>
