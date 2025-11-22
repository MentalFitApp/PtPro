import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cloudflare R2 Storage Configuration
 * R2 is S3-compatible, so we use AWS SDK with custom endpoint
 */

// Inizializza il client S3 per Cloudflare R2
let r2Client = null;

const getR2Client = () => {
  if (!r2Client) {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID;
    const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Configurazione R2 mancante. Verifica le variabili d\'ambiente VITE_R2_*');
    }

    r2Client = new S3Client({
      region: 'auto', // R2 usa 'auto' come region
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2Client;
};

/**
 * Comprimi un'immagine prima dell'upload
 * Riduce la dimensione del file del 70-80% mantenendo buona qualità
 * 
 * @param {File} file - File immagine da comprimere
 * @returns {Promise<File>} - File compresso
 */
export const compressImage = async (file) => {
  // Se non è un'immagine o è già piccola, ritorna il file originale
  if (!file.type.startsWith('image/') || file.size < 200 * 1024) {
    return file;
  }

  try {
    const options = {
      maxSizeMB: 1, // Dimensione massima 1MB
      maxWidthOrHeight: 1920, // Massima larghezza/altezza 1920px
      useWebWorker: true, // Usa Web Worker per performance migliori
      fileType: file.type, // Mantieni il tipo originale
    };

    const compressedFile = await imageCompression(file, options);
    console.log(`Compressione: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB (${(((file.size - compressedFile.size) / file.size) * 100).toFixed(0)}% riduzione)`);
    
    return compressedFile;
  } catch (error) {
    console.warn('Errore nella compressione, uso file originale:', error);
    return file;
  }
};

/**
 * Carica un file su Cloudflare R2
 * 
 * @param {File} file - File da caricare (immagine, video, audio)
 * @param {string} clientId - ID del cliente per organizzare i file
 * @param {string} folder - Sotto-cartella (es. 'anamnesi_photos', 'check_photos', 'community_media')
 * @param {Function} onProgress - Callback per progress (opzionale)
 * @param {boolean} isAdmin - Se true, rimuove il limite di dimensione file (default: false)
 * @returns {Promise<string>} - URL pubblico del file caricato
 */
export const uploadToR2 = async (file, clientId, folder = 'anamnesi_photos', onProgress = null, isAdmin = false) => {
  if (!file) throw new Error('Nessun file fornito');

  // Validazione dimensione file (prima della compressione)
  // Admin: nessun limite, Clienti: 10MB per immagini, 50MB per video, 10MB per audio
  if (!isAdmin) {
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw new Error(`Il file supera il limite di ${maxSizeMB}MB`);
    }
  }

  // Validazione tipo file
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  if (!isImage && !isVideo && !isAudio) {
    throw new Error('Il file deve essere un\'immagine, un video o un audio');
  }

  try {
    // Comprimi l'immagine se necessario
    let fileToUpload = file;
    if (isImage) {
      const emit = (payload) => {
        try { 
          window.dispatchEvent(new CustomEvent('global-upload-progress', { detail: payload })); 
        } catch (err) {
          console.warn('Failed to emit progress event:', err);
        }
      };
      if (onProgress) onProgress({ stage: 'compressing', percent: 5, message: 'Compressione immagine in corso...' });
      emit({ stage: 'compressing', percent: 5, message: 'Compressione immagine in corso...' });
      fileToUpload = await compressImage(file);
      if (onProgress) onProgress({ stage: 'compressed', percent: 15, message: 'Compressione completata' });
      emit({ stage: 'compressed', percent: 15, message: 'Compressione completata' });
    }

    // Crea nome file unico
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fileKey = `clients/${clientId}/${folder}/${fileName}`;

    // Prepara il comando per l'upload
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('VITE_R2_BUCKET_NAME non configurato');
    }

    const emit = (payload) => { 
      try { 
        window.dispatchEvent(new CustomEvent('global-upload-progress', { detail: payload })); 
      } catch (err) {
        console.warn('Failed to emit progress event:', err);
      }
    };
    if (onProgress) onProgress({ stage: 'uploading', percent: 20, message: 'Upload iniziato...' });
    emit({ stage: 'uploading', percent: 20, message: 'Upload iniziato...' });

    // Converti il file in ArrayBuffer per l'upload
    const arrayBuffer = await fileToUpload.arrayBuffer();
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: new Uint8Array(arrayBuffer),
      ContentType: fileToUpload.type,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Upload a R2
    const client = getR2Client();
    // Simulazione avanzamento (PutObject non espone progress nativo) 
    // Avanziamo a tappe mentre attendiamo la promise
    const progressSteps = [40, 55, 70, 85];
    let stepIndex = 0;
    const intervalId = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        const payload = { stage: 'uploading', percent: progressSteps[stepIndex], message: 'Caricamento...' };
        if (onProgress) onProgress(payload);
        emit(payload);
        stepIndex++;
      }
    }, 250);

    await client.send(command); // attende completamento effettivo
    clearInterval(intervalId);

    const finalizing = { stage: 'finalizing', percent: 95, message: 'Finalizzazione...' };
    const complete = { stage: 'complete', percent: 100, message: 'Upload completato!' };
    if (onProgress) onProgress(finalizing);
    emit(finalizing);
    if (onProgress) onProgress(complete);
    emit(complete);

    // Costruisci l'URL pubblico usando il custom domain
    const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;
    
    // Usa il custom domain configurato: https://media.flowfitpro.it/<key>
    const fileUrl = `${publicUrl}/${fileKey}`;

    console.log(`Upload completato su R2: ${fileName} -> ${fileUrl}`);
    return fileUrl;

  } catch (error) {
    console.error('Errore upload R2:', error);
    throw new Error(`Errore durante l'upload: ${error.message}`);
  }
};

/**
 * Ottieni l'URL pubblico di un file su R2
 * 
 * @param {string} fileKey - Chiave del file (path completo)
 * @returns {string} - URL pubblico del file
 */
export const getR2URL = (fileKey) => {
  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;
  return `${publicUrl}/${fileKey}`;
};

/**
 * Wrapper per compatibilità con uploadPhoto esistente
 * Mantiene la stessa interfaccia della funzione Firebase
 * 
 * @param {File} file - File da caricare
 * @param {string} clientId - ID del cliente
 * @param {string} folder - Sotto-cartella
 * @param {Function} onProgress - Callback per progress (opzionale)
 * @param {boolean} isAdmin - Se true, rimuove il limite di dimensione file (default: false)
 * @returns {Promise<string>} - URL del file caricato
 */
export const uploadPhoto = async (file, clientId, folder = 'anamnesi_photos', onProgress = null, isAdmin = false) => {
  return uploadToR2(file, clientId, folder, onProgress, isAdmin);
};

// Export default per retrocompatibilità
export default {
  uploadToR2,
  uploadPhoto,
  compressImage,
  getR2URL,
};
