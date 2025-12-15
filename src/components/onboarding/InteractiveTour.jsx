// src/components/onboarding/InteractiveTour.jsx
// Tour interattivo con spotlight sugli elementi della UI

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';

// Configurazione tour per ruolo
const TOUR_STEPS = {
  admin: [
    {
      id: 'welcome',
      type: 'modal',
      title: 'Benvenuto su FitFlow! 🎉',
      description: 'Ti guiderò attraverso le funzionalità principali della tua piattaforma. Clicca "Iniziamo" per scoprire tutto!',
    },
    {
      id: 'dashboard',
      selector: '[data-tour="dashboard"]',
      title: 'La tua Dashboard',
      description: 'Panoramica completa: clienti attivi, incassi del mese, scadenze imminenti e attività recenti. Tutto a colpo d\'occhio!',
      position: 'right'
    },
    {
      id: 'clients',
      selector: '[data-tour="clients"]',
      title: 'Gestione Clienti',
      description: 'Aggiungi nuovi clienti, assegna schede di allenamento e alimentazione, monitora i progressi e gestisci gli abbonamenti.',
      position: 'right'
    },
    {
      id: 'chat',
      selector: '[data-tour="chat"]',
      title: 'Chat in Tempo Reale',
      description: 'Comunica direttamente con i tuoi clienti. Riceverai notifiche push per i nuovi messaggi!',
      position: 'right'
    },
    {
      id: 'calendar',
      selector: '[data-tour="calendar"]',
      title: 'Calendario Appuntamenti',
      description: 'Pianifica chiamate, check-in e sessioni. Integrazione con Google Calendar disponibile!',
      position: 'right'
    },
    {
      id: 'collaboratori',
      selector: '[data-tour="collaboratori"]',
      title: 'Collaboratori',
      description: 'Aggiungi coach e collaboratori al tuo team. Assegna loro clienti e monitora il loro lavoro.',
      position: 'right'
    },
    {
      id: 'schede',
      selector: '[data-tour="schede"]',
      title: 'Schede Allenamento',
      description: 'Crea e assegna schede personalizzate con esercizi dal nostro database di 1.300+ esercizi.',
      position: 'right'
    },
    {
      id: 'community',
      selector: '[data-tour="community"]',
      title: 'Community',
      description: 'Crea una community per i tuoi clienti: post, interazioni e contenuti esclusivi.',
      position: 'right'
    },
    {
      id: 'analytics',
      selector: '[data-tour="analytics"]',
      title: 'Analytics & Revenue',
      description: 'Monitora la crescita del business: revenue, retention dei clienti e trend mensili.',
      position: 'right'
    },
    {
      id: 'branding',
      selector: '[data-tour="branding"]',
      title: 'Personalizza il Brand',
      description: 'Carica il tuo logo, scegli i colori e personalizza l\'app con il tuo brand.',
      position: 'right'
    },
    {
      id: 'integrations',
      selector: '[data-tour="integrations"]',
      title: 'Integrazioni',
      description: 'Collega Instagram, ManyChat, Google Calendar, Daily.co per videochiamate e molto altro.',
      position: 'right'
    },
    {
      id: 'complete',
      type: 'modal',
      title: 'Sei pronto a partire! 🚀',
      description: 'Hai scoperto le funzionalità principali. Inizia aggiungendo i tuoi primi clienti e fai crescere il tuo business!',
    }
  ],
  coach: [
    {
      id: 'welcome',
      type: 'modal',
      title: 'Benvenuto Coach! 💪',
      description: 'Ecco una breve guida per gestire al meglio i clienti che ti sono stati assegnati.',
    },
    {
      id: 'dashboard',
      selector: '[data-tour="dashboard"]',
      title: 'La tua Dashboard',
      description: 'Visualizza i clienti attivi, le scadenze e le attività recenti dei tuoi clienti.',
      position: 'right'
    },
    {
      id: 'clients',
      selector: '[data-tour="clients"]',
      title: 'I tuoi Clienti',
      description: 'Vedi i clienti assegnati a te. Clicca su uno per accedere ai dettagli, schede e check.',
      position: 'right'
    },
    {
      id: 'chat',
      selector: '[data-tour="chat"]',
      title: 'Chat',
      description: 'Comunica con i tuoi clienti. Il pallino blu indica messaggi non letti.',
      position: 'right'
    },
    {
      id: 'anamnesi',
      selector: '[data-tour="anamnesi"]',
      title: 'Anamnesi Clienti',
      description: 'Visualizza le anamnesi compilate. Il pallino indica nuove compilazioni da controllare.',
      position: 'right'
    },
    {
      id: 'schede',
      selector: '[data-tour="schede"]',
      title: 'Gestione Schede',
      description: 'Crea e assegna schede di allenamento ai tuoi clienti.',
      position: 'right'
    },
    {
      id: 'updates',
      selector: '[data-tour="updates"]',
      title: 'Aggiornamenti',
      description: 'Leggi le novità e gli annunci pubblicati dall\'admin.',
      position: 'right'
    },
    {
      id: 'complete',
      type: 'modal',
      title: 'Tutto pronto! 🎯',
      description: 'Ora puoi iniziare a seguire i tuoi clienti. Buon lavoro!',
    }
  ],
  client: [
    {
      id: 'welcome',
      type: 'modal',
      title: 'Benvenuto nella tua Area! 👋',
      description: 'Questa è la tua app personale per seguire allenamenti, alimentazione e comunicare con il tuo coach.',
    },
    {
      id: 'dashboard',
      selector: '[data-tour="dashboard"]',
      title: 'La tua Dashboard',
      description: 'Panoramica dei tuoi progressi: streak allenamenti, prossime attività e statistiche.',
      position: 'right'
    },
    {
      id: 'workout',
      selector: '[data-tour="workout"]',
      title: 'Scheda Allenamento',
      description: 'La tua scheda allenamento personalizzata. Segui gli esercizi con video dimostrativi!',
      position: 'right'
    },
    {
      id: 'diet',
      selector: '[data-tour="diet"]',
      title: 'Piano Alimentare',
      description: 'Il tuo piano alimentare giornaliero con pasti, ricette e alternative personalizzate.',
      position: 'right'
    },
    {
      id: 'chat',
      selector: '[data-tour="chat"]',
      title: 'Chat con il Coach',
      description: 'Scrivi al tuo coach per domande, dubbi o aggiornamenti. Risposta entro 24h!',
      position: 'right'
    },
    {
      id: 'community',
      selector: '[data-tour="community"]',
      title: 'Community',
      description: 'Connettiti con gli altri clienti, leggi post motivazionali e condividi i tuoi progressi.',
      position: 'right'
    },
    {
      id: 'anamnesi',
      selector: '[data-tour="anamnesi"]',
      title: 'La tua Anamnesi',
      description: 'Compila il questionario per permettere al coach di personalizzare il tuo percorso.',
      position: 'right'
    },
    {
      id: 'checks',
      selector: '[data-tour="checks"]',
      title: 'Check Settimanali',
      description: 'Carica le tue foto e il peso ogni settimana. Il coach monitorerà i tuoi progressi!',
      position: 'right'
    },
    {
      id: 'payments',
      selector: '[data-tour="payments"]',
      title: 'Abbonamento',
      description: 'Visualizza lo stato del tuo abbonamento e lo storico dei pagamenti.',
      position: 'right'
    },
    {
      id: 'complete',
      type: 'modal',
      title: 'Inizia il tuo percorso! 💪',
      description: 'Sei pronto per raggiungere i tuoi obiettivi. Consulta la scheda allenamento e inizia subito!',
    }
  ],
  collaboratore: [
    {
      id: 'welcome',
      type: 'modal',
      title: 'Benvenuto nel Team! 🤝',
      description: 'Come collaboratore, hai accesso agli strumenti per gestire i clienti e supportare il business.',
    },
    {
      id: 'dashboard',
      selector: '[data-tour="dashboard"]',
      title: 'Dashboard Collaboratore',
      description: 'Visualizza le tue statistiche, clienti seguiti e attività recenti.',
      position: 'right'
    },
    {
      id: 'calendar',
      selector: '[data-tour="calendar"]',
      title: 'Calendario',
      description: 'Gestisci i tuoi appuntamenti e le chiamate con i clienti.',
      position: 'right'
    },
    {
      id: 'complete',
      type: 'modal',
      title: 'Pronto a iniziare! 🎯',
      description: 'Esplora la piattaforma e inizia a supportare il team. Buon lavoro!',
    }
  ]
};

