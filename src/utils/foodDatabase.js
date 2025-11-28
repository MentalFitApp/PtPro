/**
 * Food Database with Macronutrients
 * Comprehensive database of common foods with macros per 100g
 * Used for smart meal swap with automatic macro calculation
 */

export const FOOD_CATEGORIES = {
  CARBS: 'Carboidrati',
  PROTEINS: 'Proteine',
  FATS: 'Grassi',
  VEGETABLES: 'Verdure',
  FRUITS: 'Frutta',
  DAIRY: 'Latticini',
  SUPPLEMENTS: 'Integratori',
};

// Macros structure: { calories, proteins, carbs, fats } per 100g
export const FOOD_DATABASE = [
  // CARBOIDRATI
  { id: 'pasta', name: 'Pasta (secca)', category: 'CARBS', macros: { calories: 350, proteins: 12, carbs: 70, fats: 1.5 } },
  { id: 'pasta_integrale', name: 'Pasta integrale', category: 'CARBS', macros: { calories: 340, proteins: 13, carbs: 67, fats: 2.5 } },
  { id: 'riso_bianco', name: 'Riso bianco', category: 'CARBS', macros: { calories: 350, proteins: 7, carbs: 77, fats: 0.5 } },
  { id: 'riso_integrale', name: 'Riso integrale', category: 'CARBS', macros: { calories: 360, proteins: 7.5, carbs: 76, fats: 3 } },
  { id: 'riso_basmati', name: 'Riso basmati', category: 'CARBS', macros: { calories: 350, proteins: 8, carbs: 77, fats: 1 } },
  { id: 'riso_venere', name: 'Riso venere', category: 'CARBS', macros: { calories: 370, proteins: 9, carbs: 75, fats: 2.5 } },
  { id: 'quinoa', name: 'Quinoa', category: 'CARBS', macros: { calories: 370, proteins: 14, carbs: 64, fats: 6 } },
  { id: 'farro', name: 'Farro', category: 'CARBS', macros: { calories: 335, proteins: 15, carbs: 67, fats: 2.5 } },
  { id: 'orzo', name: 'Orzo', category: 'CARBS', macros: { calories: 350, proteins: 10, carbs: 73, fats: 1.5 } },
  { id: 'couscous', name: 'Couscous', category: 'CARBS', macros: { calories: 370, proteins: 13, carbs: 72, fats: 1.5 } },
  { id: 'pane_bianco', name: 'Pane bianco', category: 'CARBS', macros: { calories: 265, proteins: 9, carbs: 50, fats: 3 } },
  { id: 'pane_integrale', name: 'Pane integrale', category: 'CARBS', macros: { calories: 247, proteins: 11, carbs: 45, fats: 4 } },
  { id: 'patate', name: 'Patate', category: 'CARBS', macros: { calories: 77, proteins: 2, carbs: 17, fats: 0.1 } },
  { id: 'patate_dolci', name: 'Patate dolci', category: 'CARBS', macros: { calories: 86, proteins: 1.6, carbs: 20, fats: 0.1 } },
  { id: 'avena', name: 'Avena', category: 'CARBS', macros: { calories: 389, proteins: 17, carbs: 66, fats: 7 } },
  
  // PROTEINE
  { id: 'pollo_petto', name: 'Petto di pollo', category: 'PROTEINS', macros: { calories: 165, proteins: 31, carbs: 0, fats: 3.6 } },
  { id: 'pollo_coscia', name: 'Coscia di pollo', category: 'PROTEINS', macros: { calories: 209, proteins: 26, carbs: 0, fats: 11 } },
  { id: 'tacchino_petto', name: 'Petto di tacchino', category: 'PROTEINS', macros: { calories: 135, proteins: 30, carbs: 0, fats: 1 } },
  { id: 'manzo_magro', name: 'Manzo magro', category: 'PROTEINS', macros: { calories: 250, proteins: 26, carbs: 0, fats: 15 } },
  { id: 'vitello', name: 'Vitello', category: 'PROTEINS', macros: { calories: 172, proteins: 31, carbs: 0, fats: 5 } },
  { id: 'maiale_lonza', name: 'Lonza di maiale', category: 'PROTEINS', macros: { calories: 143, proteins: 27, carbs: 0, fats: 3.5 } },
  { id: 'salmone', name: 'Salmone', category: 'PROTEINS', macros: { calories: 208, proteins: 20, carbs: 0, fats: 13 } },
  { id: 'tonno', name: 'Tonno (fresco)', category: 'PROTEINS', macros: { calories: 144, proteins: 23, carbs: 0, fats: 5 } },
  { id: 'tonno_scatola', name: 'Tonno in scatola', category: 'PROTEINS', macros: { calories: 116, proteins: 26, carbs: 0, fats: 1 } },
  { id: 'merluzzo', name: 'Merluzzo', category: 'PROTEINS', macros: { calories: 82, proteins: 18, carbs: 0, fats: 0.7 } },
  { id: 'orata', name: 'Orata', category: 'PROTEINS', macros: { calories: 121, proteins: 20, carbs: 0, fats: 4 } },
  { id: 'branzino', name: 'Branzino', category: 'PROTEINS', macros: { calories: 135, proteins: 23, carbs: 0, fats: 4.5 } },
  { id: 'gamberi', name: 'Gamberi', category: 'PROTEINS', macros: { calories: 99, proteins: 24, carbs: 0, fats: 0.3 } },
  { id: 'uova', name: 'Uova intere', category: 'PROTEINS', macros: { calories: 155, proteins: 13, carbs: 1.1, fats: 11 } },
  { id: 'albumi', name: 'Albumi', category: 'PROTEINS', macros: { calories: 52, proteins: 11, carbs: 0.7, fats: 0.2 } },
  { id: 'bresaola', name: 'Bresaola', category: 'PROTEINS', macros: { calories: 151, proteins: 32, carbs: 0, fats: 2.6 } },
  { id: 'prosciutto_crudo', name: 'Prosciutto crudo', category: 'PROTEINS', macros: { calories: 145, proteins: 26, carbs: 0, fats: 4.5 } },
  { id: 'tofu', name: 'Tofu', category: 'PROTEINS', macros: { calories: 76, proteins: 8, carbs: 1.9, fats: 4.8 } },
  { id: 'seitan', name: 'Seitan', category: 'PROTEINS', macros: { calories: 370, proteins: 75, carbs: 14, fats: 2 } },
  
  // LATTICINI
  { id: 'latte_scremato', name: 'Latte scremato', category: 'DAIRY', macros: { calories: 34, proteins: 3.4, carbs: 5, fats: 0.1 } },
  { id: 'latte_intero', name: 'Latte intero', category: 'DAIRY', macros: { calories: 64, proteins: 3.2, carbs: 5, fats: 3.6 } },
  { id: 'yogurt_greco', name: 'Yogurt greco 0%', category: 'DAIRY', macros: { calories: 59, proteins: 10, carbs: 3.6, fats: 0.4 } },
  { id: 'yogurt_intero', name: 'Yogurt intero', category: 'DAIRY', macros: { calories: 61, proteins: 3.5, carbs: 4.7, fats: 3.3 } },
  { id: 'ricotta', name: 'Ricotta vaccina', category: 'DAIRY', macros: { calories: 174, proteins: 11, carbs: 3, fats: 13 } },
  { id: 'fiocchi_latte', name: 'Fiocchi di latte', category: 'DAIRY', macros: { calories: 98, proteins: 11, carbs: 3.4, fats: 4.3 } },
  { id: 'mozzarella', name: 'Mozzarella', category: 'DAIRY', macros: { calories: 280, proteins: 19, carbs: 2.2, fats: 22 } },
  { id: 'parmigiano', name: 'Parmigiano', category: 'DAIRY', macros: { calories: 392, proteins: 33, carbs: 0, fats: 28 } },
  { id: 'philadelphia', name: 'Philadelphia light', category: 'DAIRY', macros: { calories: 160, proteins: 8, carbs: 5, fats: 12 } },
  
  // GRASSI BUONI
  { id: 'olio_oliva', name: 'Olio d\'oliva', category: 'FATS', macros: { calories: 884, proteins: 0, carbs: 0, fats: 100 } },
  { id: 'avocado', name: 'Avocado', category: 'FATS', macros: { calories: 160, proteins: 2, carbs: 9, fats: 15 } },
  { id: 'mandorle', name: 'Mandorle', category: 'FATS', macros: { calories: 579, proteins: 21, carbs: 22, fats: 50 } },
  { id: 'noci', name: 'Noci', category: 'FATS', macros: { calories: 654, proteins: 15, carbs: 14, fats: 65 } },
  { id: 'nocciole', name: 'Nocciole', category: 'FATS', macros: { calories: 628, proteins: 15, carbs: 17, fats: 61 } },
  { id: 'burro_arachidi', name: 'Burro di arachidi', category: 'FATS', macros: { calories: 588, proteins: 25, carbs: 20, fats: 50 } },
  { id: 'burro_mandorle', name: 'Burro di mandorle', category: 'FATS', macros: { calories: 614, proteins: 21, carbs: 21, fats: 56 } },
  
  // VERDURE
  { id: 'broccoli', name: 'Broccoli', category: 'VEGETABLES', macros: { calories: 34, proteins: 2.8, carbs: 7, fats: 0.4 } },
  { id: 'spinaci', name: 'Spinaci', category: 'VEGETABLES', macros: { calories: 23, proteins: 2.9, carbs: 3.6, fats: 0.4 } },
  { id: 'zucchine', name: 'Zucchine', category: 'VEGETABLES', macros: { calories: 17, proteins: 1.2, carbs: 3.1, fats: 0.3 } },
  { id: 'pomodori', name: 'Pomodori', category: 'VEGETABLES', macros: { calories: 18, proteins: 0.9, carbs: 3.9, fats: 0.2 } },
  { id: 'peperoni', name: 'Peperoni', category: 'VEGETABLES', macros: { calories: 31, proteins: 1, carbs: 6, fats: 0.3 } },
  { id: 'carote', name: 'Carote', category: 'VEGETABLES', macros: { calories: 41, proteins: 0.9, carbs: 10, fats: 0.2 } },
  { id: 'fagiolini', name: 'Fagiolini', category: 'VEGETABLES', macros: { calories: 31, proteins: 1.8, carbs: 7, fats: 0.1 } },
  { id: 'insalata', name: 'Insalata (lattuga)', category: 'VEGETABLES', macros: { calories: 15, proteins: 1.4, carbs: 2.9, fats: 0.2 } },
  { id: 'rucola', name: 'Rucola', category: 'VEGETABLES', macros: { calories: 25, proteins: 2.6, carbs: 3.7, fats: 0.7 } },
  { id: 'asparagi', name: 'Asparagi', category: 'VEGETABLES', macros: { calories: 20, proteins: 2.2, carbs: 3.9, fats: 0.1 } },
  
  // FRUTTA
  { id: 'mela', name: 'Mela', category: 'FRUITS', macros: { calories: 52, proteins: 0.3, carbs: 14, fats: 0.2 } },
  { id: 'banana', name: 'Banana', category: 'FRUITS', macros: { calories: 89, proteins: 1.1, carbs: 23, fats: 0.3 } },
  { id: 'arancia', name: 'Arancia', category: 'FRUITS', macros: { calories: 47, proteins: 0.9, carbs: 12, fats: 0.1 } },
  { id: 'kiwi', name: 'Kiwi', category: 'FRUITS', macros: { calories: 61, proteins: 1.1, carbs: 15, fats: 0.5 } },
  { id: 'fragole', name: 'Fragole', category: 'FRUITS', macros: { calories: 32, proteins: 0.7, carbs: 8, fats: 0.3 } },
  { id: 'mirtilli', name: 'Mirtilli', category: 'FRUITS', macros: { calories: 57, proteins: 0.7, carbs: 14, fats: 0.3 } },
  { id: 'pera', name: 'Pera', category: 'FRUITS', macros: { calories: 57, proteins: 0.4, carbs: 15, fats: 0.1 } },
  { id: 'pesca', name: 'Pesca', category: 'FRUITS', macros: { calories: 39, proteins: 0.9, carbs: 10, fats: 0.3 } },
  { id: 'ananas', name: 'Ananas', category: 'FRUITS', macros: { calories: 50, proteins: 0.5, carbs: 13, fats: 0.1 } },
  
  // INTEGRATORI
  { id: 'whey_isolate', name: 'Whey Isolate', category: 'SUPPLEMENTS', macros: { calories: 370, proteins: 90, carbs: 2, fats: 1 } },
  { id: 'whey_concentrate', name: 'Whey Concentrate', category: 'SUPPLEMENTS', macros: { calories: 400, proteins: 80, carbs: 8, fats: 6 } },
  { id: 'caseina', name: 'Caseina Micellare', category: 'SUPPLEMENTS', macros: { calories: 360, proteins: 80, carbs: 6, fats: 2 } },
  { id: 'proteine_vegane', name: 'Proteine Vegane', category: 'SUPPLEMENTS', macros: { calories: 380, proteins: 75, carbs: 10, fats: 6 } },
  { id: 'proteine_soia', name: 'Proteine di Soia', category: 'SUPPLEMENTS', macros: { calories: 370, proteins: 80, carbs: 7, fats: 5 } },
  { id: 'proteine_manzo', name: 'Proteine di Manzo', category: 'SUPPLEMENTS', macros: { calories: 360, proteins: 85, carbs: 2, fats: 3 } },
  { id: 'bcaa', name: 'BCAA in polvere', category: 'SUPPLEMENTS', macros: { calories: 0, proteins: 100, carbs: 0, fats: 0 } },
  { id: 'eaa', name: 'EAA (Aminoacidi Essenziali)', category: 'SUPPLEMENTS', macros: { calories: 0, proteins: 100, carbs: 0, fats: 0 } },
  { id: 'creatina', name: 'Creatina Monoidrato', category: 'SUPPLEMENTS', macros: { calories: 0, proteins: 0, carbs: 0, fats: 0 } },
  { id: 'maltodestrine', name: 'Maltodestrine', category: 'SUPPLEMENTS', macros: { calories: 380, proteins: 0, carbs: 95, fats: 0 } },
  { id: 'vitargo', name: 'Vitargo', category: 'SUPPLEMENTS', macros: { calories: 385, proteins: 0, carbs: 96, fats: 0 } },
  { id: 'destrosio', name: 'Destrosio', category: 'SUPPLEMENTS', macros: { calories: 380, proteins: 0, carbs: 95, fats: 0 } },
  { id: 'ciclodestrine', name: 'Ciclodestrine', category: 'SUPPLEMENTS', macros: { calories: 370, proteins: 0, carbs: 92, fats: 0 } },
  { id: 'barretta_proteica', name: 'Barretta Proteica', category: 'SUPPLEMENTS', macros: { calories: 350, proteins: 20, carbs: 35, fats: 10 } },
  { id: 'barretta_energetica', name: 'Barretta Energetica', category: 'SUPPLEMENTS', macros: { calories: 380, proteins: 7, carbs: 68, fats: 7 } },
  { id: 'pancake_proteici', name: 'Pancake Proteici (mix)', category: 'SUPPLEMENTS', macros: { calories: 360, proteins: 40, carbs: 30, fats: 6 } },
  { id: 'yogurt_proteico', name: 'Yogurt Proteico', category: 'SUPPLEMENTS', macros: { calories: 90, proteins: 10, carbs: 6, fats: 2 } },
  { id: 'pudding_proteico', name: 'Pudding Proteico', category: 'SUPPLEMENTS', macros: { calories: 110, proteins: 12, carbs: 8, fats: 2.5 } },
  { id: 'gelato_proteico', name: 'Gelato Proteico', category: 'SUPPLEMENTS', macros: { calories: 140, proteins: 8, carbs: 18, fats: 4 } },
  { id: 'cioccolato_proteico', name: 'Cioccolato Proteico', category: 'SUPPLEMENTS', macros: { calories: 450, proteins: 15, carbs: 50, fats: 20 } },
  { id: 'burro_arachidi_proteico', name: 'Burro Arachidi Proteico', category: 'SUPPLEMENTS', macros: { calories: 520, proteins: 30, carbs: 18, fats: 40 } },
  { id: 'wafer_proteici', name: 'Wafer Proteici', category: 'SUPPLEMENTS', macros: { calories: 380, proteins: 25, carbs: 42, fats: 12 } },
  { id: 'cookie_proteici', name: 'Cookie Proteici', category: 'SUPPLEMENTS', macros: { calories: 400, proteins: 20, carbs: 45, fats: 14 } },
  { id: 'chips_proteiche', name: 'Chips Proteiche', category: 'SUPPLEMENTS', macros: { calories: 360, proteins: 35, carbs: 30, fats: 10 } },
  { id: 'drink_proteico', name: 'Drink Proteico Pronto', category: 'SUPPLEMENTS', macros: { calories: 80, proteins: 15, carbs: 2, fats: 1.5 } },
  { id: 'gel_energetico', name: 'Gel Energetico', category: 'SUPPLEMENTS', macros: { calories: 250, proteins: 0, carbs: 60, fats: 0 } },
  { id: 'omega3', name: 'Omega 3 (softgel)', category: 'SUPPLEMENTS', macros: { calories: 10, proteins: 0, carbs: 0, fats: 1 } },
  { id: 'mct_oil', name: 'Olio MCT', category: 'SUPPLEMENTS', macros: { calories: 840, proteins: 0, carbs: 0, fats: 100 } },
  { id: 'collagene', name: 'Collagene in polvere', category: 'SUPPLEMENTS', macros: { calories: 340, proteins: 85, carbs: 0, fats: 0 } },
  { id: 'gainers', name: 'Mass Gainer', category: 'SUPPLEMENTS', macros: { calories: 380, proteins: 15, carbs: 75, fats: 3 } },
];

