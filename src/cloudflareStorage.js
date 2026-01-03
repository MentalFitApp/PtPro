import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Cloudflare R2 Storage - VERSIONE SICURA
 * 
 * Gli upload vengono gestiti tramite Cloud Function per evitare
 * di esporre le credenziali R2 nel bundle JavaScript.
 * 
 * La compressione immagini avviene ancora client-side per ridurre
 * il traffico e i tempi di upload.
 */

// Formati immagine supportati (estensione -> MIME type)
const IMAGE_EXTENSIONS = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'jpe': 'image/jpeg',
  'jfif': 'image/jpeg',
  'jif': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'avif': 'image/avif',
  'heic': 'image/heic',
  'heif': 'image/heif',
  'hif': 'image/heif',
  'raw': 'image/raw',
  'cr2': 'image/x-canon-cr2',
  'nef': 'image/x-nikon-nef',
  'arw': 'image/x-sony-arw',
  'dng': 'image/x-adobe-dng',
  'bmp': 'image/bmp',
  'dib': 'image/bmp',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'cur': 'image/x-icon',
  'srw': 'image/x-samsung-srw',
  'psd': 'image/vnd.adobe.photoshop',
  'jp2': 'image/jp2',
  'jpx': 'image/jpx',
};

/**
 * Accept string per input file - include esplicitamente HEIC per iOS
 */
export const IMAGE_ACCEPT_STRING = 'image/*,.heic,.heif,.HEIC,.HEIF';

/**
 * Determina se un file è un'immagine basandosi su MIME type O estensione
 */
const isImageFile = (file) => {
  if (file.type && file.type.startsWith('image/')) return true;
  
  if (!file.type || file.type === 'application/octet-stream' || file.type === '') {
    const ext = file.name?.split('.').pop()?.toLowerCase();
    return ext && IMAGE_EXTENSIONS[ext] !== undefined;
  }
  
  return false;
};

/**
 * Ottiene il MIME type corretto per un file
 */
const getImageMimeType = (file) => {
  if (file.type && file.type.startsWith('image/') && file.type !== 'application/octet-stream') {
    return file.type;
  }
  
  const ext = file.name?.split('.').pop()?.toLowerCase();
  return IMAGE_EXTENSIONS[ext] || 'image/jpeg';
};

/**
 * Converte un file HEIC/HEIF in JPEG usando heic2any
 */
const convertHeicToJpeg = async (file) => {
  try {
    const blob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85
    });
    
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([resultBlob], newFileName, { type: 'image/jpeg' });
  } catch (error) {
    console.error('[HEIC] Errore conversione:', error);
    throw error;
  }
};

/**
 * Comprimi un'immagine prima dell'upload
 */
export const compressImage = async (file) => {
  if (!isImageFile(file)) {
    return file;
  }

  const ext = file.name?.toLowerCase().split('.').pop();
  const isHeicByExtension = ext === 'heic' || ext === 'heif';
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || 
                 (file.type === '' || file.type === 'application/octet-stream') && isHeicByExtension;
  const needsHeicConversion = isHeic || isHeicByExtension;

  if (file.size < 200 * 1024 && !needsHeicConversion) {
    return file;
  }

  try {
    let fileToCompress = file;
    
    if (needsHeicConversion) {
      fileToCompress = await convertHeicToJpeg(file);
    }
    
    let outputType = fileToCompress.type || 'image/jpeg';
    if (!outputType || outputType === 'application/octet-stream') {
      outputType = getImageMimeType(fileToCompress);
    }
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: outputType,
      initialQuality: 0.85,
    };

    const compressedBlob = await imageCompression(fileToCompress, options);
    
    return new File(
      [compressedBlob], 
      fileToCompress.name || 'compressed.jpg', 
      { type: compressedBlob.type || outputType }
    );
  } catch (error) {
    console.warn('[compressImage] Errore:', error);
    if (needsHeicConversion) {
      throw new Error('Impossibile convertire il file HEIC. Prova a scattare una nuova foto in formato JPEG.');
    }
    return file;
  }
};

/**
 * Converte un File in base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Rimuovi il prefisso "data:mime/type;base64,"
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

/**
 * Carica un file su Cloudflare R2 tramite Cloud Function SICURA
 * 
 * @param {File} file - File da caricare (immagine, video, audio)
 * @param {string} clientId - ID del cliente per organizzare i file
 * @param {string} folder - Sotto-cartella (es. 'anamnesi_photos', 'check_photos')
 * @param {Function} onProgress - Callback per progress (opzionale)
 * @param {boolean} isAdmin - Se true, rimuove il limite di dimensione file
 * @returns {Promise<string>} - URL pubblico del file caricato
 */
