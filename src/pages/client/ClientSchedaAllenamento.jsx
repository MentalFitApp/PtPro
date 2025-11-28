import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Download } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase';
import { getTenantDoc, getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { exportWorkoutCardToPDF } from '../../utils/pdfExport';

const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const ClientSchedaAllenamento = () => {
  const [loading, setLoading] = useState(true);
  const [schedaData, setSchedaData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Lunedì');
  const [clientName, setClientName] = useState('');

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
            {GIORNI_SETTIMANA.map(giorno => (
              <button
                key={giorno}
                onClick={() => setSelectedDay(giorno)}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                  selectedDay === giorno
                    ? 'bg-blue-600 text-white preserve-white shadow-lg'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {giorno.slice(0, 3)}
                <span className="hidden sm:inline">{giorno.slice(3)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Exercises */}
        {schedaData.giorni[selectedDay]?.esercizi?.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
            Nessun esercizio programmato per questo giorno
          </div>
        ) : (
          schedaData.giorni[selectedDay]?.esercizi?.map((item, index) => {
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

            // Exercise item
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 sm:p-4"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-2">{item.nome}</h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded">
                        {item.attrezzo}
                      </span>
                      <span className="px-2 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded">
                        {item.gruppoMuscolare}
                      </span>
                    </div>
                  </div>
                  {item.videoUrl && (
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white preserve-white rounded-lg text-xs sm:text-sm transition-colors flex-shrink-0"
                    >
                      <Play size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Video</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
                    <div className="text-slate-500 text-[10px] sm:text-xs mb-1">Serie</div>
                    <div className="text-slate-200 font-semibold text-sm sm:text-base">{item.serie || '-'}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
                    <div className="text-slate-500 text-[10px] sm:text-xs mb-1">Ripetizioni</div>
                    <div className="text-slate-200 font-semibold text-sm sm:text-base">{item.ripetizioni || '-'}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
                    <div className="text-slate-500 text-[10px] sm:text-xs mb-1">Recupero</div>
                    <div className="text-slate-200 font-semibold text-sm sm:text-base">{item.recupero ? `${item.recupero}s` : '-'}</div>
                  </div>
                </div>

                {item.noteEsercizio && (
                  <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
                    <div className="text-slate-500 text-xs mb-1">Note</div>
                    <div className="text-slate-300 text-xs sm:text-sm">{item.noteEsercizio}</div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ClientSchedaAllenamento;
