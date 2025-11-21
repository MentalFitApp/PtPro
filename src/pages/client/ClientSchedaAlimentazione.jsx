import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase';
import { exportNutritionCardToPDF } from '../../utils/pdfExport';

const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const ClientSchedaAlimentazione = () => {
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
      const clientRef = doc(db, 'clients', user.uid);
      const clientSnap = await getDoc(clientRef);
      if (clientSnap.exists()) {
        setClientName(clientSnap.data().name || 'N/D');
      }

      // Load scheda
      const schedaRef = doc(db, 'schede_alimentazione', user.uid);
      const schedaSnap = await getDoc(schedaRef);
      
      if (schedaSnap.exists()) {
        setSchedaData(schedaSnap.data());
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
    }
    setLoading(false);
  };

  const calculatePastoTotals = (pasto) => {
    let totals = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
    
    pasto.alimenti?.forEach(alimento => {
      const factor = alimento.quantita / 100;
      totals.kcal += (alimento.kcal || 0) * factor;
      totals.proteine += (alimento.proteine || 0) * factor;
      totals.carboidrati += (alimento.carboidrati || 0) * factor;
      totals.grassi += (alimento.grassi || 0) * factor;
    });

    return totals;
  };

  const calculateDayTotals = () => {
    if (!schedaData || !schedaData.giorni || !schedaData.giorni[selectedDay]) {
      return { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0, quantita: 0 };
    }

    const pasti = schedaData.giorni[selectedDay].pasti || [];
    let totals = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0, quantita: 0 };
    
    pasti.forEach(pasto => {
      pasto.alimenti?.forEach(alimento => {
        const factor = alimento.quantita / 100;
        totals.kcal += (alimento.kcal || 0) * factor;
        totals.proteine += (alimento.proteine || 0) * factor;
        totals.carboidrati += (alimento.carboidrati || 0) * factor;
        totals.grassi += (alimento.grassi || 0) * factor;
        totals.quantita += alimento.quantita || 0;
      });
    });

    return totals;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!schedaData) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-slate-100 mb-2">Scheda Alimentazione</h2>
            <p className="text-slate-400">Al momento non hai una scheda alimentazione attiva.</p>
          </div>
        </div>
      </div>
    );
  }

  const dayTotals = calculateDayTotals();

  return (
    <div className="min-h-screen bg-slate-900 px-4 pt-8 pb-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-100">
              Piano Alimentazione
            </h1>
            <button
              onClick={() => exportNutritionCardToPDF(schedaData, clientName)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
          {schedaData.obiettivo && (
            <p className="text-emerald-400 text-sm md:text-base">
              Obiettivo: {schedaData.obiettivo}
            </p>
          )}
          {schedaData.note && (
            <p className="text-slate-400 text-sm mt-1">{schedaData.note}</p>
          )}
        </motion.div>

        {/* Day Selector */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {GIORNI_SETTIMANA.map(giorno => (
              <button
                key={giorno}
                onClick={() => setSelectedDay(giorno)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                  selectedDay === giorno
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {giorno}
              </button>
            ))}
          </div>
        </div>

        {/* Meals */}
        {schedaData.giorni[selectedDay]?.pasti?.map((pasto, index) => {
          if (!pasto.alimenti || pasto.alimenti.length === 0) return null;
          
          const pastoTotals = calculatePastoTotals(pasto);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
            >
              <h3 className="text-lg font-semibold text-slate-100 mb-3">{pasto.nome}</h3>
              
              <div className="space-y-2 mb-3">
                {pasto.alimenti.map((alimento, aIndex) => {
                  const factor = alimento.quantita / 100;
                  return (
                    <div key={aIndex} className="bg-slate-800 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-slate-200">{alimento.nome}</span>
                        <span className="text-slate-400 text-sm">{alimento.quantita}g</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <div className="text-slate-500">Kcal</div>
                          <div className="text-slate-300">{((alimento.kcal || 0) * factor).toFixed(0)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Prot</div>
                          <div className="text-slate-300">{((alimento.proteine || 0) * factor).toFixed(1)}g</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Carb</div>
                          <div className="text-slate-300">{((alimento.carboidrati || 0) * factor).toFixed(1)}g</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Grassi</div>
                          <div className="text-slate-300">{((alimento.grassi || 0) * factor).toFixed(1)}g</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-lg p-3">
                <div className="text-xs text-emerald-400 mb-1">Totale {pasto.nome}</div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <div className="text-emerald-300 font-semibold">{pastoTotals.kcal.toFixed(0)}</div>
                    <div className="text-emerald-400 text-xs">Kcal</div>
                  </div>
                  <div>
                    <div className="text-emerald-300 font-semibold">{pastoTotals.proteine.toFixed(1)}g</div>
                    <div className="text-emerald-400 text-xs">Prot</div>
                  </div>
                  <div>
                    <div className="text-emerald-300 font-semibold">{pastoTotals.carboidrati.toFixed(1)}g</div>
                    <div className="text-emerald-400 text-xs">Carb</div>
                  </div>
                  <div>
                    <div className="text-emerald-300 font-semibold">{pastoTotals.grassi.toFixed(1)}g</div>
                    <div className="text-emerald-400 text-xs">Grassi</div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Daily Totals */}
        <div className="bg-emerald-900/30 border-2 border-emerald-600/50 rounded-xl p-4">
          <h3 className="text-lg font-bold text-emerald-300 mb-3">Totali Giornalieri - {selectedDay}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-emerald-400 text-xs mb-1">Quantità</div>
              <div className="text-emerald-300 font-bold text-lg">{dayTotals.quantita.toFixed(0)}g</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-emerald-400 text-xs mb-1">Kcal</div>
              <div className="text-emerald-300 font-bold text-lg">{dayTotals.kcal.toFixed(0)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-emerald-400 text-xs mb-1">Proteine</div>
              <div className="text-emerald-300 font-bold text-lg">{dayTotals.proteine.toFixed(1)}g</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-emerald-400 text-xs mb-1">Carboidrati</div>
              <div className="text-emerald-300 font-bold text-lg">{dayTotals.carboidrati.toFixed(1)}g</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-emerald-400 text-xs mb-1">Grassi</div>
              <div className="text-emerald-300 font-bold text-lg">{dayTotals.grassi.toFixed(1)}g</div>
            </div>
          </div>
        </div>

        {/* Integration Notes */}
        {schedaData.integrazione && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Integrazione</h3>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{schedaData.integrazione}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSchedaAlimentazione;