export const uploadToR2 = async (file, clientId, folder = 'anamnesi_photos', onProgress = null, isAdmin = false) => {
  if (!file) throw new Error('Nessun file fornito');

  // Validazione dimensione file (prima della compressione)
  if (!isAdmin) {
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw new Error(`Il file supera il limite di ${maxSizeMB}MB`);
    }
  }

  // Validazione tipo file
  const isImage = isImageFile(file);
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  
  if (!isImage && !isVideo && !isAudio) {
    throw new Error('Formato file non supportato. Formati immagine: JPG, PNG, HEIC, WebP, GIF, AVIF, BMP, TIFF');
  }

  const emit = (payload) => {
    try { 
      window.dispatchEvent(new CustomEvent('global-upload-progress', { detail: payload })); 
    } catch (err) { /* ignore */ }
  };

  try {
    // Comprimi l'immagine se necessario
    let fileToUpload = file;
    if (isImage) {
      if (onProgress) onProgress({ stage: 'compressing', percent: 5, message: 'Compressione immagine...' });
      emit({ stage: 'compressing', percent: 5, message: 'Compressione immagine...' });
      fileToUpload = await compressImage(file);
      if (onProgress) onProgress({ stage: 'compressed', percent: 15, message: 'Compressione completata' });
      emit({ stage: 'compressed', percent: 15, message: 'Compressione completata' });
    }

    // Determina il ContentType corretto
    const originalExtension = file.name.split('.').pop().toLowerCase();
    const isHeicFile = originalExtension === 'heic' || originalExtension === 'heif';
    const contentType = isImage 
      ? (isHeicFile ? 'image/jpeg' : getImageMimeType(fileToUpload))
      : fileToUpload.type;

    if (onProgress) onProgress({ stage: 'preparing', percent: 20, message: 'Preparazione upload...' });
    emit({ stage: 'preparing', percent: 20, message: 'Preparazione upload...' });

    // Converti file in base64
    const fileBase64 = await fileToBase64(fileToUpload);

    if (onProgress) onProgress({ stage: 'uploading', percent: 30, message: 'Caricamento...' });
    emit({ stage: 'uploading', percent: 30, message: 'Caricamento...' });

    // Chiama la Cloud Function (usa l'istanza functions importata da firebase.js che ha già l'app autenticata)
    const uploadFn = httpsCallable(functions, 'uploadToR2');
    
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      throw new Error('Tenant non configurato');
    }

    // DEBUG LOG - rimuovere dopo test
    console.log('🔵 [DEBUG UPLOAD] Iniziando upload...');
    console.log('🔵 [DEBUG UPLOAD] tenantId:', tenantId);
    console.log('🔵 [DEBUG UPLOAD] clientId:', clientId);
    console.log('🔵 [DEBUG UPLOAD] fileName:', fileToUpload.name);
    console.log('🔵 [DEBUG UPLOAD] contentType:', contentType);
    console.log('🔵 [DEBUG UPLOAD] fileBase64 length:', fileBase64?.length);
    console.log('🔵 [DEBUG UPLOAD] folder:', folder);

    try {
      const result = await uploadFn({
        fileBase64,
        fileName: fileToUpload.name,
        contentType,
        clientId,
        folder,
        tenantId,
        isLandingMedia: false,
      });
      
      console.log('🟢 [DEBUG UPLOAD] Risultato:', result);
      
      if (onProgress) onProgress({ stage: 'complete', percent: 100, message: 'Upload completato!' });
      emit({ stage: 'complete', percent: 100, message: 'Upload completato!' });

      return result.data.url;
    } catch (uploadError) {
      console.error('🔴 [DEBUG UPLOAD] Errore chiamata Cloud Function:', uploadError);
      console.error('🔴 [DEBUG UPLOAD] Errore code:', uploadError.code);
      console.error('🔴 [DEBUG UPLOAD] Errore details:', uploadError.details);
      console.error('🔴 [DEBUG UPLOAD] Errore message:', uploadError.message);
      throw uploadError;
    }

  } catch (error) {
    console.error('Errore upload R2:', error);
    throw new Error(`Errore durante l'upload: ${error.message}`);
  }
};

/**
 * Elimina un file da R2 tramite Cloud Function SICURA
 * 
 * @param {string} fileUrl - URL del file da eliminare
 * @returns {Promise<void>}
 */
export const deleteFromR2 = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    // Estrai la key dall'URL
    // URL formato: https://media.flowfitpro.it/clients/xxx/folder/file.jpg
    const urlObj = new URL(fileUrl);
    const fileKey = urlObj.pathname.slice(1); // Rimuovi lo slash iniziale

    // Chiama la Cloud Function (usa l'istanza functions importata da firebase.js)
    const deleteFn = httpsCallable(functions, 'deleteFromR2');
    
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      throw new Error('Tenant non configurato');
    }

    await deleteFn({ fileKey, tenantId });
  } catch (error) {
    console.error('Errore eliminazione R2:', error);
    // Non rilanciamo l'errore per non bloccare altre operazioni
  }
};

/**
 * Ottieni l'URL pubblico di un file su R2
 * NOTA: Non serve più, l'URL viene restituito dalla Cloud Function
 */
export const getR2URL = (fileKey) => {
  // Usa la variabile pubblica (solo URL, non le credenziali)
  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
  return publicUrl ? `${publicUrl}/${fileKey}` : '';
};

/**
 * Wrapper per compatibilità con uploadPhoto esistente
 */
export const uploadPhoto = async (file, clientId, folder = 'anamnesi_photos', onProgress = null, isAdmin = false) => {
  return uploadToR2(file, clientId, folder, onProgress, isAdmin);
};

export default {
  uploadToR2,
  uploadPhoto,
  compressImage,
  getR2URL,
  deleteFromR2,
};
