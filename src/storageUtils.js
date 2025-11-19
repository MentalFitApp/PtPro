/**
 * Storage Utilities - Migrated to Cloudflare R2
 * 
 * Questo file ora usa Cloudflare R2 per lo storage invece di Firebase.
 * R2 offre:
 * - Storage più economico (€0.015/GB vs €0.026/GB Firebase)
 * - Bandwidth gratuito (vs €0.12/GB Firebase)
 * - Compressione automatica immagini (riduce 70-80% dimensione)
 */

import { uploadToR2, uploadPhoto as uploadPhotoR2, compressImage } from './cloudflareStorage';

/**
 * Carica un file su Cloudflare R2 Storage (con compressione automatica per immagini).
 * 
 * @param {File} file - Il file da caricare.
 * @param {string} clientId - L'ID del cliente per la cartella di destinazione.
 * @param {string} folder - Sotto-cartella (es. 'anamnesi_photos', 'check_photos').
 * @returns {Promise<string>} L'URL pubblico del file caricato.
 */
export const uploadPhoto = async (file, clientId, folder = 'anamnesi_photos') => {
  return uploadPhotoR2(file, clientId, folder);
};

// Export delle funzioni R2 per uso diretto
export { uploadToR2, compressImage };