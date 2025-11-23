import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp, addDoc, collection, getDoc } from 'firebase/firestore';
import { db, auth, storage } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Play, SkipForward, Check, ChevronRight, Camera, User, MessageSquare, FileText, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [presentationPost, setPresentationPost] = useState('');
  const [onboardingVideoUrl, setOnboardingVideoUrl] = useState('/videos/welcome-founder.mp4');
  const videoRef = useRef(null);

  const steps = [
    { id: 'video', title: 'Benvenuto!', icon: Play },
    { id: 'photo', title: 'Foto Profilo', icon: Camera },
    { id: 'presentation', title: 'Presentazione', icon: MessageSquare },
    { id: 'questionnaire', title: 'Questionario', icon: FileText },
  ];

  // Carica video onboarding personalizzato
  useEffect(() => {
    const customVideo = localStorage.getItem('onboarding_video_url');
    if (customVideo) {
      setOnboardingVideoUrl(customVideo);
    }
  }, []);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(getTenantDoc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);

          // Check onboarding progress
          if (userData.onboardingCompleted) {
            navigate('/dashboard');
            return;
          }

          // Determine current step
          if (!userData.photoURL) {
            setCurrentStep(1); // Photo step
          } else if (!userData.presentationPosted) {
            setCurrentStep(2); // Presentation step
          } else if (!userData.questionnaireCompleted) {
            setCurrentStep(3); // Questionnaire step
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  const handleVideoEnd = () => {
    setVideoWatched(true);
  };

  const handleSkipVideo = () => {
    if (window.confirm('Sei sicuro di voler saltare il video di benvenuto?')) {
      setVideoWatched(true);
      nextStep();
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePhotoUpload = async () => {
    if (!profilePhoto) return;

    try {
      const user = auth.currentUser;
      const photoRef = storageRef(storage, `profile_photos/${user.uid}`);
      await uploadBytes(photoRef, profilePhoto);
      const photoURL = await getDownloadURL(photoRef);

      await updateDoc(getTenantDoc(db, 'users', user.uid), {
        photoURL,
        updatedAt: serverTimestamp(),
      });

      setUserProfile(prev => ({ ...prev, photoURL }));
      nextStep();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Errore nel caricamento della foto');
    }
  };

  const handlePresentationPost = async () => {
    if (!presentationPost.trim()) return;

    try {
      const user = auth.currentUser;
      const postData = {
        content: presentationPost,
        channel: 'presentazioni',
        authorId: user.uid,
        authorName: userProfile?.name || 'Nuovo membro',
        authorPhoto: userProfile?.photoURL || '',
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        isPinned: false,
        isPresentation: true,
        media: []
      };

      await addDoc(getTenantCollection(db, 'community_posts'), postData);

      await updateDoc(getTenantDoc(db, 'users', user.uid), {
        presentationPosted: true,
        updatedAt: serverTimestamp(),
      });

      nextStep();
    } catch (error) {
      console.error('Error creating presentation post:', error);
      alert('Errore nella pubblicazione del post');
    }
  };

  const handleQuestionnaireComplete = async () => {
    try {
      const user = auth.currentUser;
      await updateDoc(getTenantDoc(db, 'users', user.uid), {
        questionnaireCompleted: true,
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Navigate to community
      navigate('/community');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Errore nel completamento dell\'onboarding');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfilePhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Progress Bar */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : isCurrent
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-slate-600 text-slate-500'
                  }`}>
                    {isCompleted ? (
                      <Check size={20} />
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isCompleted
                      ? 'text-green-400'
                      : isCurrent
                      ? 'text-cyan-400'
                      : 'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronRight size={16} className="ml-4 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-100 mb-4">
                  Benvenuto nella Community! 🎉
                </h1>
                <p className="text-lg text-slate-300 mb-6">
                  Prima di iniziare, guarda questo video di benvenuto dal Founder
                </p>
              </div>

              <div className="relative bg-slate-800 rounded-xl overflow-hidden mb-8">
                <video
                  ref={videoRef}
                  className="w-full aspect-video"
                  controls={!videoWatched}
                  onEnded={handleVideoEnd}
                  autoPlay
                  muted
                >
                  <source src={onboardingVideoUrl} type="video/mp4" />
                  Il tuo browser non supporta il tag video.
                </video>

                {!videoWatched && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <button
                      onClick={() => videoRef.current?.play()}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                    >
                      <Play size={20} />
                      Guarda il Video
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleSkipVideo}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg flex items-center gap-2"
                >
                  <SkipForward size={18} />
                  Salta Video
                </button>
                {videoWatched && (
                  <button
                    onClick={nextStep}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg flex items-center gap-2"
                  >
                    Continua
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="photo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <Camera className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Carica la tua Foto Profilo
                </h2>
                <p className="text-slate-300">
                  Una foto rende la tua presenza più personale e aiuta gli altri membri a riconoscerti!
                </p>
              </div>

              <div className="mb-8">
                <div className="relative inline-block">
                  <img
                    src={profilePhotoPreview || 'https://ui-avatars.com/api/?name=' + (userProfile?.name || 'User') + '&size=150'}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500"
                  />
                  {profilePhoto && (
                    <div className="absolute -bottom-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Pronta
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-slate-300 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Formato consigliato: quadrata, max 2MB
                </p>
              </div>

              <button
                onClick={handlePhotoUpload}
                disabled={!profilePhoto}
                className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profilePhoto ? 'Carica Foto e Continua' : 'Seleziona una Foto'}
              </button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="presentation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <MessageSquare className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Presentati alla Community!
                </h2>
                <p className="text-slate-300 mb-6">
                  Scrivi un breve post di presentazione nel canale #presentazioni
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={userProfile?.photoURL || 'https://ui-avatars.com/api/?name=' + (userProfile?.name || 'User')}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-medium text-slate-200">{userProfile?.name || 'Tu'}</span>
                    <span className="text-xs text-slate-400 ml-2">ora</span>
                  </div>
                </div>

                <textarea
                  value={presentationPost}
                  onChange={(e) => setPresentationPost(e.target.value)}
                  placeholder={`Ciao a tutti! Mi chiamo ${userProfile?.name || '...'},

Vengo da [la tua città] e il mio obiettivo principale è [descrivi il tuo obiettivo].

Non vedo l'ora di condividere il mio percorso con voi e imparare dalle vostre esperienze!

🚀`}
                  className="w-full h-40 px-4 py-3 bg-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />

                <div className="text-right text-xs text-slate-500 mt-2">
                  {presentationPost.length}/500
                </div>
              </div>

              <button
                onClick={handlePresentationPost}
                disabled={!presentationPost.trim()}
                className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pubblica Presentazione
              </button>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <FileText className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Questionario di Ingresso
                </h2>
                <p className="text-slate-300">
                  Completa questo breve questionario per aiutarci a personalizzare la tua esperienza
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
                <p className="text-slate-300 mb-4">
                  Il questionario sarà disponibile qui. Per ora, clicca su "Completa" per continuare.
                </p>
                <div className="text-sm text-slate-400">
                  (Il questionario completo sarà implementato nel prossimo step)
                </div>
              </div>

              <button
                onClick={handleQuestionnaireComplete}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg"
              >
                Completa Onboarding
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingFlow;