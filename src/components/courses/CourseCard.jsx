import React from 'react';
import { BookOpen, Users, Clock, Star, Play, ChevronRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';

/**
 * Card per mostrare un corso nella lista corsi - Stile Nebula
 */
export default function CourseCard({ course, onEnroll, onView, isEnrolled = false, progress = 0 }) {
  const toast = useToast();
  const {
    title,
    description,
    instructor,
    thumbnail,
    duration,
    studentsCount = 0,
    rating = 0,
    level = 'beginner',
    modulesCount = 0,
    lessonsCount = 0,
    status = 'published'
  } = course;

  const isComingSoon = status === 'coming_soon';

  const getLevelInfo = (level) => {
    switch (level) {
      case 'beginner': return { emoji: '🌱', label: 'Principiante', color: 'from-emerald-500 to-teal-500' };
      case 'intermediate': return { emoji: '📈', label: 'Intermedio', color: 'from-amber-500 to-orange-500' };
      case 'advanced': return { emoji: '🚀', label: 'Avanzato', color: 'from-red-500 to-pink-500' };
      default: return { emoji: '📚', label: 'Corso', color: 'from-purple-500 to-pink-500' };
    }
  };

  const levelInfo = getLevelInfo(level);

  const handleClick = () => {
    if (isComingSoon) {
      toast.info('Questo corso sarà disponibile presto! 🔜');
      return;
    }
    if (isEnrolled) {
      onView(course);
    } else {
      onEnroll(course);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: isComingSoon ? 1 : 0.98 }}
      onClick={handleClick}
      className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 transition-all ${
        isComingSoon ? 'opacity-75 cursor-default' : 'active:bg-slate-800/70 cursor-pointer'
      }`}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className={`w-full h-full object-cover ${isComingSoon ? 'grayscale' : ''}`}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${levelInfo.color} flex items-center justify-center`}>
              <BookOpen size={28} className="text-white/80" />
            </div>
          )}
          
          {/* Progress overlay per corsi iscritti */}
          {isEnrolled && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          {/* Coming soon badge */}
          {isComingSoon && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-400 bg-black/60 px-2 py-1 rounded">🔜</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Level badge */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs">{levelInfo.emoji}</span>
                <span className="text-xs text-slate-400">{levelInfo.label}</span>
                {isEnrolled && progress > 0 && (
                  <span className="text-xs text-emerald-400 font-medium">{progress}%</span>
                )}
              </div>
              
              {/* Title */}
              <h3 className="text-base font-semibold text-white line-clamp-1 mb-1">{title}</h3>
              
              {/* Description */}
              <p className="text-sm text-slate-400 line-clamp-2 mb-2">{description}</p>
            </div>
            
            <ChevronRight className="text-slate-500 flex-shrink-0 mt-4" size={20} />
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {duration && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{duration}</span>
              </div>
            )}
            {(modulesCount > 0 || lessonsCount > 0) && (
              <div className="flex items-center gap-1">
                <BookOpen size={12} />
                <span>{lessonsCount || modulesCount} lezioni</span>
              </div>
            )}
            {studentsCount > 0 && (
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{studentsCount}</span>
              </div>
            )}
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom action hint */}
      <div className={`px-4 py-2 border-t border-slate-700/50 ${
        isComingSoon ? 'bg-amber-500/10' : isEnrolled ? 'bg-emerald-500/10' : 'bg-purple-500/10'
      }`}>
        <div className="flex items-center justify-center gap-2">
          {isComingSoon ? (
            <>
              <Lock size={14} className="text-amber-400" />
              <span className="text-xs font-medium text-amber-400">In arrivo</span>
            </>
          ) : isEnrolled ? (
            <>
              <Play size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Continua</span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-purple-400">Iscriviti gratis</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}