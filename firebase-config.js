// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlN7kKauqgaI_YeXSLavCV976Ln3cDNAw",
  authDomain: "clouds5-p17-antananarivo.firebaseapp.com",
  databaseURL: "https://clouds5-p17-antananarivo-default-rtdb.firebaseio.com",
  projectId: "clouds5-p17-antananarivo",
  storageBucket: "clouds5-p17-antananarivo.firebasestorage.app",
  messagingSenderId: "196563751245",
  appId: "1:196563751245:web:e3bc8b4af74d840de2a704"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };