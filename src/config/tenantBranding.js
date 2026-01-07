// src/config/tenantBranding.js
// Sistema di personalizzazione branding per tenant

/**
 * Configurazione branding tenant
 * Ogni tenant può personalizzare:
 * - Nome dell'area personale
 * - Nome dell'area clienti
 * - Logo (opzionale)
 * - Palette colori personalizzata
 * - Densità UI
 */

// Densità UI disponibili
export const uiDensityOptions = {
  compact: {
    name: 'Compatta',
    description: 'Più contenuto visibile, spaziatura ridotta',
    spacing: {
      card: 'p-3',
      section: 'space-y-3',
      gap: 'gap-2',
      button: 'py-1.5 px-3',
      input: 'py-2 px-3',
      text: 'text-sm',
    },
    values: {
      '--density-spacing': '0.75rem',
      '--density-padding': '0.75rem',
      '--density-gap': '0.5rem',
      '--density-radius': '0.5rem',
    }
  },
  normal: {
    name: 'Normale',
    description: 'Bilanciamento ottimale',
    spacing: {
      card: 'p-5',
      section: 'space-y-5',
      gap: 'gap-4',
      button: 'py-2.5 px-5',
      input: 'py-3 px-4',
      text: 'text-base',
    },
    values: {
      '--density-spacing': '1.25rem',
      '--density-padding': '1.25rem',
      '--density-gap': '1rem',
      '--density-radius': '0.75rem',
    }
  },
  spacious: {
    name: 'Spaziosa',
    description: 'Più respiro visivo, elementi più grandi',
    spacing: {
      card: 'p-7',
      section: 'space-y-7',
      gap: 'gap-6',
      button: 'py-3.5 px-7',
      input: 'py-4 px-5',
      text: 'text-lg',
    },
    values: {
      '--density-spacing': '1.75rem',
      '--density-padding': '1.75rem',
      '--density-gap': '1.5rem',
      '--density-radius': '1rem',
    }
  }
};

// Palette colori predefinite
export const colorPresets = {
  blue: {
    name: 'Blu (Default)',
    primary: '#3b82f6',      // Blue-500
    primaryLight: '#60a5fa', // Blue-400
    primaryDark: '#2563eb',  // Blue-600
    accent: '#0ea5e9',       // Sky-500
    accentLight: '#38bdf8',  // Sky-400
    stars: '#38bdf8',        // Stelle sky
    starsSecondary: '#22d3ee', // Cyan
  },
  violet: {
    name: 'Viola',
    primary: '#8b5cf6',      // Violet-500
    primaryLight: '#a78bfa', // Violet-400
    primaryDark: '#7c3aed',  // Violet-600
    accent: '#e879f9',       // Fuchsia-400
    accentLight: '#f0abfc',  // Fuchsia-300
    stars: '#a78bfa',
    starsSecondary: '#e879f9',
  },
  emerald: {
    name: 'Verde',
    primary: '#10b981',      // Emerald-500
    primaryLight: '#34d399', // Emerald-400
    primaryDark: '#059669',  // Emerald-600
    accent: '#14b8a6',       // Teal-500
    accentLight: '#2dd4bf',  // Teal-400
    stars: '#34d399',
    starsSecondary: '#2dd4bf',
  },
  rose: {
    name: 'Rosa',
    primary: '#f43f5e',      // Rose-500
    primaryLight: '#fb7185', // Rose-400
    primaryDark: '#e11d48',  // Rose-600
    accent: '#ec4899',       // Pink-500
    accentLight: '#f472b6',  // Pink-400
    stars: '#fb7185',
    starsSecondary: '#f472b6',
  },
  amber: {
    name: 'Arancione',
    primary: '#f59e0b',      // Amber-500
    primaryLight: '#fbbf24', // Amber-400
    primaryDark: '#d97706',  // Amber-600
    accent: '#fb923c',       // Orange-400
    accentLight: '#fdba74',  // Orange-300
    stars: '#fbbf24',
    starsSecondary: '#fb923c',
  },
  cyan: {
    name: 'Ciano',
    primary: '#06b6d4',      // Cyan-500
    primaryLight: '#22d3ee', // Cyan-400
    primaryDark: '#0891b2',  // Cyan-600
    accent: '#0ea5e9',       // Sky-500
    accentLight: '#38bdf8',  // Sky-400
    stars: '#22d3ee',
    starsSecondary: '#38bdf8',
  },
  custom: {
    name: 'Personalizzato',
    // I colori verranno definiti dall'utente
  }
};

export const defaultBranding = {
  appName: 'FitFlows',
  adminAreaName: 'Area Personale',
  clientAreaName: 'Area Cliente',
  coachAreaName: 'Area Coach',
  collaboratoreAreaName: 'Area Collaboratore',
  logoUrl: null,
  // Colori - default blu
  colorPreset: 'blue',
  colors: colorPresets.blue,
};

/**
 * Ottiene il branding del tenant corrente
 * @param {string} tenantId - ID del tenant
 * @returns {Promise<Object>} - Configurazione branding
 */
export async function getTenantBranding(tenantId) {
  if (!tenantId) return defaultBranding;

  try {
    const { db } = await import('../firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const brandingDoc = await getDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'));
    
    if (brandingDoc.exists()) {
      return { ...defaultBranding, ...brandingDoc.data() };
    }
    
    return defaultBranding;
  } catch (error) {
    console.error('Error fetching tenant branding:', error);
    return defaultBranding;
  }
}

/**
 * Aggiorna il branding del tenant
 * @param {string} tenantId - ID del tenant
 * @param {Object} brandingData - Nuova configurazione branding
 * @returns {Promise<void>}
 */
export async function updateTenantBranding(tenantId, brandingData) {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  try {
    const { db } = await import('../firebase');
    const { doc, setDoc } = await import('firebase/firestore');
    
    const brandingRef = doc(db, 'tenants', tenantId, 'settings', 'branding');
    await setDoc(brandingRef, {
      ...brandingData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    console.log('Tenant branding updated successfully');
  } catch (error) {
    console.error('Error updating tenant branding:', error);
    throw error;
  }
}

/**
 * Hook React per utilizzare il branding del tenant
 * Da usare nei componenti
 * Include: appName, area names, logoUrl
 */
import { useState, useEffect } from 'react';
import { auth } from '../firebase';

export function useTenantBranding() {
  
  const [branding, setBranding] = useState(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      const user = auth.currentUser;
      if (!user?.tenantId) {
        setBranding(defaultBranding);
        setLoading(false);
        return;
      }

      try {
        const tenantBranding = await getTenantBranding(user.tenantId);
        setBranding(tenantBranding);
      } catch (error) {
        console.error('Error loading branding:', error);
        setBranding(defaultBranding);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, []);

  return { branding, loading };
}
