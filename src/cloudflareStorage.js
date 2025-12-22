import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cloudflare R2 Storage Configuration
 * R2 is S3-compatible, so we use AWS SDK with custom endpoint
 */

// Formati immagine supportati (estensione -> MIME type)
// Lista estesa per supportare tutti i formati comuni da smartphone e fotocamere
const IMAGE_EXTENSIONS = {
  // JPEG variants
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'jpe': 'image/jpeg',
  'jfif': 'image/jpeg',
  'jif': 'image/jpeg',
  // PNG
  'png': 'image/png',
  // GIF
  'gif': 'image/gif',
  // Modern formats
  'webp': 'image/webp',
  'avif': 'image/avif',
  // Apple formats (iPhone/iPad)
  'heic': 'image/heic',
  'heif': 'image/heif',
  'hif': 'image/heif',
  // RAW formats (fotocamere)
  'raw': 'image/raw',
  'cr2': 'image/x-canon-cr2',
  'nef': 'image/x-nikon-nef',
  'arw': 'image/x-sony-arw',
  'dng': 'image/x-adobe-dng',
  // Legacy formats
  'bmp': 'image/bmp',
  'dib': 'image/bmp',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  // Vector/other
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'cur': 'image/x-icon',
  // Samsung/Android specific
  'srw': 'image/x-samsung-srw',
  // Other common
  'psd': 'image/vnd.adobe.photoshop',
  'jp2': 'image/jp2',
  'jpx': 'image/jpx',
};

/**
 * Accept string per input file - include esplicitamente HEIC per iOS
 * Usare questa stringa negli input type="file" per garantire compatibilità
 */
export const IMAGE_ACCEPT_STRING = 'image/*,.heic,.heif,.HEIC,.HEIF';

/**
 * Determina se un file è un'immagine basandosi su MIME type O estensione
 * Utile per file HEIC che alcuni browser non riconoscono
 */
const isImageFile = (file) => {
  // Check MIME type
  if (file.type && file.type.startsWith('image/')) return true;
  
  // Check estensione se MIME type vuoto o application/octet-stream
  if (!file.type || file.type === 'application/octet-stream' || file.type === '') {
    const ext = file.name?.split('.').pop()?.toLowerCase();
    return ext && IMAGE_EXTENSIONS[ext] !== undefined;
  }
  
  return false;
};

/**
 * Ottiene il MIME type corretto per un file
 * Usa l'estensione se il browser non riconosce il tipo
 */
const getImageMimeType = (file) => {
  // Se il browser ha già identificato un tipo immagine valido, usalo
  if (file.type && file.type.startsWith('image/') && file.type !== 'application/octet-stream') {
    return file.type;
  }
  
  // Altrimenti, determina dall'estensione
  const ext = file.name?.split('.').pop()?.toLowerCase();
  return IMAGE_EXTENSIONS[ext] || 'image/jpeg'; // Default a JPEG
};

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
 * Converte un file HEIC/HEIF in JPEG usando heic2any
 * @param {File} file - File HEIC da convertire
 * @returns {Promise<File>} - File JPEG convertito
 */
const convertHeicToJpeg = async (file) => {
  console.log('[HEIC] Inizio conversione:', file.name, 'type:', file.type, 'size:', file.size);
  try {
    const blob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85
    });
    
    // heic2any può restituire un array o un singolo blob
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;
    
    // Crea un nuovo File dal blob con nome .jpg
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    const convertedFile = new File([resultBlob], newFileName, { type: 'image/jpeg' });
    console.log('[HEIC] Conversione completata:', convertedFile.name, 'type:', convertedFile.type, 'size:', convertedFile.size);
    return convertedFile;
  } catch (error) {
    console.error('[HEIC] Errore conversione HEIC:', error);
    throw error;
  }
};

/**
 * Comprimi un'immagine prima dell'upload
 * Riduce la dimensione del file del 70-80% mantenendo buona qualità
 * Converte automaticamente HEIC/HEIF in JPEG per compatibilità browser
 * 
 * @param {File} file - File immagine da comprimere
 * @returns {Promise<File>} - File compresso (sempre in formato JPEG per HEIC, altrimenti originale)
 */
