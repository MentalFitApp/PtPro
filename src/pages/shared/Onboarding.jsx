import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { CheckCircle, Upload, MessageSquare, FileText, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaUploadButton from '../../components/ui/MediaUploadButton';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [videoWatched, setVideoWatched] = useState(false);
  const [profileData, setProfileData] = useState({
    photoURL: '',
    welcomeMessage: '',
  });
  const [loading, setLoading] = useState(false);

  const ONBOARDING_VIDEO_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Placeholder - sostituire con video reale

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        // Verifica se ha già completato l'onboarding
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().onboardingCompleted) {
          navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handlePhotoUpload = (urls) => {
    if (urls && urls.length > 0) {
      setProfileData(prev => ({ ...prev, photoURL: urls[0] }));
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      // Aggiorna profilo utente
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: profileData.photoURL,
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp(),
      });



      // Naviga al questionario anamnesi
      navigate('/first-access');
    } catch (error) {
      console.error('Errore completamento onboarding:', error);
      alert('Errore durante il completamento. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Benvenuto in MentalFit!',
      icon: Trophy,
      description: 'Guarda il video di benvenuto di Maurizio',
    },
    {
      id: 2,
      title: 'Foto Profilo',
      icon: Upload,
      description: 'Carica la tua foto profilo',
    },
    {
      id: 3,
      title: 'Presentati',
      icon: MessageSquare,
      description: 'Scrivi un messaggio di presentazione',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="bg-slate-900/50 p-6 border-b border-slate-700">
          <div className="flex justify-between mb-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                    isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    isActive ? 'bg-gradient-to-r from-rose-600 to-pink-600' :
                    'bg-slate-700'
                  }`}>
                    {isCompleted ? <CheckCircle className="text-white" size={24} /> : <Icon className="text-white" size={24} />}
                  </div>
                  {step.id < steps.length && (
                    <div className={`flex-1 h-1 mx-2 transition-all ${
                      isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">{steps[currentStep - 1].title}</h2>
            <p className="text-slate-400">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Video */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
                  <iframe
                    src={ONBOARDING_VIDEO_URL}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video Benvenuto MentalFit"
                  />
                </div>
                <div className="flex items-center gap-3 bg-slate-700/50 p-4 rounded-lg">
                  <input
                    type="checkbox"
                    checked={videoWatched}
                    onChange={(e) => setVideoWatched(e.target.checked)}
                    className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <label className="text-slate-200 font-medium">
                    Ho guardato il video e sono pronto a iniziare!
                  </label>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!videoWatched}
                  className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
                >
                  Continua
                </button>
              </motion.div>
            )}

            {/* Step 2: Foto Profilo */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    {profileData.photoURL ? (
                      <img
                        src={profileData.photoURL}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-rose-500 shadow-2xl"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center border-4 border-slate-600">
                        <Upload className="text-slate-400" size={48} />
                      </div>
                    )}
                  </div>
                  <MediaUploadButton
                    userId={currentUser?.uid}
                    onUploadComplete={handlePhotoUpload}
                    folder="profile_photos"
                    acceptedFileTypes="image/*"
                    label={profileData.photoURL ? 'Cambia Foto' : 'Carica Foto Profilo'}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-all"
                  >
                    Indietro
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!profileData.photoURL}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold transition-all"
                  >
                    Continua
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Messaggio Benvenuto */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-slate-200 font-semibold mb-3 text-lg">
                    Completa il tuo profilo 🎉
                  </label>
                  <p className="text-slate-400 mb-4">
                    Condividi i tuoi obiettivi personali e fisici!
                  </p>
                  <textarea
                    value={profileData.welcomeMessage}
                    onChange={(e) => setProfileData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    placeholder="Es: Ciao a tutti! Sono [nome] e sono entusiasta di iniziare questo percorso con MentalFit. Il mio obiettivo è..."
                    className="w-full h-48 px-4 py-3 bg-slate-700/50 text-slate-100 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    maxLength={500}
                  />
                  <div className="text-right text-sm text-slate-400 mt-2">
                    {profileData.welcomeMessage.length}/500
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-all"
                  >
                    Indietro
                  </button>
                  <button
                    onClick={handleCompleteOnboarding}
                    disabled={!profileData.welcomeMessage.trim() || loading}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold transition-all shadow-lg"
                  >
                    {loading ? 'Caricamento...' : 'Completa e Inizia! 🚀'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
