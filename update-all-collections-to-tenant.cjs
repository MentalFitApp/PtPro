const fs = require('fs');
const path = require('path');

// Tutte le collections che devono essere lette dal tenant
const TENANT_COLLECTIONS = [
  'users', 'clients', 'community_posts', 'community_comments', 'community_likes',
  'community_user_profiles', 'notifications', 'collaboratori', 'updates',
  'business_history', 'alimentazione_allenamento', 'admin_checks',
  'lista_alimenti', 'lista_esercizi', 'guide_posts', 'guide_categories',
  'statistics', 'chat_rooms', 'chat_messages', 'dipendenti', 'client_payments',
  'coach_updates', 'guide_captures', 'anamnesi', 'schede_alimentazione',
  'schede_allenamento', 'checks', 'payments', 'calendar_events',
  'calendarEvents', 'chats', 'daily_rooms', 'dipendenti_provvigioni',
  'guideLeads', 'guides', 'leads', 'pagamenti_dipendenti', 'salesReports',
  'settings', 'userStatus', 'user_levels', 'user_progress', 'video_calls',
  'app-data', 'community_config', 'roles'
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 1. Sostituisci collection(db, 'collectionName')
  for (const col of TENANT_COLLECTIONS) {
    const regex1 = new RegExp(`collection\\(db,\\s*['"]${col}['"]\\)`, 'g');
    if (content.match(regex1)) {
      content = content.replace(regex1, `getTenantCollection(db, '${col}')`);
      changed = true;
    }
  }
  
  // 2. Sostituisci doc(db, 'collectionName', docId) 
  // SOLO se NON è già getTenantDoc
  for (const col of TENANT_COLLECTIONS) {
    const regex2 = new RegExp(`(?<!getTenant)doc\\(db,\\s*['"]${col}['"],\\s*([^)]+)\\)`, 'g');
    const matches = content.match(regex2);
    if (matches) {
      content = content.replace(regex2, (match, docId) => {
        return `getTenantDoc(db, '${col}', ${docId})`;
      });
      changed = true;
    }
  }
  
  // 3. Sostituisci subcollections: collection(db, 'parent', parentId, 'sub')
  const subPattern = /collection\(db,\s*['"](\w+)['"],\s*([^,]+),\s*['"](\w+)['"]\)/g;
  const subMatches = content.match(subPattern);
  if (subMatches) {
    content = content.replace(subPattern, (match, parent, parentId, sub) => {
      if (TENANT_COLLECTIONS.includes(parent)) {
        return `getTenantSubcollection(db, '${parent}', ${parentId}, '${sub}')`;
      }
      return match;
    });
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walkDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(filePath, results);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  
  return results;
}

console.log('🚀 Aggiornamento TUTTE le collections al tenant...\n');

const srcDir = path.join(__dirname, 'src');
const files = walkDirectory(srcDir);

let updated = 0;
const updatedFiles = [];

for (const file of files) {
  // Skip alcuni file
  if (file.includes('/config/tenant.js') || 
      file.includes('/firebase.js') ||
      file.includes('platform/CEOPlatformDashboard.jsx') ||
      file.includes('platform/PlatformLogin.jsx')) {
    continue;
  }
  
  if (updateFile(file)) {
    updated++;
    updatedFiles.push(path.relative(__dirname, file));
  }
}

console.log('='.repeat(60));
console.log(`✅ Aggiornati ${updated}/${files.length} file`);
console.log('='.repeat(60));

if (updated > 0) {
  console.log('\n📝 File modificati:');
  updatedFiles.forEach(f => console.log(`  - ${f}`));
}

console.log('\n✅ COMPLETATO! Ora tutte le collections leggono dal tenant.');
