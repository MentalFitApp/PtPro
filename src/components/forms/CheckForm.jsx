import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- 1. NUOVE ICONE DA LUCIDE-REACT ---
import { UploadCloud, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadToR2 } from '../cloudflareStorage.js';

export default function CheckForm({ clientId, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState('');

  const onSubmit = async (data) => {
    setIsUploading(true);
    setUploadProgress(0);
    setFormError('');

    const files = Array.from(data.photos);
    if (files.length === 0) {
      setFormError("Per favore, seleziona almeno una foto.");
      setIsUploading(false);
      return;
    }

    try {
      // Upload photos to Cloudflare R2 with progress tracking
      const photoURLs = await Promise.all(
        files.map(async (file, index) => {
          const url = await uploadToR2(file, clientId, 'check_photos', (progressInfo) => {
            // Update progress: calculate average progress across all files
            const progressPerFile = 100 / files.length;
            const currentProgress = (index * progressPerFile) + (progressInfo.percent * progressPerFile / 100);
            setUploadProgress(currentProgress);
          });
          return url;
        })
      );
      
      await addDoc(collection(db, 'clients', clientId, 'checks'), {
        notes: data.notes,
        weight: parseFloat(data.weight), // Assicuriamoci di salvare anche il peso
        photoURLs: photoURLs,
        createdAt: serverTimestamp()
      });

      reset();
      if(onSuccess) onSuccess(); // Chiama la callback di successo
      
    } catch (error) {
      console.error("Errore nel processo di salvataggio del check:", error);
      setFormError("Si è verificato un errore durante il salvataggio.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // --- 2. STILI AGGIORNATI ---
  const inputStyle = "w-full p-2.5 bg-slate-800/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 placeholder:text-slate-500";
  const labelStyle = "block mb-1 text-sm font-medium text-slate-300";

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
      <h3 className="text-xl font-semibold mb-4 text-rose-300 flex items-center gap-2">
        <UploadCloud size={20} /> Nuovo Check
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="weight" className={labelStyle}>Peso Attuale (kg)*</label>
           <input
            id="weight"
            type="number"
            step="0.1"
            {...register('weight', { required: "Il peso è obbligatorio." })}
            className={inputStyle}
            placeholder="Es. 75.5"
          />
          {errors.weight && <p className="text-red-400 text-xs mt-1">{errors.weight.message}</p>}
        </div>
        <div>
          <label htmlFor="notes" className={labelStyle}>Note sui progressi</label>
          <textarea id="notes" {...register('notes')} rows="4" className={inputStyle} placeholder="Es. Aumento carichi, sensazioni, misure..."></textarea>
        </div>
        <div>
          <label htmlFor="photos" className={labelStyle}>Foto Progressi*</label>
          <input
            id="photos"
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            {...register('photos', { required: "Le foto sono obbligatorie." })}
            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-600/20 file:text-rose-300 hover:file:bg-rose-600/30 cursor-pointer"
          />
          {errors.photos && <p className="text-red-400 text-xs mt-1">{errors.photos.message}</p>}
        </div>

        {isUploading && (
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <motion.div 
              className="bg-rose-500 h-2.5 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {formError && <p className="text-red-400 text-xs mt-1 flex items-center gap-2"><AlertCircle size={14}/> {formError}</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isUploading}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
          >
            {isUploading ? `Caricamento... ${Math.round(uploadProgress)}%` : 'Salva Check'}
          </button>
        </div>
      </form>
    </div>
  );
}
