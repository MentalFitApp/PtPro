// Script per creare gli index Firebase necessari per la Community
// Questo script NON crea effettivamente gli index (devono essere creati da console Firebase)
// ma fornisce le istruzioni dettagliate per ciascun index

const indexes = [
  {
    collection: 'community_posts',
    name: 'pinned_posts',
    fields: [
      { field: 'pinned', order: 'ASCENDING' },
      { field: 'pinnedAt', order: 'DESCENDING' },
      { field: 'timestamp', order: 'DESCENDING' }
    ],
    description: 'Per mostrare i post pinnati prima, ordinati per data di pinning e poi per data creazione'
  },
  {
    collection: 'community_posts', 
    name: 'popular_posts',
    fields: [
      { field: 'likes', order: 'DESCENDING' },
      { field: 'timestamp', order: 'DESCENDING' }
    ],
    description: 'Per ordinare i post per popolarità (like) e data'
  },
  {
    collection: 'users',
    name: 'users_by_level',
    fields: [
      { field: 'level', order: 'DESCENDING' }
    ],
    description: 'Per mostrare i membri ordinati per livello (dal più alto al più basso)'
  },
  {
    collection: 'courses',
    name: 'courses_by_level',
    fields: [
      { field: 'level', order: 'ASCENDING' }
    ],
    description: 'Per mostrare i corsi ordinati per livello richiesto (dal più basso al più alto)'
  }
];

console.log('🔥 GUIDA INDEX FIREBASE - VERSIONE AGGIORNATA');
console.log('=' .repeat(60));
console.log('');
console.log('❗ IMPORTANTE: Firebase Console richiede MINIMO 2 campi per index compositi');
console.log('   Gli index su singolo campo vengono creati automaticamente da Firebase');
console.log('');

console.log('📋 INDEX DA CREARE MANUALMENTE (solo compositi):');
console.log('');

// Solo gli index compositi per community_posts
const compositeIndexes = indexes.filter(idx => idx.fields.length > 1);

compositeIndexes.forEach((index, i) => {
  console.log(`${i + 1}. Index: ${index.name}`);
  console.log(`   Collection: ${index.collection}`);
  console.log(`   Descrizione: ${index.description}`);
  console.log('   Campi:');
  index.fields.forEach(field => {
    console.log(`     - ${field.field} (${field.order})`);
  });
  console.log('');
  console.log('   🔗 URL creazione:');
  console.log(`   https://console.firebase.google.com/u/1/project/biondo-fitness-coach/firestore/databases/-default-/indexes`);
  console.log('');
  console.log('   📋 Istruzioni:');
  console.log('   1. Clicca "Crea Index"');
  console.log(`   2. Collection ID: ${index.collection}`);
  console.log('   3. Aggiungi campi:');
  index.fields.forEach(field => {
    console.log(`      - Campo: ${field.field}, Ordine: ${field.order}`);
  });
  console.log('   4. Clicca "Crea"');
  console.log('');
  console.log('-'.repeat(50));
});

console.log('🤖 INDEX SU SINGOLO CAMPO (creati automaticamente):');
console.log('   - users.level (descending) → creato automaticamente alla prima query');
console.log('   - courses.level (ascending) → creato automaticamente alla prima query');
console.log('   - community_posts.pinned (descending) → creato automaticamente');
console.log('');

console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('- Crea SOLO gli index compositi (2+ campi) - i singoli sono automatici');
console.log('- Gli index possono richiedere fino a 10 minuti per essere creati');
console.log('- Le query falliranno fino a quando gli index non sono pronti');
console.log('- Puoi monitorare lo stato degli index nella console Firebase');
console.log('');
console.log('🚀 Dopo aver creato gli index compositi, esegui:');
console.log('node scripts/populate-firebase.js');
console.log('');
console.log('📱 Poi testa su: http://localhost:5173/community');
console.log('');
console.log('🔗 Link diretto alla console Firebase:');
console.log('https://console.firebase.google.com/u/1/project/biondo-fitness-coach/firestore/databases/-default-/indexes');