export const compressImage = async (file) => {
  console.log('[compressImage] Input:', file.name, 'type:', file.type, 'size:', file.size);
  
  // Se non è un'immagine, ritorna il file originale
  if (!isImageFile(file)) {
    console.log('[compressImage] Non è immagine, ritorno originale');
    return file;
  }

  // Determina se è un file HEIC/HEIF (formato iPhone)
  const ext = file.name?.toLowerCase().split('.').pop();
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || 
                 file.type === '' || file.type === 'application/octet-stream' &&
                 (ext === 'heic' || ext === 'heif');
  
  // Forza controllo estensione per HEIC (iOS a volte non mette il mime type corretto)
  const isHeicByExtension = ext === 'heic' || ext === 'heif';
  const needsHeicConversion = isHeic || isHeicByExtension;
  
  console.log('[compressImage] ext:', ext, 'isHeic:', isHeic, 'isHeicByExtension:', isHeicByExtension, 'needsHeicConversion:', needsHeicConversion);
  
  // Determina se è WebP o AVIF (formati moderni)
  const isModernFormat = ext === 'webp' || ext === 'avif' || 
                         file.type === 'image/webp' || file.type === 'image/avif';

  // Se è già piccola e non è HEIC, ritorna il file originale
  if (file.size < 200 * 1024 && !needsHeicConversion) {
    return file;
  }

  try {
    let fileToCompress = file;
    
    // Se è HEIC, converti prima in JPEG usando heic2any
    if (needsHeicConversion) {
      console.log('Conversione HEIC → JPEG in corso...');
      fileToCompress = await convertHeicToJpeg(file);
      console.log('Conversione HEIC completata:', fileToCompress.name);
    }
    
    // Determina il tipo di output
    let outputType = fileToCompress.type || 'image/jpeg';
    if (!outputType || outputType === 'application/octet-stream') {
      outputType = getImageMimeType(fileToCompress);
    }
    
    const options = {
      maxSizeMB: 1, // Dimensione massima 1MB
      maxWidthOrHeight: 1920, // Massima larghezza/altezza 1920px
      useWebWorker: true, // Usa Web Worker per performance migliori
      fileType: outputType,
      // Aggiungi initialQuality per migliore qualità
      initialQuality: 0.85,
    };

    const compressedFile = await imageCompression(fileToCompress, options);
    console.log(`Compressione${needsHeicConversion ? ' (HEIC→JPEG)' : ''}: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB (${(((file.size - compressedFile.size) / file.size) * 100).toFixed(0)}% riduzione)`);
    
    return compressedFile;
  } catch (error) {
    console.warn('[compressImage] Errore nella compressione:', error);
    // Se la conversione HEIC fallisce, NON caricare il file originale perché non sarà visualizzabile
    if (needsHeicConversion) {
      console.error('[compressImage] CRITICO: Impossibile convertire HEIC. Il file non può essere caricato.');
      throw new Error('Impossibile convertire il file HEIC. Prova a scattare una nuova foto in formato JPEG.');
    }
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

  // Validazione tipo file - usa le nuove funzioni helper per supportare più formati
  const isImage = isImageFile(file);
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  
  if (!isImage && !isVideo && !isAudio) {
    // Log per debug
    console.warn('File type not recognized:', file.type, 'name:', file.name);
    throw new Error('Formato file non supportato. Formati immagine: JPG, PNG, HEIC, WebP, GIF, AVIF, BMP, TIFF e altri');
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
    // Se era HEIC/HEIF e è stato convertito a JPEG, usa estensione .jpg
    const originalExtension = file.name.split('.').pop().toLowerCase();
    const isHeicFile = originalExtension === 'heic' || originalExtension === 'heif';
    const fileExtension = isHeicFile ? 'jpg' : originalExtension;
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fileKey = `clients/${clientId}/${folder}/${fileName}`;
    
    // Determina il ContentType corretto
    const contentType = isImage 
      ? (isHeicFile ? 'image/jpeg' : getImageMimeType(fileToUpload))
      : fileToUpload.type;

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
      ContentType: contentType,
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
