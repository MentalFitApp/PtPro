import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Download, Dumbbell, Calendar, ChevronRight, Info } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase';
import { getTenantDoc, getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { exportWorkoutCardToPDF } from '../../utils/pdfExport';
import WorkoutPlayer from '../../components/client/WorkoutPlayer';

const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// Determina il giorno corrente
const getCurrentDayName = () => {
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return days[new Date().getDay()];
};

const ClientSchedaAllenamento = () => {
  const [loading, setLoading] = useState(true);
  const [schedaData, setSchedaData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(getCurrentDayName());
  const [clientName, setClientName] = useState('');
  const [showWorkoutPlayer, setShowWorkoutPlayer] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);

  useEffect(() => {
    loadScheda();
  }, []);

  const loadScheda = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load client info
      const clientRef = getTenantDoc(db, 'clients', user.uid);
      const clientSnap = await getDoc(clientRef);
      if (clientSnap.exists()) {
        setClientName(clientSnap.data().name || 'N/D');
      }

      // Load scheda
      const schedaRef = getTenantDoc(db, 'schede_allenamento', user.uid);
      const schedaSnap = await getDoc(schedaRef);
      
      if (schedaSnap.exists()) {
        setSchedaData(schedaSnap.data());
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!schedaData) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-slate-100 mb-2">Scheda Allenamento</h2>
            <p className="text-slate-400">Al momento non hai una scheda allenamento attiva.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 px-3 sm:px-4 pt-4 sm:pt-8 pb-4 relative">
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 sm:p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-100">
              Piano Allenamento
            </h1>
            <button
              onClick={() => exportWorkoutCardToPDF(schedaData, clientName)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white preserve-white text-xs sm:text-sm rounded-lg transition-colors"
            >
              <Download size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {schedaData.obiettivo && (
              <span className="px-3 py-1 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded-lg">
                {schedaData.obiettivo}
              </span>
            )}
            {schedaData.livello && (
              <span className="px-3 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded-lg">
                {schedaData.livello}
              </span>
            )}
          </div>
          {schedaData.note && (
            <p className="text-slate-400 text-sm mt-2">{schedaData.note}</p>
          )}
        </motion.div>

        {/* Day Selector */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2 sm:p-3">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1">
            {GIORNI_SETTIMANA.map(giorno => {
              const hasExercises = schedaData.giorni[giorno]?.esercizi?.filter(e => !e.isMarker)?.length > 0;
              const isToday = giorno === getCurrentDayName();
              
              return (
                <button
                  key={giorno}
                  onClick={() => setSelectedDay(giorno)}
                  className={`relative px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                    selectedDay === giorno
                      ? 'bg-blue-600 text-white preserve-white shadow-lg'
                      : hasExercises
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {giorno.slice(0, 3)}
                  <span className="hidden sm:inline">{giorno.slice(3)}</span>
                  {isToday && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Workout Button */}
        {schedaData.giorni[selectedDay]?.esercizi?.filter(e => !e.isMarker)?.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowWorkoutPlayer(true)}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl p-4 flex items-center justify-center gap-3 font-semibold text-lg transition-all shadow-lg shadow-green-500/20"
          >
            <Play size={24} fill="currentColor" />
            Inizia Allenamento di {selectedDay}
          </motion.button>
        )}

        {/* Exercises Preview */}
        {schedaData.giorni[selectedDay]?.esercizi?.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <Calendar size={48} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">Giorno di riposo 😴</p>
            <p className="text-slate-500 text-sm mt-1">Nessun esercizio programmato</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-400 text-sm font-medium">
                {schedaData.giorni[selectedDay]?.esercizi?.filter(e => !e.isMarker)?.length} esercizi
              </h3>
            </div>
            
            {schedaData.giorni[selectedDay]?.esercizi?.map((item, index) => {
              // Superset/Circuit markers
              if (item.isMarker) {
                const isCircuit = item.type.includes('circuit');
                const isStart = item.type.includes('start');
                const colorClass = isCircuit ? 'bg-cyan-500' : 'bg-purple-500';
                const bgClass = isCircuit ? 'bg-cyan-900/30 text-cyan-300 border-cyan-600/50' : 'bg-purple-900/30 text-purple-300 border-purple-600/50';
                const label = isCircuit 
                  ? (isStart ? '▼ INIZIO CIRCUITO' : '▲ FINE CIRCUITO')
                  : (isStart ? '▼ INIZIO SUPERSERIE' : '▲ FINE SUPERSERIE');
                
                return (
                  <div key={index} className="flex items-center gap-4 my-2">
                    <div className={`flex-1 h-px ${colorClass}`}></div>
                    <div className={`px-4 py-2 rounded-lg font-semibold border ${bgClass} text-sm`}>
                      {label}
                    </div>
                    <div className={`flex-1 h-px ${colorClass}`}></div>
                  </div>
                );
              }

              const isExpanded = expandedExercise === index;

              // Exercise item - Compact Card with GIF
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
                >
                  {/* Main Row */}
                  <div 
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800/70 transition-colors"
                    onClick={() => setExpandedExercise(isExpanded ? null : index)}
                  >
                    {/* GIF Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                      {item.gifUrl ? (
                        <img
                          src={item.gifUrl}
                          alt={item.nome}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Dumbbell size={24} className="text-slate-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                        {item.nome || item.nameIt || item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="px-2 py-0.5 bg-slate-700 rounded">
                          {item.gruppoMuscolare || item.bodyPartIt}
                        </span>
                      </div>
                      {/* Quick Stats */}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-blue-400">{item.serie} serie</span>
                        <span className="text-purple-400">{item.ripetizioni} reps</span>
                        <span className="text-green-400">{item.recupero}s rec</span>
                      </div>
                    </div>
                    
                    {/* Expand Arrow */}
                    <ChevronRight 
                      size={20} 
                      className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                  
                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-700"
                      >
                        <div className="p-4 space-y-4">
                          {/* Large GIF */}
                          {item.gifUrl && (
                            <div className="aspect-square max-w-xs mx-auto bg-slate-800 rounded-xl overflow-hidden">
                              <img
                                src={item.gifUrl}
                                alt={item.nome}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          
                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-600/30 rounded-lg p-3 text-center">
                              <div className="text-blue-400 text-xs mb-1">Serie</div>
                              <div className="text-white text-xl font-bold">{item.serie || '-'}</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 border border-purple-600/30 rounded-lg p-3 text-center">
                              <div className="text-purple-400 text-xs mb-1">Ripetizioni</div>
                              <div className="text-white text-xl font-bold">{item.ripetizioni || '-'}</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-600/30 rounded-lg p-3 text-center">
                              <div className="text-green-400 text-xs mb-1">Recupero</div>
                              <div className="text-white text-xl font-bold">{item.recupero ? `${item.recupero}s` : '-'}</div>
                            </div>
                          </div>
                          
                          {/* Equipment */}
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 text-slate-300 rounded-lg text-sm">
                              🏋️ {item.attrezzo || item.equipmentIt || item.equipment}
                            </span>
                            <span className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 text-slate-300 rounded-lg text-sm">
                              💪 {item.gruppoMuscolare || item.bodyPartIt || item.bodyPart}
                            </span>
                          </div>
                          
                          {/* Notes */}
                          {item.noteEsercizio && (
                            <div className="bg-slate-800 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                                <Info size={14} />
                                Note dell'allenatore
                              </div>
                              <p className="text-slate-200 text-sm">{item.noteEsercizio}</p>
                            </div>
                          )}
                          
                          {/* Video Link */}
                          {item.videoUrl && (
                            <a
                              href={item.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                              <Play size={18} />
                              Guarda Video Tutorial
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Workout Player Modal */}
      <AnimatePresence>
        {showWorkoutPlayer && schedaData.giorni[selectedDay]?.esercizi && (
          <WorkoutPlayer
            exercises={schedaData.giorni[selectedDay].esercizi}
            dayName={selectedDay}
            onClose={() => setShowWorkoutPlayer(false)}
            onComplete={() => {
              console.log('Allenamento completato!');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientSchedaAllenamento;
