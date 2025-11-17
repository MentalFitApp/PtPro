// Script per correggere l'UID del collaboratore in Firestore
// Esegui: node fix-collaboratore-uid.js

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configurazione Firebase (stessa di src/firebase.js)
const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY || "TUA_API_KEY",
  authDomain: process.env.VITE_AUTH_DOMAIN || "biondo-fitness-coach.firebaseapp.com",
  projectId: process.env.VITE_PROJECT_ID || "biondo-fitness-coach",
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
  measurementId: process.env.VITE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UID VECCHIO (quello nel database - SBAGLIATO)
const OLD_UID = 'wzgQRc7yvShRxA8sal5R3rWhY4y2';

// UID NUOVO (quello dell'utente che fa login - CORRETTO)
const NEW_UID = 'Lsw0ykPO6aWNPyLk1fQtoL9qqEx2';

async function fixCollaboratoreUID() {
  try {
    console.log('🔧 Correzione UID collaboratore...');
    
    // 1. Leggi documento vecchio
    const oldDocRef = doc(db, 'collaboratori', OLD_UID);
    const oldSnap = await getDoc(oldDocRef);
    
    if (!oldSnap.exists()) {
      console.error('❌ Documento con UID vecchio non trovato!');
      return;
    }
    
    const data = oldSnap.data();
    console.log('✅ Documento vecchio trovato:', data);
    
    // 2. Crea nuovo documento con UID corretto
    const newDocRef = doc(db, 'collaboratori', NEW_UID);
    await setDoc(newDocRef, {
      ...data,
      uid: NEW_UID // Aggiorna anche il campo uid interno
    });
    
    console.log('✅ Nuovo documento creato con UID:', NEW_UID);
    
    // 3. (OPZIONALE) Elimina documento vecchio
    // await deleteDoc(oldDocRef);
    // console.log('✅ Documento vecchio eliminato');
    
    console.log('🎉 Correzione completata!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

fixCollaboratoreUID();
