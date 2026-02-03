import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Configuration Firebase - À remplacer par vos valeurs réelles
// TODO: Utiliser des variables d'environnement (import.meta.env...)
const firebaseConfig = {
  apiKey: "AIzaSyD-YOUR-API-KEY-HERE",
  authDomain: "signalement-routier.firebaseapp.com",
  databaseURL: "https://signalement-routier-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "signalement-routier",
  storageBucket: "signalement-routier.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
