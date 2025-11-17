// Script rapido per aggiungere collaboratore con UID esistente
// Copia questo nella Console del Browser (F12) quando sei loggato come admin

import { doc, setDoc } from 'firebase/firestore';
import { db } from './src/firebase';

// UID dell'utente che sta provando a loggarsi
const NEW_COLLAB_UID = 'Lsw0ykPO6aWNPyLk1fQtoL9qqEx2';
const NEW_COLLAB_EMAIL = 'alexsetter@gmail.com';
const ADMIN_UID = 'AeZKjJYu5zMZ4mvffaGiqCBb0cF2'; // Sostituisci con tuo UID admin

async function addExistingUserAsCollaboratore() {
  try {
    const collabRef = doc(db, 'collaboratori', NEW_COLLAB_UID);
    
    await setDoc(collabRef, {
      uid: NEW_COLLAB_UID,
      email: NEW_COLLAB_EMAIL,
      nome: NEW_COLLAB_EMAIL.split('@')[0],
      ruolo: 'Setter',
      role: 'Setter',
      firstLogin: false,
      assignedAdmin: [ADMIN_UID],
      dailyReports: [],
      tracker: {},
      personalPipeline: []
    });
    
    console.log('✅ Collaboratore aggiunto con successo!');
    alert('✅ Collaboratore aggiunto! Ora può fare login.');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    alert('❌ Errore: ' + error.message);
  }
}

// Esegui la funzione
addExistingUserAsCollaboratore();
