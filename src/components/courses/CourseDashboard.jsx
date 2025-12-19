import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { BookOpen, Search, Grid, List, GraduationCap, Play, Clock, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CourseCard from './CourseCard';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { useToast } from '../../contexts/ToastContext';

/**
 * Dashboard principale per i corsi - mostra tutti i corsi disponibili
 */
export default function CourseDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [userProgress, setUserProgress] = useState({});

  // Determina il prefisso delle route basato sulla posizione attuale
  const routePrefix = location.pathname.startsWith('/client') ? '/client' : '';

  const getTotalLessons = useCallback(async (courseId) => {
    try {
      const modulesQuery = query(collection(db, 'courses', courseId, 'modules'));
      const modulesSnap = await getDocs(modulesQuery);

      let totalLessons = 0;
      for (const moduleDoc of modulesSnap.docs) {
        const lessonsQuery = query(collection(db, 'courses', courseId, 'modules', moduleDoc.id, 'lessons'));
        const lessonsSnap = await getDocs(lessonsQuery);
        totalLessons += lessonsSnap.size;
      }

      return totalLessons;
    } catch (error) {
      console.error('Error counting lessons:', error);
      return 0;
    }
  }, []);

  const loadUserEnrollments = useCallback(async (userId) => {
    try {
      // Carica tutte le iscrizioni dell'utente
      const enrollmentsQuery = query(
        collection(db, 'course_enrollments'),
        where('userId', '==', userId)
      );

      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const enrolledCourseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId);

      // Carica i dettagli dei corsi iscritti
      const enrolledCoursesData = [];
      const progressData = {};

      for (const courseId of enrolledCourseIds) {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          enrolledCoursesData.push({
            id: courseDoc.id,
            ...courseDoc.data(),
          });

          // Carica progresso per questo corso
          const progressQuery = query(
            getTenantCollection(db, 'user_progress'),
            where('userId', '==', userId),
            where('courseId', '==', courseId)
          );
          const progressSnap = await getDocs(progressQuery);
          const completedLessons = progressSnap.docs.filter(doc => doc.data().completed).length;
          const totalLessons = await getTotalLessons(courseId);

          progressData[courseId] = Math.round((completedLessons / totalLessons) * 100);
        }
      }

      setEnrolledCourses(enrolledCoursesData);
      setUserProgress(progressData);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoading(false);
    }
  }, [getTotalLessons]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Carica corsi pubblici (published o coming_soon)
    const coursesQuery = query(
      collection(db, 'courses'), 
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        // Filtra: mostra solo published e coming_soon (non draft)
        .filter(course => course.status !== 'draft');
      setCourses(coursesData);
    });

    return () => unsubscribeCourses();
  }, [navigate]);

  // Carica corsi iscritti dall'utente
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      loadUserEnrollments(user.uid);
    }
  }, [loadUserEnrollments]);

  const handleEnroll = async (course) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Crea iscrizione
      await setDoc(doc(collection(db, 'course_enrollments')), {
        userId: user.uid,
        courseId: course.id,
        enrolledAt: serverTimestamp(),
        progress: 0,
        completed: false,
      });

      // Ricarica iscrizioni
      await loadUserEnrollments(user.uid);

      toast.success('Iscrizione completata! Ora puoi accedere al corso.');
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Errore durante l\'iscrizione. Riprova.');
    }
  };

  const handleViewCourse = (course) => {
    navigate(`${routePrefix}/courses/${course.id}`);
  };

  // Filtra corsi
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  // Separa corsi iscritti e non iscritti
  const enrolledCourseCards = enrolledCourses.map(course => (
    <CourseCard
      key={course.id}
      course={course}
      onView={handleViewCourse}
      isEnrolled={true}
      progress={userProgress[course.id] || 0}
    />
  ));

  const availableCourseCards = filteredCourses
    .filter(course => !enrolledCourses.find(ec => ec.id === course.id))
    .map(course => (
      <CourseCard
        key={course.id}
        course={course}
        onEnroll={handleEnroll}
        isEnrolled={false}
      />
    ));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <GraduationCap className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">I Miei Corsi</h1>
            <p className="text-sm text-slate-400">Continua il tuo percorso di crescita</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Cerca corsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>
        
        {/* Level Filter Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'Tutti' },
            { value: 'beginner', label: '🌱 Principiante' },
            { value: 'intermediate', label: '📈 Intermedio' },
            { value: 'advanced', label: '🚀 Avanzato' }
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => setSelectedLevel(level.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedLevel === level.value
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Corsi Iscritti */}
      {enrolledCourseCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Play className="text-emerald-400" size={18} />
            <h2 className="text-lg font-semibold text-white">Continua a imparare</h2>
          </div>
          <div className="space-y-3">
            {enrolledCourseCards}
          </div>
        </motion.div>
      )}

      {/* Corsi Disponibili */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-purple-400" size={18} />
          <h2 className="text-lg font-semibold text-white">
            {enrolledCourseCards.length > 0 ? 'Scopri altri corsi' : 'Corsi disponibili'}
          </h2>
        </div>

        {availableCourseCards.length > 0 ? (
          <div className="space-y-3">
            {availableCourseCards}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/30 rounded-2xl p-8 text-center border border-slate-700/30"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <GraduationCap className="text-purple-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nessun corso disponibile</h3>
            <p className="text-slate-400 text-sm">
              {searchTerm || selectedLevel !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Nuovi corsi saranno disponibili presto!'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}