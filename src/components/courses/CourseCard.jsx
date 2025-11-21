import React from 'react';
import { BookOpen, Users, Clock, Star, Play } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Card per mostrare un corso nella lista corsi
 */
export default function CourseCard({ course, onEnroll, onView, isEnrolled = false, progress = 0 }) {
  const {
    title,
    description,
    instructor,
    thumbnail,
    duration,
    studentsCount = 0,
    rating = 0,
    level = 'beginner',
    modulesCount = 0
  } = course;

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-cyan-600 to-blue-600">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={48} className="text-white/50" />
          </div>
        )}

        {/* Level Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getLevelColor(level)}`}>
            {level === 'beginner' ? 'Principiante' :
             level === 'intermediate' ? 'Intermedio' : 'Avanzato'}
          </span>
        </div>

        {/* Progress Bar for enrolled courses */}
        {isEnrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-3">{description}</p>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {instructor?.name?.charAt(0)?.toUpperCase() || 'I'}
            </span>
          </div>
          <span className="text-slate-300 text-sm">{instructor?.name || 'Instructor'}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{duration || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen size={14} />
              <span>{modulesCount} moduli</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400 fill-current" />
            <span className="text-sm text-slate-300">{rating?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>

        {/* Students Count */}
        <div className="flex items-center gap-1 mb-4 text-sm text-slate-400">
          <Users size={14} />
          <span>{studentsCount} studenti iscritti</span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => isEnrolled ? onView(course) : onEnroll(course)}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            isEnrolled
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
          }`}
        >
          {isEnrolled ? (
            <>
              <Play size={16} />
              Continua Corso
            </>
          ) : (
            'Iscriviti al Corso'
          )}
        </button>
      </div>
    </motion.div>
  );
}