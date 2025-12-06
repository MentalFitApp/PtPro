import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth, storage } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { isSuperAdmin, isAdmin } from '../../utils/superadmin';
import { 
  ArrowLeft, Plus, Edit, Trash2, Video, FileText, 
  Save, X, Upload, Play, ChevronDown, ChevronRight, 
  FolderPlus, Check, Clock, Star, BookOpen
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';

/**
 * Course Content Manager
 * Manages modules, lessons, and video uploads for a specific course
 */
export default function CourseContentManager() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast: toast } = useToast();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState(null);
  
  // Modals
  const [showNewModuleModal, setShowNewModuleModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [showNewLessonModal, setShowNewLessonModal] = useState(false);
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  
  // Selected items
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  // Form data
  const [moduleData, setModuleData] = useState({
    title: '',
    description: '',
    order: 1
  });
  
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    content: '',
    videoFile: null,
    videoUrl: '',
    duration: '',
    order: 1,
    isFree: false
  });

  const [isUploading, setIsUploading] = useState(false);

  // Check admin access and load course
  useEffect(() => {
    const checkAccessAndLoadCourse = async () => {
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

      // Load course details
      const courseDoc = await getDocs(query(collection(db, 'courses')));
      const courseData = courseDoc.docs.find(doc => doc.id === courseId);
      if (courseData) {
        setCourse({ id: courseData.id, ...courseData.data() });
      } else {
        alert('Corso non trovato');
        navigate('/course-admin');
        return;
      }
      
      setLoading(false);
    };

    checkAccessAndLoadCourse();
  }, [courseId, navigate]);

  // Load modules
  useEffect(() => {
    if (!courseId) return;

    const modulesQuery = query(
      collection(db, 'courses', courseId, 'modules'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(modulesQuery, async (snapshot) => {
      const modulesData = await Promise.all(
        snapshot.docs.map(async (moduleDoc) => {
          const module = { id: moduleDoc.id, ...moduleDoc.data() };
          
          // Load lessons for this module
          const lessonsQuery = query(
            collection(db, 'courses', courseId, 'modules', moduleDoc.id, 'lessons'),
            orderBy('order', 'asc')
          );
          const lessonsSnap = await getDocs(lessonsQuery);
          module.lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          return module;
        })
      );
      
      setModules(modulesData);
    });

    return () => unsubscribe();
  }, [courseId]);

  const handleCreateModule = async () => {
    if (!moduleData.title.trim()) {
      toast.error('Inserisci un titolo per il modulo');
      return;
    }

    try {
      await addDoc(collection(db, 'courses', courseId, 'modules'), {
        title: moduleData.title,
        description: moduleData.description,
        order: moduleData.order || modules.length + 1,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });

      setModuleData({ title: '', description: '', order: 1 });
      setShowNewModuleModal(false);
      alert('Modulo creato con successo!');
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Errore nella creazione del modulo: ' + error.message);
    }
  };

  const handleUpdateModule = async () => {
    if (!selectedModule) return;

    try {
      await updateDoc(
        doc(db, 'courses', courseId, 'modules', selectedModule.id),
        {
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
          updatedAt: serverTimestamp()
        }
      );

      setShowEditModuleModal(false);
      setSelectedModule(null);
      alert('Modulo aggiornato con successo!');
    } catch (error) {
      console.error('Error updating module:', error);
      toast.error('Errore nell\'aggiornamento del modulo: ' + error.message);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo modulo? Tutte le lezioni verranno eliminate.')) {
      return;
    }

    try {
      // Delete all lessons first
      const lessonsSnap = await getDocs(
        collection(db, 'courses', courseId, 'modules', moduleId, 'lessons')
      );
      
      for (const lessonDoc of lessonsSnap.docs) {
        await deleteDoc(lessonDoc.ref);
      }

      // Delete module
      await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId));
      alert('Modulo eliminato con successo');
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Errore nell\'eliminazione del modulo: ' + error.message);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonData.title.trim()) {
      alert('Inserisci un titolo per la lezione');
      return;
    }

    if (!selectedModule) {
      alert('Seleziona un modulo');
      return;
    }

    try {
      setIsUploading(true);
      let videoUrl = lessonData.videoUrl;

      // Upload video if file is provided
      if (lessonData.videoFile) {
        const videoRef = storageRef(
          storage,
          `courses/${courseId}/modules/${selectedModule.id}/lessons/${Date.now()}_${lessonData.videoFile.name}`
        );
        
        const uploadTask = uploadBytes(videoRef, lessonData.videoFile);
        
        // Monitor upload progress (if using uploadBytesResumable)
        // For simplicity, we're using uploadBytes which doesn't support progress
        
        await uploadTask;
        videoUrl = await getDownloadURL(videoRef);
      }

      await addDoc(
        collection(db, 'courses', courseId, 'modules', selectedModule.id, 'lessons'),
        {
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
          videoUrl: videoUrl,
          duration: lessonData.duration,
          order: lessonData.order || (selectedModule.lessons?.length || 0) + 1,
          isFree: lessonData.isFree,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.uid
        }
      );

      setLessonData({
        title: '',
        description: '',
        content: '',
        videoFile: null,
        videoUrl: '',
        duration: '',
        order: 1,
        isFree: false
      });
      setShowNewLessonModal(false);
      setIsUploading(false);
      alert('Lezione creata con successo!');
    } catch (error) {
      console.error('Error creating lesson:', error);
      setIsUploading(false);
      alert('Errore nella creazione della lezione: ' + error.message);
    }
  };

  const handleUpdateLesson = async () => {
    if (!selectedLesson || !selectedModule) return;

    try {
      setIsUploading(true);
      let videoUrl = lessonData.videoUrl;

      // Upload new video if file is provided
      if (lessonData.videoFile && lessonData.videoFile instanceof File) {
        const videoRef = storageRef(
          storage,
          `courses/${courseId}/modules/${selectedModule.id}/lessons/${Date.now()}_${lessonData.videoFile.name}`
        );
        
        await uploadBytes(videoRef, lessonData.videoFile);
        videoUrl = await getDownloadURL(videoRef);
        
        // Delete old video if exists (note: old video deletion should be handled server-side for better reliability)
        // We're skipping deletion here to avoid issues with URL vs path conversion
      }

      await updateDoc(
        doc(db, 'courses', courseId, 'modules', selectedModule.id, 'lessons', selectedLesson.id),
        {
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
          videoUrl: videoUrl,
          duration: lessonData.duration,
          order: lessonData.order,
          isFree: lessonData.isFree,
          updatedAt: serverTimestamp()
        }
      );

      setShowEditLessonModal(false);
      setSelectedLesson(null);
      setIsUploading(false);
      alert('Lezione aggiornata con successo!');
    } catch (error) {
      console.error('Error updating lesson:', error);
      setIsUploading(false);
      alert('Errore nell\'aggiornamento della lezione: ' + error.message);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa lezione?')) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId)
      );
      toast.success('Lezione eliminata con successo');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Errore nell\'eliminazione della lezione: ' + error.message);
    }
  };

  const handleEditModule = (module) => {
    setSelectedModule(module);
    setModuleData({
      title: module.title || '',
      description: module.description || '',
      order: module.order || 1
    });
    setShowEditModuleModal(true);
  };

  const handleEditLesson = (module, lesson) => {
    setSelectedModule(module);
    setSelectedLesson(lesson);
    setLessonData({
      title: lesson.title || '',
      description: lesson.description || '',
      content: lesson.content || '',
      videoFile: null,
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration || '',
      order: lesson.order || 1,
      isFree: lesson.isFree || false
    });
    setShowEditLessonModal(true);
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
              <button
                onClick={() => navigate('/course-admin')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="text-slate-400" size={24} />
              </button>
              <BookOpen className="text-cyan-400" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-white">{course?.title}</h1>
                <p className="text-slate-400">Gestisci moduli e lezioni del corso</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewModuleModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2"
            >
              <FolderPlus size={20} />
              Nuovo Modulo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <FolderPlus className="text-blue-400" size={24} />
              <span className="text-sm font-medium text-slate-300">Moduli</span>
            </div>
            <div className="text-3xl font-bold text-white">{modules.length}</div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Video className="text-purple-400" size={24} />
              <span className="text-sm font-medium text-slate-300">Lezioni Totali</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-green-400" size={24} />
              <span className="text-sm font-medium text-slate-300">Durata Totale</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {modules.reduce((sum, m) => {
                const moduleDuration = m.lessons?.reduce((total, l) => {
                  const duration = parseInt(l.duration) || 0;
                  return total + duration;
                }, 0) || 0;
                return sum + moduleDuration;
              }, 0)} min
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              {/* Module Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                      >
                        {expandedModule === module.id ? (
                          <ChevronDown size={20} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={20} className="text-slate-400" />
                        )}
                      </button>
                      <span className="text-slate-500 text-sm font-medium">Modulo {index + 1}</span>
                      <h3 className="text-xl font-bold text-white">{module.title}</h3>
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                        {module.lessons?.length || 0} lezioni
                      </span>
                    </div>
                    {module.description && (
                      <p className="text-slate-400 text-sm ml-9">{module.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedModule(module);
                        setShowNewLessonModal(true);
                      }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Lezione
                    </button>
                    <button
                      onClick={() => handleEditModule(module)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Lessons List */}
                {expandedModule === module.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 ml-9 space-y-2"
                  >
                    {module.lessons && module.lessons.length > 0 ? (
                      module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 text-sm font-medium">
                              {lessonIndex + 1}
                            </span>
                            <Play size={16} className="text-cyan-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white">{lesson.title}</h4>
                                {lesson.isFree && (
                                  <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">
                                    Gratuita
                                  </span>
                                )}
                              </div>
                              {lesson.duration && (
                                <p className="text-xs text-slate-400">{lesson.duration} minuti</p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditLesson(module, lesson)}
                              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded text-sm"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(module.id, lesson.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        Nessuna lezione in questo modulo.
                        <button
                          onClick={() => {
                            setSelectedModule(module);
                            setShowNewLessonModal(true);
                          }}
                          className="block mx-auto mt-2 text-cyan-400 hover:text-cyan-300"
                        >
                          + Aggiungi prima lezione
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}

          {modules.length === 0 && (
            <div className="text-center py-12">
              <FolderPlus className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-xl font-medium text-slate-400 mb-2">Nessun modulo disponibile</h3>
              <p className="text-slate-500 mb-4">Inizia creando il primo modulo del corso</p>
              <button
                onClick={() => setShowNewModuleModal(true)}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg inline-flex items-center gap-2"
              >
                <FolderPlus size={20} />
                Crea Modulo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New/Edit Module Modal */}
      <AnimatePresence>
        {(showNewModuleModal || showEditModuleModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowNewModuleModal(false);
              setShowEditModuleModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {showEditModuleModal ? 'Modifica Modulo' : 'Nuovo Modulo'}
                </h2>
                <button
                  onClick={() => {
                    setShowNewModuleModal(false);
                    setShowEditModuleModal(false);
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Titolo Modulo *
                  </label>
                  <input
                    type="text"
                    value={moduleData.title}
                    onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Es: Introduzione al Fitness"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    value={moduleData.description}
                    onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
                    className="w-full h-24 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                    placeholder="Descrivi il modulo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ordine
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={moduleData.order}
                    onChange={(e) => setModuleData({ ...moduleData, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewModuleModal(false);
                    setShowEditModuleModal(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={showEditModuleModal ? handleUpdateModule : handleCreateModule}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-colors"
                >
                  {showEditModuleModal ? 'Salva Modifiche' : 'Crea Modulo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New/Edit Lesson Modal */}
      <AnimatePresence>
        {(showNewLessonModal || showEditLessonModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowNewLessonModal(false);
              setShowEditLessonModal(false);
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
                  {showEditLessonModal ? 'Modifica Lezione' : 'Nuova Lezione'}
                </h2>
                <button
                  onClick={() => {
                    setShowNewLessonModal(false);
                    setShowEditLessonModal(false);
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Titolo Lezione *
                  </label>
                  <input
                    type="text"
                    value={lessonData.title}
                    onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Es: Esercizi di Base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    value={lessonData.description}
                    onChange={(e) => setLessonData({ ...lessonData, description: e.target.value })}
                    className="w-full h-20 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                    placeholder="Breve descrizione della lezione..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contenuto Testuale
                  </label>
                  <textarea
                    value={lessonData.content}
                    onChange={(e) => setLessonData({ ...lessonData, content: e.target.value })}
                    className="w-full h-32 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                    placeholder="Contenuto della lezione in formato testo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Video Lezione
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setLessonData({ ...lessonData, videoFile: e.target.files[0] })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                  {lessonData.videoUrl && !lessonData.videoFile && (
                    <p className="text-xs text-green-400 mt-1">✓ Video già caricato</p>
                  )}
                  {lessonData.videoFile && (
                    <p className="text-xs text-cyan-400 mt-1">Nuovo video selezionato: {lessonData.videoFile.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Durata (minuti)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={lessonData.duration}
                      onChange={(e) => setLessonData({ ...lessonData, duration: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Ordine
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={lessonData.order}
                      onChange={(e) => setLessonData({ ...lessonData, order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Lezione Gratuita</div>
                    <div className="text-sm text-slate-400">
                      Disponibile anche per utenti non iscritti al corso
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonData.isFree}
                      onChange={(e) => setLessonData({ ...lessonData, isFree: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {isUploading && (
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Caricamento video...</span>
                    </div>
                    <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 transition-all duration-300 animate-pulse"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewLessonModal(false);
                    setShowEditLessonModal(false);
                  }}
                  disabled={isUploading}
                  className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annulla
                </button>
                <button
                  onClick={showEditLessonModal ? handleUpdateLesson : handleCreateLesson}
                  disabled={isUploading}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Caricamento...' : showEditLessonModal ? 'Salva Modifiche' : 'Crea Lezione'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
