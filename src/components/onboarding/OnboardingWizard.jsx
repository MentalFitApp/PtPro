// src/components/onboarding/OnboardingWizard.jsx
// Tour guidato per nuovi utenti (Coach e Clienti)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Check, Sparkles,
  Users, Settings, Calendar, MessageSquare, BarChart3,
  Dumbbell, Utensils, Camera, Bell, Palette
} from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';

// Configurazione steps per ruolo
const ONBOARDING_STEPS = {
  admin: [
    {
      id: 'welcome',
      title: 'Benvenuto su FitFlows! 🎉',
      description: 'Questa breve guida ti aiuterà a configurare il tuo spazio di lavoro e iniziare a gestire il tuo business.',
      icon: Sparkles,
      color: 'cyan'
    },
    {
      id: 'branding',
      title: 'Personalizza il tuo Brand',
      description: 'Aggiungi il tuo logo e personalizza i colori per dare un tocco professionale alla tua area clienti.',
      icon: Palette,
      color: 'purple',
      action: { label: 'Vai a Branding', path: '/settings' }
    },
    {
      id: 'clients',
      title: 'Gestisci i tuoi Clienti',
      description: 'Aggiungi clienti, assegna schede allenamento e diete, monitora i loro progressi.',
      icon: Users,
      color: 'emerald',
      action: { label: 'Vai ai Clienti', path: '/clients' }
    },
    {
      id: 'collaborators',
      title: 'Aggiungi Collaboratori',
      description: 'Invita coach e collaboratori per aiutarti a gestire i clienti. Definisci i permessi di accesso.',
      icon: Users,
      color: 'blue',
      action: { label: 'Gestisci Team', path: '/collaboratori' }
    },
    {
      id: 'calendar',
      title: 'Organizza il tuo Calendario',
      description: 'Programma chiamate, appuntamenti e promemoria. Non perdere mai un check-in!',
      icon: Calendar,
      color: 'amber',
      action: { label: 'Vai al Calendario', path: '/calendar' }
    },
    {
      id: 'notifications',
      title: 'Attiva le Notifiche Push',
      description: 'Ricevi notifiche in tempo reale per nuovi lead, messaggi e check dei clienti.',
      icon: Bell,
      color: 'rose',
      action: { label: 'Attiva Notifiche', type: 'notification' }
    },
    {
      id: 'complete',
      title: 'Sei pronto! 🚀',
      description: 'Hai completato la configurazione. Esplora tutte le funzionalità e fai crescere il tuo business!',
      icon: Check,
      color: 'emerald'
    }
  ],
  coach: [
    {
      id: 'welcome',
      title: 'Benvenuto su FitFlows! 💪',
      description: 'Sei stato aggiunto come Coach. Ecco come iniziare a gestire i tuoi clienti.',
      icon: Sparkles,
      color: 'cyan'
    },
    {
      id: 'clients',
      title: 'I tuoi Clienti',
      description: 'Visualizza i clienti a te assegnati. Puoi vedere i loro progressi, check e comunicare con loro.',
      icon: Users,
      color: 'emerald',
      action: { label: 'Vai ai Clienti', path: '/coach/clients' }
    },
    {
      id: 'calendar',
      title: 'Il tuo Calendario',
      description: 'Programma le chiamate e gli appuntamenti con i tuoi clienti.',
      icon: Calendar,
      color: 'amber',
      action: { label: 'Vai al Calendario', path: '/coach/calendar' }
    },
    {
      id: 'notifications',
      title: 'Attiva le Notifiche',
      description: 'Ricevi notifiche quando i clienti caricano check o ti scrivono.',
      icon: Bell,
      color: 'rose',
      action: { label: 'Attiva Notifiche', type: 'notification' }
    },
    {
      id: 'complete',
      title: 'Tutto pronto! 🎯',
      description: 'Ora puoi iniziare a seguire i tuoi clienti. Buon lavoro!',
      icon: Check,
      color: 'emerald'
    }
  ],
  client: [
    {
      id: 'welcome',
      title: 'Benvenuto! 👋',
      description: 'Questa guida ti mostrerà come utilizzare al meglio l\'app per raggiungere i tuoi obiettivi.',
      icon: Sparkles,
      color: 'cyan'
    },
    {
      id: 'anamnesi',
      title: 'Compila la tua Anamnesi',
      description: 'Inizia compilando il questionario iniziale. Ci aiuterà a personalizzare il tuo percorso.',
      icon: Users,
      color: 'purple',
      action: { label: 'Compila Anamnesi', path: '/client/anamnesi' }
    },
    {
      id: 'workout',
      title: 'I tuoi Allenamenti',
      description: 'Qui troverai la tua scheda allenamento personalizzata. Segui gli esercizi e registra i tuoi progressi.',
      icon: Dumbbell,
      color: 'emerald',
      action: { label: 'Vai agli Allenamenti', path: '/client/scheda' }
    },
    {
      id: 'diet',
      title: 'Il tuo Piano Alimentare',
      description: 'Consulta il tuo piano alimentare giornaliero e segui le indicazioni del tuo coach.',
      icon: Utensils,
      color: 'amber',
      action: { label: 'Vai alla Dieta', path: '/client/dieta' }
    },
    {
      id: 'check',
      title: 'Check Settimanali',
      description: 'Ogni settimana carica le tue foto e il tuo peso. Il tuo coach monitorerà i tuoi progressi.',
      icon: Camera,
      color: 'rose',
      action: { label: 'Fai un Check', path: '/client/checks' }
    },
    {
      id: 'complete',
      title: 'Tutto pronto! 💪',
      description: 'Ora sei pronto per iniziare il tuo percorso. Buon allenamento!',
      icon: Check,
      color: 'emerald'
    }
  ]
};

