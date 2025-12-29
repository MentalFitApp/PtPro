import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, X, Timer, 
  ChevronDown, ChevronUp, CheckCircle2, Dumbbell,
  Info, RotateCcw, Volume2, VolumeX, Trophy
} from 'lucide-react';

/**
 * 🏋️ WorkoutPlayer - Modalità allenamento interattiva
 * 
 * Features:
 * - Visualizzazione esercizio con GIF centrale
 * - Timer recupero automatico
 * - Navigazione tra esercizi e serie
 * - Note espandibili
 * - Feedback audio/vibrazione
 * - Progress tracking
 */

const WorkoutPlayer = ({ exercises, onClose, onComplete, dayName }) => {
  // State principale
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [completedSets, setCompletedSets] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  
  // Refs
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  
  // Filtra solo gli esercizi (no markers)
  const actualExercises = exercises.filter(ex => !ex.isMarker);
  const currentExercise = actualExercises[currentExerciseIndex];
  
  // Calcola progresso
  const totalExercises = actualExercises.length;
  const progressPercent = ((currentExerciseIndex + 1) / totalExercises) * 100;
  
  // Parse serie come numero
  const totalSets = parseInt(currentExercise?.serie) || 3;
  
  // Parse recupero in secondi
  const getRestTime = () => {
    const recupero = currentExercise?.recupero;
    if (!recupero) return 60;
    // Gestisce formati come "60", "60s", "60-90"
    const parsed = parseInt(String(recupero).replace(/[^\d]/g, ''));
    return parsed || 60;
  };
  
  // Timer recupero
  useEffect(() => {
    if (isResting && !isPaused && restTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleRestComplete();
            return 0;
          }
          // Beep ultimi 3 secondi
          if (prev <= 4 && soundEnabled) {
            playBeep(prev === 1 ? 'high' : 'low');
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isResting, isPaused, restTimeLeft]);
  
  // Vibrazione e suono
  const playBeep = (type = 'low') => {
    // Vibrazione se supportata
    if (navigator.vibrate) {
      navigator.vibrate(type === 'high' ? [200, 100, 200] : 100);
    }
    
    // Audio beep
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };
  
  // Gestione completamento recupero
  const handleRestComplete = useCallback(() => {
    setIsResting(false);
    setRestTimeLeft(0);
    if (soundEnabled) {
      playBeep('high');
    }
  }, [soundEnabled]);
  
  // Completa serie corrente
  const completeSet = () => {
    const key = `${currentExerciseIndex}-${currentSet}`;
    setCompletedSets(prev => ({ ...prev, [key]: true }));
    
    if (currentSet < totalSets) {
      // Inizia recupero
      setIsResting(true);
      setRestTimeLeft(getRestTime());
      setCurrentSet(prev => prev + 1);
    } else {
      // Esercizio completato, vai al prossimo
      nextExercise();
    }
  };
  
  // Vai al prossimo esercizio
  const nextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setIsResting(false);
      setRestTimeLeft(0);
      setShowNotes(false);
    } else {
      // Allenamento completato!
      setWorkoutComplete(true);
      if (onComplete) onComplete();
    }
  };
  
  // Vai all'esercizio precedente
  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSet(1);
      setIsResting(false);
      setRestTimeLeft(0);
      setShowNotes(false);
    }
  };
  
  // Skip recupero
  const skipRest = () => {
    setIsResting(false);
    setRestTimeLeft(0);
  };
  
  // Reset esercizio
  const resetExercise = () => {
    setCurrentSet(1);
    setIsResting(false);
    setRestTimeLeft(0);
    // Rimuovi completamenti per questo esercizio
    setCompletedSets(prev => {
      const newState = { ...prev };
      for (let i = 1; i <= totalSets; i++) {
        delete newState[`${currentExerciseIndex}-${i}`];
      }
      return newState;
    });
  };
  
  // Formatta tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Schermata completamento
  if (workoutComplete) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Trophy size={48} className="text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            Allenamento Completato! 🎉
          </h2>
          <p className="text-green-400 text-lg mb-6">
            {dayName} - {totalExercises} esercizi
          </p>
          
          <button
            onClick={onClose}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            Chiudi
          </button>
        </motion.div>
      </motion.div>
    );
  }
  
  if (!currentExercise) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900 flex flex-col"
    >
      {/* Audio element per beep */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQM1t+DcuHENRO/e7caWBCnc7fjhpQIU6f3/+KoFAPb//v+qAwH0/v/6qQIB8f7/+6oDAev+//yoAgPn/v7+pgIF4f7+/6UDBNz+/v+kAwTZ/v7+owIE1f3+/6MCBNL9/v6iAgTQ/f7/ogMEzf7+/qIDBMv+/v+iAwTJ/v7+oQMEyP7+/6IDBMX+/v6hAwTE/v//oQMEw/7+/6EDBML+/v6hAwTB/v7/oQMEwP7+/qEDBL/+/v+hAwS+/v7+oQMEvf7+/6EDBL3+/v+gAwS8/v7+oAMEvP7+/6ADBL3+/v+gAwS9/v7/oAMEvf7+/6ADBLz+/v6gAwS8/v7/oAMEvP7+/6ADBL3+/v+gAwS9/v7/oAMEvf7+/6ADBL3+/v6gAwS9/v7/oAMEvf7+/6ADBL3+/v6gAwS9/v7/oAMEvf7+/6ADBL7+/v+gAwS+/v7+oAMEvv7+/6ADBMD+/v+gAwTA/v7+oQMEwP7+/6EDBMH+/v6hAwTC/v7/oQMExP7+/qEDBMb+/v+iAwTH/v7+ogMEyf7+/6IDBMz+/v6jAwTO/v7/owME0P7+/qQDBNL+/v+kAgTV/v7/pAIF2P7+/6UDBdv+/v6mAwXf/v7/pwIF4/7+/6gCBej+/v+pAgXs/v7/qgIG8f7+/6sDBfX+/v+sAgb5/v7/rQIG/f7+/60CCf/+/v+uAg==" type="audio/wav"/>
      </audio>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={24} className="text-slate-400" />
        </button>
        
        <div className="text-center">
          <div className="text-slate-400 text-xs">{dayName}</div>
          <div className="text-white font-medium">
            {currentExerciseIndex + 1} / {totalExercises}
          </div>
        </div>
        
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {soundEnabled ? (
            <Volume2 size={24} className="text-blue-400" />
          ) : (
            <VolumeX size={24} className="text-slate-500" />
          )}
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isResting ? (
            /* REST SCREEN */
            <motion.div
              key="rest"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center min-h-full p-6 bg-gradient-to-b from-blue-900/20 to-slate-900"
            >
              <div className="text-blue-400 text-sm font-medium mb-2">RECUPERO</div>
              
              {/* Timer circolare */}
              <div className="relative w-48 h-48 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    className="text-blue-500"
                    strokeDasharray={553}
                    strokeDashoffset={553 - (553 * restTimeLeft) / getRestTime()}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-white">{formatTime(restTimeLeft)}</span>
                  <span className="text-slate-400 text-sm">rimanenti</span>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-slate-400 text-sm mb-1">Prossima serie</div>
                <div className="text-white text-xl font-semibold">
                  Serie {currentSet} di {totalSets}
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
                >
                  {isPaused ? (
                    <Play size={28} className="text-white" />
                  ) : (
                    <Pause size={28} className="text-white" />
                  )}
                </button>
                
                <button
                  onClick={skipRest}
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
                >
                  Salta recupero
                </button>
              </div>
            </motion.div>
          ) : (
            /* EXERCISE SCREEN */
            <motion.div
              key={`exercise-${currentExerciseIndex}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-4"
            >
              {/* Exercise Name */}
              <div className="text-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {currentExercise.nome || currentExercise.nameIt || currentExercise.name}
                </h2>
                <div className="flex justify-center gap-2">
                  <span className="px-3 py-1 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded-lg text-sm">
                    {currentExercise.attrezzo || currentExercise.equipmentIt || currentExercise.equipment}
                  </span>
                  <span className="px-3 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded-lg text-sm">
                    {currentExercise.gruppoMuscolare || currentExercise.bodyPartIt || currentExercise.bodyPart}
                  </span>
                </div>
              </div>
              
              {/* GIF Animation - Central */}
              <div className="relative mb-6">
                {currentExercise.gifUrl ? (
                  <div className="aspect-square max-w-sm mx-auto bg-slate-800 rounded-2xl overflow-hidden">
                    <img
                      src={currentExercise.gifUrl}
                      alt={currentExercise.nome}
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </div>
                ) : (
                  <div className="aspect-square max-w-sm mx-auto bg-slate-800 rounded-2xl flex items-center justify-center">
                    <Dumbbell size={64} className="text-slate-600" />
                  </div>
                )}
                
                {/* Info button overlay */}
                <button
                  onClick={() => setShowExerciseInfo(true)}
                  className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <Info size={20} className="text-white" />
                </button>
              </div>
              
              {/* Serie, Reps, Recovery */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-600/30 rounded-xl p-4 text-center">
                  <div className="text-blue-400 text-xs font-medium mb-1">SERIE</div>
                  <div className="text-white text-2xl font-bold">
                    {currentSet}/{totalSets}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 border border-purple-600/30 rounded-xl p-4 text-center">
                  <div className="text-purple-400 text-xs font-medium mb-1">RIPETIZIONI</div>
                  <div className="text-white text-2xl font-bold">
                    {currentExercise.ripetizioni || '-'}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-600/30 rounded-xl p-4 text-center">
                  <div className="text-green-400 text-xs font-medium mb-1">RECUPERO</div>
                  <div className="text-white text-2xl font-bold flex items-center justify-center gap-1">
                    <Timer size={18} className="text-green-400" />
                    {currentExercise.recupero || '60'}s
                  </div>
                </div>
              </div>
              
              {/* Sets Progress */}
              <div className="flex justify-center gap-2 mb-6">
                {Array.from({ length: totalSets }, (_, i) => {
                  const setNum = i + 1;
                  const isCompleted = completedSets[`${currentExerciseIndex}-${setNum}`];
                  const isCurrent = setNum === currentSet;
                  
                  return (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={20} /> : setNum}
                    </div>
                  );
                })}
              </div>
              
              {/* Notes - Expandable */}
              {currentExercise.noteEsercizio && (
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm font-medium">
                      📝 Note dell'allenatore
                    </span>
                    {showNotes ? (
                      <ChevronUp size={20} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400" />
                    )}
                  </div>
                  <AnimatePresence>
                    {showNotes && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-white mt-2 text-sm leading-relaxed">
                          {currentExercise.noteEsercizio}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Bottom Actions */}
      {!isResting && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            {/* Previous */}
            <button
              onClick={prevExercise}
              disabled={currentExerciseIndex === 0}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <SkipBack size={24} className="text-white" />
            </button>
            
            {/* Complete Set */}
            <button
              onClick={completeSet}
              className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-lg"
            >
              <CheckCircle2 size={24} />
              Completata Serie {currentSet}
            </button>
            
            {/* Next */}
            <button
              onClick={nextExercise}
              disabled={currentExerciseIndex === totalExercises - 1}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <SkipForward size={24} className="text-white" />
            </button>
          </div>
          
          {/* Reset exercise */}
          <button
            onClick={resetExercise}
            className="w-full mt-3 py-2 text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={16} />
            Ricomincia esercizio
          </button>
        </div>
      )}
      
      {/* Exercise Info Modal */}
      <AnimatePresence>
        {showExerciseInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/80 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowExerciseInfo(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-slate-800 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Dettagli Esercizio
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm">Nome</label>
                  <p className="text-white">{currentExercise.nome || currentExercise.nameIt || currentExercise.name}</p>
                </div>
                
                <div>
                  <label className="text-slate-400 text-sm">Muscolo Target</label>
                  <p className="text-white">{currentExercise.gruppoMuscolare || currentExercise.bodyPartIt || currentExercise.bodyPart}</p>
                </div>
                
                <div>
                  <label className="text-slate-400 text-sm">Attrezzatura</label>
                  <p className="text-white">{currentExercise.attrezzo || currentExercise.equipmentIt || currentExercise.equipment}</p>
                </div>
                
                {currentExercise.secondaryMusclesIt?.length > 0 && (
                  <div>
                    <label className="text-slate-400 text-sm">Muscoli Secondari</label>
                    <p className="text-white">{currentExercise.secondaryMusclesIt?.join(', ')}</p>
                  </div>
                )}
                
                {currentExercise.instructionsIt?.length > 0 && (
                  <div>
                    <label className="text-slate-400 text-sm">Istruzioni</label>
                    <ul className="text-white text-sm space-y-2 mt-2">
                      {currentExercise.instructionsIt.map((inst, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-blue-400 font-semibold">{i + 1}.</span>
                          {inst}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowExerciseInfo(false)}
                className="w-full mt-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                Chiudi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WorkoutPlayer;
