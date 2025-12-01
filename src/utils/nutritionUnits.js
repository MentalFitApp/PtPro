/**
 * Utility per conversione unità di misura nutrizionali
 */

// Conversioni approssimative a grammi
const UNIT_CONVERSIONS = {
  'g': 1,
  'pz': 60,        // 1 uovo medio = ~60g
  'ml': 1,         // ml ≈ g per liquidi comuni
  'cucchiaio': 15, // 1 cucchiaio = ~15g
  'cucchiaino': 5  // 1 cucchiaino = ~5g
};

/**
 * Converti quantità in grammi per calcoli uniformi
 * @param {number} quantita - Quantità dell'alimento
 * @param {string} unitaMisura - Unità di misura ('g', 'pz', 'ml', 'cucchiaio', 'cucchiaino')
 * @returns {number} Quantità convertita in grammi
 */
export const convertToGrams = (quantita, unitaMisura = 'g') => {
  if (!unitaMisura || unitaMisura === 'g') return quantita;
  return quantita * (UNIT_CONVERSIONS[unitaMisura] || 1);
};

/**
 * Inferisce l'unità di misura più appropriata dal nome dell'alimento
 * @param {string} nome - Nome dell'alimento
 * @returns {object} { unitaMisura: string, quantitaDefault: string }
 */
export const inferUnitFromName = (nome) => {
  const nomeLower = nome.toLowerCase();
  
  if (nomeLower.includes('uovo') || nomeLower.includes('uova')) {
    return { unitaMisura: 'pz', quantitaDefault: '1' };
  }
  
  if (nomeLower.includes('latte') || nomeLower.includes('succo') || 
      nomeLower.includes('acqua') || nomeLower.includes('bevanda')) {
    return { unitaMisura: 'ml', quantitaDefault: '200' };
  }
  
  if (nomeLower.includes('olio') || nomeLower.includes('aceto') || 
      nomeLower.includes('miele')) {
    return { unitaMisura: 'cucchiaio', quantitaDefault: '1' };
  }
  
  return { unitaMisura: 'g', quantitaDefault: '100' };
};

/**
 * Formatta l'unità di misura per visualizzazione
 * @param {string} unitaMisura
 * @returns {string}
 */
export const formatUnit = (unitaMisura) => {
  const labels = {
    'g': 'g',
    'pz': 'pz',
    'ml': 'ml',
    'cucchiaio': 'cucch.',
    'cucchiaino': 'cucch.ino'
  };
  return labels[unitaMisura] || unitaMisura;
};

export default {
  convertToGrams,
  inferUnitFromName,
  formatUnit,
  UNIT_CONVERSIONS
};
