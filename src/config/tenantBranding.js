// src/config/tenantBranding.js
// Sistema di personalizzazione branding per tenant

/**
 * Configurazione branding tenant
 * Ogni tenant può personalizzare:
 * - Nome dell'area personale
 * - Nome dell'area clienti
 * - Logo (opzionale)
 * - Colori primari (opzionale - feature futura)
 */

export const defaultBranding = {
  appName: 'FitFlow',
  adminAreaName: 'Area Personale',
  clientAreaName: 'Area Cliente',
  coachAreaName: 'Area Coach',
  collaboratoreAreaName: 'Area Collaboratore',
  logoUrl: null, // URL logo personalizzato
  primaryColor: '#3b82f6', // Blue-500
  accentColor: '#60a5fa', // Blue-400
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
export function useTenantBranding() {
  const { useState, useEffect } = require('react');
  const { auth } = require('../firebase');
  
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
