import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, RefreshCw, RotateCcw } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../../firebase';
import { convertToGrams } from '../../utils/nutritionUnits';
import { getTenantDoc, getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { exportNutritionCardToPDF } from '../../utils/pdfExport';
import SmartFoodSwapEnhanced from '../../components/SmartFoodSwapEnhanced';
import { useFeaturePermission } from '../../components/ProtectedClientRoute';

const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const ClientSchedaAlimentazione = () => {
  const [loading, setLoading] = useState(true);
  const [schedaData, setSchedaData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Lunedì');
  const [clientName, setClientName] = useState('');
  const [swapModalData, setSwapModalData] = useState(null);
  
  // Controllo permessi features
  const { hasPermission: canSwapFoods, disabledMessage: swapDisabledMessage } = useFeaturePermission('food-swap');
  const { hasPermission: canExportPDF, disabledMessage: pdfDisabledMessage } = useFeaturePermission('pdf-export');

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
      const schedaRef = getTenantDoc(db, 'schede_alimentazione', user.uid);
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
      const quantitaInGrammi = convertToGrams(alimento.quantita, alimento.unitaMisura);
      const factor = quantitaInGrammi / 100;
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
        const quantitaInGrammi = convertToGrams(alimento.quantita, alimento.unitaMisura);
        const factor = quantitaInGrammi / 100;
        totals.kcal += (alimento.kcal || 0) * factor;
        totals.proteine += (alimento.proteine || 0) * factor;
        totals.carboidrati += (alimento.carboidrati || 0) * factor;
        totals.grassi += (alimento.grassi || 0) * factor;
        totals.quantita += quantitaInGrammi;
      });
    });

    return totals;
  };

  const handleOpenSwap = (dayName, pastoIndex, alimentoIndex, alimento) => {
    const pasto = schedaData.giorni[dayName].pasti[pastoIndex];
    const quantitaInGrammi = convertToGrams(alimento.quantita, alimento.unitaMisura);
    const factor = quantitaInGrammi / 100;
    
    const currentMacros = {
      calories: Math.round((alimento.kcal || 0) * factor),
      proteins: Math.round((alimento.proteine || 0) * factor * 10) / 10,
      carbs: Math.round((alimento.carboidrati || 0) * factor * 10) / 10,
      fats: Math.round((alimento.grassi || 0) * factor * 10) / 10,
    };

    setSwapModalData({
      dayName,
      pastoIndex,
      alimentoIndex,
      currentFood: alimento,
      currentGrams: quantitaInGrammi,
      currentMacros,
      targetMacros: currentMacros, // Target = macros attuali impostati dal coach
      mealDay: dayName,
      mealName: pasto.nome,
    });
  };

  const handleSwapConfirm = async (swapData) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const newSchedaData = { ...schedaData };
      
      const processSwap = (dayName) => {
        const pasto = newSchedaData.giorni[dayName].pasti[swapModalData.pastoIndex];
        const newAlimento = {
          nome: swapData.foodName,
          quantita: swapData.grams,
          kcal: Math.round((swapData.macros.calories / swapData.grams) * 100),
          proteine: Math.round(((swapData.macros.proteins / swapData.grams) * 100) * 10) / 10,
          carboidrati: Math.round(((swapData.macros.carbs / swapData.grams) * 100) * 10) / 10,
          grassi: Math.round(((swapData.macros.fats / swapData.grams) * 100) * 10) / 10,
        };
        
        pasto.alimenti[swapModalData.alimentoIndex] = newAlimento;
      };

      if (swapData.applyToAllDays) {
        // Applica a tutti i giorni
        GIORNI_SETTIMANA.forEach(dayName => {
          if (newSchedaData.giorni[dayName]?.pasti?.[swapModalData.pastoIndex]) {
            processSwap(dayName);
          }
        });
      } else {
        // Applica solo al giorno corrente
        processSwap(swapModalData.dayName);
      }

      // Salva su Firestore
      const schedaRef = getTenantDoc(db, 'schede_alimentazione', user.uid);
      await updateDoc(schedaRef, {
        giorni: newSchedaData.giorni,
        lastModified: new Date().toISOString(),
        modifiedBy: 'client',
      });

      setSchedaData(newSchedaData);
      setSwapModalData(null);
    } catch (error) {
      console.error('Errore nella sostituzione:', error);
      alert('Errore durante la sostituzione dell\'alimento');
    }
  };

  const handleResetScheda = async () => {
    if (!window.confirm('Sei sicuro di voler ripristinare la scheda originale del coach? Tutte le modifiche andranno perse.')) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Carica la scheda originale dal coach
      const schedaRef = getTenantDoc(db, 'schede_alimentazione', user.uid);
      const schedaSnap = await getDoc(schedaRef);
      
      if (!schedaSnap.exists()) {
        alert('Scheda non trovata');
        return;
      }

      const originalData = schedaSnap.data();
      
      // Ripristina solo se esiste una versione originale salvata
      if (originalData.originalGiorni) {
        await updateDoc(schedaRef, {
          giorni: originalData.originalGiorni,
          lastModified: new Date().toISOString(),
          modifiedBy: 'client_reset',
        });

        setSchedaData({
          ...originalData,
          giorni: originalData.originalGiorni
        });

        alert('✅ Scheda ripristinata correttamente!');
      } else {
        alert('⚠️ Non è disponibile una versione originale da ripristinare. La scheda potrebbe non essere mai stata modificata.');
      }
    } catch (error) {
      console.error('Errore nel ripristino:', error);
      alert('Errore durante il ripristino della scheda');
    }
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
    <div className="min-h-screen px-2 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-2.5 sm:space-y-4">
        {/* Header - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-900/40 to-slate-800/40 border border-emerald-600/30 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-emerald-100">
                Piano Alimentare
              </h1>
              {schedaData.obiettivo && (
                <p className="text-emerald-300 text-xs sm:text-sm lg:text-base font-medium mt-1">
                  🎯 {schedaData.obiettivo}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canExportPDF ? (
                <button
                  onClick={() => exportNutritionCardToPDF(schedaData, clientName)}
                  className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-4 py-1.5 lg:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs lg:text-sm rounded-lg lg:rounded-xl transition-all shadow-lg"
                >
                  <Download size={14} className="lg:hidden" />
                  <Download size={18} className="hidden lg:block" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              ) : pdfDisabledMessage ? (
                <div className="px-3 py-2 bg-amber-900/30 border border-amber-600/30 rounded-lg text-xs text-amber-400 flex items-center gap-2">
                  🔒 {pdfDisabledMessage}
                </div>
              ) : null}
              
              {/* Pulsante Reset Scheda */}
              <button
                onClick={handleResetScheda}
                className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-4 py-1.5 lg:py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs lg:text-sm rounded-lg lg:rounded-xl transition-all shadow-lg"
                title="Ripristina scheda originale del coach"
              >
                <RotateCcw size={14} className="lg:hidden" />
                <RotateCcw size={18} className="hidden lg:block" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Day Selector - Responsive */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl lg:rounded-2xl p-1.5 lg:p-2.5 shadow-lg">
          <div className="flex gap-1 lg:gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {GIORNI_SETTIMANA.map(giorno => (
              <button
                key={giorno}
                onClick={() => setSelectedDay(giorno)}
                className={`px-2.5 lg:px-5 py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl font-medium transition-all whitespace-nowrap text-xs lg:text-base shadow-md ${
                  selectedDay === giorno
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white scale-105 shadow-emerald-500/30'
                    : 'bg-slate-700/70 text-slate-300 hover:bg-slate-600/70'
                }`}
              >
                <span className="lg:hidden">{giorno.slice(0, 3)}</span>
                <span className="hidden lg:inline">{giorno}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meals Grid - 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-4">
          {schedaData.giorni[selectedDay]?.pasti?.map((pasto, index) => {
            if (!pasto.alimenti || pasto.alimenti.length === 0) return null;
            
            const pastoTotals = calculatePastoTotals(pasto);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-slate-800/40 border border-slate-700/50 rounded-xl lg:rounded-2xl p-2.5 lg:p-4 shadow-lg hover:border-emerald-600/30 transition-all"
              >
                {/* Header Pasto */}
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <h3 className="text-sm lg:text-lg font-bold text-emerald-400">
                    {pasto.nome}
                  </h3>
                  <div className="flex gap-1.5 lg:gap-2 text-[10px] lg:text-xs">
                    <span className="text-slate-300 font-semibold">{pastoTotals.kcal.toFixed(0)} kcal</span>
                    <span className="text-blue-400">P:{pastoTotals.proteine.toFixed(0)}</span>
                    <span className="text-amber-400">C:{pastoTotals.carboidrati.toFixed(0)}</span>
                    <span className="text-rose-400">F:{pastoTotals.grassi.toFixed(0)}</span>
                  </div>
                </div>
                
                {/* Alimenti */}
                <div className="space-y-1.5 lg:space-y-2">
                  {pasto.alimenti.map((alimento, aIndex) => {
                    const quantitaInGrammi = convertToGrams(alimento.quantita, alimento.unitaMisura);
                    const factor = quantitaInGrammi / 100;
                    return (
                      <div key={aIndex} className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-lg lg:rounded-xl p-2 lg:p-3 border border-slate-700/30 group hover:border-emerald-600/30 transition-all">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 lg:gap-2">
                              <span className="font-semibold text-slate-100 text-xs lg:text-base truncate">{alimento.nome}</span>
                              <span className="text-emerald-400 text-[10px] lg:text-sm flex-shrink-0">
                                {alimento.quantita}{alimento.unitaMisura || 'g'}
                              </span>
                            </div>
                            <div className="flex gap-2 lg:gap-3 mt-0.5 lg:mt-1 text-[10px] lg:text-xs">
                              <span className="text-slate-300">{((alimento.kcal || 0) * factor).toFixed(0)}</span>
                              <span className="text-blue-400">P:{((alimento.proteine || 0) * factor).toFixed(1)}</span>
                              <span className="text-amber-400">C:{((alimento.carboidrati || 0) * factor).toFixed(1)}</span>
                              <span className="text-rose-400">F:{((alimento.grassi || 0) * factor).toFixed(1)}</span>
                            </div>
                          </div>
                          {canSwapFoods ? (
                            <button
                              onClick={() => handleOpenSwap(selectedDay, index, aIndex, alimento)}
                              className="p-1.5 lg:p-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 rounded-lg opacity-70 group-hover:opacity-100 transition-all shadow-md hover:shadow-rose-500/30 hover:scale-105 flex-shrink-0"
                              title="Sostituisci"
                            >
                              <RefreshCw size={12} className="text-white lg:hidden" />
                              <RefreshCw size={16} className="text-white hidden lg:block" />
                            </button>
                          ) : swapDisabledMessage ? (
                            <div className="px-2 py-1 bg-amber-900/30 border border-amber-600/30 rounded text-xs text-amber-400 flex-shrink-0" title={swapDisabledMessage}>
                              🔒
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Daily Totals - Sticky Bottom */}
        <div className="bg-gradient-to-br from-emerald-900/50 to-slate-800/50 border-2 border-emerald-500/50 rounded-xl lg:rounded-2xl p-2.5 lg:p-5 shadow-2xl sticky bottom-2 lg:bottom-4">
          <div className="flex items-center justify-between mb-1.5 lg:mb-3">
            <h3 className="text-xs lg:text-xl font-bold text-emerald-300">
              Totali Giornalieri - {selectedDay}
            </h3>
          </div>
          <div className="grid grid-cols-5 gap-1.5 lg:gap-4">
            <div className="bg-slate-900/60 rounded-lg lg:rounded-xl p-1.5 lg:p-4 border border-slate-700/50 text-center shadow-glow">
              <div className="text-emerald-200 font-bold text-sm lg:text-2xl">{dayTotals.quantita.toFixed(0)}</div>
              <div className="text-slate-400 text-[9px] lg:text-sm mt-0.5 lg:mt-1">Quantità (g)</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg lg:rounded-xl p-1.5 lg:p-4 border border-emerald-600/30 text-center shadow-glow">
              <div className="text-emerald-200 font-bold text-sm lg:text-2xl">{dayTotals.kcal.toFixed(0)}</div>
              <div className="text-emerald-400 text-[9px] lg:text-sm mt-0.5 lg:mt-1">Kcal</div>
            </div>
            <div className="bg-blue-900/20 rounded-lg lg:rounded-xl p-1.5 lg:p-4 border border-blue-600/30 text-center">
              <div className="text-blue-200 font-bold text-sm lg:text-2xl">{dayTotals.proteine.toFixed(0)}</div>
              <div className="text-blue-400 text-[9px] lg:text-sm mt-0.5 lg:mt-1">Proteine (g)</div>
            </div>
            <div className="bg-amber-900/20 rounded-lg lg:rounded-xl p-1.5 lg:p-4 border border-amber-600/30 text-center">
              <div className="text-amber-200 font-bold text-sm lg:text-2xl">{dayTotals.carboidrati.toFixed(0)}</div>
              <div className="text-amber-400 text-[9px] lg:text-sm mt-0.5 lg:mt-1">Carboidrati (g)</div>
            </div>
            <div className="bg-rose-900/20 rounded-lg lg:rounded-xl p-1.5 lg:p-4 border border-rose-600/30 text-center">
              <div className="text-rose-200 font-bold text-sm lg:text-2xl">{dayTotals.grassi.toFixed(0)}</div>
              <div className="text-rose-400 text-[9px] lg:text-sm mt-0.5 lg:mt-1">Grassi (g)</div>
            </div>
          </div>
        </div>

        {/* Integration Notes - Responsive */}
        {schedaData.integrazione && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl lg:rounded-2xl p-2.5 lg:p-4 shadow-lg">
            <h3 className="text-xs lg:text-lg font-bold text-slate-100 mb-1.5 lg:mb-2 flex items-center gap-1 lg:gap-2">
              <span className="text-base lg:text-xl">💊</span>
              Integrazione
            </h3>
            <p className="text-slate-300 text-[11px] lg:text-sm whitespace-pre-wrap bg-slate-900/40 rounded-lg p-2 lg:p-3">{schedaData.integrazione}</p>
          </div>
        )}
      </div>

      {/* Swap Modal */}
      {swapModalData && (
        <SmartFoodSwapEnhanced
          currentFood={swapModalData.currentFood}
          currentGrams={swapModalData.currentGrams}
          currentMacros={swapModalData.currentMacros}
          targetMacros={swapModalData.targetMacros}
          allowedVariance={0.10}
          mealDay={swapModalData.mealDay}
          mealName={swapModalData.mealName}
          onSwap={handleSwapConfirm}
          onCancel={() => setSwapModalData(null)}
        />
      )}
    </div>
  );
};

export default ClientSchedaAlimentazione;
