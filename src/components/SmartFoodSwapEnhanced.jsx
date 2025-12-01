import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, X, Info, ChevronDown, Search, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Smart Food Swap Enhanced Component
 * Uses platform_foods database from Firestore
 * Validates macros within allowed range (±10%)
 * Smart categorization: only shows foods of the same nutritional category
 */

// Categorie nutrizionali intelligenti con regole precise
const NUTRITIONAL_CATEGORIES = {
  CARNI_BIANCHE: {
    name: 'Carni Bianche',
    categories: ['carni-bianche'],
    keywords: ['pollo', 'tacchino', 'coniglio', 'vitello bianco'],
    rules: { minProtein: 18, maxFat: 10, maxCarbs: 2 }
  },
  CARNI_ROSSE: {
    name: 'Carni Rosse',
    categories: ['carni-rosse'],
    keywords: ['manzo', 'maiale', 'agnello', 'vitello', 'cavallo'],
    rules: { minProtein: 15, maxCarbs: 2 }
  },
  PESCE_MAGRO: {
    name: 'Pesce Magro',
    categories: ['pesce'],
    keywords: ['merluzzo', 'orata', 'branzino', 'sogliola', 'platessa', 'nasello'],
    rules: { minProtein: 15, maxFat: 5, maxCarbs: 2 }
  },
  PESCE_GRASSO: {
    name: 'Pesce Grasso',
    categories: ['pesce'],
    keywords: ['salmone', 'sgombro', 'tonno', 'aringa', 'sardine'],
    rules: { minProtein: 15, minFat: 5, maxCarbs: 2 }
  },
  FRUTTI_MARE: {
    name: 'Frutti di Mare',
    categories: ['frutti-mare'],
    keywords: ['gamberi', 'calamari', 'polpo', 'cozze', 'vongole', 'seppia'],
    rules: { minProtein: 12, maxFat: 5, maxCarbs: 5 }
  },
  UOVA: {
    name: 'Uova',
    categories: ['uova'],
    keywords: ['uova', 'uovo', 'albume', 'tuorlo'],
    rules: { minProtein: 10, minFat: 8, maxCarbs: 2 }
  },
  LATTICINI_MAGRI: {
    name: 'Latticini Magri',
    categories: ['uova-latticini', 'latte'],
    keywords: ['yogurt', 'latte scremato', 'skyr', 'kefir', 'latte magro'],
    rules: { minProtein: 3, maxFat: 5, minCarbs: 3 }
  },
  FORMAGGI_FRESCHI: {
    name: 'Formaggi Freschi',
    categories: ['formaggi', 'uova-latticini'],
    keywords: ['ricotta', 'fiocchi', 'cottage', 'mozzarella', 'stracchino', 'crescenza'],
    rules: { minProtein: 8, minFat: 5, maxCarbs: 5 }
  },
  FORMAGGI_STAGIONATI: {
    name: 'Formaggi Stagionati',
    categories: ['formaggi'],
    keywords: ['parmigiano', 'grana', 'pecorino', 'gorgonzola', 'emmental', 'provolone'],
    rules: { minProtein: 20, minFat: 20, maxCarbs: 5 }
  },
  LEGUMI: {
    name: 'Legumi',
    categories: ['legumi'],
    keywords: ['ceci', 'fagioli', 'lenticchie', 'piselli', 'fave', 'soia'],
    rules: { minProtein: 6, minCarbs: 15 }
  },
  SALUMI_MAGRI: {
    name: 'Salumi Magri',
    categories: ['salumi'],
    keywords: ['bresaola', 'prosciutto crudo', 'speck', 'fesa tacchino'],
    rules: { minProtein: 20, maxFat: 8 }
  },
  SALUMI_GRASSI: {
    name: 'Salumi Grassi',
    categories: ['salumi'],
    keywords: ['salame', 'mortadella', 'pancetta', 'salsiccia', 'coppa'],
    rules: { minProtein: 12, minFat: 15 }
  },
  CEREALI_PASTA: {
    name: 'Cereali e Pasta',
    categories: ['cereali-pasta', 'pasta', 'primi'],
    keywords: ['pasta', 'riso', 'farro', 'orzo', 'quinoa', 'couscous', 'bulgur'],
    rules: { minCarbs: 60, maxProtein: 15, maxFat: 5 }
  },
  PANE: {
    name: 'Pane e Prodotti da Forno',
    categories: ['pane'],
    keywords: ['pane', 'piadina', 'cracker', 'grissini', 'fette biscottate'],
    rules: { minCarbs: 45, maxProtein: 12, maxFat: 10 }
  },
  PATATE_TUBERI: {
    name: 'Patate e Tuberi',
    categories: ['patate-tuberi'],
    keywords: ['patate', 'patata dolce', 'topinambur', 'manioca'],
    rules: { minCarbs: 15, maxCarbs: 25, maxProtein: 3, maxFat: 1 }
  },
  FRUTTA_FRESCA: {
    name: 'Frutta Fresca',
    categories: ['frutta-fresca', 'frutta'],
    keywords: ['mela', 'banana', 'arancia', 'pera', 'fragola', 'kiwi', 'pesca', 'uva'],
    rules: { minCarbs: 8, maxProtein: 2, maxFat: 1 }
  },
  FRUTTA_SECCA: {
    name: 'Frutta Secca e Semi',
    categories: ['frutta-secca'],
    keywords: ['noci', 'mandorle', 'nocciole', 'pistacchi', 'anacardi', 'semi'],
    rules: { minFat: 40, minProtein: 10 }
  },
  GRASSI_CONDIMENTI: {
    name: 'Grassi e Condimenti',
    categories: ['grassi-condimenti', 'condimenti'],
    keywords: ['olio', 'burro', 'margarina', 'strutto', 'lardo'],
    rules: { minFat: 80, maxProtein: 2, maxCarbs: 2 }
  },
  BURRI_CREME: {
    name: 'Burri e Creme Spalmabili',
    categories: ['grassi-condimenti', 'condimenti'],
    keywords: ['burro arachidi', 'burro mandorle', 'tahini', 'crema nocciole'],
    rules: { minFat: 40, minProtein: 15, maxCarbs: 20 }
  },
  VERDURE: {
    name: 'Verdure',
    categories: ['verdure'],
    keywords: ['spinaci', 'broccoli', 'zucchine', 'pomodori', 'insalata', 'carote', 'peperoni'],
    rules: { maxCalories: 50, maxFat: 1, maxProtein: 5 }
  },
  DOLCI: {
    name: 'Dolci e Dessert',
    categories: ['dolci'],
    keywords: ['cioccolato', 'biscotti', 'torta', 'gelato', 'marmellata'],
    rules: { minCarbs: 40, minCalories: 200 }
  }
};

