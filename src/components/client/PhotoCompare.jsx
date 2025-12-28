// src/components/client/PhotoCompare.jsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Image, Calendar, ArrowLeftRight, ZoomIn, ZoomOut, Move, RotateCcw, RotateCw, Download, Columns } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

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
  const toast = useToast();
  const [selectedType, setSelectedType] = useState(null);
  const [leftPhotoIndex, setLeftPhotoIndex] = useState(0);
  const [rightPhotoIndex, setRightPhotoIndex] = useState(1);
  const [compareMode, setCompareMode] = useState(false); // false = grid, true = compare
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Stato per allineamento foto (zoom, offset e rotazione per entrambe le foto)
  const [leftTransform, setLeftTransform] = useState({ scale: 1, x: 0, y: 0, rotate: 0 });
  const [rightTransform, setRightTransform] = useState({ scale: 1, x: 0, y: 0, rotate: 0 });
  const [activeAdjust, setActiveAdjust] = useState(null); // 'left' | 'right' | null
  
  // Stato per drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const containerRef = useRef(null);
  const sliderDebounceRef = useRef(null);

  // Carica posizione slider salvata quando cambia tipo foto
  useEffect(() => {
    if (selectedType) {
      const savedPosition = localStorage.getItem(`photoCompare_slider_${selectedType}`);
      if (savedPosition) {
        setSliderPosition(Number(savedPosition));
      }
    }
  }, [selectedType]);

  // Auto-save posizione slider con debounce
  const handleSliderChange = useCallback((value) => {
    setSliderPosition(value);
    
    // Debounce il salvataggio
    if (sliderDebounceRef.current) {
      clearTimeout(sliderDebounceRef.current);
    }
    sliderDebounceRef.current = setTimeout(() => {
      if (selectedType) {
        localStorage.setItem(`photoCompare_slider_${selectedType}`, String(value));
      }
    }, 500);
  }, [selectedType]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (sliderDebounceRef.current) {
        clearTimeout(sliderDebounceRef.current);
      }
    };
  }, []);

  // Handler per drag & drop
  const handleDragStart = useCallback((e, side) => {
    if (!activeAdjust || activeAdjust !== side) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    const transform = side === 'left' ? leftTransform : rightTransform;
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      startX: transform.x,
      startY: transform.y
    };
  }, [activeAdjust, leftTransform, rightTransform]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !activeAdjust) return;
    
    e.preventDefault();
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
    setter(prev => ({
      ...prev,
      x: dragStartRef.current.startX + deltaX,
      y: dragStartRef.current.startY + deltaY
    }));
  }, [isDragging, activeAdjust]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event listeners globali per drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Reset transform quando cambiano le foto selezionate
  useEffect(() => {
    setLeftTransform({ scale: 1, x: 0, y: 0, rotate: 0 });
    setActiveAdjust(null);
  }, [leftPhotoIndex]);

  useEffect(() => {
    setRightTransform({ scale: 1, x: 0, y: 0, rotate: 0 });
    setActiveAdjust(null);
  }, [rightPhotoIndex]);

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

  // Download foto con slider (screenshot della visualizzazione corrente)
  const downloadSliderView = useCallback(async () => {
    if (!containerRef.current) return;
    setIsDownloading(true);
    
    try {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Crea canvas con le dimensioni del container
      const canvas = document.createElement('canvas');
      const scale = 2; // Retina quality
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      
      // Carica entrambe le immagini
      const leftImg = new window.Image();
      const rightImg = new window.Image();
      leftImg.crossOrigin = 'anonymous';
      rightImg.crossOrigin = 'anonymous';
      
      const leftPhoto = currentPhotos[leftPhotoIndex];
      const rightPhoto = currentPhotos[rightPhotoIndex];
      
      await Promise.all([
        new Promise((resolve, reject) => {
          leftImg.onload = resolve;
          leftImg.onerror = reject;
          leftImg.src = leftPhoto?.url;
        }),
        new Promise((resolve, reject) => {
          rightImg.onload = resolve;
          rightImg.onerror = reject;
          rightImg.src = rightPhoto?.url;
        })
      ]);
      
      // Background nero
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // Calcola dimensioni per object-contain
      const containerAspect = rect.width / rect.height;
      
      const drawImageContain = (img, transform, clipWidth = null) => {
        const imgAspect = img.width / img.height;
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > containerAspect) {
          drawWidth = rect.width;
          drawHeight = rect.width / imgAspect;
          offsetX = 0;
          offsetY = (rect.height - drawHeight) / 2;
        } else {
          drawHeight = rect.height;
          drawWidth = rect.height * imgAspect;
          offsetX = (rect.width - drawWidth) / 2;
          offsetY = 0;
        }
        
        ctx.save();
        
        // Applica clip se necessario
        if (clipWidth !== null) {
          ctx.beginPath();
          ctx.rect(0, 0, clipWidth, rect.height);
          ctx.clip();
        }
        
        // Applica trasformazioni
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        ctx.translate(centerX + transform.x, centerY + transform.y);
        ctx.rotate((transform.rotate * Math.PI) / 180);
        ctx.scale(transform.scale, transform.scale);
        ctx.translate(-centerX, -centerY);
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
      };
      
      // Disegna foto destra (background)
      drawImageContain(rightImg, rightTransform);
      
      // Disegna foto sinistra (clipped)
      const clipWidth = (sliderPosition / 100) * rect.width;
      drawImageContain(leftImg, leftTransform, clipWidth);
      
      // Disegna linea slider
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(clipWidth, 0);
      ctx.lineTo(clipWidth, rect.height);
      ctx.stroke();
      
      // Labels
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText('PRIMA', 20, rect.height - 20);
      ctx.fillText('DOPO', rect.width - 60, rect.height - 20);
      
      // Download
      const link = document.createElement('a');
      link.download = `confronto-${selectedType}-slider-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Errore download slider view:', err);
      toast.error('Errore durante il download. Riprova.');
    } finally {
      setIsDownloading(false);
    }
  }, [currentPhotos, leftPhotoIndex, rightPhotoIndex, sliderPosition, leftTransform, rightTransform, selectedType]);

  // Download foto affiancate (side by side)
  const downloadSideBySide = useCallback(async () => {
    setIsDownloading(true);
    
    try {
      const leftPhoto = currentPhotos[leftPhotoIndex];
      const rightPhoto = currentPhotos[rightPhotoIndex];
      
      // Carica entrambe le immagini
      const leftImg = new window.Image();
      const rightImg = new window.Image();
      leftImg.crossOrigin = 'anonymous';
      rightImg.crossOrigin = 'anonymous';
      
      await Promise.all([
        new Promise((resolve, reject) => {
          leftImg.onload = resolve;
          leftImg.onerror = reject;
          leftImg.src = leftPhoto?.url;
        }),
        new Promise((resolve, reject) => {
          rightImg.onload = resolve;
          rightImg.onerror = reject;
          rightImg.src = rightPhoto?.url;
        })
      ]);
      
      // Dimensioni canvas - usa altezza massima tra le due foto
      const maxHeight = Math.max(leftImg.height, rightImg.height);
      const leftAspect = leftImg.width / leftImg.height;
      const rightAspect = rightImg.width / rightImg.height;
      
      // Scala le larghezze per avere stessa altezza
      const leftWidth = maxHeight * leftAspect;
      const rightWidth = maxHeight * rightAspect;
      
      const gap = 10; // Gap tra le foto
      const padding = 40; // Padding per labels
      const totalWidth = leftWidth + rightWidth + gap;
      const totalHeight = maxHeight + padding;
      
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      // Disegna foto sinistra (PRIMA)
      ctx.drawImage(leftImg, 0, 0, leftWidth, maxHeight);
      
      // Disegna foto destra (DOPO)
      ctx.drawImage(rightImg, leftWidth + gap, 0, rightWidth, maxHeight);
      
      // Labels
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      
      // Label PRIMA con data
      const leftDate = leftPhoto?.date ? formatDate(leftPhoto.date) : '';
      ctx.fillText(`PRIMA${leftDate ? ' - ' + leftDate : ''}`, leftWidth / 2, maxHeight + 25);
      
      // Label DOPO con data
      const rightDate = rightPhoto?.date ? formatDate(rightPhoto.date) : '';
      ctx.fillText(`DOPO${rightDate ? ' - ' + rightDate : ''}`, leftWidth + gap + rightWidth / 2, maxHeight + 25);
      
      // Download
      const link = document.createElement('a');
      link.download = `confronto-${selectedType}-affiancate-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Errore download side by side:', err);
      toast.error('Errore durante il download. Riprova.');
    } finally {
      setIsDownloading(false);
    }
  }, [currentPhotos, leftPhotoIndex, rightPhotoIndex, selectedType]);

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
      <div className="flex flex-wrap justify-center items-center gap-2 p-3 bg-slate-900/50">
        <div className="flex gap-2">
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
        
        {/* Pulsanti Download */}
        <div className="flex gap-2 ml-4 border-l border-slate-700 pl-4">
          <button
            onClick={downloadSideBySide}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition-colors disabled:opacity-50"
            title="Scarica foto affiancate"
          >
            <Columns size={16} />
            <span className="hidden sm:inline">Affiancate</span>
          </button>
          {compareMode && (
            <button
              onClick={downloadSliderView}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 transition-colors disabled:opacity-50"
              title="Scarica vista slider"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Slider</span>
            </button>
          )}
        </div>
      </div>

      {/* Controlli allineamento - solo in modalità slider */}
      {compareMode && (
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-2 bg-slate-800/60 border-b border-slate-700/50">
          {/* Selezione foto */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Allinea:</span>
            <button
              onClick={() => setActiveAdjust(activeAdjust === 'left' ? null : 'left')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeAdjust === 'left' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Prima
            </button>
            <button
              onClick={() => setActiveAdjust(activeAdjust === 'right' ? null : 'right')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeAdjust === 'right' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Dopo
            </button>
          </div>
          
          {activeAdjust && (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {/* Zoom */}
              <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg px-2 py-1">
                <button
                  onClick={() => {
                    const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
                    setter(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.1) }));
                  }}
                  className="p-1.5 rounded hover:bg-slate-600 text-slate-300"
                  title="Zoom -"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs text-slate-300 min-w-[36px] text-center font-medium">
                  {Math.round((activeAdjust === 'left' ? leftTransform : rightTransform).scale * 100)}%
                </span>
                <button
                  onClick={() => {
                    const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
                    setter(prev => ({ ...prev, scale: Math.min(2, prev.scale + 0.1) }));
                  }}
                  className="p-1.5 rounded hover:bg-slate-600 text-slate-300"
                  title="Zoom +"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
              
              {/* Sposta - frecce più precise (5px per click) */}
              <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg px-2 py-1">
                <button
                  onClick={() => {
                    const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
                    setter(prev => ({ ...prev, x: prev.x - 5 }));
                  }}
                  className="p-1.5 rounded hover:bg-slate-600 text-slate-300"
                  title="← Sinistra"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
                      setter(prev => ({ ...prev, y: prev.y - 5 }));
                    }}
                    className="p-1 rounded hover:bg-slate-600 text-slate-300"
                    title="↑ Su"
                  >
                    <ChevronLeft size={14} className="rotate-90" />
                  </button>
                  <button
                    onClick={() => {
                      const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
                      setter(prev => ({ ...prev, y: prev.y + 5 }));
                    }}
                    className="p-1 rounded hover:bg-slate-600 text-slate-300"
                    title="↓ Giù"
                  >
                    <ChevronRight size={14} className="rotate-90" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
                    setter(prev => ({ ...prev, x: prev.x + 5 }));
                  }}
                  className="p-1.5 rounded hover:bg-slate-600 text-slate-300"
                  title="→ Destra"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              {/* Rotazione */}
              <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg px-2 py-1">
                <button
                  onClick={() => {
                    const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
                    setter(prev => ({ ...prev, rotate: prev.rotate - 90 }));
                  }}
                  className="p-1.5 rounded hover:bg-slate-600 text-slate-300"
                  title="Ruota -90°"
                >
                  <RotateCcw size={16} />
                </button>
                <span className="text-xs text-slate-300 min-w-[32px] text-center font-medium">
                  {(activeAdjust === 'left' ? leftTransform : rightTransform).rotate}°
                </span>
                <button
                  onClick={() => {
                    const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
                    setter(prev => ({ ...prev, rotate: prev.rotate + 90 }));
                  }}
                  className="p-1.5 rounded hover:bg-slate-600 text-slate-300"
                  title="Ruota +90°"
                >
                  <RotateCw size={16} />
                </button>
              </div>
              
              {/* Reset */}
              <button
                onClick={() => {
                  const setter = activeAdjust === 'left' ? setLeftTransform : setRightTransform;
                  setter({ scale: 1, x: 0, y: 0, rotate: 0 });
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium"
                title="Reset tutto"
              >
                Reset
              </button>
              
              {/* Fine - per riattivare lo slider */}
              <button
                onClick={() => setActiveAdjust(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                ✓ Fine
              </button>
            </div>
          )}
          
          {!activeAdjust && (
            <span className="text-xs text-slate-500 italic">
              Clicca "Prima" o "Dopo" per regolare
            </span>
          )}
        </div>
      )}

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
          <div className="flex flex-col items-center w-full h-full">
            {/* Slider container - aspect ratio 3:4 per foto corpo intero */}
            <div 
              ref={containerRef}
              className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-slate-900" 
              style={{ aspectRatio: '3/4', maxHeight: 'calc(100vh - 280px)' }}
            >
              {/* Right photo (background - "Dopo") - Draggable quando attivo */}
              <div 
                className={`absolute inset-0 flex items-center justify-center ${activeAdjust === 'right' ? 'cursor-move z-5' : ''}`}
                onMouseDown={(e) => handleDragStart(e, 'right')}
                onTouchStart={(e) => handleDragStart(e, 'right')}
              >
                <img 
                  src={rightPhoto?.url} 
                  alt="After"
                  className={`w-full h-full object-contain select-none ${activeAdjust === 'right' ? 'pointer-events-none' : ''}`}
                  draggable={false}
                  style={{
                    transform: `translate(${rightTransform.x}px, ${rightTransform.y}px) scale(${rightTransform.scale}) rotate(${rightTransform.rotate}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                />
              </div>
              
              {/* Left photo (clipped - "Prima") - Draggable quando attivo */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <div 
                  className={`absolute inset-0 flex items-center justify-center ${activeAdjust === 'left' ? 'cursor-move z-5' : ''}`}
                  style={{ width: `${100 / (sliderPosition / 100)}%` }}
                  onMouseDown={(e) => handleDragStart(e, 'left')}
                  onTouchStart={(e) => handleDragStart(e, 'left')}
                >
                  <img 
                    src={leftPhoto?.url} 
                    alt="Before"
                    className={`w-full h-full object-contain select-none ${activeAdjust === 'left' ? 'pointer-events-none' : ''}`}
                    draggable={false}
                    style={{
                      transform: `translate(${leftTransform.x}px, ${leftTransform.y}px) scale(${leftTransform.scale}) rotate(${leftTransform.rotate}deg)`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    }}
                  />
                </div>
              </div>

              {/* Slider handle */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <ArrowLeftRight size={18} className="text-slate-800" />
                </div>
              </div>

              {/* Slider input (invisible, for interaction) - sempre presente, z-index varia */}
              <input
                type="range"
                min="5"
                max="95"
                value={sliderPosition}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className={`absolute inset-0 w-full h-full opacity-0 cursor-ew-resize ${activeAdjust ? 'z-0 pointer-events-none' : 'z-20'}`}
              />

              {/* Labels */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/70 text-white text-sm z-10 pointer-events-none">
                {formatDate(leftPhoto?.date)}
              </div>
              <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-black/70 text-white text-sm z-10 pointer-events-none">
                {formatDate(rightPhoto?.date)}
              </div>
              
              {/* Indicatore foto attiva per allineamento */}
              {activeAdjust && (
                <div className={`absolute top-4 ${activeAdjust === 'left' ? 'left-4' : 'right-4'} px-3 py-1.5 rounded-lg text-white text-xs font-medium z-30 pointer-events-none ${
                  activeAdjust === 'left' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}>
                  Trascina la foto "{activeAdjust === 'left' ? 'Prima' : 'Dopo'}"
                </div>
              )}
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
