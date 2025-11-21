import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, setDoc, updateDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ArrowLeft, Play, Pause, CheckCircle, ChevronRight, ChevronLeft, Clock } from 'lucide-react';

import MediaViewer from '../MediaViewer';

/**
 * Player per visualizzare e completare le lezioni
 */
export default function LessonPlayer() {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [nextLesson, setNextLesson] = useState(null);
  const [previousLesson, setPreviousLesson] = useState(null);

  // Determina il prefisso delle route basato sulla posizione attuale
  const routePrefix = location.pathname.startsWith('/client') ? '/client' : '';

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    loadLessonData();
    checkProgress(user.uid);
  }, [courseId, moduleId, lessonId, navigate, loadLessonData, checkProgress]);

  const loadLessonData = useCallback(async () => {
    try {
      // Carica lezione
      const lessonDoc = await getDoc(doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId));
      if (lessonDoc.exists()) {
        setLesson({ id: lessonDoc.id, ...lessonDoc.data() });
      }

      // Carica corso
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        setCourse({ id: courseDoc.id, ...courseDoc.data() });
      }

      // Carica modulo
      const moduleDoc = await getDoc(doc(db, 'courses', courseId, 'modules', moduleId));
      if (moduleDoc.exists()) {
        setModule({ id: moduleDoc.id, ...moduleDoc.data() });
      }

      // Trova lezione precedente e successiva
      await findAdjacentLessons();

      setLoading(false);
    } catch (error) {
      console.error('Error loading lesson:', error);
      setLoading(false);
    }
  }, [courseId, moduleId, lessonId, findAdjacentLessons]);

  const findAdjacentLessons = useCallback(async () => {
    try {
      // Carica tutte le lezioni del modulo
      const lessonsQuery = query(
        collection(db, 'courses', courseId, 'modules', moduleId, 'lessons'),
        orderBy('order', 'asc')
      );

      const lessonsSnap = await getDocs(lessonsQuery);
      const lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const currentIndex = lessons.findIndex(l => l.id === lessonId);

      if (currentIndex > 0) {
        setPreviousLesson(lessons[currentIndex - 1]);
      }

      if (currentIndex < lessons.length - 1) {
        setNextLesson(lessons[currentIndex + 1]);
      }
    } catch (error) {
      console.error('Error finding adjacent lessons:', error);
    }
  }, [courseId, moduleId, lessonId]);

  const checkProgress = useCallback(async (userId) => {
    try {
      const progressQuery = query(
        collection(db, 'user_progress'),
        where('userId', '==', userId),
        where('lessonId', '==', lessonId)
      );

      const progressSnap = await getDocs(progressQuery);
      if (!progressSnap.empty) {
        const progressData = progressSnap.docs[0].data();
        setCompleted(progressData.completed);
      }
    } catch (error) {
      console.error('Error checking progress:', error);
    }
  }, [lessonId]);

  const markCompleted = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Cerca progresso esistente
      const progressQuery = query(
        collection(db, 'user_progress'),
        where('userId', '==', user.uid),
        where('lessonId', '==', lessonId)
      );

      const progressSnap = await getDocs(progressQuery);

      if (progressSnap.empty) {
        // Crea nuovo progresso
        await setDoc(doc(collection(db, 'user_progress')), {
          userId: user.uid,
          courseId: courseId,
          moduleId: moduleId,
          lessonId: lessonId,
          completed: true,
          completedAt: serverTimestamp(),
        });
      } else {
        // Aggiorna progresso esistente
        const progressId = progressSnap.docs[0].id;
        await updateDoc(doc(db, 'user_progress', progressId), {
          completed: true,
          completedAt: serverTimestamp(),
        });
      }

      setCompleted(true);
      alert('Lezione completata! 🎉');
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      alert('Errore nel salvare il progresso. Riprova.');
    }
  };

  const navigateToLesson = (targetLesson) => {
    if (targetLesson) {
      navigate(`${routePrefix}/courses/${courseId}/modules/${moduleId}/lessons/${targetLesson.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Play className="mx-auto text-slate-600 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-400 mb-2">Lezione non trovata</h2>
          <button
            onClick={() => navigate(`${routePrefix}/courses/${courseId}`)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Torna al corso
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`${routePrefix}/courses/${courseId}`)}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-300" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
                <p className="text-slate-400 text-sm">
                  {course?.title} • {module?.title}
                </p>
              </div>
            </div>

            {/* Completion Status */}
            <div className="flex items-center gap-4">
              {completed && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={20} />
                  <span className="font-medium">Completata</span>
                </div>
              )}

              {!completed && (
                <button
                  onClick={markCompleted}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Segna come Completata
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video */}
            {lesson.video && (
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                <video
                  src={lesson.video}
                  controls
                  className="w-full aspect-video"
                  poster={lesson.thumbnail}
                >
                  Il tuo browser non supporta il tag video.
                </video>
              </div>
            )}

            {/* Content */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Contenuto della Lezione</h2>

              {lesson.content ? (
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              ) : (
                <p className="text-slate-400">
                  {lesson.description || 'Nessun contenuto aggiuntivo per questa lezione.'}
                </p>
              )}
            </div>

            {/* Media Attachments */}
            {lesson.media && lesson.media.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Materiali</h3>
                <div className="space-y-2">
                  {lesson.media.map((mediaItem, index) => (
                    <MediaViewer key={index} media={mediaItem} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lesson Info */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Info Lezione</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={16} />
                  <span>Durata: {lesson.duration || 'N/A'}</span>
                </div>

                {lesson.objectives && lesson.objectives.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-2">Obiettivi</h4>
                    <ul className="space-y-1">
                      {lesson.objectives.map((objective, index) => (
                        <li key={index} className="text-slate-400 text-sm flex items-start gap-2">
                          <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Navigazione</h3>
              <div className="space-y-3">
                {previousLesson && (
                  <button
                    onClick={() => navigateToLesson(previousLesson)}
                    className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                  >
                    <ChevronLeft size={16} className="text-slate-400" />
                    <div>
                      <div className="text-white text-sm font-medium">Lezione Precedente</div>
                      <div className="text-slate-400 text-xs truncate">{previousLesson.title}</div>
                    </div>
                  </button>
                )}

                {nextLesson && (
                  <button
                    onClick={() => navigateToLesson(nextLesson)}
                    className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                  >
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">Lezione Successiva</div>
                      <div className="text-slate-400 text-xs truncate">{nextLesson.title}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}