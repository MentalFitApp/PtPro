import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { BookOpen, Search, Filter, Grid, List, GraduationCap } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import CourseCard from './CourseCard';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';

/**
 * Dashboard principale per i corsi - mostra tutti i corsi disponibili
 */
export default function CourseDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
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

    // Carica tutti i corsi
    const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
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

      alert('Iscrizione completata! Ora puoi accedere al corso.');
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Errore durante l\'iscrizione. Riprova.');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-cyan-400" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-white">Corsi</h1>
                <p className="text-slate-400">Impara e cresci con i nostri corsi esclusivi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Cerca corsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Tutti i livelli</option>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzato</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-slate-800 border border-slate-700 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-l-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-r-lg transition-colors ${
                  viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        {enrolledCourseCards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">I Miei Corsi</h2>
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {enrolledCourseCards}
            </div>
          </div>
        )}

        {/* Available Courses */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            {enrolledCourseCards.length > 0 ? 'Altri Corsi Disponibili' : 'Corsi Disponibili'}
          </h2>

          {availableCourseCards.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {availableCourseCards}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-xl font-medium text-slate-400 mb-2">Nessun corso trovato</h3>
              <p className="text-slate-500">Prova a modificare i filtri di ricerca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}