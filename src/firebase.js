// Importa le funzioni che ti servono dagli SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// La configurazione legge i valori sicuri dalle variabili d'ambiente
// Abbiamo aggiunto 'export' qui per renderla disponibile ad altri file
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza e esporta i servizi Firebase che userai nel resto dell'app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Esporta l'app principale, può essere utile
export default app;