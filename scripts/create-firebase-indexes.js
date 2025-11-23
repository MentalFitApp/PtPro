// Script per creare gli index Firebase necessari
// Questo script NON crea effettivamente gli index (devono essere creati da console Firebase)
// ma fornisce le istruzioni dettagliate per ciascun index

const indexes = [
  // COMMUNITY
  {
    collection: 'tenants/{tenantId}/community_posts',
    name: 'pinned_posts',
    fields: [
      { field: 'pinned', order: 'ASCENDING' },
      { field: 'pinnedAt', order: 'DESCENDING' },
      { field: 'timestamp', order: 'DESCENDING' }
    ],
    description: 'Post pinnati ordinati per data pinning e creazione'
  },
  {
    collection: 'tenants/{tenantId}/community_posts', 
    name: 'popular_posts',
    fields: [
      { field: 'likes', order: 'DESCENDING' },
      { field: 'timestamp', order: 'DESCENDING' }
    ],
    description: 'Post ordinati per popolarità (like) e data'
  },
  
  // CLIENTS
  {
    collection: 'tenants/{tenantId}/clients',
    name: 'active_clients',
    fields: [
      { field: 'isActive', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ],
    description: 'Clients attivi ordinati per data creazione'
  },
  {
    collection: 'tenants/{tenantId}/clients/{clientId}/checks',
    name: 'checks_by_date',
    fields: [
      { field: 'createdAt', order: 'DESCENDING' }
    ],
    description: 'Check-in ordinati per data (più recenti prima)'
  },
  {
    collection: 'tenants/{tenantId}/clients/{clientId}/payments',
    name: 'payments_by_date',
    fields: [
      { field: 'paymentDate', order: 'DESCENDING' }
    ],
    description: 'Pagamenti ordinati per data'
  },
  
  // LEADS
  {
    collection: 'tenants/{tenantId}/leads',
    name: 'leads_by_status_date',
    fields: [
      { field: 'status', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ],
    description: 'Leads filtrati per stato e ordinati per data'
  },
  {
    collection: 'tenants/{tenantId}/leads',
    name: 'leads_by_date_range',
    fields: [
      { field: 'createdAt', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ],
    description: 'Leads in un range di date'
  },
  
  // CALENDAR
  {
    collection: 'tenants/{tenantId}/calendarEvents',
    name: 'events_by_date',
    fields: [
      { field: 'date', order: 'ASCENDING' },
      { field: 'startTime', order: 'ASCENDING' }
    ],
    description: 'Eventi calendario ordinati per data e ora'
  },
  
  // CHATS
  {
    collection: 'tenants/{tenantId}/chats',
    name: 'chats_by_participant',
    fields: [
      { field: 'participants', order: 'ASCENDING' },
      { field: 'lastUpdate', order: 'DESCENDING' }
    ],
    description: 'Chat di un utente ordinate per ultimo aggiornamento'
  },
  {
    collection: 'tenants/{tenantId}/chats/{chatId}/messages',
    name: 'messages_by_date',
    fields: [
      { field: 'timestamp', order: 'ASCENDING' }
    ],
    description: 'Messaggi ordinati cronologicamente'
  }
];

console.log('🔥 GUIDA INDEX FIREBASE - MULTI-TENANT');
console.log('=' .repeat(80));
console.log('');
console.log('⚠️  IMPORTANTE: Questi index devono essere creati manualmente nella Firebase Console');
console.log('   Gli index su singolo campo sono automatici, servono solo i compositi (2+ campi)');
console.log('');

const compositeIndexes = indexes.filter(idx => idx.fields.length > 1);

console.log(`📋 INDEX COMPOSITI DA CREARE (${compositeIndexes.length} totali):\n`);

compositeIndexes.forEach((index, i) => {
  console.log(`${i + 1}. ${index.name.toUpperCase()}`);
  console.log(`   Collection: ${index.collection}`);
  console.log(`   Descrizione: ${index.description}`);
  console.log('   Campi:');
  index.fields.forEach(field => {
    console.log(`     • ${field.field} → ${field.order}`);
  });
  console.log('');
});

console.log('=' .repeat(80));
console.log('\n📝 ISTRUZIONI VELOCI:\n');
console.log('1. Apri: https://console.firebase.google.com/project/biondo-fitness-coach/firestore/indexes');
console.log('2. Clicca "Create Index"');
console.log('3. Per ogni index sopra:');
console.log('   - Inserisci Collection path');
console.log('   - Aggiungi i campi specificati con il loro ordine');
console.log('   - Query scope: Collection');
console.log('   - Clicca "Create"');
console.log('');
console.log('⏱️  Gli index richiedono 5-10 minuti per essere creati');
console.log('✅ Verifica che siano tutti "Enabled" prima di usare l\'app');
console.log('');
console.log('💡 TIP: Firebase ti mostrerà un link per creare l\'index quando una query fallisce');
console.log('');
console.log('=' .repeat(80));
