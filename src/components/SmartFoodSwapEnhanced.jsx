import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, X, Info, ChevronDown, Search, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Smart Food Swap Enhanced Component
 * Uses platform_foods database from Firestore
 * Validates macros within allowed range (±10%)
 */
export default function SmartFoodSwapEnhanced({ 
  currentFood,
  currentGrams, 
  currentMacros,
  targetMacros, // Macros obiettivo del coach
  allowedVariance = 0.10, // ±10% di variazione consentita
  mealDay,
  mealName,
  onSwap,
  onCancel 
}) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const [calculatedGrams, setCalculatedGrams] = useState(currentGrams);
  const [newMacros, setNewMacros] = useState(currentMacros);
  const [applyToAllDays, setApplyToAllDays] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const foodsRef = collection(db, 'platform_foods');
      const snapshot = await getDocs(foodsRef);
      
      const foodsList = [];
      const categoriesSet = new Set();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        foodsList.push({
          id: doc.id,
          ...data
        });
        if (data.category) categoriesSet.add(data.category);
      });
      
      setFoods(foodsList);
      setCategories(Array.from(categoriesSet).sort());
      
      // Pre-seleziona il cibo attuale
      const current = foodsList.find(f => f.nome === currentFood.nome);
      if (current) {
        setSelectedFood(current);
        setSelectedCategory(current.category || '');
      }
    } catch (error) {
      console.error('Errore caricamento alimenti:', error);
    }
    setLoading(false);
  };

  const calculateNewGramsAndMacros = (food) => {
    // Calcola grammi necessari per mantenere circa le stesse calorie
    const factor = currentMacros.calories / (food.kcal || 1);
    const neededGrams = Math.round(currentGrams * factor);
    
    // Calcola nuovi macros con i nuovi grammi
    const gramsRatio = neededGrams / 100;
    const macros = {
      calories: Math.round((food.kcal || 0) * gramsRatio),
      proteins: Math.round((food.proteine || 0) * gramsRatio * 10) / 10,
      carbs: Math.round((food.carboidrati || 0) * gramsRatio * 10) / 10,
      fats: Math.round((food.grassi || 0) * gramsRatio * 10) / 10,
    };
    
    return { neededGrams, macros };
  };

  const validateMacrosInRange = (macros) => {
    if (!targetMacros) return { valid: true }; // Nessuna validazione se non ci sono target
    
    const errors = [];
    const tolerance = allowedVariance;
    
    // Valida calorie
    const caloriesMin = targetMacros.calories * (1 - tolerance);
    const caloriesMax = targetMacros.calories * (1 + tolerance);
    if (macros.calories < caloriesMin || macros.calories > caloriesMax) {
      errors.push(`Calorie fuori range: ${Math.round(caloriesMin)}-${Math.round(caloriesMax)} kcal`);
    }
    
    // Valida proteine
    const proteinsMin = targetMacros.proteins * (1 - tolerance);
    const proteinsMax = targetMacros.proteins * (1 + tolerance);
    if (macros.proteins < proteinsMin || macros.proteins > proteinsMax) {
      errors.push(`Proteine fuori range: ${Math.round(proteinsMin)}-${Math.round(proteinsMax)}g`);
    }
    
    // Valida carboidrati
    const carbsMin = targetMacros.carbs * (1 - tolerance);
    const carbsMax = targetMacros.carbs * (1 + tolerance);
    if (macros.carbs < carbsMin || macros.carbs > carbsMax) {
      errors.push(`Carboidrati fuori range: ${Math.round(carbsMin)}-${Math.round(carbsMax)}g`);
    }
    
    // Valida grassi
    const fatsMin = targetMacros.fats * (1 - tolerance);
    const fatsMax = targetMacros.fats * (1 + tolerance);
    if (macros.fats < fatsMin || macros.fats > fatsMax) {
      errors.push(`Grassi fuori range: ${Math.round(fatsMin)}-${Math.round(fatsMax)}g`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleFoodChange = (food) => {
    const { neededGrams, macros } = calculateNewGramsAndMacros(food);
    const validation = validateMacrosInRange(macros);
    
    setSelectedFood(food);
    setCalculatedGrams(neededGrams);
    setNewMacros(macros);
    setValidationError(validation.valid ? null : validation.errors);
  };

  const handleConfirm = () => {
    if (validationError) {
      alert('Impossibile salvare: i macros sono fuori dal range consentito dal tuo coach.\n\n' + validationError.join('\n'));
      return;
    }

    onSwap({
      foodId: selectedFood.id,
      foodName: selectedFood.nome,
      grams: calculatedGrams,
      macros: newMacros,
      applyToAllDays,
      mealDay,
      mealName,
    });
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = searchTerm === '' || 
      food.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const macroDifference = {
    calories: newMacros.calories - currentMacros.calories,
    proteins: Math.round((newMacros.proteins - currentMacros.proteins) * 10) / 10,
    carbs: Math.round((newMacros.carbs - currentMacros.carbs) * 10) / 10,
    fats: Math.round((newMacros.fats - currentMacros.fats) * 10) / 10,
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-200 mt-4">Caricamento alimenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="text-rose-400" size={24} />
              <div>
                <h2 className="text-xl font-bold text-slate-100">Sostituisci Alimento</h2>
                <p className="text-sm text-slate-400">
                  {mealName} - {mealDay}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Food Info */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
            <p className="text-sm text-slate-400 mb-2">Alimento attuale:</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-100">{currentFood.nome}</p>
                <p className="text-sm text-slate-400">{currentGrams}g</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Macros attuali:</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-slate-300">{currentMacros.calories} kcal</span>
                  <span className="text-xs text-blue-400">P: {currentMacros.proteins}g</span>
                  <span className="text-xs text-amber-400">C: {currentMacros.carbs}g</span>
                  <span className="text-xs text-rose-400">F: {currentMacros.fats}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cerca alimento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="">Tutte le categorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Foods List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredFoods.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Nessun alimento trovato</p>
            ) : (
              filteredFoods.map(food => (
                <button
                  key={food.id}
                  onClick={() => handleFoodChange(food)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedFood?.id === food.id
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-100">{food.nome}</p>
                      <p className="text-xs text-slate-400">{food.category || 'N/D'}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-slate-300">{food.kcal} kcal/100g</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-blue-400">P:{food.proteine}g</span>
                        <span className="text-amber-400">C:{food.carboidrati}g</span>
                        <span className="text-rose-400">F:{food.grassi}g</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* New Macros Preview */}
          {selectedFood && (
            <div className={`rounded-xl p-4 border-2 ${
              validationError 
                ? 'bg-red-500/10 border-red-500' 
                : 'bg-emerald-500/10 border-emerald-500'
            }`}>
              <div className="flex items-start gap-3">
                {validationError ? (
                  <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
                ) : (
                  <Check className="text-emerald-400 flex-shrink-0" size={20} />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-100 mb-2">Nuovo alimento:</p>
                  <p className="text-lg font-bold text-slate-100">{selectedFood.nome} - {calculatedGrams}g</p>
                  
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-slate-400">Calorie</p>
                      <p className={`text-lg font-bold ${validationError ? 'text-red-400' : 'text-slate-100'}`}>
                        {newMacros.calories}
                      </p>
                      <p className={`text-xs ${macroDifference.calories >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroDifference.calories >= 0 ? '+' : ''}{macroDifference.calories}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Proteine</p>
                      <p className={`text-lg font-bold ${validationError ? 'text-red-400' : 'text-blue-400'}`}>
                        {newMacros.proteins}g
                      </p>
                      <p className={`text-xs ${macroDifference.proteins >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroDifference.proteins >= 0 ? '+' : ''}{macroDifference.proteins}g
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Carboidrati</p>
                      <p className={`text-lg font-bold ${validationError ? 'text-red-400' : 'text-amber-400'}`}>
                        {newMacros.carbs}g
                      </p>
                      <p className={`text-xs ${macroDifference.carbs >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroDifference.carbs >= 0 ? '+' : ''}{macroDifference.carbs}g
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Grassi</p>
                      <p className={`text-lg font-bold ${validationError ? 'text-red-400' : 'text-rose-400'}`}>
                        {newMacros.fats}g
                      </p>
                      <p className={`text-xs ${macroDifference.fats >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroDifference.fats >= 0 ? '+' : ''}{macroDifference.fats}g
                      </p>
                    </div>
                  </div>

                  {validationError && (
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-medium text-red-400">⚠️ Errori di validazione:</p>
                      {validationError.map((err, idx) => (
                        <p key={idx} className="text-xs text-red-300">• {err}</p>
                      ))}
                      <p className="text-xs text-slate-400 mt-2">
                        Il tuo coach ha impostato un limite del ±{allowedVariance * 100}% sui macros
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Apply to all days */}
          <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={applyToAllDays}
              onChange={(e) => setApplyToAllDays(e.target.checked)}
              className="w-5 h-5 accent-rose-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-200">Applica a tutti i giorni</p>
              <p className="text-xs text-slate-400">La sostituzione verrà applicata a tutti i giorni della settimana</p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={!selectedFood || validationError}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Conferma Sostituzione
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
