const fs = require('fs');
const path = require('path');

const files = [
  'src/components/courses/CourseDetail.jsx',
  'src/components/courses/CourseDashboard.jsx',
  'src/components/courses/LessonPlayer.jsx',
  'src/components/chat/ChatNotificationBadge.jsx',
  'src/components/forms/AnamnesiForm.jsx',
  'src/components/business/AdminCheckManager.jsx',
  'src/pages/admin/GuideCapture.jsx',
  'src/pages/admin/GuideManager.jsx',
  'src/pages/ceo/CEOLogin.jsx'
];

for (const file of files) {
  const fullPath = path.join('/workspaces/PtPro', file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  ${file} - not found`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Calcola il path corretto basato sulla profondità
  const depth = (file.match(/\//g) || []).length - 1;
  let correctPath = '../'.repeat(depth) + 'config/tenant';
  
  // Trova dove inserire l'import (dopo l'ultimo import)
  const importMatches = content.match(/^import .+ from .+;?$/gm);
  
  if (!importMatches) {
    console.log(`⚠️  ${file} - no imports found`);
    continue;
  }
  
  const lastImport = importMatches[importMatches.length - 1];
  const insertPos = content.indexOf(lastImport) + lastImport.length;
  
  const newImport = `\nimport { getTenantCollection, getTenantDoc, getTenantSubcollection } from '${correctPath}';`;
  
  content = content.slice(0, insertPos) + newImport + content.slice(insertPos);
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ ${file}`);
}

console.log('\n✅ Import aggiunti!');
