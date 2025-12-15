import { 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  doc,
  collection,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Landing Page Service - CRUD operations for multi-tenant landing pages
 * Collection: tenants/{tenantId}/landing_pages
 * 
 * NOTE: For block definitions and templates, import from '../config/landingBlocks'
 */

// Helper per ottenere collection e doc con tenantId
const getLandingPagesCollection = (tenantId) => collection(db, 'tenants', tenantId, 'landing_pages');
const getLandingPageDoc = (tenantId, pageId) => doc(db, 'tenants', tenantId, 'landing_pages', pageId);

// Re-export from config for backward compatibility
export { DEFAULT_BLOCKS, LANDING_TEMPLATES, LANDING_TEMPLATES_LIGHT, createBlock, generateBlockId } from '../config/landingBlocks';

// ==================== CRUD OPERATIONS ====================

/**
 * Ottiene tutte le landing pages del tenant
 */
export const getLandingPages = async (tenantId, options = {}) => {
  try {
    const { status, limitCount = 50 } = options;
    
    let q = query(getLandingPagesCollection(tenantId), orderBy('updatedAt', 'desc'));
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Errore getLandingPages:', error);
    throw new Error('Impossibile recuperare le landing pages: ' + error.message);
  }
};

/**
 * Ottiene una singola landing page
 */
export const getLandingPage = async (tenantId, pageId) => {
  try {
    const docRef = getLandingPageDoc(tenantId, pageId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Landing page non trovata');
    }
    
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Errore getLandingPage:', error);
    throw error;
  }
};

/**
 * Ottiene una landing page tramite slug (per pagina pubblica)
 */
export const getLandingPageBySlug = async (tenantId, slug) => {
  try {
    const q = query(
      getLandingPagesCollection(tenantId),
      where('slug', '==', slug),
      where('isPublished', '==', true),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Errore getLandingPageBySlug:', error);
    throw error;
  }
};

/**
 * Genera uno slug URL-friendly dal titolo
 */
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
};

/**
 * Crea una nuova landing page
 */
export const createLandingPage = async (tenantId, data) => {
  try {
    const slug = generateSlug(data.title);
    
    const landingData = {
      title: data.title,
      slug,
      description: data.description || '',
      isPublished: false,
      blocks: data.blocks || [],
      settings: {
        seo: {
          title: data.title,
          description: data.description || '',
          ogImage: '',
          keywords: [],
        },
        tracking: {
          facebookPixel: '',
          googleAnalytics: '',
          tiktokPixel: '',
          customScripts: '',
        },
        styles: {
          fontFamily: 'Inter',
          primaryColor: '#0ea5e9',
          secondaryColor: '#22d3ee',
          backgroundColor: '#0f172a',
          textColor: '#f8fafc',
        },
        general: {
          favicon: '',
          showPoweredBy: true,
          customDomain: '',
        }
      },
      analytics: {
        views: 0,
        uniqueVisitors: 0,
        conversions: 0,
        conversionRate: 0,
      },
      template: data.template || 'blank',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: null,
    };
    
    const docRef = await addDoc(getLandingPagesCollection(tenantId), landingData);
    return { id: docRef.id, ...landingData };
  } catch (error) {
    console.error('Errore createLandingPage:', error);
    throw new Error('Impossibile creare la landing page: ' + error.message);
  }
};

/**
 * Aggiorna una landing page
 */
export const updateLandingPage = async (tenantId, pageId, data) => {
  try {
    const docRef = getLandingPageDoc(tenantId, pageId);
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    
    if (data.isPublished === true) {
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists() && !currentDoc.data().publishedAt) {
        updateData.publishedAt = serverTimestamp();
      }
    }
    
    await updateDoc(docRef, updateData);
    return { id: pageId, ...updateData };
  } catch (error) {
    console.error('Errore updateLandingPage:', error);
    throw new Error('Impossibile aggiornare la landing page: ' + error.message);
  }
};

/**
 * Elimina una landing page
 */
export const deleteLandingPage = async (tenantId, pageId) => {
  try {
    const docRef = getLandingPageDoc(tenantId, pageId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Errore deleteLandingPage:', error);
    throw new Error('Impossibile eliminare la landing page: ' + error.message);
  }
};

/**
 * Duplica una landing page
 */
export const duplicateLandingPage = async (tenantId, pageId) => {
  try {
    const original = await getLandingPage(tenantId, pageId);
    
    const duplicateData = {
      ...original,
      title: `${original.title} (Copia)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      isPublished: false,
      analytics: { views: 0, uniqueVisitors: 0, conversions: 0, conversionRate: 0 },
      publishedAt: null,
    };
    
    delete duplicateData.id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    
    return await createLandingPage(tenantId, duplicateData);
  } catch (error) {
    console.error('Errore duplicateLandingPage:', error);
    throw new Error('Impossibile duplicare la landing page: ' + error.message);
  }
};

/**
 * Incrementa le views di una landing page
 */
export const incrementPageViews = async (tenantId, pageId) => {
  try {
    const docRef = getLandingPageDoc(tenantId, pageId);
    await updateDoc(docRef, {
      'analytics.views': increment(1),
    });
  } catch (error) {
    console.error('Errore incrementPageViews:', error);
  }
};

/**
 * Incrementa le conversioni di una landing page
 */
export const incrementPageConversions = async (tenantId, pageId) => {
  try {
    const docRef = getLandingPageDoc(tenantId, pageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const newConversions = (data.analytics?.conversions || 0) + 1;
      const views = data.analytics?.views || 1;
      const conversionRate = ((newConversions / views) * 100).toFixed(2);
      
      await updateDoc(docRef, {
        'analytics.conversions': newConversions,
        'analytics.conversionRate': parseFloat(conversionRate),
      });
    }
  } catch (error) {
    console.error('Errore incrementPageConversions:', error);
  }
};

/**
 * Valida una landing page prima del salvataggio
 */
export const validateLandingPage = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Il titolo deve avere almeno 3 caratteri');
  }
  
  if (data.title && data.title.length > 100) {
    errors.push('Il titolo non può superare 100 caratteri');
  }
  
  if (data.blocks && !Array.isArray(data.blocks)) {
    errors.push('I blocchi devono essere un array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
