// src/components/client/PhotoCompare.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Image, Calendar, ArrowLeftRight } from 'lucide-react';

const formatDate = (date) => {
  if (!date) return 'N/D';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Tipi di foto supportati
const PHOTO_TYPES = {
  front: 'Frontale',
  back: 'Posteriore', 
  side: 'Laterale',
  sideLeft: 'Lat. Sinistra',
  sideRight: 'Lat. Destra'
};

export default function PhotoCompare({ checks = [], anamnesi = null, onClose }) {
  const [selectedType, setSelectedType] = useState(null);
  const [leftPhotoIndex, setLeftPhotoIndex] = useState(0);
  const [rightPhotoIndex, setRightPhotoIndex] = useState(1);
  const [compareMode, setCompareMode] = useState(false); // false = grid, true = compare
  const [sliderPosition, setSliderPosition] = useState(50);

  // Raggruppa tutte le foto per tipo
  const photosByType = useMemo(() => {
    const grouped = {};
    
    // Foto dai check (ordinate dal più vecchio al più recente)
    const sortedChecks = [...checks].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateA - dateB;
    });

    sortedChecks.forEach(check => {
      if (!check.photoURLs) return;
      Object.entries(check.photoURLs).forEach(([type, url]) => {
        if (!url) return;
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push({
          url,
          date: check.createdAt,
          source: 'check',
          checkId: check.id,
          weight: check.weight,
          bodyFat: check.bodyFat
        });
      });
    });

    // Foto dall'anamnesi (come "prima")
    if (anamnesi?.photoURLs) {
      Object.entries(anamnesi.photoURLs).forEach(([type, url]) => {
        if (!url) return;
        if (!grouped[type]) grouped[type] = [];
        // Aggiungi all'inizio come foto più vecchia
        grouped[type].unshift({
          url,
          date: anamnesi.createdAt,
          source: 'anamnesi',
          weight: anamnesi.weight,
          bodyFat: anamnesi.bodyFat
        });
      });
    }

    return grouped;
  }, [checks, anamnesi]);

  // Tipi disponibili (con almeno 2 foto per confronto)
  const availableTypes = useMemo(() => {
    return Object.entries(photosByType)
      .filter(([_, photos]) => photos.length >= 2)
      .map(([type]) => type);
  }, [photosByType]);

  // Foto del tipo selezionato
  const currentPhotos = selectedType ? photosByType[selectedType] || [] : [];

  // Se non ci sono foto confrontabili
  if (availableTypes.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="bg-slate-900 rounded-2xl p-8 text-center max-w-md" onClick={e => e.stopPropagation()}>
          <Image size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">Nessun confronto disponibile</h3>
          <p className="text-slate-400 mb-6">
            Servono almeno 2 foto dello stesso tipo (frontale, laterale, ecc.) per fare un confronto.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </motion.div>
    );
  }

  // Se non è selezionato un tipo, mostra la selezione
  if (!selectedType) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900 rounded-2xl p-6 w-full max-w-lg"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <ArrowLeftRight size={20} />
              Confronta Foto
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <p className="text-slate-400 mb-4 text-sm">
            Seleziona il tipo di foto da confrontare:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {availableTypes.map(type => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  setLeftPhotoIndex(0);
                  setRightPhotoIndex(photosByType[type].length - 1);
                }}
                className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <img 
                      src={photosByType[type][0]?.url} 
                      alt={type}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                      {PHOTO_TYPES[type] || type}
                    </p>
                    <p className="text-xs text-slate-500">
                      {photosByType[type].length} foto disponibili
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Modalità confronto
  const leftPhoto = currentPhotos[leftPhotoIndex];
  const rightPhoto = currentPhotos[rightPhotoIndex];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-sm">
        <button 
          onClick={() => setSelectedType(null)}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Cambia tipo</span>
        </button>
        
        <h3 className="text-white font-medium">
          {PHOTO_TYPES[selectedType] || selectedType} - Confronto
        </h3>

        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Toggle mode */}
      <div className="flex justify-center gap-2 p-3 bg-slate-900/50">
        <button
          onClick={() => setCompareMode(false)}
          className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
            !compareMode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Affiancate
        </button>
        <button
          onClick={() => setCompareMode(true)}
          className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
            compareMode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Slider
        </button>
      </div>

      {/* Photos */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {!compareMode ? (
          // Side by side
          <div className="flex gap-4 w-full max-w-6xl h-full">
            {/* Left Photo */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-900">
                <img 
                  src={leftPhoto?.url} 
                  alt="Before"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-medium">{formatDate(leftPhoto?.date)}</p>
                  <div className="flex gap-3 text-xs text-slate-300 mt-1">
                    {leftPhoto?.weight && <span>Peso: {leftPhoto.weight} kg</span>}
                    {leftPhoto?.bodyFat && <span>BF: {leftPhoto.bodyFat}%</span>}
                    <span className="text-blue-400">{leftPhoto?.source === 'anamnesi' ? 'Anamnesi' : 'Check'}</span>
                  </div>
                </div>
              </div>
              {/* Selector */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => setLeftPhotoIndex(Math.max(0, leftPhotoIndex - 1))}
                  disabled={leftPhotoIndex === 0}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} className="text-white" />
                </button>
                <span className="text-xs text-slate-400 min-w-[60px] text-center">
                  {leftPhotoIndex + 1} / {currentPhotos.length}
                </span>
                <button
                  onClick={() => setLeftPhotoIndex(Math.min(currentPhotos.length - 1, leftPhotoIndex + 1))}
                  disabled={leftPhotoIndex >= rightPhotoIndex - 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* Right Photo */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-900">
                <img 
                  src={rightPhoto?.url} 
                  alt="After"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-medium">{formatDate(rightPhoto?.date)}</p>
                  <div className="flex gap-3 text-xs text-slate-300 mt-1">
                    {rightPhoto?.weight && <span>Peso: {rightPhoto.weight} kg</span>}
                    {rightPhoto?.bodyFat && <span>BF: {rightPhoto.bodyFat}%</span>}
                    <span className="text-emerald-400">{rightPhoto?.source === 'anamnesi' ? 'Anamnesi' : 'Check'}</span>
                  </div>
                </div>
              </div>
              {/* Selector */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => setRightPhotoIndex(Math.max(leftPhotoIndex + 1, rightPhotoIndex - 1))}
                  disabled={rightPhotoIndex <= leftPhotoIndex + 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} className="text-white" />
                </button>
                <span className="text-xs text-slate-400 min-w-[60px] text-center">
                  {rightPhotoIndex + 1} / {currentPhotos.length}
                </span>
                <button
                  onClick={() => setRightPhotoIndex(Math.min(currentPhotos.length - 1, rightPhotoIndex + 1))}
                  disabled={rightPhotoIndex === currentPhotos.length - 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Slider compare mode
          <div className="relative w-full max-w-3xl aspect-[3/4] rounded-xl overflow-hidden">
            {/* Right photo (background) */}
            <img 
              src={rightPhoto?.url} 
              alt="After"
              className="absolute inset-0 w-full h-full object-contain"
            />
            
            {/* Left photo (clipped) */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img 
                src={leftPhoto?.url} 
                alt="Before"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
              />
            </div>

            {/* Slider handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                <ArrowLeftRight size={18} className="text-slate-800" />
              </div>
            </div>

            {/* Slider input (invisible, for interaction) */}
            <input
              type="range"
              min="5"
              max="95"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            />

            {/* Labels */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/70 text-white text-sm">
              {formatDate(leftPhoto?.date)}
            </div>
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-black/70 text-white text-sm">
              {formatDate(rightPhoto?.date)}
            </div>
          </div>
        )}
      </div>

      {/* Photo thumbnails */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto pb-2 max-w-4xl mx-auto">
          {currentPhotos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (idx < rightPhotoIndex) setLeftPhotoIndex(idx);
                else if (idx > leftPhotoIndex) setRightPhotoIndex(idx);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === leftPhotoIndex ? 'border-blue-500 ring-2 ring-blue-500/50' :
                idx === rightPhotoIndex ? 'border-emerald-500 ring-2 ring-emerald-500/50' :
                'border-slate-700 hover:border-slate-500'
              }`}
            >
              <img 
                src={photo.url} 
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1 text-blue-400">
            <div className="w-3 h-3 rounded bg-blue-500"></div> Prima
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <div className="w-3 h-3 rounded bg-emerald-500"></div> Dopo
          </span>
        </div>
      </div>
    </motion.div>
  );
}
