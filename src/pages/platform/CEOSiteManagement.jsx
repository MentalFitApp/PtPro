// src/pages/platform/CEOSiteManagement.jsx
// Funzioni di gestione siti per CEO Dashboard

import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Carica configurazione landing page di un tenant
 */
export async function loadLandingConfig(tenantId) {
  try {
    const landingDoc = await getDoc(doc(db, 'tenants', tenantId, 'settings', 'landing'));
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
    const tenantData = tenantDoc.data();
    
    return {
      tenantId,
      tenantName: tenantData?.name || tenantId,
      config: landingDoc.exists() ? landingDoc.data() : {
        hero: {
          title: 'Trasforma il Tuo Business Fitness',
          subtitle: 'La piattaforma all-in-one per personal trainer professionisti',
          ctaPrimary: 'Inizia Ora',
          ctaSecondary: 'Scopri di più',
          showStats: true,
          stats: [
            { value: '500+', label: 'Personal Trainer' },
            { value: '10.000+', label: 'Clienti Attivi' },
            { value: '95%', label: 'Soddisfazione' }
          ]
        },
        features: [
          {
            icon: 'Users',
            title: 'Gestione Clienti',
            description: 'Organizza schede, progressi e comunicazioni in un unico posto'
          },
          {
            icon: 'Calendar',
            title: 'Calendario Integrato',
            description: 'Pianifica sessioni, appuntamenti e follow-up automatici'
          },
          {
            icon: 'BarChart3',
            title: 'Analytics Avanzate',
            description: 'Monitora risultati, revenue e crescita del business'
          }
        ],
        branding: {
          appName: tenantData?.name || 'FitFlows',
          logoUrl: '/logo192.png',
          primaryColor: '#3b82f6',
          accentColor: '#60a5fa'
        },
        siteSlug: tenantData?.siteSlug || tenantId,
        customDomain: tenantData?.customDomain || null,
        enabled: true,
        seo: {
          title: `${tenantData?.name || 'FitFlows'} - Gestione Clienti Fitness`,
          description: 'La piattaforma completa per personal trainer professionisti',
          keywords: 'personal trainer, fitness, gestione clienti, schede allenamento'
        }
      }
    };
  } catch (error) {
    console.error('Error loading landing config:', error);
    throw error;
  }
}

/**
 * Salva configurazione landing page
 */
export async function saveLandingConfig(tenantId, config) {
  try {
    // Salva configurazione landing
    await setDoc(doc(db, 'tenants', tenantId, 'settings', 'landing'), config, { merge: true });
    
    // Aggiorna siteSlug e customDomain nel tenant principale
    const updateData = {
      updatedAt: new Date()
    };
    
    if (config.siteSlug) {
      updateData.siteSlug = config.siteSlug;
    }
    
    if (config.customDomain !== undefined) {
      updateData.customDomain = config.customDomain;
    }
    
    await updateDoc(doc(db, 'tenants', tenantId), updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving landing config:', error);
    throw error;
  }
}

/**
 * Carica configurazione branding di un tenant
 */
export async function loadBrandingConfig(tenantId) {
  try {
    const brandingDoc = await getDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'));
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
    const tenantData = tenantDoc.data();
    
    return {
      tenantId,
      tenantName: tenantData?.name || tenantId,
      config: brandingDoc.exists() ? brandingDoc.data() : {
        appName: tenantData?.name || 'FitFlows',
        adminAreaName: 'Area Personale',
        clientAreaName: 'Area Cliente',
        coachAreaName: 'Area Coach',
        collaboratoreAreaName: 'Area Collaboratore',
        logoUrl: null,
        primaryColor: '#3b82f6',
        accentColor: '#60a5fa'
      }
    };
  } catch (error) {
    console.error('Error loading branding config:', error);
    throw error;
  }
}

/**
 * Salva configurazione branding
 */
export async function saveBrandingConfig(tenantId, config) {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'), config, { merge: true });
    
    // Aggiorna anche il nome nel tenant principale se cambiato
    if (config.appName) {
      await updateDoc(doc(db, 'tenants', tenantId), {
        name: config.appName,
        updatedAt: new Date()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving branding config:', error);
    throw error;
  }
}

/**
 * Cambia status sito (active/draft)
 */
export async function toggleSiteStatus(tenantId, currentStatus) {
  try {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';
    await updateDoc(doc(db, 'tenants', tenantId), {
      status: newStatus,
      updatedAt: new Date()
    });
    
    return { success: true, newStatus };
  } catch (error) {
    console.error('Error toggling site status:', error);
    throw error;
  }
}

/**
 * Elimina tenant (ATTENZIONE: operazione irreversibile)
 */
export async function deleteTenant(tenantId) {
  try {
    // In produzione, dovrebbe eliminare anche tutte le subcollections
    // Per ora elimina solo il documento principale
    await deleteDoc(doc(db, 'tenants', tenantId));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting tenant:', error);
    throw error;
  }
}

/**
 * Crea nuovo tenant
 */
export async function createTenant(tenantData) {
  try {
    const tenantId = tenantData.id || `tenant-${Date.now()}`;
    
    // Crea documento tenant
    await setDoc(doc(db, 'tenants', tenantId), {
      name: tenantData.name,
      status: 'draft',
      plan: tenantData.plan || 'professional',
      siteSlug: tenantData.siteSlug || tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalUsers: 0,
        totalClients: 0,
        totalRevenue: 0
      }
    });
    
    // Inizializza configurazione landing
    await setDoc(doc(db, 'tenants', tenantId, 'settings', 'landing'), {
      hero: {
        title: 'Trasforma il Tuo Business Fitness',
        subtitle: 'La piattaforma all-in-one per personal trainer professionisti',
        ctaPrimary: 'Inizia Ora',
        ctaSecondary: 'Scopri di più'
      },
      branding: {
        appName: tenantData.name,
        logoUrl: '/logo192.png'
      },
      enabled: false
    });
    
    // Inizializza branding
    await setDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'), {
      appName: tenantData.name,
      adminAreaName: 'Area Personale',
      clientAreaName: 'Area Cliente',
      coachAreaName: 'Area Coach'
    });
    
    return { success: true, tenantId };
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
}

/**
 * Duplica configurazione landing da un tenant a un altro
 */
export async function duplicateLanding(sourceTenantId, targetTenantId) {
  try {
    const sourceConfig = await loadLandingConfig(sourceTenantId);
    await saveLandingConfig(targetTenantId, sourceConfig.config);
    
    return { success: true };
  } catch (error) {
    console.error('Error duplicating landing:', error);
    throw error;
  }
}
