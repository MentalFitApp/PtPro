const fs = require('fs');
const path = require('path');

const TENANT_COLLECTIONS = [
  'clients', 'users', 'collaboratori', 'notifications', 'community_posts',
  'calendarEvents', 'chats', 'leads', 'guideLeads', 'guides', 'settings'
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  for (const col of TENANT_COLLECTIONS) {
    // Cerca collection(db, 'col') che NON sia getTenantCollection
    const badPattern1 = new RegExp(`(?<!getTenant)collection\\(db,\\s*['"]${col}['"]\\)`, 'g');
    const matches1 = content.match(badPattern1);
    if (matches1) {
      issues.push(`collection(db, '${col}')`);
    }
    
    // Cerca doc(db, 'col', ...) che NON sia getTenantDoc
    const badPattern2 = new RegExp(`(?<!getTenant)doc\\(db,\\s*['"]${col}['"]`, 'g');
    const matches2 = content.match(badPattern2);
    if (matches2) {
      issues.push(`doc(db, '${col}', ...)`);
    }
  }
  
  return issues;
}

function walkDir(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath, results);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  return results;
}

console.log('🔍 Verifica uso getTenant* in tutti i file...\n');

const files = walkDir(path.join(__dirname, 'src'));
let filesWithIssues = 0;

for (const file of files) {
  if (file.includes('/config/tenant.js') || file.includes('/firebase.js')) continue;
  
  const issues = checkFile(file);
  if (issues.length > 0) {
    filesWithIssues++;
    console.log(`\n❌ ${path.relative(__dirname, file)}`);
    issues.forEach(i => console.log(`   - ${i}`));
  }
}

if (filesWithIssues === 0) {
  console.log('✅ Tutti i file usano correttamente getTenant*!');
} else {
  console.log(`\n⚠️  ${filesWithIssues} file hanno ancora references dirette`);
}
