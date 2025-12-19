/**
 * Script per aggiornare le colonne dei lead con i nuovi campi del form
 */
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'biondo-fitness-coach'
  });
}

const db = admin.firestore();
const TENANT_ID = 'biondo-fitness-coach';

// Colonne per il form Protocollo Maglietta Piena
const LEAD_COLUMNS = [
  // Colonne base (sempre visibili)
  { id: 'nome', field: 'nome', label: 'Nome', visible: true, locked: true },
  { id: 'cognome', field: 'cognome', label: 'Cognome', visible: true, locked: false },
  { id: 'email', field: 'email', label: 'Email', visible: true, locked: false },
  { id: 'telefono', field: 'telefono', label: 'Telefono', visible: true, locked: false },
  { id: 'data_nascita', field: 'data_nascita', label: 'Data Nascita', visible: true, locked: false },
  
  // Campi personalizzati fitness
  { id: 'fisico_partenza', field: 'fisico_partenza', label: 'Fisico Partenza', visible: true, locked: false },
  { id: 'obiettivo', field: 'obiettivo', label: 'Obiettivo', visible: true, locked: false },
  { id: 'esperienza_allenamento', field: 'esperienza_allenamento', label: 'Esperienza', visible: true, locked: false },
  { id: 'motivazione', field: 'motivazione', label: 'Motivazione', visible: true, locked: false },
  { id: 'lavoro_disponibilita', field: 'lavoro_disponibilita', label: 'Lavoro/Disponibilità', visible: true, locked: false },
  
  // Colonne sistema
  { id: 'source', field: 'source', label: 'Fonte', visible: true, locked: false },
  { id: 'landingPageId', field: 'landingPageId', label: 'Landing Page', visible: false, locked: false },
  { id: 'createdAt', field: 'createdAt', label: 'Data', visible: true, locked: false },
  { id: 'note', field: 'note', label: 'Note', visible: true, locked: false },
];

async function updateLeadColumns() {
  try {
    console.log('🚀 Aggiornamento colonne lead...\n');
    
    // Salva la configurazione
    await db
      .collection('tenants')
      .doc(TENANT_ID)
      .collection('settings')
      .doc('leadColumns')
      .set({
        columns: LEAD_COLUMNS,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log('✅ Colonne lead aggiornate!');
    console.log('\n📋 Nuove colonne visibili:');
    LEAD_COLUMNS.filter(c => c.visible).forEach((col, i) => {
      console.log(`   ${i + 1}. ${col.label}`);
    });
    
    console.log('\n📊 Ora tutti i dati del form saranno visibili nella tab Leads!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

updateLeadColumns();
