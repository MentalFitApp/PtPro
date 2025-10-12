import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Carica un file su Firebase Storage.
 * @param {File} file - Il file da caricare.
 * @param {string} clientId - L'ID del cliente per la cartella di destinazione.
 * @param {string} folder - Sotto-cartella (es. 'anamnesi_photos').
 * @returns {Promise<string>} L'URL pubblico del file caricato.
 */
export const uploadPhoto = async (file, clientId, folder = 'anamnesi_photos') => {
  if (!file) throw new Error('Nessun file fornito');
  
  // Validazione file
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Il file supera il limite di 5MB');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Il file non è un\'immagine valida');
  }

  // Crea un nome file unico
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  
  // Definisce il percorso su Storage
  const storageRef = ref(storage, `clients/${clientId}/${folder}/${fileName}`);

  try {
    // Carica il file
    const snapshot = await uploadBytes(storageRef, file);
    // Ottieni l'URL pubblico
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`Upload completato per ${fileName}: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error('Errore nell\'upload della foto su Storage:', error.code, error.message);
    throw error;
  }
};