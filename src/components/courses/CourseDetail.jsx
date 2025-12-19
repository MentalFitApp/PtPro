import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, setDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ArrowLeft, BookOpen, Play, CheckCircle, Clock, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { useToast } from '../../contexts/ToastContext';

/**
 * Pagina dettaglio di un corso con moduli e lezioni
 */
export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userProgress, setUserProgress] = useState({});

  // Determina il prefisso delle route basato sulla posizione attuale
  const routePrefix = location.pathname.startsWith('/client') ? '/client' : '';

  const loadCourse = useCallback(async () => {
    try {
      // Carica dati del corso
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        setCourse({ id: courseDoc.id, ...courseDoc.data() });
      }

      // Carica moduli
      const modulesQuery = query(
        collection(db, 'courses', courseId, 'modules'),
        orderBy('order', 'asc')
      );

      const unsubscribe = onSnapshot(modulesQuery, (snapshot) => {
        const modulesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setModules(modulesData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading course:', error);
      setLoading(false);
    }
  }, [courseId]);

  const loadUserProgress = useCallback(async (userId) => {
    try {
      const progressQuery = query(
        getTenantCollection(db, 'user_progress'),
        where('userId', '==', userId),
        where('courseId', '==', courseId)
      );

      const progressSnap = await getDocs(progressQuery);
      const progressData = {};

      progressSnap.docs.forEach(doc => {
        const data = doc.data();
        progressData[data.lessonId] = data.completed;
      });

      setUserProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, [courseId]);

  const checkEnrollment = useCallback(async (userId) => {
    try {
      const enrollmentQuery = query(
        collection(db, 'course_enrollments'),
        where('userId', '==', userId),
        where('courseId', '==', courseId)
      );

      const enrollmentSnap = await getDocs(enrollmentQuery);
      setIsEnrolled(!enrollmentSnap.empty);

      if (!enrollmentSnap.empty) {
        // Carica progresso utente
        loadUserProgress(userId);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  }, [courseId, loadUserProgress]);

  // Carica corso e verifica iscrizione
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    loadCourse();
    checkEnrollment(user.uid);
  }, [courseId, navigate, loadCourse, checkEnrollment]);

  const handleEnroll = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(doc(collection(db, 'course_enrollments')), {
        userId: user.uid,
        courseId: courseId,
        enrolledAt: serverTimestamp(),
        progress: 0,
        completed: false,
      });

      setIsEnrolled(true);
      toast.success('Iscrizione completata! Ora puoi accedere alle lezioni.');
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Errore durante l\'iscrizione. Riprova.');
    }
  };

  const handleLessonClick = (moduleId, lessonId) => {
    if (!isEnrolled) {
      toast.warning('Devi prima iscriverti al corso per accedere alle lezioni.');
      return;
    }

    navigate(`${routePrefix}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <BookOpen className="text-purple-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Corso non trovato</h2>
          <button
            onClick={() => navigate(`${routePrefix}/courses`)}
            className="text-purple-400 hover:text-purple-300"
          >
            ← Torna ai corsi
          </button>
        </div>
      </div>
    );
  }

  const getLevelInfo = (level) => {
    switch (level) {
      case 'beginner': return { emoji: '🌱', label: 'Principiante', color: 'from-emerald-500 to-teal-500' };
      case 'intermediate': return { emoji: '📈', label: 'Intermedio', color: 'from-amber-500 to-orange-500' };
      case 'advanced': return { emoji: '🚀', label: 'Avanzato', color: 'from-red-500 to-pink-500' };
      default: return { emoji: '📚', label: 'Corso', color: 'from-purple-500 to-pink-500' };
    }
  };

  const levelInfo = getLevelInfo(course.level);
  const instructorName = course.instructor?.name || course.instructor || course.createdByName || 'Il tuo Coach';

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      {/* Header con back button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <button
          onClick={() => navigate(`${routePrefix}/courses`)}
          className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-slate-400 text-sm">Torna ai corsi</span>
      </motion.div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 mb-6"
      >
        {/* Thumbnail */}
        <div className="relative h-48 w-full">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${levelInfo.color} flex items-center justify-center`}>
              <BookOpen size={64} className="text-white/30" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
          
          {/* Level badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold bg-black/50 backdrop-blur-sm text-white flex items-center gap-1.5`}>
              <span>{levelInfo.emoji}</span>
              <span>{levelInfo.label}</span>
            </span>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-5">
          <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
          <p className="text-slate-400 text-sm mb-4 line-clamp-3">{course.description}</p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            {course.duration && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock size={14} />
                <span>{course.duration}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users size={14} />
              <span>{course.studentsCount || 0} iscritti</span>
            </div>
            {course.rating > 0 && (
              <div className="flex items-center gap-1.5 text-amber-400">
                <Star size={14} className="fill-amber-400" />
                <span>{course.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-semibold">
                {instructorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Istruttore</p>
              <p className="text-white font-medium">{instructorName}</p>
            </div>
          </div>

          {/* Enroll/Status Button */}
          {!isEnrolled ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleEnroll}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold flex items-center justify-center gap-2"
            >
              <Play size={18} />
              Iscriviti gratis
            </motion.button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <CheckCircle size={18} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Sei iscritto a questo corso</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Course Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-purple-400" size={18} />
          <h2 className="text-lg font-semibold text-white">Contenuto del corso</h2>
        </div>

        {modules.length > 0 ? (
          <div className="space-y-3">
            {modules.map((module, moduleIndex) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + moduleIndex * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50"
              >
                {/* Module Header */}
                <div className="p-4 border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 font-semibold text-sm">{moduleIndex + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{module.title}</h3>
                      {module.description && (
                        <p className="text-slate-400 text-xs mt-0.5">{module.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lessons */}
                <div className="divide-y divide-slate-700/50">
                  {module.lessons?.length > 0 ? (
                    module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        onClick={() => handleLessonClick(module.id, lesson.id)}
                        className={`p-4 flex items-center gap-3 transition-colors ${
                          isEnrolled 
                            ? 'hover:bg-slate-700/30 cursor-pointer active:bg-slate-700/50' 
                            : 'opacity-60'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          userProgress[lesson.id]
                            ? 'bg-emerald-500'
                            : 'bg-slate-700'
                        }`}>
                          {userProgress[lesson.id] ? (
                            <CheckCircle size={14} className="text-white" />
                          ) : (
                            <Play size={14} className="text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium truncate">{lesson.title}</h4>
                          {lesson.duration && (
                            <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                              <Clock size={10} />
                              {lesson.duration}
                            </p>
                          )}
                        </div>
                        {!isEnrolled && (
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-slate-500 text-xs">🔒</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-slate-500 text-sm">Lezioni in preparazione...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/30 rounded-2xl p-8 text-center border border-slate-700/30"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <BookOpen className="text-purple-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Contenuto in preparazione</h3>
            <p className="text-slate-400 text-sm">
              Il contenuto di questo corso sarà disponibile a breve. Resta sintonizzato!
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}