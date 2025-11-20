import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, X, Info, ChevronDown } from 'lucide-react';
import { 
  FOOD_DATABASE, 
  getFoodById, 
  calculateGramsForMacros, 
  calculateMacrosForGrams,
  findSimilarFoods,
  FOOD_CATEGORIES 
} from '../utils/foodDatabase';

/**
 * Smart Food Swap Component
 * Allows clients to substitute foods in meal plans with automatic macro calculation
 * Maintains target macros by adjusting quantities automatically
 */
export default function SmartFoodSwap({ 
  currentFoodId, 
  currentGrams, 
  currentMacros,
  mealDay,
  mealName,
  onSwap,
  onCancel 
}) {
  const currentFood = getFoodById(currentFoodId);
  const [selectedFoodId, setSelectedFoodId] = useState(currentFoodId);
  const [calculatedGrams, setCalculatedGrams] = useState(currentGrams);
  const [newMacros, setNewMacros] = useState(currentMacros);
  const [applyToAllDays, setApplyToAllDays] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(currentFood?.category || 'CARBS');

  if (!currentFood) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
        <p className="text-red-300">Alimento non trovato nel database</p>
      </div>
    );
  }

  const handleFoodChange = (newFoodId) => {
    const newFood = getFoodById(newFoodId);
    if (!newFood) return;

    // Calculate grams needed to match current macros
    const neededGrams = calculateGramsForMacros(newFood, currentMacros);
    const resultingMacros = calculateMacrosForGrams(newFood, neededGrams);

    setSelectedFoodId(newFoodId);
    setCalculatedGrams(neededGrams);
    setNewMacros(resultingMacros);
    setShowDropdown(false);
  };

  const handleConfirm = () => {
    const selectedFood = getFoodById(selectedFoodId);
    onSwap({
      foodId: selectedFoodId,
      foodName: selectedFood.name,
      grams: calculatedGrams,
      macros: newMacros,
      applyToAllDays,
      mealDay,
      mealName,
    });
  };

  const macroDifference = {
    calories: newMacros.calories - currentMacros.calories,
    proteins: Math.round((newMacros.proteins - currentMacros.proteins) * 10) / 10,
    carbs: Math.round((newMacros.carbs - currentMacros.carbs) * 10) / 10,
    fats: Math.round((newMacros.fats - currentMacros.fats) * 10) / 10,
  };

  // Get similar foods for suggestions
  const similarFoods = findSimilarFoods(currentFoodId, 6);
  
  // Get foods by category for dropdown
  const categoryFoods = FOOD_DATABASE.filter(f => f.category === selectedCategory);

  const isGoodMatch = Math.abs(macroDifference.calories) <= 10 && 
                      Math.abs(macroDifference.proteins) <= 2 &&
                      Math.abs(macroDifference.carbs) <= 3 &&
                      Math.abs(macroDifference.fats) <= 2;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700"
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
                <p className="text-lg font-semibold text-slate-100">{currentFood.name}</p>
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

          {/* Similar Foods Suggestions */}
          {similarFoods.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-300 mb-3">Alimenti simili (consigliati):</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {similarFoods.map(food => (
                  <button
                    key={food.id}
                    onClick={() => handleFoodChange(food.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedFoodId === food.id
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-200">{food.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {food.macros.calories} kcal/100g
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Foods Dropdown */}
          <div>
            <p className="text-sm font-medium text-slate-300 mb-3">Oppure scegli da tutti gli alimenti:</p>
            
            {/* Category Filter */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {Object.entries(FOOD_CATEGORIES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === key
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-left flex items-center justify-between hover:border-slate-600 transition-colors"
              >
                <span className="text-slate-200">
                  {getFoodById(selectedFoodId)?.name || 'Seleziona alimento'}
                </span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20"
                  >
                    {categoryFoods.map(food => (
                      <button
                        key={food.id}
                        onClick={() => handleFoodChange(food.id)}
                        className={`w-full p-3 text-left hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-b-0 ${
                          selectedFoodId === food.id ? 'bg-slate-800' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200 text-sm">{food.name}</span>
                          <span className="text-xs text-slate-400">{food.macros.calories} kcal</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Calculated Result */}
          {selectedFoodId !== currentFoodId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 border-2 ${
                isGoodMatch 
                  ? 'bg-green-500/10 border-green-500/50' 
                  : 'bg-amber-500/10 border-amber-500/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <Info size={20} className={isGoodMatch ? 'text-green-400' : 'text-amber-400'} />
                <div className="flex-1">
                  <p className="font-medium text-slate-100 mb-2">
                    {getFoodById(selectedFoodId)?.name}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Quantità calcolata:</p>
                      <p className="text-2xl font-bold text-rose-400">{calculatedGrams}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Macros risultanti:</p>
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Calorie:</span>
                          <span className="text-xs font-medium text-slate-200">
                            {newMacros.calories} kcal
                            <span className={`ml-1 ${macroDifference.calories > 0 ? 'text-rose-400' : 'text-green-400'}`}>
                              ({macroDifference.calories > 0 ? '+' : ''}{macroDifference.calories})
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Proteine:</span>
                          <span className="text-xs font-medium text-blue-400">
                            {newMacros.proteins}g
                            <span className={`ml-1 ${macroDifference.proteins > 0 ? 'text-rose-400' : 'text-green-400'}`}>
                              ({macroDifference.proteins > 0 ? '+' : ''}{macroDifference.proteins}g)
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Carboidrati:</span>
                          <span className="text-xs font-medium text-amber-400">
                            {newMacros.carbs}g
                            <span className={`ml-1 ${macroDifference.carbs > 0 ? 'text-rose-400' : 'text-green-400'}`}>
                              ({macroDifference.carbs > 0 ? '+' : ''}{macroDifference.carbs}g)
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Grassi:</span>
                          <span className="text-xs font-medium text-rose-400">
                            {newMacros.fats}g
                            <span className={`ml-1 ${macroDifference.fats > 0 ? 'text-rose-400' : 'text-green-400'}`}>
                              ({macroDifference.fats > 0 ? '+' : ''}{macroDifference.fats}g)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isGoodMatch ? (
                    <p className="text-xs text-green-400 mt-3 flex items-center gap-1">
                      <Check size={14} /> Ottima corrispondenza! I macros sono quasi identici.
                    </p>
                  ) : (
                    <p className="text-xs text-amber-400 mt-3">
                      Attenzione: piccola differenza nei macros (entro {Math.max(
                        Math.abs(macroDifference.calories),
                        Math.abs(macroDifference.proteins * 4),
                        Math.abs(macroDifference.carbs * 4),
                        Math.abs(macroDifference.fats * 9)
                      )} kcal)
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Apply to all days option */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={applyToAllDays}
                onChange={(e) => setApplyToAllDays(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-600 text-rose-600 focus:ring-rose-500 focus:ring-offset-slate-800"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">
                  Applica a tutti i giorni
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Sostituisce questo alimento in tutti i giorni in cui è presente nel piano alimentare
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900 p-6 border-t border-slate-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedFoodId === currentFoodId}
            className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Conferma Sostituzione
          </button>
        </div>
      </motion.div>
    </div>
  );
}