const determineNutritionalCategory = (food) => {
  const foodName = (food.nome || '').toLowerCase();
  const protein = food.proteine || 0;
  const carbs = food.carboidrati || 0;
  const fat = food.grassi || 0;
  const calories = food.kcal || 0;

  // Cerca match per keywords (più preciso)
  for (const [key, catData] of Object.entries(NUTRITIONAL_CATEGORIES)) {
    if (catData.keywords?.some(keyword => foodName.includes(keyword))) {
      return key;
    }
  }

  // Cerca match per categoria database
  for (const [key, catData] of Object.entries(NUTRITIONAL_CATEGORIES)) {
    if (catData.categories.includes(food.category)) {
      // Verifica che rispetti le regole della categoria
      const rules = catData.rules;
      const matches = 
        (!rules.minProtein || protein >= rules.minProtein) &&
        (!rules.maxProtein || protein <= rules.maxProtein) &&
        (!rules.minCarbs || carbs >= rules.minCarbs) &&
        (!rules.maxCarbs || carbs <= rules.maxCarbs) &&
        (!rules.minFat || fat >= rules.minFat) &&
        (!rules.maxFat || fat <= rules.maxFat) &&
        (!rules.minCalories || calories >= rules.minCalories) &&
        (!rules.maxCalories || calories <= rules.maxCalories);
      
      if (matches) return key;
    }
  }

  // Fallback: classificazione basata su macros dominanti con regole stringenti
  
  // Verdure (basse calorie, bassi grassi)
  if (calories < 50 && protein < 5 && fat < 1) return 'VERDURE';
  
  // Grassi puri
  if (fat > 80 && protein < 2 && carbs < 2) return 'GRASSI_CONDIMENTI';
  
  // Burri e creme
  if (fat > 40 && protein > 15) return 'BURRI_CREME';
  
  // Frutta secca
  if (fat > 40 && protein > 10 && carbs < 30) return 'FRUTTA_SECCA';
  
  // Cereali e pasta
  if (carbs > 60 && protein < 15 && fat < 5) return 'CEREALI_PASTA';
  
  // Pane
  if (carbs > 45 && carbs < 60 && protein < 12) return 'PANE';
  
  // Patate
  if (carbs > 15 && carbs < 25 && protein < 3 && fat < 1) return 'PATATE_TUBERI';
  
  // Frutta
  if (carbs > 8 && protein < 2 && fat < 1 && calories < 100) return 'FRUTTA_FRESCA';
  
  // Formaggi stagionati
  if (protein > 20 && fat > 20 && carbs < 5) return 'FORMAGGI_STAGIONATI';
  
  // Formaggi freschi
  if (protein > 8 && fat > 5 && carbs < 5) return 'FORMAGGI_FRESCHI';
  
  // Latticini magri
  if (protein > 3 && fat < 5 && carbs > 3) return 'LATTICINI_MAGRI';
  
  // Legumi
  if (protein > 6 && carbs > 15 && fat < 5) return 'LEGUMI';
  
  // Carni/Pesci
  if (protein > 18 && carbs < 2) {
    if (fat < 10) return 'CARNI_BIANCHE';
    if (fat > 10) return 'CARNI_ROSSE';
  }
  
  if (protein > 15 && carbs < 2) {
    if (fat < 5) return 'PESCE_MAGRO';
    if (fat > 5) return 'PESCE_GRASSO';
  }

  return 'ALTRO';
};

