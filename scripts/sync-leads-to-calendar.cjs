const admin = require('firebase-admin');

// Usa le credenziali di default di Firebase CLI
admin.initializeApp({
  projectId: 'biondo-fitness-coach'
});

const db = admin.firestore();

async function syncLeadsToCalendar() {
  try {
    console.log('🔄 Inizio sincronizzazione leads → calendario...\n');

    // Recupera tutti i leads
    const leadsSnapshot = await db.collection('leads').get();
    console.log(`📋 Trovati ${leadsSnapshot.size} leads totali`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const leadDoc of leadsSnapshot.docs) {
      const lead = leadDoc.data();
      const leadId = leadDoc.id;

      // Verifica che abbia i dati necessari
      if (!lead.name || !lead.dataPrenotazione || !lead.oraPrenotazione || !lead.collaboratoreId) {
        console.log(`⚠️  Saltato lead ${leadId}: dati mancanti`);
        skipped++;
        continue;
      }

      // Verifica se esiste già un evento calendario per questo lead
      const existingEvent = await db.collection('calendarEvents')
        .where('leadId', '==', leadId)
        .limit(1)
        .get();

      if (!existingEvent.empty) {
        console.log(`⏭️  Lead ${lead.name} già presente nel calendario`);
        skipped++;
        continue;
      }

      // Crea evento calendario
      await db.collection('calendarEvents').add({
        title: `📞 ${lead.name}`,
        date: lead.dataPrenotazione,
        time: lead.oraPrenotazione,
        type: 'lead',
        leadId: leadId,
        leadData: {
          name: lead.name,
          number: lead.number || '',
          email: lead.email || '',
          source: lead.source || '',
          note: lead.note || ''
        },
        createdBy: lead.collaboratoreId,
        participants: [lead.collaboratoreId],
        timestamp: new Date()
      });

      console.log(`✅ Creato evento calendario per: ${lead.name} (${lead.dataPrenotazione} ${lead.oraPrenotazione})`);
      created++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RIEPILOGO SINCRONIZZAZIONE:');
    console.log(`   ✅ Eventi creati: ${created}`);
    console.log(`   ⏭️  Già esistenti: ${skipped}`);
    console.log(`   ❌ Errori: ${errors}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Errore durante la sincronizzazione:', error);
  } finally {
    process.exit();
  }
}

syncLeadsToCalendar();
