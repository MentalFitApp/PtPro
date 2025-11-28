import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, RefreshCw, ChevronRight } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../../firebase';
import { getTenantDoc, getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { useNavigate } from 'react-router-dom';
import SmartFoodSwapEnhanced from '../../components/SmartFoodSwapEnhanced';


const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

/**
 * Enhanced Client Nutrition Schedule with Smart Food Swap
 * Allows clients to substitute foods while maintaining target macros
 */
export default function ClientSchedaAlimentazioneEnhanced() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedaData, setSchedaData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Lunedì');
  const [swapModalData, setSwapModalData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadScheda();
  }, []);

  const loadScheda = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
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

  const handleOpenSwapModal = (pasto, alimento, day) => {
    // Calcola i macros target (quelli originali impostati dal coach)
    const factor = alimento.quantita / 100;
    
    setSwapModalData({
      currentFood: {
        nome: alimento.alimento || alimento.nome,
        kcal: alimento.kcal / factor, // Per 100g
        proteine: alimento.proteine / factor,
        carboidrati: alimento.carboidrati / factor,
        grassi: alimento.grassi / factor,
      },
      currentGrams: alimento.quantita || 100,
      currentMacros: {
        calories: alimento.kcal || 0,
        proteins: alimento.proteine || 0,
        carbs: alimento.carboidrati || 0,
        fats: alimento.grassi || 0,
      },
      targetMacros: schedaData.macrosTarget || {
        calories: alimento.kcal || 0,
        proteins: alimento.proteine || 0,
        carbs: alimento.carboidrati || 0,
        fats: alimento.grassi || 0,
      },
      mealDay: day,
      mealName: pasto.nome,
      day: day,
      pastoIndex: schedaData.giorni[day].pasti.findIndex(p => p.nome === pasto.nome),
      alimentoIndex: pasto.alimenti.findIndex(a => a === alimento),
      currentFoodId: alimento.foodId || alimento.alimento,
    });
  };

  const handleSwapConfirm = async (swapData) => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user || !schedaData) return;

      const updatedScheda = JSON.parse(JSON.stringify(schedaData)); // Deep clone
      const { day, pastoIndex, alimentoIndex } = swapModalData;

      // Create updated food item
      const newAlimento = {
        alimento: swapData.foodName,
        nome: swapData.foodName,
        foodId: swapData.foodId,
        quantita: swapData.grams,
        kcal: swapData.macros.calories,
        proteine: swapData.macros.proteins,
        carboidrati: swapData.macros.carbs,
        grassi: swapData.macros.fats,
      };

      if (swapData.applyToAllDays) {
        // Apply to all days where this food appears in the same meal
        GIORNI_SETTIMANA.forEach(giorno => {
          const pasto = updatedScheda.giorni[giorno]?.pasti?.[pastoIndex];
          if (pasto && pasto.alimenti?.[alimentoIndex]) {
            // Check if it's the same food
            if (pasto.alimenti[alimentoIndex].foodId === swapModalData.currentFoodId ||
                pasto.alimenti[alimentoIndex].alimento === swapModalData.currentFoodId) {
              updatedScheda.giorni[giorno].pasti[pastoIndex].alimenti[alimentoIndex] = newAlimento;
            }
          }
        });
      } else {
        // Apply only to selected day
        updatedScheda.giorni[day].pasti[pastoIndex].alimenti[alimentoIndex] = newAlimento;
      }

      // Save to Firestore
      const schedaRef = getTenantDoc(db, 'schede_alimentazione', user.uid);
      await setDoc(schedaRef, updatedScheda);

      setSchedaData(updatedScheda);
      setSwapModalData(null);
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvare la sostituzione');
    }
    setSaving(false);
  };

  const calculatePastoTotals = (pasto) => {
    let totals = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
    
    pasto.alimenti?.forEach(alimento => {
      totals.kcal += alimento.kcal || 0;
      totals.proteine += alimento.proteine || 0;
      totals.carboidrati += alimento.carboidrati || 0;
      totals.grassi += alimento.grassi || 0;
    });

    return {
      kcal: Math.round(totals.kcal),
      proteine: Math.round(totals.proteine * 10) / 10,
      carboidrati: Math.round(totals.carboidrati * 10) / 10,
      grassi: Math.round(totals.grassi * 10) / 10,
    };
  };

  const calculateDayTotals = (dayData) => {
    let totals = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
    
    dayData.pasti?.forEach(pasto => {
      const pastoTotals = calculatePastoTotals(pasto);
      totals.kcal += pastoTotals.kcal;
      totals.proteine += pastoTotals.proteine;
      totals.carboidrati += pastoTotals.carboidrati;
      totals.grassi += pastoTotals.grassi;
    });

    return {
      kcal: Math.round(totals.kcal),
      proteine: Math.round(totals.proteine * 10) / 10,
      carboidrati: Math.round(totals.carboidrati * 10) / 10,
      grassi: Math.round(totals.grassi * 10) / 10,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!schedaData) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 p-6">
        <button onClick={() => navigate('/client')} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4">
          <ArrowLeft size={20} />
          <span>Torna alla Dashboard</span>
        </button>
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-slate-400 text-lg">Nessuna scheda alimentazione disponibile</p>
          <p className="text-slate-500 mt-2">Contatta il tuo coach per ricevere il piano alimentare</p>
        </div>
      </div>
    );
  }

  const dayData = schedaData.giorni?.[selectedDay];
  const dayTotals = dayData ? calculateDayTotals(dayData) : null;

  return (
    <>
      <div className="min-h-screen bg-slate-900 relative">
        <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={() => navigate('/client')}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-sm text-slate-200">Indietro</span>
            </button>
            <h1 className="text-base sm:text-xl font-bold text-slate-100">Piano Alimentare</h1>
            <div className="w-16 sm:w-20" /> {/* Spacer for alignment */}
          </div>

          {/* Day Selector */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1">
            {GIORNI_SETTIMANA.map(giorno => (
              <button
                key={giorno}
                onClick={() => setSelectedDay(giorno)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedDay === giorno
                    ? 'bg-rose-600 text-white preserve-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {giorno.slice(0, 3)}
                <span className="hidden sm:inline">{giorno.slice(3)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 relative z-10">
        {/* Day Totals */}
        {dayTotals && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 sm:p-6 border border-slate-700"
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-3 sm:mb-4">Totali Giornalieri</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-slate-400">Calorie</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-100">{dayTotals.kcal}</p>
                <p className="text-xs text-slate-500">kcal</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Proteine</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{dayTotals.proteine}</p>
                <p className="text-xs text-slate-500">g</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Carboidrati</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-400">{dayTotals.carboidrati}</p>
                <p className="text-xs text-slate-500">g</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Grassi</p>
                <p className="text-xl sm:text-2xl font-bold text-rose-400">{dayTotals.grassi}</p>
                <p className="text-xs text-slate-500">g</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Meals */}
        {dayData?.pasti?.map((pasto, pastoIdx) => {
          const pastoTotals = calculatePastoTotals(pasto);
          
          return (
            <motion.div
              key={pastoIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pastoIdx * 0.1 }}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              {/* Meal Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3 sm:p-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100">{pasto.nome}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {pastoTotals.kcal} kcal • P: {pastoTotals.proteine}g • C: {pastoTotals.carboidrati}g • F: {pastoTotals.grassi}g
                    </p>
                  </div>
                </div>
              </div>

              {/* Food Items */}
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {pasto.alimenti?.map((alimento, alimentoIdx) => (
                  <div
                    key={alimentoIdx}
                    className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-700 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-100 text-sm sm:text-base truncate">{alimento.alimento || alimento.nome}</h4>
                          <button
                            onClick={() => handleOpenSwapModal(pasto, alimento, selectedDay)}
                            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors group flex-shrink-0"
                            title="Sostituisci alimento"
                          >
                            <RefreshCw size={14} className="sm:w-4 sm:h-4 text-slate-400 group-hover:text-rose-400 group-hover:rotate-180 transition-all duration-300" />
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">{alimento.quantita}g</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-200">{Math.round(alimento.kcal)} kcal</p>
                        <div className="flex gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-xs">
                          <span className="text-blue-400">P:{Math.round(alimento.proteine)}g</span>
                          <span className="text-amber-400">C:{Math.round(alimento.carboidrati)}g</span>
                          <span className="text-rose-400">F:{Math.round(alimento.grassi)}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Info Box */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-300">
            💡 <strong className="text-slate-100">Suggerimento:</strong> Clicca sull&apos;icona <RefreshCw size={14} className="inline text-rose-400" /> accanto a qualsiasi alimento per sostituirlo. 
            Il sistema calcolerà automaticamente la quantità necessaria per mantenere i tuoi macros!
          </p>
        </div>
      </div>

      <AnimatePresence>
        {swapModalData && (
          <SmartFoodSwapEnhanced
            currentFood={swapModalData.currentFood}
            currentGrams={swapModalData.currentGrams}
            currentMacros={swapModalData.currentMacros}
            targetMacros={swapModalData.targetMacros}
            allowedVariance={0.10} // ±10% di variazione consentita
            mealDay={swapModalData.mealDay}
            mealName={swapModalData.mealName}
            onSwap={handleSwapConfirm}
            onCancel={() => setSwapModalData(null)}
          />
        )}
      </AnimatePresence>

      {saving && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-200 mt-4">Salvataggio in corso...</p>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