// Componente Spotlight
const Spotlight = ({ target, children, position = 'bottom' }) => {
  const [rect, setRect] = useState(null);
  
  useEffect(() => {
    const updateRect = () => {
      if (target) {
        const r = target.getBoundingClientRect();
        setRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
      }
    };
    
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [target]);
  
  if (!rect) return null;
  
  // Calcola posizione tooltip
  const tooltipStyle = {
    position: 'fixed',
    zIndex: 10002,
  };
  
  const padding = 16;
  
  switch (position) {
    case 'top':
      tooltipStyle.bottom = `${window.innerHeight - rect.top + padding}px`;
      tooltipStyle.left = `${rect.left + rect.width / 2}px`;
      tooltipStyle.transform = 'translateX(-50%)';
      break;
    case 'bottom':
      tooltipStyle.top = `${rect.top + rect.height + padding}px`;
      tooltipStyle.left = `${rect.left + rect.width / 2}px`;
      tooltipStyle.transform = 'translateX(-50%)';
      break;
    case 'left':
      tooltipStyle.top = `${rect.top + rect.height / 2}px`;
      tooltipStyle.right = `${window.innerWidth - rect.left + padding}px`;
      tooltipStyle.transform = 'translateY(-50%)';
      break;
    case 'right':
    default:
      tooltipStyle.top = `${rect.top + rect.height / 2}px`;
      tooltipStyle.left = `${rect.left + rect.width + padding}px`;
      tooltipStyle.transform = 'translateY(-50%)';
      break;
  }
  
  // Assicurati che non esca dallo schermo
  if (tooltipStyle.left && parseFloat(tooltipStyle.left) > window.innerWidth - 320) {
    tooltipStyle.left = 'auto';
    tooltipStyle.right = '16px';
    tooltipStyle.transform = position === 'bottom' || position === 'top' ? 'none' : 'translateY(-50%)';
  }
  
  return createPortal(
    <>
      {/* Overlay scuro con buco */}
      <div className="fixed inset-0 z-[10000]" style={{ pointerEvents: 'none' }}>
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect 
                x={rect.left - 8} 
                y={rect.top - 8} 
                width={rect.width + 16} 
                height={rect.height + 16}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect 
            width="100%" 
            height="100%" 
            fill="rgba(0,0,0,0.75)" 
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>
      
      {/* Bordo luminoso elemento evidenziato */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed pointer-events-none z-[10001]"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          borderRadius: 12,
          border: '2px solid rgba(34, 211, 238, 0.8)',
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.4), inset 0 0 20px rgba(34, 211, 238, 0.1)',
        }}
      />
      
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={tooltipStyle}
      >
        {children}
      </motion.div>
    </>,
    document.body
  );
};

