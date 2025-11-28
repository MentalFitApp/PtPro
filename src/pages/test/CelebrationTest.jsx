import React from 'react';
import { celebrate, celebrationTemplates } from '../components/client/CelebrationMoments';
import { Target, Flame, Trophy, Award, Star, Zap } from 'lucide-react';

/**
 * Pagina demo per testare le celebrazioni
 * RIMUOVI IN PRODUZIONE - Solo per sviluppo
 */
export default function CelebrationTest() {
  const celebrations = [
    {
      ...celebrationTemplates.workoutCompleted,
      details: {
        Durata: '45 minuti',
        Calorie: '320 kcal',
        Esercizi: '12',
      }
    },
    {
      ...celebrationTemplates.streak7Days,
    },
    {
      ...celebrationTemplates.streak30Days,
    },
    {
      ...celebrationTemplates.weightGoalReached,
      details: {
        'Peso iniziale': '85 kg',
        'Peso attuale': '75 kg',
        'Persi': '-10 kg',
      }
    },
    {
      ...celebrationTemplates.firstWorkout,
    },
    {
      ...celebrationTemplates.levelUp,
      details: {
        'Livello precedente': 'Principiante',
        'Nuovo livello': 'Intermedio',
      }
    },
    {
      type: 'achievement',
      title: 'Badge Sbloccato! 🏅',
      message: 'Hai guadagnato il badge "Early Bird" per 5 allenamenti mattutini!',
      emoji: '🌅',
      shareable: true,
    },
    {
      type: 'milestone',
      title: '100 Allenamenti Completati! 💯',
      message: 'Incredibile! Hai raggiunto la milestone di 100 allenamenti totali!',
      emoji: '💯',
      details: {
        'Data inizio': '15 Gen 2024',
        'Giorni trascorsi': '182',
        'Media settimanale': '3.8',
      },
      shareable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            🎉 Celebration System Demo
          </h1>
          <p className="text-slate-400 mb-6">
            Clicca sui pulsanti per testare le diverse animazioni di celebrazione
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {celebrations.map((celebration, index) => (
              <button
                key={index}
                onClick={() => celebrate(celebration)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-6 rounded-xl text-left transition-all hover:scale-105 shadow-lg preserve-white"
              >
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{celebration.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{celebration.title}</h3>
                    <p className="text-sm text-white/80 mb-2">{celebration.message}</p>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className="px-2 py-1 bg-white/20 rounded">
                        {celebration.type}
                      </span>
                      {celebration.shareable && (
                        <span className="px-2 py-1 bg-white/20 rounded">
                          shareable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Quick Test Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => celebrate({
                type: 'workout',
                title: 'Allenamento Fatto! 💪',
                message: 'Ottimo lavoro oggi!',
                emoji: '🎯',
              })}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-lg transition-colors preserve-white"
            >
              <Target className="mx-auto mb-2" size={24} />
              <span className="text-sm font-medium">Workout</span>
            </button>

            <button
              onClick={() => celebrate({
                type: 'streak',
                title: 'Streak! 🔥',
                message: 'Mantieni la catena!',
                emoji: '🔥',
              })}
                className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-colors preserve-white"
            >
              <Flame className="mx-auto mb-2" size={24} />
              <span className="text-sm font-medium">Streak</span>
            </button>

            <button
              onClick={() => celebrate({
                type: 'milestone',
                title: 'Milestone! 🏆',
                message: 'Traguardo raggiunto!',
                emoji: '🏆',
              })}
                className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg transition-colors preserve-white"
            >
              <Trophy className="mx-auto mb-2" size={24} />
              <span className="text-sm font-medium">Milestone</span>
            </button>

            <button
              onClick={() => celebrate({
                type: 'achievement',
                title: 'Achievement! ⭐',
                message: 'Badge sbloccato!',
                emoji: '⭐',
              })}
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors preserve-white"
            >
              <Star className="mx-auto mb-2" size={24} />
              <span className="text-sm font-medium">Achievement</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-3">📝 Come Usare</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>• <strong>celebrate(details)</strong> - Trigger celebration da qualsiasi componente</p>
            <p>• <strong>celebrationTemplates</strong> - Template predefiniti pronti all'uso</p>
            <p>• Confetti automatici basati sul tipo di celebration</p>
            <p>• Auto-hide dopo 5 secondi (click per chiudere subito)</p>
            <p>• Supporta dettagli aggiuntivi e pulsante share</p>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-3">💻 Esempio Codice</h3>
          <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-slate-300">
{`import { celebrate } from '../components/client/CelebrationMoments';

// Trigger celebration
celebrate({
  type: 'workout',
  title: 'Allenamento Completato! 💪',
  message: 'Ottimo lavoro oggi!',
  emoji: '🎯',
  shareable: true,
  details: {
    'Durata': '45 minuti',
    'Calorie': '320 kcal',
  }
});

// Oppure usa un template
import { celebrationTemplates } from '../components/client/CelebrationMoments';
celebrate(celebrationTemplates.streak7Days);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