/**
 * Get foods by category
 */
export function getFoodsByCategory(category) {
  return FOOD_DATABASE.filter(food => food.category === category);
}

/**
 * Find food by ID
 */
export function getFoodById(id) {
  return FOOD_DATABASE.find(food => food.id === id);
}

/**
 * Calculate grams needed to match target macros
 * Returns the amount in grams that provides the closest match to target macros
 * Prioritizes the primary macro (e.g., carbs for pasta, proteins for chicken)
 */
export function calculateGramsForMacros(food, targetMacros) {
  if (!food || !targetMacros) return null;

  // Determine primary macro based on category
  let primaryMacro = 'calories';
  if (food.category === 'CARBS') primaryMacro = 'carbs';
  else if (food.category === 'PROTEINS') primaryMacro = 'proteins';
  else if (food.category === 'FATS') primaryMacro = 'fats';

  // Calculate grams based on primary macro
  const targetValue = targetMacros[primaryMacro];
  const foodValue = food.macros[primaryMacro];
  
  if (foodValue === 0) return null;

  const grams = (targetValue / foodValue) * 100;
  
  // Round to nearest 5g for practicality
  return Math.round(grams / 5) * 5;
}

/**
 * Calculate macros for a given amount of food
 */
export function calculateMacrosForGrams(food, grams) {
  if (!food || !grams) return null;

  const multiplier = grams / 100;
  return {
    calories: Math.round(food.macros.calories * multiplier),
    proteins: Math.round(food.macros.proteins * multiplier * 10) / 10,
    carbs: Math.round(food.macros.carbs * multiplier * 10) / 10,
    fats: Math.round(food.macros.fats * multiplier * 10) / 10,
  };
}

/**
 * Find best food substitutes based on similar macros
 */
export function findSimilarFoods(foodId, limit = 5) {
  const sourceFood = getFoodById(foodId);
  if (!sourceFood) return [];

  const sameCategoryFoods = getFoodsByCategory(sourceFood.category)
    .filter(f => f.id !== foodId);

  // Calculate similarity score based on macro proximity
  const scoredFoods = sameCategoryFoods.map(food => {
    const caloriesDiff = Math.abs(food.macros.calories - sourceFood.macros.calories);
    const proteinsDiff = Math.abs(food.macros.proteins - sourceFood.macros.proteins);
    const carbsDiff = Math.abs(food.macros.carbs - sourceFood.macros.carbs);
    const fatsDiff = Math.abs(food.macros.fats - sourceFood.macros.fats);
    
    // Weighted score (calories less important than macro split)
    const score = (caloriesDiff * 0.3) + (proteinsDiff * 2) + (carbsDiff * 2) + (fatsDiff * 2);
    
    return { food, score };
  });

  // Sort by similarity (lower score = more similar)
  scoredFoods.sort((a, b) => a.score - b.score);

  return scoredFoods.slice(0, limit).map(item => item.food);
}
