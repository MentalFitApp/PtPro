import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, X, Info, ChevronDown, Search, AlertTriangle, Star, Clock, Sparkles, TrendingUp, Filter } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { getTenantSubcollection, CURRENT_TENANT_ID } from '../config/tenant';
import { useToast } from '../contexts/ToastContext';

/**
 * Smart Food Swap Enhanced Component v2.0
 * 
 * MIGLIORAMENTI:
 * - Caching alimenti in memoria (evita ricaricamenti)
 * - Algoritmo match intelligente con score 0-100%
 * - Considera allergie/intolleranze del cliente
 * - Ricerca fuzzy (trova anche con typo)
 * - Ottimizzazione grammi (arrotondamento umano)
 * - Storico sostituzioni recenti
 * - Ordinamento per "best fit"
 */

// === CACHE GLOBALE ALIMENTI ===
let foodsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minuti

// === CATEGORIE NUTRIZIONALI ===
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

// === PAROLE CHIAVE ALLERGIE/INTOLLERANZE ===
const ALLERGY_KEYWORDS = {
  'lattosio': ['latte', 'latticini', 'yogurt', 'formaggio', 'mozzarella', 'ricotta', 'panna', 'burro', 'gelato'],
  'glutine': ['pasta', 'pane', 'farina', 'grano', 'orzo', 'segale', 'farro', 'crackers', 'biscotti', 'pizza'],
  'uova': ['uova', 'uovo', 'albume', 'tuorlo', 'maionese'],
  'frutta a guscio': ['noci', 'mandorle', 'nocciole', 'pistacchi', 'anacardi', 'arachidi'],
  'arachidi': ['arachidi', 'burro di arachidi'],
  'soia': ['soia', 'tofu', 'edamame', 'tempeh', 'latte di soia'],
  'pesce': ['pesce', 'salmone', 'tonno', 'merluzzo', 'orata', 'branzino', 'sgombro'],
  'crostacei': ['gamberi', 'aragosta', 'granchio', 'scampi', 'astice'],
  'molluschi': ['cozze', 'vongole', 'calamari', 'polpo', 'seppia', 'ostriche'],
  'sedano': ['sedano'],
  'senape': ['senape'],
  'sesamo': ['sesamo', 'tahini'],
};

// === FUNZIONI UTILITY ===

// Ricerca Fuzzy - trova match anche con typo
const fuzzyMatch = (text, pattern) => {
  if (!text || !pattern) return false;
  const textLower = text.toLowerCase();
  const patternLower = pattern.toLowerCase();
  
  // Match esatto
  if (textLower.includes(patternLower)) return true;
  
  // Varianti comuni
  const variants = {
    'yogurt': ['yoghurt', 'iogurt'],
    'pollo': ['polo', 'polletto'],
    'tacchino': ['tachino'],
    'mozzarella': ['mozarella', 'mozzerella'],
    'parmigiano': ['parmigiano reggiano', 'grana'],
    'prosciutto': ['proscuitto', 'prosciuto'],
  };
  
  for (const [key, alts] of Object.entries(variants)) {
    if (patternLower === key || alts.some(a => patternLower.includes(a))) {
      if (textLower.includes(key) || alts.some(a => textLower.includes(a))) {
        return true;
      }
    }
  }
  
  // Levenshtein distance semplificato per typo
  if (patternLower.length >= 4) {
    let matches = 0;
    for (let i = 0; i < patternLower.length; i++) {
      if (textLower.includes(patternLower[i])) matches++;
    }
    if (matches / patternLower.length >= 0.7) {
      let lastIdx = -1;
      let orderedMatches = 0;
      for (const char of patternLower) {
        const idx = textLower.indexOf(char, lastIdx + 1);
        if (idx > lastIdx) {
          orderedMatches++;
          lastIdx = idx;
        }
      }
      if (orderedMatches / patternLower.length >= 0.6) return true;
    }
  }
  
  return false;
};

