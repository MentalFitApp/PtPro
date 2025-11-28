/**
 * AI Feedback Service
 * Gestisce il feedback degli utenti sui suggerimenti AI per migliorare l'accuratezza
 */

import { db } from '../firebase';
import { getTenantCollection } from '../config/tenant';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Salva feedback positivo/negativo su un suggerimento
 */
export async function saveFeedback({
  suggestionId,
  suggestionType,
  suggestionTitle,
  suggestionData,
  isPositive,
  clientId,
  obiettivo,
  coachId,
  notes = ''
}) {
  try {
    const feedbackRef = getTenantCollection(db, 'ai_feedback');
    
    await addDoc(feedbackRef, {
      suggestionId: suggestionId || `${Date.now()}-${Math.random()}`,
      suggestionType, // 'replace_food', 'add_food', etc.
      suggestionTitle,
      suggestionData, // Dati completi del suggerimento
      isPositive, // true = utile, false = non utile
      clientId,
      obiettivo,
      coachId,
      notes,
      createdAt: new Date(),
      applied: true // Indica che il suggerimento è stato applicato
    });

    console.log('✅ Feedback salvato:', isPositive ? 'POSITIVO' : 'NEGATIVO');
  } catch (error) {
    console.error('Errore salvataggio feedback:', error);
  }
}

/**
 * Salva preferenza "non mostrare più il popup feedback"
 */
export async function saveDoNotShowPreference(userId) {
  try {
    const preferencesRef = getTenantCollection(db, 'ai_preferences');
    
    await addDoc(preferencesRef, {
      userId,
      showFeedbackPopup: false,
      createdAt: new Date()
    });

    console.log('🚫 Preferenza salvata: non mostrare più popup feedback');
  } catch (error) {
    console.error('Errore salvataggio preferenza:', error);
  }
}

/**
 * Verifica se mostrare il popup di feedback
 */
export async function shouldShowFeedbackPopup(userId) {
  try {
    const preferencesRef = getTenantCollection(db, 'ai_preferences');
    const q = query(preferencesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    // Se trova una preferenza con showFeedbackPopup = false, non mostrare
    let shouldShow = true;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.showFeedbackPopup === false) {
        shouldShow = false;
      }
    });
    
    return shouldShow;
  } catch (error) {
    console.error('Errore verifica preferenza:', error);
    return true; // Default: mostra il popup
  }
}

/**
 * Recupera feedback positivi per migliorare i prompt
 */
export async function getPositiveFeedback({ obiettivo, limit: maxResults = 50 }) {
  try {
    const feedbackRef = getTenantCollection(db, 'ai_feedback');
    const q = query(
      feedbackRef,
      where('isPositive', '==', true),
      where('obiettivo', '==', obiettivo),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    const feedback = [];
    snapshot.forEach(doc => {
      feedback.push({ id: doc.id, ...doc.data() });
    });
    
    return feedback;
  } catch (error) {
    console.error('Errore recupero feedback positivi:', error);
    return [];
  }
}

/**
 * Recupera preferenze "non mostrare" per filtrare suggerimenti
 */
export async function getDoNotShowPreferences({ coachId, obiettivo }) {
  try {
    const preferencesRef = getTenantCollection(db, 'ai_preferences');
    const q = query(
      preferencesRef,
      where('coachId', '==', coachId),
      where('doNotShow', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const preferences = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filtra per obiettivo se specificato, altrimenti prendi tutte
      if (!obiettivo || data.obiettivo === obiettivo) {
        preferences.push(data.suggestionType);
      }
    });
    
    return preferences;
  } catch (error) {
    console.error('Errore recupero preferenze:', error);
    return [];
  }
}

/**
 * Costruisce contesto di apprendimento da feedback positivi
 * Da usare nei prompt AI per migliorare suggerimenti
 */
export async function buildLearningContext({ obiettivo }) {
  const positiveFeedback = await getPositiveFeedback({ obiettivo, limit: 20 });
  
  if (positiveFeedback.length === 0) return '';

  const examples = positiveFeedback.map(fb => 
    `- ${fb.suggestionTitle}: ${fb.suggestionData?.descrizione || 'suggerimento apprezzato'}`
  ).slice(0, 10).join('\n');

  return `\n\n📚 ESEMPI DI SUGGERIMENTI APPREZZATI (da feedback utenti):\n${examples}\n\nUsa questi esempi come riferimento per il tono e tipo di suggerimenti che funzionano meglio.`;
}

/**
 * Statistiche feedback per dashboard analytics
 */
export async function getFeedbackStats({ coachId }) {
  try {
    const feedbackRef = getTenantCollection(db, 'ai_feedback');
    const snapshot = await getDocs(feedbackRef);
    
    let positive = 0;
    let negative = 0;
    const byType = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.isPositive) {
        positive++;
      } else {
        negative++;
      }
      
      if (!byType[data.suggestionType]) {
        byType[data.suggestionType] = { positive: 0, negative: 0 };
      }
      byType[data.suggestionType][data.isPositive ? 'positive' : 'negative']++;
    });
    
    return {
      total: positive + negative,
      positive,
      negative,
      successRate: positive + negative > 0 ? (positive / (positive + negative) * 100).toFixed(1) : 0,
      byType
    };
  } catch (error) {
    console.error('Errore calcolo statistiche:', error);
    return { total: 0, positive: 0, negative: 0, successRate: 0, byType: {} };
  }
}

export default {
  saveFeedback,
  saveDoNotShowPreference,
  shouldShowFeedbackPopup,
  getPositiveFeedback,
  getDoNotShowPreferences,
  buildLearningContext,
  getFeedbackStats
};
