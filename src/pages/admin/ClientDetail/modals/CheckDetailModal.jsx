// src/pages/admin/ClientDetail/modals/CheckDetailModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Weight, FileText, Image, ZoomIn, ImageOff } from 'lucide-react';
import { useUserPreferences } from '../../../../hooks/useUserPreferences';
import { toDate } from '../../../../firebase';

export default function CheckDetailModal({ isOpen, onClose, check, onPhotoZoom }) {
  const { formatWeight } = useUserPreferences();
  const [failedPhotos, setFailedPhotos] = useState({});
  
  if (!isOpen || !check) return null;

  const photoTypes = [
    { key: 'front', label: 'Frontale' },
    { key: 'right', label: 'Laterale Destro' },
    { key: 'left', label: 'Laterale Sinistro' },
    { key: 'back', label: 'Posteriore' }
  ];

  const checkDate = check.createdAt ? toDate(check.createdAt)?.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Data non disponibile';

  const hasPhotos = check.photoURLs && Object.values(check.photoURLs).some(url => url);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 rounded-xl">
                <Calendar className="text-cyan-400" size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Dettaglio Check</h2>
                <p className="text-sm text-slate-400 capitalize">{checkDate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Peso */}
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Weight size={16} />
                  <span className="text-xs font-medium uppercase">Peso</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {check.weight ? formatWeight(check.weight) : 'N/D'}
                </p>
              </div>

              {/* Body Fat */}
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <span className="text-xs font-medium uppercase">Body Fat</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {check.bodyFat ? `${check.bodyFat}%` : 'N/D'}
                </p>
              </div>

              {/* Misurazioni aggiuntive se presenti */}
              {check.waist && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <span className="text-xs font-medium uppercase">Vita</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white">{check.waist} cm</p>
                </div>
              )}

              {check.hips && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <span className="text-xs font-medium uppercase">Fianchi</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white">{check.hips} cm</p>
                </div>
              )}
            </div>

            {/* Note */}
            {check.notes && (
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <FileText size={16} />
                  <span className="text-xs font-medium uppercase">Note</span>
                </div>
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{check.notes}</p>
              </div>
            )}

            {/* Foto */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <Image size={16} />
                <span className="text-xs font-medium uppercase">Foto</span>
              </div>
              
              {hasPhotos ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {photoTypes.map(({ key, label }) => (
                    <div key={key} className="text-center">
                      <p className="text-xs font-medium text-slate-400 mb-2">{label}</p>
                      {check.photoURLs?.[key] && !failedPhotos[key] ? (
                        <button
                          onClick={() => onPhotoZoom(check.photoURLs[key], label)}
                          className="relative w-full aspect-[3/4] overflow-hidden rounded-xl border border-slate-700 group"
                        >
                          <img
                            src={check.photoURLs[key]}
                            alt={label}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={() => setFailedPhotos(prev => ({ ...prev, [key]: true }))}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                          </div>
                        </button>
                      ) : (
                        <div className="w-full aspect-[3/4] bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 gap-2">
                          {failedPhotos[key] ? (
                            <>
                              <ImageOff size={20} />
                              <span className="text-xs">Errore</span>
                            </>
                          ) : (
                            <span className="text-xs">Non disponibile</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center">
                  <ImageOff className="mx-auto text-slate-600 mb-2" size={32} />
                  <p className="text-slate-500 text-sm">Nessuna foto caricata per questo check</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
