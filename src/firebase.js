// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

// CONFIGURAZIONE CON NOMI ESATTI CHE USI NEL .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Servizi
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Messaging (opzionale)
let messaging = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch(() => {});
}
export { messaging };

// ──────── Funzioni di utilità (le lasciamo identiche) ────────
export const updateStatoPercorso = async (userId) => {
  try {
    const clientRef = doc(db, "clients", userId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) return;

    const dataScadenza = clientSnap.data().scadenza;
    const stato = calcolaStatoPercorso(dataScadenza);
    await updateDoc(clientRef, { statoPercorso: stato });
  } catch (error) {
    console.error("Errore in updateStatoPercorso:", error);
  }
};

export const calcolaStatoPercorso = (dataScadenza) => {
  if (!dataScadenza) return "N/D";
  const scadenza = toDate(dataScadenza);
  if (!scadenza) return "N/D";

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  scadenza.setHours(0, 0, 0, 0);

  const diffGiorni = Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));

  if (diffGiorni < 0) return "Scaduto";
  if (diffGiorni <= 7) return "In scadenza";
  return "Attivo";
};

export const toDate = (x) => {
  if (!x) return null;
  if (typeof x?.toDate === 'function') return x.toDate();
  if (x instanceof Date) return x;
  if (typeof x === 'string' || typeof x === 'number') {
    const date = new Date(x);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};