// src/pages/client/ClientChecks.jsx
// Pagina Check Cliente - Stile Nebula 2.0 Mobile-First
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import { useNavigate } from 'react-router-dom';
import { getTenantSubcollection, getTenantDoc } from '../../config/tenant';
import { notifyNewCheck } from '../../services/notificationService';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
  ArrowLeft, FilePenLine, UploadCloud, Send, X, AlertTriangle, CheckCircle2, 
  ImageOff, ArrowLeftRight, Plus, Calendar as CalendarIcon, Trash2, 
  ChevronDown, ChevronUp, TrendingDown, TrendingUp, Scale, Clock, 
  Camera, Eye, Flame, BarChart3
} from 'lucide-react';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import PhotoCompare from '../../components/client/PhotoCompare';
import { useConfirm } from '../../contexts/ConfirmContext';
import { IMAGE_ACCEPT_STRING, compressImage } from '../../cloudflareStorage';
import { PhotoPoseSilhouette } from '../../components/PhotoPoseSilhouette';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { uploadPhoto } from '../../storageUtils.js';
import normalizePhotoURLs from '../../utils/normalizePhotoURLs';

// === NEBULA COMPONENTS ===
const GlowCard = ({ children, className = '', gradient = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {gradient && (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 via-transparent to-slate-900/30 pointer-events-none" />
    )}
    <div className="relative">{children}</div>
  </div>
);

// Stili personalizzati per il calendario Nebula
const calendarStyles = `
  .react-calendar { width: 100%; background: transparent; border: none; font-family: inherit; }
  .react-calendar__navigation { margin-bottom: 0.5rem; }
  .react-calendar__navigation button { color: #67e8f9; font-weight: 600; font-size: 0.95em; min-height: 40px; }
  .react-calendar__navigation button:hover, .react-calendar__navigation button:focus { background: rgba(103, 232, 249, 0.1); border-radius: 0.75rem; }
  .react-calendar__navigation button:disabled { color: #64748b; }
  .react-calendar__month-view__weekdays__weekday { color: #64748b; text-transform: uppercase; font-size: 0.65rem; font-weight: 600; padding: 0.5rem 0; }
  .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
  .react-calendar__tile { color: #cbd5e1; border-radius: 0.75rem; height: 44px; font-size: 0.85rem; transition: all 0.2s; }
  .react-calendar__tile:disabled { color: #475569; }
  .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background: rgba(103, 232, 249, 0.15); }
  .react-calendar__tile--now { background: rgba(139, 92, 246, 0.2); font-weight: bold; border: 1px solid rgba(139, 92, 246, 0.3); }
  .react-calendar__tile--active { background: linear-gradient(135deg, #0891b2, #0e7490); color: white; font-weight: 600; }
  .check-submitted { position: relative; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }
  .check-submitted::after { content: ''; position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background: #10b981; }
  .check-suggested { position: relative; background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); }
  .check-suggested::after { content: ''; position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background: #fbbf24; }
`;

// === NOTIFICATION TOAST ===
const Notification = ({ message, type, onDismiss }) => {
  if (!message) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className={`fixed top-4 left-4 right-4 z-50 flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${
          type === 'success' 
            ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30' 
            : 'bg-red-900/80 text-red-300 border-red-500/30'
        }`}
      >
        {type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

// === HERO STATS CARD ===
const HeroStatsCard = ({ checks, formatWeight }) => {
  const stats = useMemo(() => {
    if (!checks.length) return null;
    
    const sortedChecks = [...checks].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateA - dateB;
    });
    
    const firstCheck = sortedChecks[0];
    const lastCheck = sortedChecks[sortedChecks.length - 1];
    const firstWeight = firstCheck?.weight || 0;
    const lastWeight = lastCheck?.weight || 0;
    const totalChange = lastWeight - firstWeight;
    
    // Calcola il prossimo check suggerito (ogni 7 giorni dall'ultimo)
    const lastCheckDate = lastCheck?.createdAt?.toDate?.();
    const nextCheckDate = lastCheckDate ? new Date(lastCheckDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilNextCheck = nextCheckDate 
      ? Math.ceil((nextCheckDate - today) / (1000 * 60 * 60 * 24))
      : null;
    
    return {
      totalChecks: checks.length,
      totalChange,
      lastWeight,
      daysUntilNextCheck
    };
  }, [checks]);

  if (!stats) return null;

  return (
    <GlowCard gradient className="p-4 mb-4">
      <div className="grid grid-cols-4 gap-3">
        {/* Total Checks */}
        <div className="text-center">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 w-10 h-10 mx-auto flex items-center justify-center mb-1">
            <Camera size={18} className="text-cyan-400" />
          </div>
          <p className="text-lg font-bold text-white">{stats.totalChecks}</p>
          <p className="text-[10px] text-slate-500">Check</p>
        </div>
        
        {/* Weight Change */}
        <div className="text-center">
          <div className={`p-2 rounded-xl w-10 h-10 mx-auto flex items-center justify-center mb-1 ${
            stats.totalChange < 0 
              ? 'bg-emerald-500/20 border border-emerald-500/30' 
              : stats.totalChange > 0 
              ? 'bg-orange-500/20 border border-orange-500/30'
              : 'bg-slate-500/20 border border-slate-500/30'
          }`}>
            {stats.totalChange < 0 ? (
              <TrendingDown size={18} className="text-emerald-400" />
            ) : stats.totalChange > 0 ? (
              <TrendingUp size={18} className="text-orange-400" />
            ) : (
              <Scale size={18} className="text-slate-400" />
            )}
          </div>
          <p className={`text-lg font-bold ${
            stats.totalChange < 0 ? 'text-emerald-400' : stats.totalChange > 0 ? 'text-orange-400' : 'text-white'
          }`}>
            {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)}
          </p>
          <p className="text-[10px] text-slate-500">kg totali</p>
        </div>
        
        {/* Last Weight */}
        <div className="text-center">
          <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 w-10 h-10 mx-auto flex items-center justify-center mb-1">
            <Scale size={18} className="text-violet-400" />
          </div>
          <p className="text-lg font-bold text-white">{stats.lastWeight.toFixed(1)}</p>
          <p className="text-[10px] text-slate-500">kg attuale</p>
        </div>
        
        {/* Days Until Next */}
        <div className="text-center">
          <div className={`p-2 rounded-xl w-10 h-10 mx-auto flex items-center justify-center mb-1 ${
            stats.daysUntilNextCheck <= 0 
              ? 'bg-amber-500/20 border border-amber-500/30' 
              : 'bg-cyan-500/20 border border-cyan-500/30'
          }`}>
            <CalendarIcon size={18} className={stats.daysUntilNextCheck <= 0 ? 'text-amber-400' : 'text-cyan-400'} />
          </div>
          <p className={`text-lg font-bold ${stats.daysUntilNextCheck <= 0 ? 'text-amber-400' : 'text-white'}`}>
            {stats.daysUntilNextCheck <= 0 ? 'Oggi!' : stats.daysUntilNextCheck ?? '-'}
          </p>
          <p className="text-[10px] text-slate-500">{stats.daysUntilNextCheck <= 0 ? 'prossimo' : 'gg al prossimo'}</p>
        </div>
      </div>
    </GlowCard>
  );
};

// === COLLAPSIBLE CALENDAR ===
const CollapsibleCalendar = ({ selectedDate, setSelectedDate, checks, isExpanded, setIsExpanded }) => {
  // Calcola la data del prossimo check suggerito (7 giorni dopo l'ultimo)
  const nextSuggestedDate = useMemo(() => {
    if (!checks.length) return null;
    const sortedChecks = [...checks].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA; // più recente prima
    });
    const lastCheckDate = sortedChecks[0]?.createdAt?.toDate?.();
    if (!lastCheckDate) return null;
    const nextDate = new Date(lastCheckDate);
    nextDate.setDate(nextDate.getDate() + 7);
    return nextDate;
  }, [checks]);

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      // Check già inviato
      if (checks.some(c => c.createdAt?.toDate?.()?.toDateString() === date.toDateString())) {
        return 'check-submitted';
      }
      // Prossimo check suggerito (solo se è oggi o nel futuro)
      if (nextSuggestedDate && date.toDateString() === nextSuggestedDate.toDateString()) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date >= today) {
          return 'check-suggested';
        }
      }
    }
    return null;
  };

  const currentMonthYear = selectedDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <GlowCard className="mb-4 overflow-hidden">
      {/* Header - sempre visibile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <CalendarIcon size={18} className="text-cyan-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white capitalize">{currentMonthYear}</p>
            <p className="text-xs text-slate-500">
              {checks.filter(c => {
                const checkDate = c.createdAt?.toDate?.();
                return checkDate?.getMonth() === selectedDate.getMonth() && 
                       checkDate?.getFullYear() === selectedDate.getFullYear();
              }).length} check questo mese
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      </button>

      {/* Calendar - collapsible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <Calendar 
                onChange={setSelectedDate} 
                value={selectedDate} 
                tileClassName={tileClassName}
                locale="it-IT"
              />
              {/* Legenda */}
              <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Inviato</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>Prossimo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                  <span>Oggi</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlowCard>
  );
};

