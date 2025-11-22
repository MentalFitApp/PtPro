const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Pattern 1: doc(db, 'roles', 'admins')
  const pattern1 = /doc\(db,\s*['"]roles['"],\s*['"](\w+)['"]\)/g;
  if (content.match(pattern1)) {
    content = content.replace(pattern1, (match, roleType) => {
      return `getTenantDoc(db, 'roles', '${roleType}')`;
    });
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const filesToFix = [
  'src/pages/ceo/CEODashboard.jsx',
  'src/pages/ceo/CEOLogin.jsx',
  'src/pages/coach/CoachDashboard.jsx',
  'src/pages/auth/Login.jsx',
  'src/pages/shared/CalendarPage.jsx',
  'src/pages/shared/UnifiedChat.jsx',
  'src/pages/shared/CalendarReport.jsx',
  'src/pages/admin/CollaboratoreDetail.jsx',
  'src/pages/admin/Statistiche.jsx',
  'src/pages/admin/SuperAdminSettings.jsx',
  'src/pages/admin/Collaboratori.jsx'
];

let fixed = 0;
for (const file of filesToFix) {
  const fullPath = path.join('/workspaces/PtPro', file);
  if (fs.existsSync(fullPath)) {
    if (fixFile(fullPath)) {
      console.log(`✅ ${file}`);
      fixed++;
    } else {
      console.log(`⏭️  ${file} (già ok)`);
    }
  }
}

console.log(`\n✅ Aggiornati ${fixed} file!`);
