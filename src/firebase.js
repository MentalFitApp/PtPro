import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, getDocs, collection, onSnapshot, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Configurazione Firebase (da .env)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Servizi Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Funzione per calcolare e aggiornare lo stato del percorso
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

// Funzione di calcolo stato percorso
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

// Funzione di utilità per convertire timestamp (ottimizzata e silenziosa)
export const toDate = (x) => {
  if (!x) return null;

  // Firebase Timestamp
  if (typeof x?.toDate === 'function') return x.toDate();

  // Date object
  if (x instanceof Date) return x;

  // Stringa ISO
  if (typeof x === 'string') {
    try {
      const date = new Date(x);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  // Numero (timestamp in ms)
  if (typeof x === 'number') {
    const date = new Date(x);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
};