// Determina categoria nutrizionale
const determineNutritionalCategory = (food) => {
  const foodName = (food.nome || '').toLowerCase();
  const protein = food.proteine || 0;
  const carbs = food.carboidrati || 0;
  const fat = food.grassi || 0;
  const calories = food.kcal || 0;

  // Cerca match per keywords
  for (const [key, catData] of Object.entries(NUTRITIONAL_CATEGORIES)) {
    if (catData.keywords?.some(keyword => foodName.includes(keyword))) {
      return key;
    }
  }

  // Cerca match per categoria database
  for (const [key, catData] of Object.entries(NUTRITIONAL_CATEGORIES)) {
    if (catData.categories.includes(food.category)) {
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

  // Fallback basato su macros
  if (calories < 50 && protein < 5 && fat < 1) return 'VERDURE';
  if (fat > 80 && protein < 2 && carbs < 2) return 'GRASSI_CONDIMENTI';
  if (fat > 40 && protein > 15) return 'BURRI_CREME';
  if (fat > 40 && protein > 10 && carbs < 30) return 'FRUTTA_SECCA';
  if (carbs > 60 && protein < 15 && fat < 5) return 'CEREALI_PASTA';
  if (carbs > 45 && carbs < 60 && protein < 12) return 'PANE';
  if (carbs > 15 && carbs < 25 && protein < 3 && fat < 1) return 'PATATE_TUBERI';
  if (carbs > 8 && protein < 2 && fat < 1 && calories < 100) return 'FRUTTA_FRESCA';
  if (protein > 20 && fat > 20 && carbs < 5) return 'FORMAGGI_STAGIONATI';
  if (protein > 8 && fat > 5 && carbs < 5) return 'FORMAGGI_FRESCHI';
  if (protein > 3 && fat < 5 && carbs > 3) return 'LATTICINI_MAGRI';
  if (protein > 6 && carbs > 15 && fat < 5) return 'LEGUMI';
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

// Controlla se un alimento contiene allergeni
const containsAllergen = (foodName, allergyText) => {
  if (!allergyText || allergyText.toLowerCase() === 'nessuna') return false;
  
  const foodLower = foodName.toLowerCase();
  const allergyLower = allergyText.toLowerCase();
  
  for (const [allergen, keywords] of Object.entries(ALLERGY_KEYWORDS)) {
    if (allergyLower.includes(allergen)) {
      if (keywords.some(kw => foodLower.includes(kw))) {
        return true;
      }
    }
  }
  
  // Check diretto per parole nell'allergia
  const allergyWords = allergyLower.split(/[,\s]+/).filter(w => w.length > 2);
  for (const word of allergyWords) {
    if (foodLower.includes(word)) return true;
  }
  
  return false;
};

// Arrotonda grammi a quantità umane
const roundToHumanQuantity = (grams) => {
  if (grams <= 20) return Math.round(grams / 5) * 5;
  if (grams <= 50) return Math.round(grams / 5) * 5;
  if (grams <= 100) return Math.round(grams / 10) * 10;
  if (grams <= 250) return Math.round(grams / 25) * 25;
  return Math.round(grams / 50) * 50;
};

// Calcola score di compatibilità (0-100)
const calculateMatchScore = (food, targetMacros, neededGrams) => {
  const gramsRatio = neededGrams / 100;
  const macros = {
    calories: (food.kcal || 0) * gramsRatio,
    proteins: (food.proteine || 0) * gramsRatio,
    carbs: (food.carboidrati || 0) * gramsRatio,
    fats: (food.grassi || 0) * gramsRatio,
  };
  
  const caloriesDiff = Math.abs(macros.calories - targetMacros.calories) / (targetMacros.calories || 1);
  const proteinsDiff = Math.abs(macros.proteins - targetMacros.proteins) / (targetMacros.proteins || 1);
  const carbsDiff = Math.abs(macros.carbs - targetMacros.carbs) / (targetMacros.carbs || 1);
  const fatsDiff = Math.abs(macros.fats - targetMacros.fats) / (targetMacros.fats || 1);
  
  const weightedDiff = (caloriesDiff * 0.35) + (proteinsDiff * 0.30) + (carbsDiff * 0.20) + (fatsDiff * 0.15);
  const score = Math.max(0, Math.round((1 - weightedDiff) * 100));
  
  return score;
};

// === COMPONENTE PRINCIPALE ===
export default function SmartFoodSwapEnhanced({ 
  currentFood,
  currentGrams, 
  currentMacros,
  targetMacros,
  allowedVariance = 0.15,
  mealDay,
  mealName,
  onSwap,
  onCancel 
}) {
  const toast = useToast();
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
  const [clientIntolerances, setClientIntolerances] = useState('');
  const [clientDislikedFoods, setClientDislikedFoods] = useState('');
  const [recentSwaps, setRecentSwaps] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('score');

  const currentNutritionalCategory = useMemo(() => 
    determineNutritionalCategory(currentFood), 
    [currentFood]
  );

  const calculateNewGramsAndMacros = useCallback((food) => {
    const targetCalories = targetMacros?.calories || currentMacros.calories;
    const caloriesPer100g = food.kcal || 1;
    let neededGrams = Math.round((targetCalories / caloriesPer100g) * 100);
    
    neededGrams = roundToHumanQuantity(neededGrams);
    neededGrams = Math.max(10, Math.min(500, neededGrams));
    
    const gramsRatio = neededGrams / 100;
    const macros = {
      calories: Math.round((food.kcal || 0) * gramsRatio),
      proteins: Math.round((food.proteine || 0) * gramsRatio * 10) / 10,
      carbs: Math.round((food.carboidrati || 0) * gramsRatio * 10) / 10,
      fats: Math.round((food.grassi || 0) * gramsRatio * 10) / 10,
    };
    
    return { neededGrams, macros };
  }, [targetMacros, currentMacros]);

  const validateMacrosInRange = useCallback((macros) => {
    if (!targetMacros) return { valid: true };
    
    const errors = [];
    const warnings = [];
    const tolerance = allowedVariance;
    
    let validCount = 0;
    
    const caloriesMin = targetMacros.calories * (1 - tolerance);
    const caloriesMax = targetMacros.calories * (1 + tolerance);
    const caloriesValid = macros.calories >= caloriesMin && macros.calories <= caloriesMax;
    if (caloriesValid) validCount++;
    else errors.push(`Calorie: ${Math.round(caloriesMin)}-${Math.round(caloriesMax)} kcal (attuale: ${macros.calories})`);
    
    const proteinsMin = targetMacros.proteins * (1 - tolerance);
    const proteinsMax = targetMacros.proteins * (1 + tolerance);
    if (macros.proteins >= proteinsMin && macros.proteins <= proteinsMax) validCount++;
    else warnings.push(`Proteine: ${proteinsMin.toFixed(1)}-${proteinsMax.toFixed(1)}g (attuale: ${macros.proteins}g)`);
    
    const carbsMin = targetMacros.carbs * (1 - tolerance);
    const carbsMax = targetMacros.carbs * (1 + tolerance);
    if (macros.carbs >= carbsMin && macros.carbs <= carbsMax) validCount++;
    else warnings.push(`Carboidrati: ${carbsMin.toFixed(1)}-${carbsMax.toFixed(1)}g (attuale: ${macros.carbs}g)`);
    
    const fatsMin = targetMacros.fats * (1 - tolerance);
    const fatsMax = targetMacros.fats * (1 + tolerance);
    if (macros.fats >= fatsMin && macros.fats <= fatsMax) validCount++;
    else warnings.push(`Grassi: ${fatsMin.toFixed(1)}-${fatsMax.toFixed(1)}g (attuale: ${macros.fats}g)`);
    
    const isValid = caloriesValid || validCount >= 3;
    
    return {
      valid: isValid,
      errors: isValid ? [] : errors,
      warnings: isValid ? warnings : [],
      validCount
    };
  }, [targetMacros, allowedVariance]);

  const processAndSetFoods = useCallback((foodsList) => {
    const compatibleFoods = foodsList.filter(food => {
      const foodCategory = determineNutritionalCategory(food);
      return foodCategory === currentNutritionalCategory;
    });
    
    const safeFoods = compatibleFoods.filter(food => {
      const hasAllergen = containsAllergen(food.nome, clientIntolerances);
      const isDisliked = clientDislikedFoods && food.nome.toLowerCase().includes(clientDislikedFoods.toLowerCase());
      return !hasAllergen && !isDisliked;
    });
    
    const foodsWithScore = safeFoods.map(food => {
      const { neededGrams } = calculateNewGramsAndMacros(food);
      const score = calculateMatchScore(food, targetMacros || currentMacros, neededGrams);
      return { ...food, matchScore: score };
    });
    
    setFoods(foodsWithScore);
    
    const categoriesSet = new Set();
    foodsWithScore.forEach(food => {
      if (food.category) categoriesSet.add(food.category);
    });
    setCategories(Array.from(categoriesSet).sort());
    
    const current = foodsWithScore.find(f => f.nome === currentFood.nome);
    if (current) {
      setSelectedFood(current);
      const { neededGrams, macros } = calculateNewGramsAndMacros(current);
      setCalculatedGrams(neededGrams);
      setNewMacros(macros);
      const validation = validateMacrosInRange(macros);
      setIsValidSwap(validation.valid);
      if (!validation.valid) {
        setValidationError(validation.errors);
      }
    } else if (foodsWithScore.length > 0) {
      const sorted = [...foodsWithScore].sort((a, b) => b.matchScore - a.matchScore);
      setSuggestedAlternatives(sorted.slice(0, 3).map(f => {
        const { neededGrams, macros } = calculateNewGramsAndMacros(f);
        return { food: f, grams: neededGrams, macros, score: f.matchScore };
      }));
    }
  }, [currentNutritionalCategory, clientIntolerances, clientDislikedFoods, targetMacros, currentMacros, currentFood, calculateNewGramsAndMacros, validateMacrosInRange]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carica alimenti (con cache)
      await loadFoods();
      
      // Carica anamnesi del client per allergie
      const user = auth.currentUser;
      if (user) {
        try {
          const initialRef = doc(db, `tenants/${CURRENT_TENANT_ID}/clients/${user.uid}/anamnesi/initial`);
          const initialSnap = await getDoc(initialRef);
          
          if (initialSnap.exists()) {
            const anamData = initialSnap.data();
            setClientIntolerances(anamData.intolerances || anamData.allergie || anamData.intolleranze || '');
            setClientDislikedFoods(anamData.dislikedFoods || anamData.cibiEvitare || '');
          }
        } catch (err) {
          console.debug('Anamnesi non trovata:', err);
        }
        
        // Carica storico sostituzioni recenti da localStorage
        const swapHistoryKey = `food_swaps_${user.uid}`;
        const history = JSON.parse(localStorage.getItem(swapHistoryKey) || '[]');
        setRecentSwaps(history.slice(0, 5));
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    }
    setLoading(false);
  };

  const loadFoods = async () => {
    const now = Date.now();
    if (foodsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      processAndSetFoods(foodsCache);
      return;
    }
    
    try {
      const foodsRef = collection(db, 'platform_foods');
      const snapshot = await getDocs(foodsRef);
      
      const foodsList = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        foodsList.push({
          id: docSnap.id,
          nome: data.name || data.nome,
          kcal: data.calories || data.kcal,
          proteine: data.protein || data.proteine,
          carboidrati: data.carbs || data.carboidrati,
          grassi: data.fat || data.grassi,
          category: data.category,
          categoryName: data.categoryName
        });
      });
      
      foodsCache = foodsList;
      cacheTimestamp = now;
      
      processAndSetFoods(foodsList);
    } catch (error) {
      console.error('Errore caricamento alimenti:', error);
    }
  };

  useEffect(() => {
    if (foodsCache && !loading) {
      processAndSetFoods(foodsCache);
    }
  }, [clientIntolerances, clientDislikedFoods, processAndSetFoods, loading]);

  const handleFoodChange = useCallback((food) => {
    const { neededGrams, macros } = calculateNewGramsAndMacros(food);
    const validation = validateMacrosInRange(macros);
    
    setSelectedFood(food);
    setCalculatedGrams(neededGrams);
    setNewMacros(macros);
    setIsValidSwap(validation.valid);
    
    if (!validation.valid) {
      setValidationError(validation.errors);
      const alternatives = foods
        .filter(f => f.id !== food.id)
        .map(f => {
          const { neededGrams: g, macros: m } = calculateNewGramsAndMacros(f);
          const v = validateMacrosInRange(m);
          return { food: f, grams: g, macros: m, isValid: v.valid, score: f.matchScore };
        })
        .filter(a => a.isValid)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      setSuggestedAlternatives(alternatives);
    } else {
      setValidationError(validation.warnings.length > 0 ? validation.warnings : null);
      setSuggestedAlternatives([]);
    }
  }, [foods, calculateNewGramsAndMacros, validateMacrosInRange]);

  const handleConfirm = () => {
    if (!isValidSwap) {
      toast.error('Impossibile salvare: macros fuori range.\n\n' + validationError?.join('\n'));
      return;
    }

    const user = auth.currentUser;
    if (user) {
      const swapHistoryKey = `food_swaps_${user.uid}`;
      const history = JSON.parse(localStorage.getItem(swapHistoryKey) || '[]');
      const newSwap = {
        from: currentFood.nome,
        to: selectedFood.nome,
        grams: calculatedGrams,
        date: new Date().toISOString(),
        meal: mealName
      };
      history.unshift(newSwap);
      localStorage.setItem(swapHistoryKey, JSON.stringify(history.slice(0, 20)));
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

  const filteredFoods = useMemo(() => {
    let result = foods.filter(food => {
      const matchesSearch = searchTerm === '' || fuzzyMatch(food.nome, searchTerm);
      const matchesCategory = selectedCategory === '' || food.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    if (sortBy === 'score') {
      result.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (sortBy === 'calories') {
      result.sort((a, b) => a.kcal - b.kcal);
    }
    
    return result;
  }, [foods, searchTerm, selectedCategory, sortBy]);

  const macroDifference = useMemo(() => ({
    calories: newMacros.calories - currentMacros.calories,
    proteins: Math.round((newMacros.proteins - currentMacros.proteins) * 10) / 10,
    carbs: Math.round((newMacros.carbs - currentMacros.carbs) * 10) / 10,
    fats: Math.round((newMacros.fats - currentMacros.fats) * 10) / 10,
  }), [newMacros, currentMacros]);

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
        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 p-4 sm:p-6 border-b border-slate-700 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="text-rose-400" size={24} />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100">Sostituisci Alimento</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {mealName} - {mealDay}
                </p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Alimento Corrente */}
          <div className="bg-slate-900/50 rounded-xl p-3 sm:p-4 border border-slate-700">
            <p className="text-xs sm:text-sm text-slate-400 mb-2">Alimento attuale:</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-base sm:text-lg font-semibold text-slate-100">{currentFood.nome}</p>
                <p className="text-xs sm:text-sm text-slate-400">{currentGrams}g</p>
                <p className="text-xs text-emerald-400 mt-1">
                  Categoria: {NUTRITIONAL_CATEGORIES[currentNutritionalCategory]?.name || 'Generale'}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500">Macros target:</p>
                <div className="flex gap-2 sm:gap-3 mt-1 text-xs">
                  <span className="text-slate-300">{currentMacros.calories} kcal</span>
                  <span className="text-blue-400">P: {currentMacros.proteins}g</span>
                  <span className="text-amber-400">C: {currentMacros.carbs}g</span>
                  <span className="text-rose-400">F: {currentMacros.fats}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Allergie */}
          {clientIntolerances && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                Esclusi alimenti con: {clientIntolerances}
              </p>
            </div>
          )}

          {/* Info Categoria */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Mostrati solo alimenti compatibili "{NUTRITIONAL_CATEGORIES[currentNutritionalCategory]?.name}".
              Ordinati per compatibilità macro.
            </p>
          </div>

          {/* Sostituzioni Recenti */}
          {recentSwaps.length > 0 && (
            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                <Clock size={12} /> Sostituzioni recenti:
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSwaps.slice(0, 3).map((swap, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const food = foods.find(f => f.nome === swap.to);
                      if (food) handleFoodChange(food);
                    }}
                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                  >
                    {swap.to}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Cerca alimento (anche con errori)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-rose-500/20 border-rose-500' : 'bg-slate-900 border-slate-700'}`}
              >
                <Filter size={18} className={showFilters ? 'text-rose-400' : 'text-slate-400'} />
              </button>
            </div>
            
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="grid grid-cols-2 gap-3"
              >
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="">Tutte le categorie</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="score">⭐ Migliore match</option>
                  <option value="name">A-Z Nome</option>
                  <option value="calories">🔥 Calorie</option>
                </select>
              </motion.div>
            )}
          </div>

          {/* Foods List */}
          <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-2">
            {filteredFoods.length === 0 ? (
              <p className="text-center text-slate-400 py-8">
                Nessun alimento trovato. Prova con un altro termine.
              </p>
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-100 truncate">{food.nome}</p>
                        {food.matchScore >= 90 && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> Top
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{food.category || 'N/D'}</p>
                    </div>
                    <div className="text-right text-xs flex-shrink-0">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp size={12} className={food.matchScore >= 80 ? 'text-emerald-400' : food.matchScore >= 60 ? 'text-amber-400' : 'text-slate-400'} />
                        <span className={food.matchScore >= 80 ? 'text-emerald-400' : food.matchScore >= 60 ? 'text-amber-400' : 'text-slate-400'}>
                          {food.matchScore}%
                        </span>
                      </div>
                      <p className="text-slate-300">{food.kcal} kcal/100g</p>
                      <div className="flex gap-1 mt-1">
                        <span className="text-blue-400">P:{food.proteine}</span>
                        <span className="text-amber-400">C:{food.carboidrati}</span>
                        <span className="text-rose-400">F:{food.grassi}</span>
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
              !isValidSwap 
                ? 'bg-red-500/10 border-red-500' 
                : 'bg-emerald-500/10 border-emerald-500'
            }`}>
              <div className="flex items-start gap-3">
                {!isValidSwap ? (
                  <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
                ) : (
                  <Check className="text-emerald-400 flex-shrink-0" size={20} />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-100 mb-1">Nuovo alimento:</p>
                  <p className="text-lg font-bold text-slate-100">{selectedFood.nome} - {calculatedGrams}g</p>
                  
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-3">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-400">Calorie</p>
                      <p className="text-sm sm:text-lg font-bold text-slate-100">{newMacros.calories}</p>
                      <p className={`text-[10px] sm:text-xs ${macroDifference.calories >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroDifference.calories >= 0 ? '+' : ''}{macroDifference.calories}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-400">Proteine</p>
                      <p className="text-sm sm:text-lg font-bold text-blue-400">{newMacros.proteins}g</p>
                      <p className={`text-[10px] sm:text-xs ${macroDifference.proteins >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroDifference.proteins >= 0 ? '+' : ''}{macroDifference.proteins}g
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-400">Carbo</p>
                      <p className="text-sm sm:text-lg font-bold text-amber-400">{newMacros.carbs}g</p>
                      <p className={`text-[10px] sm:text-xs ${macroDifference.carbs >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroDifference.carbs >= 0 ? '+' : ''}{macroDifference.carbs}g
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-400">Grassi</p>
                      <p className="text-sm sm:text-lg font-bold text-rose-400">{newMacros.fats}g</p>
                      <p className={`text-[10px] sm:text-xs ${macroDifference.fats >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroDifference.fats >= 0 ? '+' : ''}{macroDifference.fats}g
                      </p>
                    </div>
                  </div>

                  {validationError && validationError.length > 0 && (
                    <div className={`mt-3 p-3 rounded-lg ${!isValidSwap ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                      <p className={`text-xs font-medium ${!isValidSwap ? 'text-red-400' : 'text-amber-400'} mb-1`}>
                        {!isValidSwap ? '⚠️ Macros fuori range' : 'ℹ️ Nota'}
                      </p>
                      {validationError.map((err, idx) => (
                        <p key={idx} className="text-xs text-slate-300">• {err}</p>
                      ))}
                      
                      {suggestedAlternatives.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <p className="text-xs font-medium text-emerald-400 mb-2">💡 Alternative consigliate:</p>
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
                                    <p className="text-xs text-slate-400">{alt.grams}g • Score: {alt.score}%</p>
                                  </div>
                                  <div className="text-right text-xs flex gap-2">
                                    <span className="text-slate-300">{alt.macros.calories}kcal</span>
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
              <p className="text-xs text-slate-400">La sostituzione verrà applicata a tutta la settimana</p>
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
              Conferma
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
