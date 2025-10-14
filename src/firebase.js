import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, getDocs, collection, onSnapshot, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Configurazione Firebase
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
  const clientRef = doc(db, "clients", userId);
  const clientSnap = await getDoc(clientRef);
  if (!clientSnap.exists()) return;

  const dataScadenza = clientSnap.data().scadenza;
  const stato = calcolaStatoPercorso(dataScadenza);

  await updateDoc(clientRef, { statoPercorso: stato });
};

// Funzione di calcolo stato percorso
export const calcolaStatoPercorso = (dataScadenza) => {
  if (!dataScadenza) return "na";
  const oggi = new Date();
  const scadenza = toDate(dataScadenza);
  if (!scadenza) return "na";
  const diffGiorni = Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));
  if (diffGiorni < 0) return "non_rinnovato";
  if (diffGiorni <= 7) return "rinnovato";
  return "attivo";
};

// Funzione di utilità per convertire timestamp
export const toDate = (x) => {
  if (!x) {
    console.warn('Timestamp non valido o undefined:', x);
    return null;
  }
  if (typeof x?.toDate === 'function') {
    return x.toDate();
  }
  if (x instanceof Date) {
    return x;
  }
  if (typeof x === 'string') {
    try {
      const date = new Date(x);
      if (isNaN(date.getTime())) {
        console.warn('Stringa timestamp non valida:', x);
        return null;
      }
      return date;
    } catch (error) {
      console.warn('Errore nella conversione della stringa timestamp:', x, error);
      return null;
    }
  }
  console.warn('Formato timestamp non riconosciuto:', x);
  return null;
};