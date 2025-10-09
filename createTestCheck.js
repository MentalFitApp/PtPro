import { doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '/workspaces/PtPro/src/firebase.js';

// Funzione per autenticare l'utente
const authenticateUser = async () => {
  const auth = getAuth();
  try {
    // Sostituisci con le credenziali di un admin/coach valido
    await signInWithEmailAndPassword(auth, 'Alexgirban15@gmail.com', 'Alex1234');
    console.log('Autenticazione riuscita per admin');
  } catch (error) {
    console.error('Errore durante l\'autenticazione:', error.code, error.message);
    throw error;
  }
};

// Funzione per creare il documento di test
const createTestCheck = async () => {
  try {
    await authenticateUser();
    await setDoc(doc(db, 'clients', 'HhjYHYkpZ5S1yo2H7oG4KvoFdQB3', 'checks', 'test-check'), {
      createdAt: new Date(),
      weight: 70,
      notes: 'Test check-in',
      photoURLs: {},
      lastUpdatedAt: new Date()
    });
    console.log('Documento di test creato in /clients/HhjYHYkpZ5S1yo2H7oG4KvoFdQB3/checks/test-check');
  } catch (error) {
    console.error('Errore nella creazione del documento di test:', error.code, error.message);
    throw error;
  }
};

createTestCheck();