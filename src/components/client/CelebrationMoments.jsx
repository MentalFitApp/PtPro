import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Target, Flame, Award, Star, Zap, PartyPopper } from 'lucide-react';

/**
 * Celebration Moments - Sistema per celebrare achievement e milestone
 */
export default function CelebrationMoments() {
  const [celebration, setCelebration] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listener per eventi di celebrazione custom
    const handleCelebration = (event) => {
      showCelebration(event.detail);
    };

    window.addEventListener('celebration', handleCelebration);
    return () => window.removeEventListener('celebration', handleCelebration);
  }, []);

  const showCelebration = (details) => {
    setCelebration(details);
    setIsVisible(true);

    // Trigger confetti animation
    triggerConfetti(details.type);

    // Auto-hide dopo 5 secondi
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCelebration(null), 300);
    }, 5000);
  };

  const triggerConfetti = (type) => {
    const config = getConfettiConfig(type);
    
    // Multiple bursts per effetto migliore
    const duration = type === 'milestone' ? 3000 : 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        ...config,
        origin: { x: Math.random() * 0.4 + 0.3, y: Math.random() * 0.2 + 0.4 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const getConfettiConfig = (type) => {
    const configs = {
      workout: {
        particleCount: 50,
        spread: 70,
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      },
      streak: {
        particleCount: 100,
        spread: 120,
        colors: ['#f97316', '#ef4444', '#fbbf24'],
        shapes: ['circle', 'square'],
      },
      milestone: {
        particleCount: 150,
        spread: 160,
        colors: ['#fbbf24', '#f59e0b', '#d97706'],
        shapes: ['star'],
      },
      weight: {
        particleCount: 60,
        spread: 80,
        colors: ['#06b6d4', '#0ea5e9', '#3b82f6'],
      },
      achievement: {
        particleCount: 80,
        spread: 100,
        colors: ['#8b5cf6', '#a855f7', '#d946ef'],
      },
    };

    return configs[type] || configs.achievement;
  };

  const getIcon = (type) => {
    const icons = {
      workout: Target,
      streak: Flame,
      milestone: Trophy,
      weight: Award,
      achievement: Star,
      level_up: Zap,
    };

    const Icon = icons[type] || PartyPopper;
    return <Icon size={48} />;
  };

  const getGradient = (type) => {
    const gradients = {
      workout: 'from-emerald-500 to-blue-500',
      streak: 'from-orange-500 to-rose-500',
      milestone: 'from-yellow-500 to-orange-500',
      weight: 'from-cyan-500 to-blue-500',
      achievement: 'from-purple-500 to-pink-500',
      level_up: 'from-indigo-500 to-purple-500',
    };

    return gradients[type] || gradients.achievement;
  };

  if (!celebration) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => setCelebration(null), 300);
        }}
      />

      {/* Celebration Card */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none transition-all duration-500 ${
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-75'
        }`}
      >
        <div 
          className={`bg-gradient-to-br ${getGradient(celebration.type)} p-1 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto transform ${
            isVisible ? 'animate-bounce-in' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-slate-900 rounded-xl p-8 text-center space-y-4">
            {/* Icon with pulse animation */}
            <div className="relative inline-block">
              <div className="absolute inset-0 animate-ping opacity-75">
                <div className={`text-6xl bg-gradient-to-r ${getGradient(celebration.type)} bg-clip-text text-transparent`}>
                  {celebration.emoji || '🎉'}
                </div>
              </div>
              <div className="relative text-6xl">
                {celebration.emoji || '🎉'}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-slate-100">
              {celebration.title}
            </h2>

            {/* Message */}
            <p className="text-slate-300 text-lg">
              {celebration.message}
            </p>

            {/* Additional info */}
            {celebration.details && (
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                {Object.entries(celebration.details).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 capitalize">{key}:</span>
                    <span className="text-slate-100 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Share button (optional) */}
            {celebration.shareable && (
              <button
                onClick={() => {
                  // Implementa share logic (Web Share API o custom)
                  if (navigator.share) {
                    navigator.share({
                      title: celebration.title,
                      text: celebration.message,
                    });
                  }
                }}
                className={`w-full py-3 bg-gradient-to-r ${getGradient(celebration.type)} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity`}
              >
                Condividi il Traguardo 🎉
              </button>
            )}

            {/* Close hint */}
            <p className="text-xs text-slate-500 pt-2">
              Tocca ovunque per continuare
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </>
  );
}

/**
 * Helper function per triggerare celebration da qualsiasi parte dell'app
 */
export const celebrate = (details) => {
  const event = new CustomEvent('celebration', { detail: details });
  window.dispatchEvent(event);
};

/**
 * Celebration templates predefiniti
 */
export const celebrationTemplates = {
  workoutCompleted: {
    type: 'workout',
    title: 'Allenamento Completato! 💪',
    message: 'Ottimo lavoro! Hai completato la sessione di oggi!',
    emoji: '🎯',
    shareable: true,
  },
  
  streak7Days: {
    type: 'streak',
    title: '7 Giorni di Fila! 🔥',
    message: 'Una settimana perfetta! Non rompere la catena!',
    emoji: '🔥',
    shareable: true,
  },
  
  streak30Days: {
    type: 'milestone',
    title: '30 Giorni Consecutivi! 🏆',
    message: 'Guerriero della Costanza! Un mese di impegno totale!',
    emoji: '👑',
    shareable: true,
  },
  
  weightGoalReached: {
    type: 'milestone',
    title: 'Obiettivo Raggiunto! 🎉',
    message: 'Hai raggiunto il tuo peso target! Fantastico!',
    emoji: '🏆',
    shareable: true,
  },
  
  firstWorkout: {
    type: 'achievement',
    title: 'Benvenuto! 🎊',
    message: 'Hai completato il tuo primo allenamento! È solo l\'inizio!',
    emoji: '🌟',
  },
  
  levelUp: {
    type: 'level_up',
    title: 'Level Up! ⚡',
    message: 'Hai raggiunto un nuovo livello di fitness!',
    emoji: '⚡',
    shareable: true,
  },
};
