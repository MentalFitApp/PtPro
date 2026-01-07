/**
 * Media Upload Utilities
 * Gestisce upload di immagini, video, audio e documenti
 * Supporta: foto, video, audio (vocali), PDF
 */

import { uploadToR2 } from '../cloudflareStorage';

/**
 * Valida tipo e dimensione file
 */
export const validateFile = (file, type = 'image') => {
  const limits = {
    image: { maxSize: 10 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] }, // 10MB
    video: { maxSize: 500 * 1024 * 1024, types: ['video/mp4', 'video/webm', 'video/quicktime'] }, // 500MB
    audio: { maxSize: 25 * 1024 * 1024, types: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'] }, // 25MB
    document: { maxSize: 10 * 1024 * 1024, types: ['application/pdf', 'application/msword'] }, // 10MB
  };

  const config = limits[type];
  if (!config) return { valid: false, error: 'Tipo file non supportato' };

  if (file.size > config.maxSize) {
    return { 
      valid: false, 
      error: `File troppo grande. Massimo: ${(config.maxSize / 1024 / 1024).toFixed(0)}MB` 
    };
  }

  if (!config.types.includes(file.type)) {
    return { 
      valid: false, 
      error: `Formato non supportato. Formati accettati: ${config.types.join(', ')}` 
    };
  }

  return { valid: true };
};

/**
 * Upload immagine
 */
export const uploadImage = async (file, userId, folder = 'images', onProgress = null) => {
  const validation = validateFile(file, 'image');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const url = await uploadToR2(
      file,
      userId,
      folder,
      onProgress,
      true // auto-compress
    );
    return { type: 'image', url };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Errore durante il caricamento dell\'immagine');
  }
};

/**
 * Upload video
 */
export const uploadVideo = async (file, userId, folder = 'videos', onProgress = null) => {
  const validation = validateFile(file, 'video');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const url = await uploadToR2(
      file,
      userId,
      folder,
      onProgress,
      false // no compression for video
    );
    
    // Ottieni durata video (se possibile)
    const duration = await getVideoDuration(file);
    
    return { type: 'video', url, duration };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw new Error('Errore durante il caricamento del video');
  }
};

/**
 * Upload audio (vocale)
 */
export const uploadAudio = async (file, userId, folder = 'audio', onProgress = null) => {
  const validation = validateFile(file, 'audio');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const url = await uploadToR2(
      file,
      userId,
      folder,
      onProgress,
      false
    );
    
    // Ottieni durata audio
    const duration = await getAudioDuration(file);
    
    return { type: 'audio', url, duration };
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw new Error('Errore durante il caricamento dell\'audio');
  }
};

/**
 * Ottieni durata video
 */
const getVideoDuration = (file) => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      
      video.onerror = () => {
        resolve(null);
      };
      
      video.src = URL.createObjectURL(file);
    } catch (error) {
      resolve(null);
    }
  });
};

/**
 * Ottieni durata audio
 */
const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    try {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        resolve(Math.round(audio.duration));
      };
      
      audio.onerror = () => {
        resolve(null);
      };
      
      audio.src = URL.createObjectURL(file);
    } catch (error) {
      resolve(null);
    }
  });
};

/**
 * Registra audio dal microfono
 */
export class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Impossibile accedere al microfono');
    }
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Nessuna registrazione in corso'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        
        resolve(audioFile);
      };

      this.mediaRecorder.stop();
    });
  }

  cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.audioChunks = [];
  }
}

/**
 * Formatta durata in mm:ss
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Ottieni tipo file da URL o nome file
 */
export const getFileType = (url) => {
  if (!url) return 'unknown';
  
  const lower = url.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
  if (lower.match(/\.(mp4|webm|mov)$/)) return 'video';
  if (lower.match(/\.(mp3|wav|webm|ogg)$/)) return 'audio';
  if (lower.match(/\.(pdf)$/)) return 'document';
  
  return 'unknown';
};

/**
 * Genera thumbnail da video
 */
export const generateVideoThumbnail = (file) => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadeddata = () => {
        // Vai a 1 secondo nel video
        video.currentTime = 1;
      };
      
      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
          window.URL.revokeObjectURL(video.src);
          resolve(thumbnailFile);
        }, 'image/jpeg', 0.7);
      };
      
      video.onerror = () => {
        resolve(null);
      };
      
      video.src = URL.createObjectURL(file);
    } catch (error) {
      resolve(null);
    }
  });
};
