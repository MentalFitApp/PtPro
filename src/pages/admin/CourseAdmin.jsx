import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { isSuperAdmin, isAdmin } from '../../utils/superadmin';
import { 
  BookOpen, Plus, Edit, Trash2, Eye, EyeOff, Video, FileText, 
  Save, X, Upload, GraduationCap, Settings, Users, BarChart3,
  Play, Lock, Unlock, ChevronRight, ChevronDown, FolderPlus
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Admin page for managing courses
 * Allows admins to:
 * - Create, edit, delete courses
 * - Upload video lessons
 * - Set courses as public/private
 * - Manage modules and lessons
 * - View course analytics
 */
export default function CourseAdmin() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // New Course Form
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    level: 'beginner',
    isPublic: true,
    price: 0,
    duration: '',
    instructor: '',
    category: '',
    thumbnail: null
  });

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const isSuperAdminUser = await isSuperAdmin(user.uid);
      const isAdminUser = await isAdmin(user.uid);
      
      if (!isSuperAdminUser && !isAdminUser) {
        navigate('/');
        return;
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [navigate]);

  // Load courses
  useEffect(() => {
    const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(coursesQuery, async (snapshot) => {
      const coursesData = await Promise.all(
        snapshot.docs.map(async (courseDoc) => {
          const courseData = { id: courseDoc.id, ...courseDoc.data() };
          
          // Count modules and lessons
          const modulesSnap = await getDocs(collection(db, 'courses', courseDoc.id, 'modules'));
          courseData.modulesCount = modulesSnap.size;
          
          let lessonsCount = 0;
          for (const moduleDoc of modulesSnap.docs) {
            const lessonsSnap = await getDocs(
              collection(db, 'courses', courseDoc.id, 'modules', moduleDoc.id, 'lessons')
            );
            lessonsCount += lessonsSnap.size;
          }
          courseData.lessonsCount = lessonsCount;
          
          // Count enrollments
          const enrollmentsSnap = await getDocs(
            query(collection(db, 'course_enrollments'))
          );
          courseData.enrollmentsCount = enrollmentsSnap.docs.filter(
            doc => doc.data().courseId === courseDoc.id
          ).length;
          
          return courseData;
        })
      );
      
      setCourses(coursesData);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      alert('Inserisci un titolo per il corso');
      return;
    }

    try {
      let thumbnailUrl = '';
      
      // Upload thumbnail if provided
      if (newCourse.thumbnail) {
        const thumbnailRef = storageRef(storage, `courses/thumbnails/${Date.now()}_${newCourse.thumbnail.name}`);
        await uploadBytes(thumbnailRef, newCourse.thumbnail);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      await addDoc(collection(db, 'courses'), {
        title: newCourse.title,
        description: newCourse.description,
        level: newCourse.level,
        isPublic: newCourse.isPublic,
        price: parseFloat(newCourse.price) || 0,
        duration: newCourse.duration,
        instructor: newCourse.instructor || 'Admin',
        category: newCourse.category,
        thumbnail: thumbnailUrl,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });

      // Reset form
      setNewCourse({
        title: '',
        description: '',
        level: 'beginner',
        isPublic: true,
        price: 0,
        duration: '',
        instructor: '',
        category: '',
        thumbnail: null
      });
      
      setShowNewCourseModal(false);
      alert('Corso creato con successo!');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Errore nella creazione del corso: ' + error.message);
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;

    try {
      const courseRef = doc(db, 'courses', selectedCourse.id);
      
      let thumbnailUrl = selectedCourse.thumbnail;
      
      // Upload new thumbnail if provided
      if (newCourse.thumbnail && newCourse.thumbnail instanceof File) {
        const thumbnailRef = storageRef(storage, `courses/thumbnails/${Date.now()}_${newCourse.thumbnail.name}`);
        await uploadBytes(thumbnailRef, newCourse.thumbnail);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      await updateDoc(courseRef, {
        title: newCourse.title,
        description: newCourse.description,
        level: newCourse.level,
        isPublic: newCourse.isPublic,
        price: parseFloat(newCourse.price) || 0,
        duration: newCourse.duration,
        instructor: newCourse.instructor,
        category: newCourse.category,
        thumbnail: thumbnailUrl,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      });

      setShowEditCourseModal(false);
      setSelectedCourse(null);
      alert('Corso aggiornato con successo!');
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Errore nell\'aggiornamento del corso: ' + error.message);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo corso? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      alert('Corso eliminato con successo');
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Errore nell\'eliminazione del corso: ' + error.message);
    }
  };

  const handleTogglePublic = async (courseId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        isPublic: !currentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling course visibility:', error);
      alert('Errore nel cambio di visibilità: ' + error.message);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setNewCourse({
      title: course.title || '',
      description: course.description || '',
      level: course.level || 'beginner',
      isPublic: course.isPublic !== false,
      price: course.price || 0,
      duration: course.duration || '',
      instructor: course.instructor || '',
      category: course.category || '',
      thumbnail: course.thumbnail || null
    });
    setShowEditCourseModal(true);
  };

  const handleManageCourse = (course) => {
    navigate(`/admin/course/${course.id}/manage`);
  };

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
                <h1 className="text-3xl font-bold text-white">Gestione Corsi</h1>
                <p className="text-slate-400">Crea e gestisci i corsi della piattaforma</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/community')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                ← Torna alla Community
              </button>
              <button
                onClick={() => setShowNewCourseModal(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2"
              >
                <Plus size={20} />
                Nuovo Corso
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="text-cyan-400" size={24} />
              <span className="text-sm font-medium text-slate-300">Corsi Totali</span>
            </div>
            <div className="text-3xl font-bold text-white">{courses.length}</div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="text-green-400" size={24} />
              <span className="text-sm font-medium text-slate-300">Corsi Pubblici</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {courses.filter(c => c.isPublic).length}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-blue-400" size={24} />
              <span className="text-sm font-medium text-slate-300">Iscrizioni Totali</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {courses.reduce((sum, c) => sum + (c.enrollmentsCount || 0), 0)}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Video className="text-purple-400" size={24} />
              <span className="text-sm font-medium text-slate-300">Lezioni Totali</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {courses.reduce((sum, c) => sum + (c.lessonsCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="space-y-4">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{course.title}</h3>
                      {course.isPublic ? (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <Unlock size={12} />
                          Pubblico
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                          <Lock size={12} />
                          Privato
                        </span>
                      )}
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                        {course.level === 'beginner' && 'Principiante'}
                        {course.level === 'intermediate' && 'Intermedio'}
                        {course.level === 'advanced' && 'Avanzato'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">{course.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>{course.modulesCount || 0} moduli</span>
                      <span>{course.lessonsCount || 0} lezioni</span>
                      <span>{course.enrollmentsCount || 0} iscritti</span>
                      {course.duration && <span>{course.duration}</span>}
                      {course.instructor && <span>Istruttore: {course.instructor}</span>}
                    </div>
                  </div>

                  {course.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-32 h-20 object-cover rounded-lg ml-4"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => handleManageCourse(course)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Gestisci Contenuti
                  </button>
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Modifica
                  </button>
                  <button
                    onClick={() => handleTogglePublic(course.id, course.isPublic)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm flex items-center gap-2"
                  >
                    {course.isPublic ? <EyeOff size={16} /> : <Eye size={16} />}
                    {course.isPublic ? 'Rendi Privato' : 'Rendi Pubblico'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Elimina
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-xl font-medium text-slate-400 mb-2">Nessun corso disponibile</h3>
              <p className="text-slate-500 mb-4">Inizia creando il tuo primo corso</p>
              <button
                onClick={() => setShowNewCourseModal(true)}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Crea Corso
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New/Edit Course Modal */}
      <AnimatePresence>
        {(showNewCourseModal || showEditCourseModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowNewCourseModal(false);
              setShowEditCourseModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {showEditCourseModal ? 'Modifica Corso' : 'Nuovo Corso'}
                </h2>
                <button
                  onClick={() => {
                    setShowNewCourseModal(false);
                    setShowEditCourseModal(false);
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Titolo Corso *
                  </label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Es: Fondamenti di Fitness"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    className="w-full h-24 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                    placeholder="Descrivi il corso..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Livello
                    </label>
                    <select
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzato</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Es: Fitness, Nutrizione"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Durata
                    </label>
                    <input
                      type="text"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Es: 8 settimane"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Istruttore
                    </label>
                    <input
                      type="text"
                      value={newCourse.instructor}
                      onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Nome istruttore"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Immagine di Copertina
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.files[0] })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Corso Pubblico</div>
                    <div className="text-sm text-slate-400">
                      Rendi il corso visibile a tutti gli utenti
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCourse.isPublic}
                      onChange={(e) => setNewCourse({ ...newCourse, isPublic: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewCourseModal(false);
                    setShowEditCourseModal(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={showEditCourseModal ? handleUpdateCourse : handleCreateCourse}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-colors"
                >
                  {showEditCourseModal ? 'Salva Modifiche' : 'Crea Corso'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
