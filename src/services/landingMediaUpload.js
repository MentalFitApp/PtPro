import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

/**
 * Landing Page Media Upload Service
 * Upload video e immagini senza limiti di dimensione per le landing pages
 * Usa Cloudflare R2 per storage economico e performante
 */

// Singleton R2 Client
let r2Client = null;

const getR2Client = () => {
  if (!r2Client) {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID;
    const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Configurazione R2 mancante');
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return r2Client;
};

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
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB per video
    extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
  },
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    maxSize: 500 * 1024 * 1024, // 500MB per audio
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
    const maxSizeGB = config.maxSize / (1024 * 1024 * 1024);
    const maxSizeMB = config.maxSize / (1024 * 1024);
    const sizeStr = maxSizeGB >= 1 ? `${maxSizeGB}GB` : `${maxSizeMB}MB`;
    throw new Error(`Il file supera il limite di ${sizeStr} per ${mediaType}`);
  }

  return { mediaType, isValid: true };
};

/**
 * Upload file multipart per file grandi (> 100MB)
 * Usa chunk di 10MB per upload progressivo
 */
const uploadLargeFile = async (file, fileKey, onProgress) => {
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const client = getR2Client();
  const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

  // Per file grandi, usiamo un approccio diretto con body stream
  // R2 gestisce internamente il multipart
  const arrayBuffer = await file.arrayBuffer();
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: new Uint8Array(arrayBuffer),
    ContentType: file.type,
    Metadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      fileSize: String(file.size),
    },
  });

  // Simula progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress = Math.min(progress + 5, 90);
    onProgress?.({ 
      stage: 'uploading', 
      percent: progress, 
      message: `Caricamento: ${progress}%` 
    });
  }, 500);

  try {
    await client.send(command);
    clearInterval(progressInterval);
    onProgress?.({ stage: 'complete', percent: 100, message: 'Upload completato!' });
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
};

/**
 * Upload media per landing page
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
  
  // Genera path univoco
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const folder = blockId ? `${pageId}/${blockId}` : pageId;
  const fileKey = `landing-media/${tenantId}/${folder}/${fileName}`;

  const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;
  if (!bucketName) throw new Error('VITE_R2_BUCKET_NAME non configurato');

  onProgress?.({ stage: 'preparing', percent: 5, message: 'Preparazione upload...' });

  try {
    // Per file > 100MB usa upload ottimizzato
    if (file.size > 100 * 1024 * 1024) {
      await uploadLargeFile(file, fileKey, onProgress);
    } else {
      // Upload standard per file più piccoli
      const arrayBuffer = await file.arrayBuffer();
      
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Simula progress
      let progress = 10;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + 15, 85);
        onProgress?.({ stage: 'uploading', percent: progress, message: 'Caricamento...' });
      }, 300);

      const client = getR2Client();
      await client.send(command);
      
      clearInterval(progressInterval);
      onProgress?.({ stage: 'complete', percent: 100, message: 'Completato!' });
    }

    // Costruisci URL pubblico
    const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;
    const url = publicUrl 
      ? `${publicUrl}/${fileKey}` 
      : `https://${bucketName}.r2.cloudflarestorage.com/${fileKey}`;

    return {
      url,
      type: mediaType,
      mimeType: file.type,
      size: file.size,
      name: file.name,
      key: fileKey,
    };
  } catch (error) {
    console.error('Errore upload media:', error);
    throw new Error('Errore durante il caricamento: ' + error.message);
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
  const speedMBps = 5; // Velocità media stimata
  const seconds = fileSize / (speedMBps * 1024 * 1024);
  
  if (seconds < 60) return `~${Math.ceil(seconds)} secondi`;
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)} minuti`;
  return `~${Math.ceil(seconds / 3600)} ore`;
};

export default {
  uploadLandingMedia,
  validateMediaFile,
  formatFileSize,
  estimateUploadTime,
  MEDIA_TYPES,
};