// Progress Dots
const ProgressDots = ({ total, current }) => (
  <div className="flex items-center gap-2">
    {[...Array(total)].map((_, i) => (
      <motion.div
        key={i}
        initial={false}
        animate={{
          width: i === current ? 24 : 8,
          backgroundColor: i <= current ? '#22d3ee' : '#475569'
        }}
        className="h-2 rounded-full transition-colors"
      />
    ))}
  </div>
);

// Step Content
const StepContent = ({ step, onAction }) => {
  const iconColors = {
    cyan: 'from-cyan-500 to-blue-500',
    purple: 'from-purple-500 to-indigo-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
    blue: 'from-blue-500 to-indigo-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center px-4 sm:px-6"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${iconColors[step.color]} flex items-center justify-center shadow-lg`}
      >
        <step.icon size={28} className="text-white" />
      </motion.div>
      
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{step.title}</h2>
      <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-5 max-w-md mx-auto leading-relaxed">{step.description}</p>
      
      {step.action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAction(step.action)}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-medium rounded-xl shadow-lg transition-all"
        >
          {step.action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

export default function OnboardingWizard({ role = 'admin', onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const steps = ONBOARDING_STEPS[role] || ONBOARDING_STEPS.admin;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(getTenantDoc(db, 'onboarding', user.uid), {
          completed: true,
          completedAt: new Date(),
          role
        });
      }
    } catch (err) {
      console.error('Errore salvataggio onboarding:', err);
    }
    
    setIsVisible(false);
    setTimeout(() => onComplete?.(), 300);
  };

  const handleSkip = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(getTenantDoc(db, 'onboarding', user.uid), {
          skipped: true,
          skippedAt: new Date(),
          role
        });
      }
    } catch (err) {
      console.error('Errore skip onboarding:', err);
    }
    
    setIsVisible(false);
    setTimeout(() => onSkip?.(), 300);
  };

  const handleAction = (action) => {
    if (action.type === 'notification') {
      // Richiedi permesso notifiche
      if ('Notification' in window) {
        Notification.requestPermission();
      }
    }
    
    if (action.path) {
      // Naviga alla pagina
      window.location.href = action.path;
    }
    
    handleNext();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-md"
            onClick={handleSkip}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm sm:max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden my-auto max-h-[95vh] overflow-y-auto"
          >
            {/* Skip Button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="pt-8 sm:pt-10 pb-4 sm:pb-6">
              <AnimatePresence mode="wait">
                <StepContent 
                  key={step.id} 
                  step={step} 
                  onAction={handleAction}
                />
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              {/* Progress */}
              <div className="flex justify-center mb-6">
                <ProgressDots total={steps.length} current={currentStep} />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={isFirstStep}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isFirstStep 
                      ? 'text-slate-600 cursor-not-allowed' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <ChevronLeft size={18} />
                  Indietro
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl font-medium transition-all"
                >
                  {isLastStep ? 'Inizia!' : 'Avanti'}
                  {!isLastStep && <ChevronRight size={18} />}
                </button>
              </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook per controllare se mostrare onboarding
export function useOnboarding(role) {
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const onboardingDoc = await getDoc(getTenantDoc(db, 'onboarding', user.uid));
        
        if (!onboardingDoc.exists()) {
          setShouldShow(true);
        } else {
          const data = onboardingDoc.data();
          setShouldShow(!data.completed && !data.skipped);
        }
      } catch (err) {
        console.error('Errore check onboarding:', err);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  return { shouldShow, loading };
}
