// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import { getFunctions } from "firebase/functions";
import { getTenantDoc } from "./config/tenant";
import { CLIENT_STATUS } from "./constants/payments";

// CONFIGURAZIONE CON FALLBACK → così il build Vercel NON crasha mai
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "fallback-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "localhost",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:000:web:000",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-0000000000",
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Servizi
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1');
export { firebaseConfig };

// Messaging (opzionale)
let messaging = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    })
    .catch(() => {});
}
export { messaging };

// ───────────────────── Funzioni di utilità (invariate) ─────────────────────
export const toDate = (x) => {
  if (!x) return null;
  if (typeof x?.toDate === "function") return x.toDate();
  if (x instanceof Date) return x;
  if (typeof x === "string" || typeof x === "number") {
    const date = new Date(x);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};

export const calcolaStatoPercorso = (dataScadenza) => {
  if (!dataScadenza) return CLIENT_STATUS.NA;
  const scadenza = toDate(dataScadenza);
  if (!scadenza) return CLIENT_STATUS.NA;

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  scadenza.setHours(0, 0, 0, 0);

  const diffGiorni = Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));

  if (diffGiorni < 0) return CLIENT_STATUS.NOT_RENEWED;
  if (diffGiorni <= 7) return CLIENT_STATUS.RENEWED;
  return CLIENT_STATUS.ACTIVE;
};

export const updateStatoPercorso = async (userId) => {
  try {
    const clientRef = getTenantDoc(db, "clients", userId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) return;

    const dataScadenza = clientSnap.data().scadenza;
    const stato = calcolaStatoPercorso(dataScadenza);
    await updateDoc(clientRef, { statoPercorso: stato });
  } catch (error) {
    console.error("Errore in updateStatoPercorso:", error);
  }
};