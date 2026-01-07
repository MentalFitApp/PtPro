import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/**
 * Landing Page Media Upload Service - VERSIONE SICURA
 * 
 * Upload video e immagini per le landing pages tramite Cloud Function.
 * Le credenziali R2 non sono più esposte nel frontend.
 */

/**
 * Tipi di media supportati
 */
export const MEDIA_TYPES = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
    maxSize: 50 * 1024 * 1024, // 50MB per immagini
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'],
  },
  video: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
    maxSize: 500 * 1024 * 1024, // 500MB per video
    extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
  },
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    maxSize: 50 * 1024 * 1024, // 50MB per audio
    extensions: ['mp3', 'wav', 'ogg', 'm4a'],
  },
};

/**
 * Valida un file per l'upload
 */
export const validateMediaFile = (file) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');

  if (!isImage && !isVideo && !isAudio) {
    throw new Error('Tipo file non supportato. Usa immagini, video o audio.');
  }

  const mediaType = isImage ? 'image' : isVideo ? 'video' : 'audio';
  const config = MEDIA_TYPES[mediaType];

  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / (1024 * 1024);
    throw new Error(`Il file supera il limite di ${maxSizeMB}MB per ${mediaType}`);
  }

  return { mediaType, isValid: true };
};

/**
 * Converte un File in base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

/**
 * Upload media per landing page
 * - File piccoli (<10MB): base64 via Cloud Function
 * - File grandi (>10MB): upload diretto con presigned URL
 * 
 * @param {File} file - File da caricare
 * @param {string} tenantId - ID del tenant
 * @param {string} pageId - ID della landing page
 * @param {string} blockId - ID del blocco (opzionale)
 * @param {Function} onProgress - Callback per progress
 * @returns {Promise<{url: string, type: string, size: number, name: string}>}
 */
export const uploadLandingMedia = async (file, tenantId, pageId, blockId = null, onProgress = null) => {
  if (!file) throw new Error('Nessun file fornito');
  
  // Valida il file
  const { mediaType } = validateMediaFile(file);
  
  onProgress?.({ stage: 'preparing', percent: 5, message: 'Preparazione upload...' });

  // Per file > 10MB usa upload diretto con presigned URL
  const DIRECT_UPLOAD_THRESHOLD = 10 * 1024 * 1024; // 10MB
  
  if (file.size > DIRECT_UPLOAD_THRESHOLD) {
    return uploadLargeFile(file, tenantId, pageId, blockId, mediaType, onProgress);
  }

  // Per file piccoli usa il metodo base64 esistente
  try {
    onProgress?.({ stage: 'encoding', percent: 10, message: 'Codifica file...' });
    const fileBase64 = await fileToBase64(file);

    onProgress?.({ stage: 'uploading', percent: 20, message: 'Caricamento...' });

    const uploadFn = httpsCallable(functions, 'uploadToR2', {
      timeout: 300000,
    });

    let progress = 20;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 10, 85);
      onProgress?.({ stage: 'uploading', percent: progress, message: 'Caricamento...' });
    }, 1000);

    const result = await uploadFn({
      fileBase64,
      fileName: file.name,
      contentType: file.type,
      tenantId,
      pageId,
      blockId,
      isLandingMedia: true,
    });

    clearInterval(progressInterval);
    onProgress?.({ stage: 'complete', percent: 100, message: 'Completato!' });

    return {
      url: result.data.url,
      type: mediaType,
      mimeType: file.type,
      size: file.size,
      name: file.name,
      key: result.data.key,
    };
  } catch (error) {
    console.error('Errore upload media:', error);
    throw new Error('Errore durante il caricamento: ' + error.message);
  }
};

/**
 * Upload file grandi con presigned URL (upload diretto a R2)
 */
const uploadLargeFile = async (file, tenantId, pageId, blockId, mediaType, onProgress) => {
  try {
    onProgress?.({ stage: 'preparing', percent: 10, message: 'Richiesta URL di upload...' });

    // 1. Ottieni presigned URL dalla Cloud Function
    const getUrlFn = httpsCallable(functions, 'getR2UploadUrl');
    const urlResult = await getUrlFn({
      fileName: file.name,
      contentType: file.type,
      tenantId,
      pageId,
      blockId,
      isLandingMedia: true,
    });

    const { uploadUrl, publicUrl, key } = urlResult.data;

    onProgress?.({ stage: 'uploading', percent: 20, message: 'Caricamento diretto...' });

    // 2. Upload diretto a R2 con XMLHttpRequest per tracking progress
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round(20 + (event.loaded / event.total) * 75);
          onProgress?.({ stage: 'uploading', percent, message: `Caricamento... ${Math.round(event.loaded / 1024 / 1024)}MB / ${Math.round(event.total / 1024 / 1024)}MB` });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload fallito: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Errore di rete durante upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload annullato')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    onProgress?.({ stage: 'complete', percent: 100, message: 'Completato!' });

    return {
      url: publicUrl,
      type: mediaType,
      mimeType: file.type,
      size: file.size,
      name: file.name,
      key,
    };
  } catch (error) {
    console.error('Errore upload file grande:', error);
    throw new Error('Errore durante il caricamento: ' + error.message);
  }
};

/**
 * Elimina media da landing page tramite Cloud Function SICURA
 * 
 * @param {string} fileUrl - URL del file da eliminare
 * @param {string} tenantId - ID del tenant
 * @returns {Promise<void>}
 */
export const deleteLandingMedia = async (fileUrl, tenantId) => {
  if (!fileUrl) return;

  try {
    const urlObj = new URL(fileUrl);
    const fileKey = urlObj.pathname.slice(1);

    // Chiama la Cloud Function (usa l'istanza functions importata da firebase.js)
    const deleteFn = httpsCallable(functions, 'deleteFromR2');

    await deleteFn({ fileKey, tenantId });
  } catch (error) {
    console.error('Errore eliminazione media:', error);
  }
};

/**
 * Formatta dimensione file in modo leggibile
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Calcola durata stimata upload basata su velocità tipica (5MB/s)
 */
export const estimateUploadTime = (fileSize) => {
  const speedMBps = 5;
  const seconds = fileSize / (speedMBps * 1024 * 1024);
  
  if (seconds < 60) return `~${Math.ceil(seconds)} secondi`;
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)} minuti`;
  return `~${Math.ceil(seconds / 3600)} ore`;
};

export default {
  uploadLandingMedia,
  deleteLandingMedia,
  validateMediaFile,
  formatFileSize,
  estimateUploadTime,
  MEDIA_TYPES,
};