// === CHECK TIMELINE ITEM ===
const CheckTimelineItem = ({ check, isFirst, onClick, formatWeight, previousCheck }) => {
  const [photoURLs, setPhotoURLs] = useState({});
  const [failedPhotos, setFailedPhotos] = useState({});
  
  useEffect(() => {
    if (check.photoURLs) {
      setPhotoURLs(normalizePhotoURLs(check.photoURLs));
    }
  }, [check.photoURLs]);

  const checkDate = check.createdAt?.toDate?.();
  const formattedDate = checkDate?.toLocaleDateString('it-IT', { 
    day: 'numeric', 
    month: 'short'
  });
  const dayName = checkDate?.toLocaleDateString('it-IT', { weekday: 'short' });

  // Calcola variazione peso
  const weightChange = previousCheck 
    ? check.weight - previousCheck.weight 
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <GlowCard className={`p-3 transition-all hover:border-cyan-500/30 ${isFirst ? 'border-cyan-500/30' : ''}`}>
        <div className="flex items-center gap-3">
          {/* Date badge */}
          <div className={`flex-shrink-0 w-14 text-center p-2 rounded-xl ${
            isFirst 
              ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border border-cyan-500/30' 
              : 'bg-slate-700/50 border border-slate-700/30'
          }`}>
            <p className="text-[10px] text-slate-400 uppercase">{dayName}</p>
            <p className={`text-sm font-bold ${isFirst ? 'text-cyan-400' : 'text-white'}`}>{formattedDate?.split(' ')[0]}</p>
            <p className="text-[10px] text-slate-500">{formattedDate?.split(' ')[1]}</p>
          </div>

          {/* Photos grid 2x2 mini */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-0.5 w-16 h-16 rounded-lg overflow-hidden bg-slate-700/30">
            {['front', 'right', 'left', 'back'].map((type) => (
              <div key={type} className="w-full h-full bg-slate-800/50">
                {photoURLs[type] && !failedPhotos[type] ? (
                  <img
                    src={photoURLs[type]}
                    alt={type}
                    className="w-full h-full object-cover"
                    onError={() => setFailedPhotos(prev => ({ ...prev, [type]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff size={8} className="text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-white">{formatWeight(check.weight)}</p>
              {weightChange !== null && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  weightChange < 0 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : weightChange > 0 
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                </span>
              )}
            </div>
            {check.notes && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{check.notes}</p>
            )}
            {isFirst && (
              <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 mt-1">
                <Flame size={10} /> Ultimo check
              </span>
            )}
          </div>

          {/* Arrow */}
          <ChevronDown size={16} className="text-slate-500 -rotate-90" />
        </div>
      </GlowCard>
    </motion.div>
  );
};

// === CHECKS TIMELINE ===
const ChecksTimeline = ({ checks, onCheckClick, formatWeight, showAll, setShowAll }) => {
  const sortedChecks = useMemo(() => {
    return [...checks].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA; // più recenti prima
    });
  }, [checks]);

  const visibleChecks = showAll ? sortedChecks : sortedChecks.slice(0, 4);
  const hasMore = sortedChecks.length > 4;

  if (!checks.length) {
    return (
      <GlowCard className="p-8 text-center">
        <div className="p-4 rounded-2xl bg-slate-700/30 w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <Camera size={28} className="text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Nessun check ancora</h3>
        <p className="text-sm text-slate-500">Carica il tuo primo check per iniziare a tracciare i progressi!</p>
      </GlowCard>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Storico Check
        </h3>
        <span className="text-xs text-slate-500">{checks.length} totali</span>
      </div>

      <div className="space-y-2">
        {visibleChecks.map((check, index) => (
          <CheckTimelineItem
            key={check.id}
            check={check}
            isFirst={index === 0}
            onClick={() => onCheckClick(check)}
            formatWeight={formatWeight}
            previousCheck={sortedChecks[index + 1]}
          />
        ))}
      </div>

      {hasMore && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAll(!showAll)}
          className="w-full py-3 text-center text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {showAll ? (
            <span className="flex items-center justify-center gap-2">
              <ChevronUp size={16} /> Mostra meno
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ChevronDown size={16} /> Vedi tutti ({sortedChecks.length - 4} altri)
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
};

// === PHOTO UPLOADER 2x2 ===
const PhotoUploader2x2 = ({ formState, setFormState, handleFileChange, handleRemovePhoto, photoLoading }) => {
  const PhotoSlot = ({ type, label }) => {
    const preview = formState.photoPreviews[type];
    const isLoading = photoLoading?.[type];

    return (
      <div className="relative aspect-square bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-600 hover:border-cyan-500/50 transition-all overflow-hidden group">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 z-20">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-2"></div>
            <p className="text-[10px] text-cyan-400">Elaborazione...</p>
          </div>
        ) : preview ? (
          <>
            <img src={preview} alt={type} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemovePhoto(type);
              }}
              className="absolute top-1 right-1 p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <Trash2 size={12} />
            </button>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Cambia</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
            <PhotoPoseSilhouette position={type} size={40} showHint={false} />
            <span className="text-[10px] mt-1 font-medium">{label}</span>
          </div>
        )}
        <input
          type="file"
          accept={IMAGE_ACCEPT_STRING}
          onChange={(e) => handleFileChange(e, type)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <PhotoSlot type="front" label="Frontale" />
      <PhotoSlot type="right" label="Lat. Dx" />
      <PhotoSlot type="left" label="Lat. Sx" />
      <PhotoSlot type="back" label="Posteriore" />
    </div>
  );
};

// === UPLOAD MODAL (Bottom Sheet) ===
const UploadModal = ({ 
  isOpen, 
  onClose, 
  formState, 
  setFormState, 
  handleSubmit, 
  isUploading, 
  uploadProgress, 
  handleFileChange, 
  handleRemovePhoto, 
  photoLoading,
  isEditing 
}) => {
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 300], [1, 0]);

  useEffect(() => {
    if (isOpen) {
      dragY.set(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{ touchAction: 'none' }}
      >
        {/* Backdrop */}
        <motion.div 
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          style={{ opacity: backdropOpacity }}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          style={{ y: dragY }}
          className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-hidden"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-3xl">
            {/* Handle */}
            <motion.div 
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              drag="y"
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 1 }}
              onDrag={(event, info) => {
                if (info.offset.y > 0) dragY.set(info.offset.y);
              }}
              onDragEnd={(event, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  onClose();
                } else {
                  animate(dragY, 0, { type: 'spring', damping: 30, stiffness: 400 });
                }
              }}
              style={{ touchAction: 'none' }}
            >
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </motion.div>

            {/* Content */}
            <div className="px-4 pb-8 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                    <Camera size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {isEditing ? 'Modifica Check' : 'Nuovo Check'}
                    </h3>
                    <p className="text-xs text-slate-500">Carica peso e foto</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Weight input */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                    Peso Attuale (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formState.weight}
                    onChange={(e) => setFormState(prev => ({ ...prev, weight: e.target.value }))}
                    required
                    placeholder="Es. 75.5"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors text-lg font-semibold"
                  />
                </div>

                {/* Photos 2x2 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                    Foto {!isEditing && '*'}
                  </label>
                  <PhotoUploader2x2
                    formState={formState}
                    setFormState={setFormState}
                    handleFileChange={handleFileChange}
                    handleRemovePhoto={handleRemovePhoto}
                    photoLoading={photoLoading}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                    Note (opzionale)
                  </label>
                  <textarea
                    value={formState.notes}
                    onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                    rows="2"
                    placeholder="Come ti senti? Hai notato cambiamenti?"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  />
                </div>

                {/* Progress bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-slate-400 text-center">Caricamento {uploadProgress}%</p>
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isUploading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:shadow-none"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Caricamento...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {isEditing ? 'Salva Modifiche' : 'Invia Check'}
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// === CHECK DETAIL MODAL ===
const CheckDetailModal = ({ check, isOpen, onClose, onEdit, onDelete, formatWeight }) => {
  const [photoURLs, setPhotoURLs] = useState({});
  const [failedPhotos, setFailedPhotos] = useState({});
  const [modalImage, setModalImage] = useState(null);
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 300], [1, 0]);

  useEffect(() => {
    if (check?.photoURLs) {
      setPhotoURLs(normalizePhotoURLs(check.photoURLs));
      setFailedPhotos({});
    }
  }, [check?.photoURLs]);

  useEffect(() => {
    if (isOpen) {
      dragY.set(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !check) return null;

  const checkDate = check.createdAt?.toDate?.();

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{ touchAction: 'none' }}
      >
        {/* Backdrop */}
        <motion.div 
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          style={{ opacity: backdropOpacity }}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          style={{ y: dragY }}
          className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-hidden"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-3xl">
            {/* Handle */}
            <motion.div 
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              drag="y"
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 1 }}
              onDrag={(event, info) => {
                if (info.offset.y > 0) dragY.set(info.offset.y);
              }}
              onDragEnd={(event, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  onClose();
                } else {
                  animate(dragY, 0, { type: 'spring', damping: 30, stiffness: 400 });
                }
              }}
              style={{ touchAction: 'none' }}
            >
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </motion.div>

            {/* Content */}
            <div className="px-4 pb-8 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Check del {checkDate?.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {checkDate?.toLocaleDateString('it-IT', { weekday: 'long' })}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Weight */}
              <GlowCard gradient className="p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                    <Scale size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{formatWeight(check.weight)}</p>
                    <p className="text-xs text-slate-500">Peso registrato</p>
                  </div>
                </div>
              </GlowCard>

              {/* Photos */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2 font-medium">Foto</p>
                <div className="grid grid-cols-2 gap-2">
                  {['front', 'right', 'left', 'back'].map((type) => (
                    <button
                      key={type}
                      onClick={() => photoURLs[type] && !failedPhotos[type] && setModalImage(photoURLs[type])}
                      className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-700/30"
                    >
                      {photoURLs[type] && !failedPhotos[type] ? (
                        <>
                          <img
                            src={photoURLs[type]}
                            alt={type}
                            className="w-full h-full object-cover"
                            onError={() => setFailedPhotos(prev => ({ ...prev, [type]: true }))}
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={24} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                          <ImageOff size={20} />
                          <span className="text-[10px] mt-1 capitalize">
                            {type === 'front' ? 'Frontale' : type === 'back' ? 'Posteriore' : `Lat. ${type === 'left' ? 'Sx' : 'Dx'}`}
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 text-[10px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded capitalize">
                        {type === 'front' ? 'Frontale' : type === 'back' ? 'Posteriore' : `Lat. ${type === 'left' ? 'Sx' : 'Dx'}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {check.notes && (
                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-2 font-medium">Note</p>
                  <GlowCard className="p-3">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{check.notes}</p>
                  </GlowCard>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    onEdit(check);
                  }}
                  className="py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-cyan-500/30"
                >
                  <FilePenLine size={18} />
                  Modifica
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    onDelete(check);
                  }}
                  className="py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-red-500/30"
                >
                  <Trash2 size={18} />
                  Elimina
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fullscreen image modal */}
        <AnimatePresence>
          {modalImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalImage(null)}
              className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4"
            >
              <button
                onClick={() => setModalImage(null)}
                className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full z-10"
              >
                <X size={24} />
              </button>
              <img
                src={modalImage}
                alt="Full size"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// === MAIN COMPONENT ===
export default function ClientChecks() {
  const { formatWeight } = useUserPreferences();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [showPhotoCompare, setShowPhotoCompare] = useState(false);
  const [anamnesi, setAnamnesi] = useState(null);
  
  const [formState, setFormState] = useState({ id: null, notes: '', weight: '', photos: {}, photoPreviews: {} });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [photoLoading, setPhotoLoading] = useState({});

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Load anamnesi for photo compare
        const anamnesiRef = getTenantSubcollection(db, 'clients', user.uid, 'anamnesi');
        const anamnesiQuery = query(anamnesiRef, orderBy('createdAt', 'desc'), limit(1));
        const anamnesiSnap = await getDocs(anamnesiQuery);
        if (anamnesiSnap.docs.length > 0) {
          setAnamnesi({ id: anamnesiSnap.docs[0].id, ...anamnesiSnap.docs[0].data() });
        }

        // Subscribe to checks
        const checksRef = getTenantSubcollection(db, 'clients', user.uid, 'checks');
        const q = query(checksRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const checksData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            photoURLs: doc.data().photoURLs ? normalizePhotoURLs(doc.data().photoURLs) : {}
          }));
          setChecks(checksData);
          setLoading(false);
        }, (err) => {
          console.error("Errore snapshot checks:", err);
          setError("Errore nel caricamento dei check.");
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error("Errore fetchData:", err);
        setError("Errore nel caricamento dei dati.");
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setPhotoLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      const processedFile = await compressImage(file);
      const previewUrl = URL.createObjectURL(processedFile);
      
      setFormState(prev => ({
        ...prev,
        photos: { ...prev.photos, [type]: processedFile },
        photoPreviews: { ...prev.photoPreviews, [type]: previewUrl }
      }));
    } catch (err) {
      const errorMessage = err.message?.includes('HEIC') 
        ? err.message 
        : "Errore nel caricamento della foto.";
      showNotification(errorMessage);
    } finally {
      setPhotoLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleRemovePhoto = (type) => {
    setFormState(prev => {
      const newPhotos = { ...prev.photos };
      const newPreviews = { ...prev.photoPreviews };
      delete newPhotos[type];
      delete newPreviews[type];
      newPhotos[type] = null;
      return { ...prev, photos: newPhotos, photoPreviews: newPreviews };
    });
  };

  const handleEditClick = (check) => {
    setFormState({ 
      id: check.id, 
      notes: check.notes || '', 
      weight: check.weight || '', 
      photos: {}, 
      photoPreviews: normalizePhotoURLs(check.photoURLs) || {} 
    });
    setShowUploadModal(true);
  };

  const handleDeleteCheck = async (check) => {
    const checkDate = check.createdAt?.toDate?.()?.toLocaleDateString('it-IT') || 'questo giorno';
    
    const confirmed = await confirm({
      title: 'Elimina Check',
      message: `Sei sicuro di voler eliminare il check del ${checkDate}?`,
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const checksRef = getTenantSubcollection(db, 'clients', user.uid, 'checks');
      await deleteDoc(doc(checksRef.firestore, checksRef.path, check.id));
      showNotification('Check eliminato!', 'success');
    } catch (err) {
      console.error("Errore eliminazione:", err);
      showNotification("Errore nell'eliminazione.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, notes, weight, photos } = formState;
    
    if (!user || !weight) {
      showNotification("Inserisci il peso.");
      return;
    }
    
    if (!id) {
      const hasAllPhotos = ['front', 'right', 'left', 'back'].every(type => photos[type]);
      if (!hasAllPhotos) {
        showNotification("Carica tutte e 4 le foto.");
        return;
      }
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await user.getIdToken(true);
      
      const existingCheck = id ? checks.find(c => c.id === id) : null;
      let photoURLs = existingCheck ? { ...existingCheck.photoURLs } : { front: null, right: null, left: null, back: null };
      
      // Handle deleted photos
      Object.entries(photos).forEach(([type, value]) => {
        if (value === null) photoURLs[type] = null;
      });
      
      // Upload new photos
      const photosToUpload = Object.entries(photos).filter(([, file]) => file && file instanceof File);
      
      if (photosToUpload.length > 0) {
        const uploadPromises = photosToUpload.map(async ([type, file]) => {
          const url = await uploadPhoto(file, user.uid, 'check_photos', (p) => setUploadProgress(p.percent));
          return { type, url };
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        photoURLs = { ...photoURLs, ...Object.fromEntries(uploadedUrls.map(({ type, url }) => [type, url])) };
      }
      
      const checkData = { 
        notes, 
        weight: parseFloat(weight), 
        photoURLs, 
        createdAt: id ? existingCheck.createdAt : serverTimestamp() 
      };
      
      if (id) {
        const checksRef = getTenantSubcollection(db, 'clients', user.uid, 'checks');
        await updateDoc(doc(checksRef.firestore, checksRef.path, id), { ...checkData, lastUpdatedAt: serverTimestamp() });
        showNotification('Check modificato!', 'success');
      } else {
        await addDoc(getTenantSubcollection(db, 'clients', user.uid, 'checks'), checkData);
        showNotification('Check caricato!', 'success');
        
        try {
          await notifyNewCheck(checkData, user.displayName || 'Cliente', user.uid);
        } catch (e) {}
      }

      try {
        await updateDoc(getTenantDoc(db, 'clients', user.uid), { lastActive: serverTimestamp() });
      } catch (e) {}

      setFormState({ id: null, notes: '', weight: '', photos: {}, photoPreviews: {} });
      setShowUploadModal(false);
    } catch (error) {
      console.error("Errore submit:", error);
      showNotification("Errore nel caricamento.");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  const hasEnoughPhotosForCompare = () => {
    const photoTypes = {};
    checks.forEach(check => {
      if (check.photoURLs) {
        Object.entries(check.photoURLs).forEach(([type, url]) => {
          if (url) photoTypes[type] = (photoTypes[type] || 0) + 1;
        });
      }
    });
    if (anamnesi?.photoURLs) {
      Object.entries(anamnesi.photoURLs).forEach(([type, url]) => {
        if (url) photoTypes[type] = (photoTypes[type] || 0) + 1;
      });
    }
    return Object.values(photoTypes).some(count => count >= 2);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlowCard className="p-6 text-center max-w-sm">
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </GlowCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="h-32 bg-slate-800/50 rounded-2xl animate-pulse" />
          <div className="h-16 bg-slate-800/50 rounded-2xl animate-pulse" />
          <div className="h-24 bg-slate-800/50 rounded-2xl animate-pulse" />
          <div className="h-24 bg-slate-800/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{calendarStyles}</style>
      
      <div className="min-h-screen pb-32">
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onDismiss={() => setNotification({ message: '', type: '' })} 
        />

        {/* Header semplice */}
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">I miei Check</h1>
          <div className="flex items-center gap-2">
            {hasEnoughPhotosForCompare() && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPhotoCompare(true)}
                className="p-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 transition-colors"
              >
                <ArrowLeftRight size={18} className="text-violet-400" />
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setFormState({ id: null, notes: '', weight: '', photos: {}, photoPreviews: {} });
                setShowUploadModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus size={18} className="text-white" />
              <span className="text-white text-sm font-semibold">Nuovo</span>
            </motion.button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-4">
          {/* Hero Stats */}
          <HeroStatsCard checks={checks} formatWeight={formatWeight} />

          {/* Collapsible Calendar */}
          <CollapsibleCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            checks={checks}
            isExpanded={calendarExpanded}
            setIsExpanded={setCalendarExpanded}
          />

          {/* Checks Timeline */}
          <ChecksTimeline
            checks={checks}
            onCheckClick={(check) => setSelectedCheck(check)}
            formatWeight={formatWeight}
            showAll={showAllChecks}
            setShowAll={setShowAllChecks}
          />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setFormState({ id: null, notes: '', weight: '', photos: {}, photoPreviews: {} });
        }}
        formState={formState}
        setFormState={setFormState}
        handleSubmit={handleSubmit}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        handleFileChange={handleFileChange}
        handleRemovePhoto={handleRemovePhoto}
        photoLoading={photoLoading}
        isEditing={!!formState.id}
      />

      {/* Check Detail Modal */}
      <CheckDetailModal
        check={selectedCheck}
        isOpen={!!selectedCheck}
        onClose={() => setSelectedCheck(null)}
        onEdit={handleEditClick}
        onDelete={handleDeleteCheck}
        formatWeight={formatWeight}
      />

      {/* Photo Compare Modal */}
      {showPhotoCompare && (
        <PhotoCompare 
          checks={checks}
          anamnesi={anamnesi}
          onClose={() => setShowPhotoCompare(false)} 
        />
      )}
    </>
  );
}