export default function SmartFoodSwapEnhanced({ 
  currentFood,
  currentGrams, 
  currentMacros,
  targetMacros, // Macros obiettivo del coach
  allowedVariance = 0.15, // ±15% di variazione consentita
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
  const [suggestedAlternatives, setSuggestedAlternatives] = useState([]);
  const [isValidSwap, setIsValidSwap] = useState(true);

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
        const foodData = {
          id: doc.id,
          nome: data.name || data.nome,
          kcal: data.calories || data.kcal,
          proteine: data.protein || data.proteine,
          carboidrati: data.carbs || data.carboidrati,
          grassi: data.fat || data.grassi,
          category: data.category,
          categoryName: data.categoryName
        };
        foodsList.push(foodData);
        if (data.category) categoriesSet.add(data.category);
      });
      
      // Determina la categoria nutrizionale dell'alimento corrente
      const currentFoodData = {
        nome: currentFood.nome,
        kcal: currentFood.kcal,
        proteine: currentFood.proteine,
        carboidrati: currentFood.carboidrati,
        grassi: currentFood.grassi,
        category: currentFood.category
      };
      
      const currentNutritionalCategory = determineNutritionalCategory(currentFoodData);
      
      // Filtra solo alimenti della stessa categoria nutrizionale
      const compatibleFoods = foodsList.filter(food => {
        const foodNutritionalCategory = determineNutritionalCategory(food);
        return foodNutritionalCategory === currentNutritionalCategory;
      });
      
      setFoods(compatibleFoods);
      
      // Estrai le categorie uniche dagli alimenti compatibili
      const compatibleCategories = new Set();
      compatibleFoods.forEach(food => {
        if (food.category) compatibleCategories.add(food.category);
      });
      setCategories(Array.from(compatibleCategories).sort());
      
      // Pre-seleziona il cibo attuale
      const current = compatibleFoods.find(f => f.nome === currentFood.nome);
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
    const warnings = [];
    const tolerance = allowedVariance;
    
    let validCount = 0;
    let totalChecks = 4;
    
    // Valida calorie (priorità massima)
    const caloriesMin = targetMacros.calories * (1 - tolerance);
    const caloriesMax = targetMacros.calories * (1 + tolerance);
    const caloriesValid = macros.calories >= caloriesMin && macros.calories <= caloriesMax;
    if (caloriesValid) {
      validCount++;
    } else {
      errors.push(`Calorie fuori range: ${Math.round(caloriesMin)}-${Math.round(caloriesMax)} kcal`);
    }
    
    // Valida proteine
    const proteinsMin = targetMacros.proteins * (1 - tolerance);
    const proteinsMax = targetMacros.proteins * (1 + tolerance);
    const proteinsValid = macros.proteins >= proteinsMin && macros.proteins <= proteinsMax;
    if (proteinsValid) {
      validCount++;
    } else {
      warnings.push(`Proteine: ${Math.round(proteinsMin)}-${Math.round(proteinsMax)}g (attuale: ${Math.round(macros.proteins)}g)`);
    }
    
    // Valida carboidrati
    const carbsMin = targetMacros.carbs * (1 - tolerance);
    const carbsMax = targetMacros.carbs * (1 + tolerance);
    const carbsValid = macros.carbs >= carbsMin && macros.carbs <= carbsMax;
    if (carbsValid) {
      validCount++;
    } else {
      warnings.push(`Carboidrati: ${Math.round(carbsMin)}-${Math.round(carbsMax)}g (attuale: ${Math.round(macros.carbs)}g)`);
    }
    
    // Valida grassi
    const fatsMin = targetMacros.fats * (1 - tolerance);
    const fatsMax = targetMacros.fats * (1 + tolerance);
    const fatsValid = macros.fats >= fatsMin && macros.fats <= fatsMax;
    if (fatsValid) {
      validCount++;
    } else {
      warnings.push(`Grassi: ${Math.round(fatsMin)}-${Math.round(fatsMax)}g (attuale: ${Math.round(macros.fats)}g)`);
    }
    
    // Sostituzione valida se:
    // 1. Le calorie sono nel range (priorità), oppure
    // 2. Almeno 3 su 4 macro sono nel range
    const isValid = caloriesValid || validCount >= 3;
    
    return {
      valid: isValid,
      errors: isValid ? [] : errors,
      warnings: isValid ? warnings : [], // Mostra warnings solo se valido
      validCount,
      totalChecks
    };
  };

  const findBestAlternatives = () => {
    // Trova i 3 alimenti più vicini ai macros target
    const alternatives = foods
      .filter(f => f.id !== selectedFood?.id) // Escludi quello selezionato
      .map(food => {
        const { neededGrams, macros } = calculateNewGramsAndMacros(food);
        const validation = validateMacrosInRange(macros);
        
        // Calcola "score" di vicinanza ai target
        const caloriesDiff = Math.abs(macros.calories - targetMacros.calories);
        const proteinsDiff = Math.abs(macros.proteins - targetMacros.proteins);
        const carbsDiff = Math.abs(macros.carbs - targetMacros.carbs);
        const fatsDiff = Math.abs(macros.fats - targetMacros.fats);
        const totalDiff = caloriesDiff + proteinsDiff + carbsDiff + fatsDiff;
        
        return {
          food,
          grams: neededGrams,
          macros,
          isValid: validation.valid,
          score: totalDiff
        };
      })
      .filter(alt => alt.isValid) // Solo alternative valide
      .sort((a, b) => a.score - b.score) // Ordina per vicinanza
      .slice(0, 3); // Prendi i migliori 3
    
    return alternatives;
  };

  const handleFoodChange = (food) => {
    const { neededGrams, macros } = calculateNewGramsAndMacros(food);
    const validation = validateMacrosInRange(macros);
    
    setSelectedFood(food);
    setCalculatedGrams(neededGrams);
    setNewMacros(macros);
    setIsValidSwap(validation.valid);
    
    // Mostra errori solo se non è valido, altrimenti mostra warnings se presenti
    if (!validation.valid) {
      setValidationError(validation.errors);
      const alternatives = findBestAlternatives();
      setSuggestedAlternatives(alternatives);
    } else {
      setValidationError(validation.warnings.length > 0 ? validation.warnings : null);
      setSuggestedAlternatives([]);
    }
  };

  const handleConfirm = () => {
    // Blocca solo se la sostituzione NON è valida (errori veri)
    if (!isValidSwap) {
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
                <p className="text-xs text-emerald-400 mt-1">
                  Categoria: {NUTRITIONAL_CATEGORIES[determineNutritionalCategory(currentFood)]?.name || 'Generale'}
                </p>
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

          {/* Info sulla categorizzazione */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Vengono mostrati solo alimenti compatibili della categoria "{NUTRITIONAL_CATEGORIES[determineNutritionalCategory(currentFood)]?.name}". 
              Questo garantisce sostituzioni nutrizionalmente sensate.
            </p>
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
                    <div className={`mt-3 space-y-2 ${suggestedAlternatives.length > 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'} rounded-lg p-3`}>
                      <p className={`text-sm font-medium ${suggestedAlternatives.length > 0 ? 'text-red-400' : 'text-amber-400'}`}>
                        {suggestedAlternatives.length > 0 ? '⚠️ Macros fuori range' : 'ℹ️ Nota sui macros'}
                      </p>
                      {validationError.map((err, idx) => (
                        <p key={idx} className={`text-xs ${suggestedAlternatives.length > 0 ? 'text-red-300' : 'text-amber-300'}`}>• {err}</p>
                      ))}
                      {suggestedAlternatives.length === 0 && (
                        <p className="text-xs text-slate-400 mt-2">
                          ✅ Sostituzione valida, ma alcuni macro non sono perfettamente centrati (entro ±{allowedVariance * 100}%)
                        </p>
                      )}
                      {suggestedAlternatives.length > 0 && (
                        <p className="text-xs text-slate-400 mt-2">
                          Il tuo coach ha impostato un limite del ±{allowedVariance * 100}% sui macros
                        </p>
                      )}
                      
                      {/* Suggested Alternatives */}
                      {suggestedAlternatives.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-red-400/30">
                          <p className="text-sm font-medium text-emerald-400 mb-2">💡 Consigliati invece:</p>
                          <div className="space-y-2">
                            {suggestedAlternatives.map((alt, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleFoodChange(alt.food)}
                                className="w-full p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors text-left"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-slate-100">{alt.food.nome}</p>
                                    <p className="text-xs text-slate-400">{alt.grams}g</p>
                                  </div>
                                  <div className="text-right text-xs">
                                    <div className="flex gap-2">
                                      <span className="text-slate-300">{alt.macros.calories}kcal</span>
                                      <span className="text-blue-400">P:{alt.macros.proteins}g</span>
                                      <span className="text-amber-400">C:{alt.macros.carbs}g</span>
                                      <span className="text-rose-400">F:{alt.macros.fats}g</span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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
              disabled={!selectedFood || !isValidSwap}
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
