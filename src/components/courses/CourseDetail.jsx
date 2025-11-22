import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, setDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ArrowLeft, BookOpen, Play, CheckCircle, Clock, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';

/**
 * Pagina dettaglio di un corso con moduli e lezioni
 */
export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userProgress, setUserProgress] = useState({});

  // Determina il prefisso delle route basato sulla posizione attuale
  const routePrefix = location.pathname.startsWith('/client') ? '/client' : '';

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    loadCourse();
    checkEnrollment(user.uid);
  }, [courseId, navigate, loadCourse, checkEnrollment]);

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
      alert('Iscrizione completata! Ora puoi accedere alle lezioni.');
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Errore durante l\'iscrizione. Riprova.');
    }
  };

  const handleLessonClick = (moduleId, lessonId) => {
    if (!isEnrolled) {
      alert('Devi prima iscriverti al corso per accedere alle lezioni.');
      return;
    }

    navigate(`${routePrefix}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <BookOpen className="mx-auto text-slate-600 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-400 mb-2">Corso non trovato</h2>
          <button
            onClick={() => navigate(`${routePrefix}/courses`)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Torna ai corsi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`${routePrefix}/courses`)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{course.title}</h1>
              <p className="text-slate-400">{course.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Course Info */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-full md:w-64 h-40 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <BookOpen size={48} className="text-white/50" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.level === 'beginner' ? 'bg-green-500' :
                  course.level === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                } text-white`}>
                  {course.level === 'beginner' ? 'Principiante' :
                   course.level === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                </span>
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock size={16} />
                  <span>{course.duration || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Users size={16} />
                  <span>{course.studentsCount || 0} studenti</span>
                </div>
              </div>

              <p className="text-slate-300 mb-4">{course.description}</p>

              {/* Instructor */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {course.instructor?.name?.charAt(0)?.toUpperCase() || 'I'}
                  </span>
                </div>
                <span className="text-slate-300">{course.instructor?.name || 'Instructor'}</span>
              </div>

              {/* Enroll Button */}
              {!isEnrolled ? (
                <button
                  onClick={handleEnroll}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Iscriviti al Corso
                </button>
              ) : (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={20} />
                  <span className="font-medium">Iscritto al corso</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Contenuto del Corso</h2>

          {modules.map((module, moduleIndex) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: moduleIndex * 0.1 }}
              className="bg-slate-800 rounded-xl overflow-hidden"
            >
              {/* Module Header */}
              <div className="bg-slate-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                <p className="text-slate-400 text-sm">{module.description}</p>
              </div>

              {/* Lessons */}
              <div className="divide-y divide-slate-700">
                {module.lessons?.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonClick(module.id, lesson.id)}
                    className={`px-6 py-4 hover:bg-slate-700/50 cursor-pointer transition-colors ${
                      !isEnrolled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          userProgress[lesson.id]
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-600 text-slate-400'
                        }`}>
                          {userProgress[lesson.id] ? (
                            <CheckCircle size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{lesson.title}</h4>
                          <p className="text-slate-400 text-sm">{lesson.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock size={14} />
                        <span>{lesson.duration || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="px-6 py-8 text-center text-slate-500">
                    Nessuna lezione disponibile per questo modulo
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {modules.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-xl font-medium text-slate-400 mb-2">Contenuto in preparazione</h3>
              <p className="text-slate-500">Il contenuto di questo corso sarà disponibile a breve.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}