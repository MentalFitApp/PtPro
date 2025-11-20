import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Video, Camera, MessageSquare, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadPhoto } from '../storageUtils';

/**
 * Flow di Onboarding per nuovi utenti della Community
 * Step:
 * 1. Video di benvenuto
 * 2. Upload foto profilo
 * 3. Messaggio di presentazione alla community
 * 4. Questionario
 */

const ONBOARDING_STEPS = [
  { id: 'video', title: 'Video di Benvenuto', icon: Video },
  { id: 'photo', title: 'Foto Profilo', icon: Camera },
  { id: 'intro', title: 'Presentati', icon: MessageSquare },
  { id: 'questionnaire', title: 'Questionario', icon: FileText },
  { id: 'complete', title: 'Completato', icon: CheckCircle },
];

export default function CommunityOnboarding() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Form state
  const [photoURL, setPhotoURL] = useState('');
  const [introMessage, setIntroMessage] = useState('');
  const [videoWatched, setVideoWatched] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadSettings();
        await checkOnboardingStatus(user.uid);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'community'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkOnboardingStatus = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.onboardingCompleted) {
          // Onboarding già completato, redirect alla community
          navigate('/community');
        } else if (userData.onboardingStep) {
          // Riprendi dall'ultimo step
          const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === userData.onboardingStep);
          setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const saveProgress = async (stepId) => {
    if (!currentUser) return;
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        onboardingStep: stepId,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const url = await uploadPhoto(file, currentUser.uid, 'profile_photos', null, true);
      setPhotoURL(url);
      
      // Salva nel profilo utente
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: url,
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Errore nel caricamento della foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNextStep = async () => {
    const step = ONBOARDING_STEPS[currentStep];
    
    // Validazione step corrente
    if (step.id === 'video' && settings?.welcomeVideo?.enabled && !videoWatched) {
      alert('Per favore guarda il video di benvenuto prima di continuare');
      return;
    }
    
    if (step.id === 'photo' && settings?.onboarding?.requireProfilePhoto && !photoURL) {
      alert('Per favore carica una foto profilo prima di continuare');
      return;
    }
    
    if (step.id === 'intro' && settings?.onboarding?.requireWelcomePost && !introMessage.trim()) {
      alert('Per favore scrivi un messaggio di presentazione prima di continuare');
      return;
    }
    
    // Salva dati step corrente
    if (step.id === 'intro' && introMessage.trim()) {
      // Crea post di benvenuto nella community
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(db, 'community_posts'), {
        content: introMessage,
        channel: 'vittorie',
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Nuovo Membro',
        authorPhotoURL: photoURL || '',
        authorLevel: 1,
        likes: [],
        likesCount: 0,
        comments: [],
        commentsCount: 0,
        isWelcomePost: true,
        createdAt: serverTimestamp(),
      });
    }
    
    // Vai al prossimo step
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await saveProgress(ONBOARDING_STEPS[nextStep].id);
    } else {
      // Onboarding completato
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp(),
        totalLikes: 0, // Inizializza likes per gamificazione
      });
      
      // Invia notifica al coach se richiesto
      if (settings?.onboarding?.sendPrivateVoiceMessage) {
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'notifications'), {
          type: 'new_user_onboarding',
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Nuovo Membro',
          message: 'Ha completato l\'onboarding. Invia messaggio vocale personalizzato.',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      
      navigate('/community');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {ONBOARDING_STEPS.map((s, index) => {
              const Icon = s.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={`w-12 sm:w-24 h-1 mx-1 transition-all ${
                        isCompleted ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-slate-400 text-sm mt-2">
            Step {currentStep + 1} di {ONBOARDING_STEPS.length}: {step.title}
          </p>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-800 rounded-xl p-6 sm:p-8 border border-slate-700"
          >
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-rose-600/20 rounded-full mb-4">
                <StepIcon className="text-rose-400" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">{step.title}</h2>
            </div>

            {/* Step Content */}
            {step.id === 'video' && settings?.welcomeVideo?.enabled && (
              <div>
                <p className="text-slate-300 text-center mb-6">
                  {settings.welcomeVideo.description}
                </p>
                <div className="aspect-video bg-slate-900 rounded-lg mb-4 flex items-center justify-center">
                  {settings.welcomeVideo.url ? (
                    <iframe
                      src={settings.welcomeVideo.url}
                      title={settings.welcomeVideo.title}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-slate-500 text-center">
                      <Video size={48} className="mx-auto mb-2" />
                      <p>Nessun video configurato</p>
                    </div>
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={videoWatched}
                    onChange={(e) => setVideoWatched(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-rose-600 focus:ring-rose-500"
                  />
                  Ho guardato il video
                </label>
              </div>
            )}

            {step.id === 'photo' && (
              <div className="text-center">
                <p className="text-slate-300 mb-6">
                  Carica una tua foto per personalizzare il profilo
                </p>
                
                {photoURL ? (
                  <div className="mb-4">
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-rose-600"
                    />
                    <p className="text-emerald-400 text-sm">✓ Foto caricata con successo</p>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-700 mx-auto mb-4 flex items-center justify-center">
                    <Camera size={48} className="text-slate-500" />
                  </div>
                )}
                
                <label className="inline-block px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium cursor-pointer transition-colors">
                  {uploadingPhoto ? 'Caricamento...' : photoURL ? 'Cambia Foto' : 'Carica Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {step.id === 'intro' && (
              <div>
                <p className="text-slate-300 mb-6">
                  Presentati alla community! Condividi i tuoi obiettivi personali e fisici con gli altri membri.
                </p>
                <textarea
                  value={introMessage}
                  onChange={(e) => setIntroMessage(e.target.value)}
                  placeholder="Ciao a tutti! Sono... I miei obiettivi sono..."
                  rows={8}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Questo messaggio sarà pubblicato nel canale "Vittorie" della community
                </p>
              </div>
            )}

            {step.id === 'questionnaire' && (
              <div className="text-center">
                <p className="text-slate-300 mb-6">
                  Compila il questionario per permettere al coach di conoscerti meglio e creare un piano personalizzato
                </p>
                <button
                  onClick={() => navigate('/client/anamnesi')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FileText size={20} />
                  Vai al Questionario
                </button>
                <p className="text-xs text-slate-500 mt-4">
                  Dopo aver compilato il questionario, il coach ti invierà un messaggio vocale personalizzato
                </p>
              </div>
            )}

            {step.id === 'complete' && (
              <div className="text-center">
                <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={64} className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">Benvenuto in MentalFit!</h3>
                <p className="text-slate-300 mb-8">
                  Hai completato l'onboarding. Ora puoi iniziare a interagire con la community e il tuo coach.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
              {currentStep > 0 && step.id !== 'complete' && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Indietro
                </button>
              )}
              
              <button
                onClick={handleNextStep}
                className="ml-auto flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
              >
                {step.id === 'complete' ? 'Vai alla Community' : 'Continua'}
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
