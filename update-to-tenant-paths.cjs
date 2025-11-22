/**
 * Script per aggiornare automaticamente i file frontend
 * Sostituisce collection(db, 'collectionName') con getTenantCollection(db, 'collectionName')
 */

const fs = require('fs');
const path = require('path');

const COLLECTIONS_TO_UPDATE = [
  'users',
  'clients',
  'community_posts',
  'community_comments',
  'community_likes',
  'community_user_profiles',
  'notifications',
  'collaboratori',
  'updates',
  'business_history',
  'alimentazione_allenamento',
  'admin_checks',
  'lista_alimenti',
  'lista_esercizi',
  'guide_posts',
  'guide_categories',
  'statistics',
  'chat_rooms',
  'chat_messages',
  'dipendenti',
  'client_payments',
  'coach_updates',
  'guide_captures',
  'anamnesi',
  'schede_alimentazione',
  'schede_allenamento',
  'checks',
  'payments',
  'calendar_events'
];

function updateFile(filePath) {
  console.log(`\n📝 Aggiornamento: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changesCount = 0;
  
  // 1. Aggiungi import se necessario
  const needsImport = COLLECTIONS_TO_UPDATE.some(col => 
    content.includes(`collection(db, '${col}'`) || 
    content.includes(`collection(db, "${col}"`)
  );
  
  if (needsImport && !content.includes('getTenantCollection')) {
    // Trova dove sono gli import di firebase
    const firebaseImportMatch = content.match(/import.*from ['"].*firebase['"]/);
    if (firebaseImportMatch) {
      const importLine = firebaseImportMatch[0];
      const insertAfter = content.indexOf(importLine) + importLine.length;
      content = content.slice(0, insertAfter) + 
                "\nimport { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';" +
                content.slice(insertAfter);
      modified = true;
      console.log('   ✅ Aggiunto import getTenantCollection');
    }
  }
  
  // 2. Sostituisci collection(db, 'collectionName')
  for (const col of COLLECTIONS_TO_UPDATE) {
    // Pattern: collection(db, 'collectionName')
    const pattern1 = new RegExp(`collection\\(db,\\s*['"]${col}['"]\\)`, 'g');
    const matches1 = content.match(pattern1);
    if (matches1) {
      content = content.replace(pattern1, `getTenantCollection(db, '${col}')`);
      changesCount += matches1.length;
      modified = true;
    }
  }
  
  // 3. Sostituisci doc(db, 'collectionName', docId)
  for (const col of COLLECTIONS_TO_UPDATE) {
    // Pattern: doc(db, 'collectionName', varName)
    const pattern2 = new RegExp(`doc\\(db,\\s*['"]${col}['"],\\s*([a-zA-Z0-9_.]+)\\)`, 'g');
    const matches2 = content.match(pattern2);
    if (matches2) {
      content = content.replace(pattern2, (match, docId) => {
        return `getTenantDoc(db, '${col}', ${docId})`;
      });
      changesCount += matches2.length;
      modified = true;
    }
  }
  
  // 4. Sostituisci subcollections: collection(db, 'clients', clientId, 'subcol')
  const subcollectionPattern = /collection\(db,\s*['"]clients['"],\s*([a-zA-Z0-9_.]+),\s*['"]([a-zA-Z_]+)['"]\)/g;
  const subMatches = content.match(subcollectionPattern);
  if (subMatches) {
    content = content.replace(subcollectionPattern, (match, parentId, subcol) => {
      return `getTenantSubcollection(db, 'clients', ${parentId}, '${subcol}')`;
    });
    changesCount += subMatches.length;
    modified = true;
  }
  
  // 5. Fix import path depth (alcuni file sono più nested)
  const depth = (filePath.match(/\//g) || []).length - (filePath.match(/src\//g) || []).length;
  if (depth > 2 && content.includes("from '../../config/tenant'")) {
    const correctPath = '../'.repeat(depth - 1) + 'config/tenant';
    content = content.replace("from '../../config/tenant'", `from '${correctPath}'`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ✅ Salvato: ${changesCount} modifiche`);
    return { modified: true, changes: changesCount };
  } else {
    console.log(`   ⏭️  Nessuna modifica necessaria`);
    return { modified: false, changes: 0 };
  }
}

function walkDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath, results);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  
  return results;
}

function main() {
  console.log('🚀 Inizio aggiornamento frontend per multi-tenant\n');
  
  const srcDir = path.join(__dirname, 'src');
  const files = walkDirectory(srcDir);
  
  let totalModified = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    // Skip alcuni file
    if (file.includes('/config/tenant.js') || 
        file.includes('/firebase.js') ||
        file.includes('platform/CEOPlatformDashboard.jsx')) {
      continue;
    }
    
    const result = updateFile(file);
    if (result.modified) {
      totalModified++;
      totalChanges += result.changes;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RIEPILOGO');
  console.log('='.repeat(60));
  console.log(`✅ File modificati: ${totalModified}/${files.length}`);
  console.log(`🔄 Sostituzioni totali: ${totalChanges}`);
  console.log('='.repeat(60));
  
  if (totalModified > 0) {
    console.log('\n✅ AGGIORNAMENTO COMPLETATO!');
    console.log('\n📝 Prossimi passi:');
    console.log('1. Controlla che non ci siano errori TypeScript/ESLint');
    console.log('2. Testa le funzionalità principali');
    console.log('3. Se tutto funziona, puoi eliminare i dati dalla root');
  }
}

main();
