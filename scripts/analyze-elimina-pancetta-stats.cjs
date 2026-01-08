#!/usr/bin/env node
/**
 * Script per analizzare le statistiche della pagina "elimina-pancetta-quiz"
 * del tenant biondo-fitness-coach
 * 
 * Traccia:
 * 1. Visualizzazioni totali della pagina
 * 2. Click sul pulsante quiz (apertura popup)
 * 3. Compilazione parziale del quiz (almeno 1 risposta)
 * 4. Compilazione completa del quiz (tutti i dati inviati)
 */

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const TENANT_ID = 'biondo-fitness-coach';
const PAGE_SLUG = 'elimina-pancetta-quiz';

async function analyzeStats() {
  try {
    console.log('📊 ANALISI STATISTICHE - Elimina Pancetta Quiz');
    console.log('='.repeat(60));
    console.log('');

    // 1. Trova la landing page
    console.log('🔍 Ricerca pagina...');
    const pagesSnapshot = await db
      .collection(`tenants/${TENANT_ID}/landing_pages`)
      .where('slug', '==', PAGE_SLUG)
      .limit(1)
      .get();

    if (pagesSnapshot.empty) {
      console.log('❌ Pagina non trovata!');
      console.log(`   Cercata: tenants/${TENANT_ID}/landing_pages con slug="${PAGE_SLUG}"`);
      return;
    }

    const pageDoc = pagesSnapshot.docs[0];
    const pageData = pageDoc.data();
    const pageId = pageDoc.id;

    console.log(`✅ Pagina trovata: ${pageData.title}`);
    console.log(`   ID: ${pageId}`);
    console.log(`   Slug: ${pageData.slug}`);
    console.log(`   URL: /site/${TENANT_ID}/${PAGE_SLUG}`);
    console.log('');

    // 2. Analytics dalla pagina stessa
    console.log('📈 ANALYTICS INTEGRATE NELLA PAGINA:');
    console.log('-'.repeat(60));
    const analytics = pageData.analytics || {};
    console.log(`   👁️  Visualizzazioni: ${analytics.views || 0}`);
    console.log(`   🔄 Conversioni: ${analytics.conversions || 0}`);
    console.log(`   📊 Tasso conversione: ${analytics.conversionRate || 0}%`);
    console.log('');

    // 3. Eventi di tracking dettagliati (landing_analytics collection)
    console.log('📊 EVENTI DI TRACKING DETTAGLIATI:');
    console.log('-'.repeat(60));

    // Views
    const viewsSnapshot = await db
      .collection(`tenants/${TENANT_ID}/landing_analytics`)
      .where('pageId', '==', pageId)
      .where('type', '==', 'view')
      .get();
    
    console.log(`   👁️  Visualizzazioni totali: ${viewsSnapshot.size}`);

    // Unique visitors (basato su user agent + referrer - approssimazione)
    const uniqueVisitors = new Set();
    viewsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const fingerprint = `${data.userAgent || ''}_${data.referrer || ''}`;
      uniqueVisitors.add(fingerprint);
    });
    console.log(`   👤 Visitatori unici (stimati): ${uniqueVisitors.size}`);

    // Quiz events dettagliati
    const quizEventsSnapshot = await db
      .collection(`tenants/${TENANT_ID}/landing_analytics`)
      .where('pageId', '==', pageId)
      .where('type', '==', 'quiz_event')
      .get();

    // Raggruppa eventi per tipo
    const quizEventsByType = {};
    quizEventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const eventType = data.eventType || 'unknown';
      quizEventsByType[eventType] = (quizEventsByType[eventType] || 0) + 1;
    });

    console.log(`\n   🎯 EVENTI QUIZ:`);
    console.log(`      ▶️  Quiz aperti: ${quizEventsByType['quiz_opened'] || 0}`);
    console.log(`      📝 Step completati: ${quizEventsByType['quiz_step'] || 0}`);
    console.log(`      ⚠️  Abbandonati (parziali): ${quizEventsByType['quiz_partial'] || 0}`);
    console.log(`      ✅ Completati: ${quizEventsByType['quiz_completed'] || 0}`);

    // Conversions
    const conversionsSnapshot = await db
      .collection(`tenants/${TENANT_ID}/landing_analytics`)
      .where('pageId', '==', pageId)
      .where('type', '==', 'conversion')
      .get();
    
    console.log(`\n   ✅ Conversioni registrate: ${conversionsSnapshot.size}`);
    console.log('');

    // 4. Leads raccolti dal quiz
    console.log('🎯 LEADS DAL QUIZ:');
    console.log('-'.repeat(60));

    const leadsSnapshot = await db
      .collection(`tenants/${TENANT_ID}/leads`)
      .where('landingPageId', '==', pageId)
      .get();

    console.log(`   📝 Lead totali raccolti: ${leadsSnapshot.size}`);

    // Analizza i lead per tipo di source
    const leadsBySource = {};
    const leadsWithQuizAnswers = [];
    const partialQuizCompletions = [];

    leadsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const source = data.source || 'unknown';
      
      leadsBySource[source] = (leadsBySource[source] || 0) + 1;

      // Controlla se ha risposte al quiz
      if (data.quizAnswers && Object.keys(data.quizAnswers).length > 0) {
        leadsWithQuizAnswers.push({
          id: doc.id,
          name: data.nome || data.name || 'N/A',
          email: data.email || 'N/A',
          answersCount: Object.keys(data.quizAnswers).length,
          timestamp: data.createdAt?.toDate?.() || new Date(),
        });
      }

      // Compilazione parziale (ha iniziato ma non completato)
      const hasPartialData = data.quizAnswers && Object.keys(data.quizAnswers).length > 0 && 
                           Object.keys(data.quizAnswers).length < 6; // Meno di 6 domande
      if (hasPartialData) {
        partialQuizCompletions.push(doc.id);
      }
    });

    console.log('');
    console.log('   📊 Lead per sorgente:');
    Object.entries(leadsBySource).forEach(([source, count]) => {
      const icon = source === 'quiz_popup' ? '🎯' : 
                   source === 'form_popup' ? '📝' : 
                   source === 'form' ? '📋' : '❓';
      console.log(`      ${icon} ${source}: ${count}`);
    });

    console.log('');
    console.log('   🎯 Quiz completati: ' + leadsWithQuizAnswers.length);
    console.log('   ⚠️  Quiz parziali: ' + partialQuizCompletions.length);

    if (leadsWithQuizAnswers.length > 0) {
      console.log('');
      console.log('   📋 Ultimi 5 quiz completati:');
      leadsWithQuizAnswers
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .forEach((lead, i) => {
          const date = lead.timestamp.toLocaleDateString('it-IT');
          const time = lead.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
          console.log(`      ${i + 1}. ${lead.name} (${lead.email}) - ${lead.answersCount} risposte - ${date} ${time}`);
        });
    }

    // 5. Metriche funnel
    console.log('');
    console.log('📉 FUNNEL DI CONVERSIONE:');
    console.log('-'.repeat(60));
    const totalViews = viewsSnapshot.size || 1;
    const quizOpened = quizEventsByType['quiz_opened'] || 0;
    const quizStarts = quizOpened || leadsBySource['quiz_popup'] || 0;
    const quizPartialAbandons = quizEventsByType['quiz_partial'] || 0;
    const quizCompleted = quizEventsByType['quiz_completed'] || leadsWithQuizAnswers.length;

    console.log(`   1️⃣  Visualizzazioni pagina:       ${totalViews} (100%)`);
    console.log(`   2️⃣  Click apertura quiz:          ${quizStarts} (${((quizStarts / totalViews) * 100).toFixed(1)}%)`);
    
    if (quizStarts > 0) {
      console.log(`   3️⃣  Quiz abbandonati (parziali):  ${quizPartialAbandons} (${((quizPartialAbandons / quizStarts) * 100).toFixed(1)}%)`);
      console.log(`   4️⃣  Quiz completati:              ${quizCompleted} (${((quizCompleted / quizStarts) * 100).toFixed(1)}%)`);
    } else {
      console.log(`   3️⃣  Quiz abbandonati (parziali):  ${quizPartialAbandons}`);
      console.log(`   4️⃣  Quiz completati:              ${quizCompleted}`);
    }
    
    // Tasso di completamento (da apertura a invio)
    const completionRate = quizStarts > 0 ? ((quizCompleted / quizStarts) * 100).toFixed(1) : 0;
    const abandonRate = quizStarts > 0 ? ((quizPartialAbandons / quizStarts) * 100).toFixed(1) : 0;
    
    console.log('');
    console.log(`   🎯 Tasso di completamento quiz: ${completionRate}%`);
    console.log(`   ⚠️  Tasso di abbandono: ${abandonRate}%`);
    console.log(`   📈 Tasso conversione totale: ${((quizCompleted / totalViews) * 100).toFixed(1)}%`);

    // 6. Analisi temporale (ultimi 7 giorni)
    console.log('');
    console.log('📅 TREND ULTIMI 7 GIORNI:');
    console.log('-'.repeat(60));

    const last7Days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayViews = viewsSnapshot.docs.filter(doc => {
        const timestamp = doc.data().timestamp?.toDate?.();
        return timestamp && timestamp >= date && timestamp < nextDate;
      }).length;

      const dayLeads = leadsSnapshot.docs.filter(doc => {
        const timestamp = doc.data().createdAt?.toDate?.();
        return timestamp && timestamp >= date && timestamp < nextDate;
      }).length;

      const dayName = date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' });
      const bars = '█'.repeat(Math.ceil(dayViews / 2));
      
      console.log(`   ${dayName}: ${bars} ${dayViews} views, ${dayLeads} leads`);
      
      last7Days.push({ date: dayName, views: dayViews, leads: dayLeads });
    }

    // Suggerimenti
    console.log('');
    console.log('💡 SUGGERIMENTI:');
    console.log('-'.repeat(60));

    if (quizCompleted === 0 && quizStarts > 0) {
      console.log('   ⚠️  Nessun quiz completato! Considera di:');
      console.log('      - Ridurre il numero di domande');
      console.log('      - Semplificare le domande');
      console.log('      - Aggiungere un incentivo (sconto, guida gratuita)');
    } else if (completionRate < 50) {
      console.log('   ⚠️  Tasso di completamento basso (<50%). Considera di:');
      console.log('      - Ridurre il numero di domande obbligatorie');
      console.log('      - Rendere alcune domande opzionali');
      console.log('      - Aggiungere una progress bar');
    } else if (completionRate >= 70) {
      console.log('   ✅ Ottimo tasso di completamento! Il quiz è ben strutturato.');
    }

    if (totalViews > 0 && quizStarts < totalViews * 0.1) {
      console.log('   ⚠️  Pochi click sul quiz rispetto alle visite. Considera di:');
      console.log('      - Rendere il CTA più visibile');
      console.log('      - Cambiare il copy del bottone');
      console.log('      - Aggiungere urgency/scarcity');
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Analisi completata!');

  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error);
    throw error;
  }
}

// Esegui
analyzeStats()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
