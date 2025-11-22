// Script per aggiungere ruolo CEO via browser
// Copia e incolla questo codice nella Console del browser (F12) mentre sei su /ceo-login

import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from './firebase';

async function addCEORole() {
  const uid = 'FMj9GlrcUmUGpGUODaQe6dHaXcL2';
  
  try {
    const userRef = doc(db, 'users', uid);
    
    // Leggi documento attuale
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.log('❌ Utente non trovato');
      return;
    }
    
    const userData = userDoc.data();
    console.log('👤 Utente:', userData.displayName || userData.email);
    console.log('📋 Ruoli attuali:', userData.roles || []);
    
    // Aggiungi ruolo CEO
    await updateDoc(userRef, {
      roles: arrayUnion('ceo')
    });
    
    console.log('✅ Ruolo CEO aggiunto!');
    
    // Verifica
    const updatedDoc = await getDoc(userRef);
    console.log('📋 Ruoli finali:', updatedDoc.data().roles);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

// Esegui
addCEORole();