// Componente Modal
const TourModal = ({ children }) => {
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md my-auto"
      >
        {children}
      </motion.div>
    </div>,
    document.body
  );
};

// Tooltip Card
const TourTooltip = ({ step, currentIndex, totalSteps, onNext, onPrev, onSkip, onComplete, isLastStep }) => {
  return (
    <div className="w-80 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-slate-700">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[11px] font-medium text-cyan-400 uppercase tracking-wide">
            Step {currentIndex + 1} di {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
      </div>
      
      <div className="px-5 pb-5 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentIndex === 0 
              ? 'text-slate-600 cursor-not-allowed' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <ChevronLeft size={16} />
          Indietro
        </button>
        
        <button
          onClick={isLastStep ? onComplete : onNext}
          className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg text-sm transition-all shadow-lg"
        >
          {isLastStep ? (
            <>
              Fine <Check size={16} />
            </>
          ) : (
            <>
              Avanti <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function InteractiveTour({ role = 'admin', onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);
  const [isActive, setIsActive] = useState(true);
  
  const steps = TOUR_STEPS[role] || TOUR_STEPS.admin;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isModal = step?.type === 'modal';
  
  // Trova elemento target
  const findElement = useCallback((selector, fallback) => {
    if (!selector) return null;
    
    let el = document.querySelector(selector);
    if (!el && fallback) {
      // Prova con fallback
      el = document.querySelector(fallback);
    }
    
    // Se non trova, prova a cercare per testo
    if (!el) {
      const allLinks = document.querySelectorAll('a, button');
      for (const link of allLinks) {
        if (link.textContent?.toLowerCase().includes(step.title?.toLowerCase().split(' ')[0])) {
          el = link;
          break;
        }
      }
    }
    
    return el;
  }, [step?.title]);
  
  // Aggiorna target quando cambia step
  useEffect(() => {
    if (isModal) {
      setTargetElement(null);
      return;
    }
    
    const el = findElement(step?.selector, step?.fallbackSelector);
    setTargetElement(el);
    
    // Scroll elemento into view se necessario
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isModal, findElement, step?.selector, step?.fallbackSelector]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Versione del tour - deve corrispondere a TOUR_VERSION in ProLayout
  const TOUR_VERSION = 3;
  
  const handleComplete = async () => {
    setIsActive(false);
    
    // Salva completamento
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(getTenantDoc(db, 'onboarding', user.uid), {
          completedAt: new Date(),
          role,
          skipped: false,
          tourVersion: TOUR_VERSION
        });
        // Aggiorna localStorage
        localStorage.setItem(`onboarding_shown_${user.uid}_v${TOUR_VERSION}`, 'true');
      }
    } catch (error) {
      console.error('Error saving tour completion:', error);
    }
    
    onComplete?.();
  };
  
  const handleSkip = async () => {
    setIsActive(false);
    
    // Salva skip
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(getTenantDoc(db, 'onboarding', user.uid), {
          completedAt: new Date(),
          role,
          skipped: true,
          tourVersion: TOUR_VERSION
        });
        // Aggiorna localStorage
        localStorage.setItem(`onboarding_shown_${user.uid}_v${TOUR_VERSION}`, 'true');
      }
    } catch (error) {
      console.error('Error saving tour skip:', error);
    }
    
    onSkip?.();
  };
  
  if (!isActive || !step) return null;
  
  // Modal steps (welcome e complete)
  if (isModal) {
    return (
      <AnimatePresence>
        <TourModal>
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6 text-center">
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30"
              >
                <Sparkles size={28} className="text-white" />
              </motion.div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{step.title}</h2>
              <p className="text-sm sm:text-base text-slate-400 mb-5">{step.description}</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                {!isLastStep ? (
                  <>
                    <button
                      onClick={handleSkip}
                      className="order-2 sm:order-1 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      Salta tour
                    </button>
                    <button
                      onClick={handleNext}
                      className="order-1 sm:order-2 w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      Iniziamo <ChevronRight size={18} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    Inizia <Check size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </TourModal>
      </AnimatePresence>
    );
  }
  
  // Spotlight steps
  if (!targetElement) {
    // Se non trova l'elemento, salta allo step successivo
    return (
      <TourModal>
        <TourTooltip
          step={step}
          currentIndex={currentStep}
          totalSteps={steps.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onComplete={handleComplete}
          isLastStep={isLastStep}
        />
      </TourModal>
    );
  }
  
  return (
    <AnimatePresence>
      <Spotlight target={targetElement} position={step.position}>
        <TourTooltip
          step={step}
          currentIndex={currentStep}
          totalSteps={steps.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onComplete={handleComplete}
          isLastStep={isLastStep}
        />
      </Spotlight>
    </AnimatePresence>
  );
}
