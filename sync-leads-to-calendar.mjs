import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, addDoc, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC9RJwIQnc0eQ15vLkVZ-Zp_2Bi1v8-E60",
  authDomain: "biondo-fitness-coach.firebaseapp.com",
  projectId: "biondo-fitness-coach",
  storageBucket: "biondo-fitness-coach.firebasestorage.app",
  messagingSenderId: "699748663641",
  appId: "1:699748663641:web:bd9c53e1e5ca5a2d2cbae7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncLeadsToCalendar() {
  try {
    console.log('🔄 Inizio sincronizzazione leads → calendario...\n');

    // Recupera tutti i leads
    const leadsSnapshot = await getDocs(collection(db, 'leads'));
    console.log(`📋 Trovati ${leadsSnapshot.size} leads totali`);

    let created = 0;
    let skipped = 0;

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
      const q = query(
        collection(db, 'calendarEvents'),
        where('leadId', '==', leadId),
        limit(1)
      );
      const existingEvent = await getDocs(q);

      if (!existingEvent.empty) {
        console.log(`⏭️  Lead ${lead.name} già presente nel calendario`);
        skipped++;
        continue;
      }

      // Crea evento calendario
      await addDoc(collection(db, 'calendarEvents'), {
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
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Errore durante la sincronizzazione:', error);
  }
}

syncLeadsToCalendar();
