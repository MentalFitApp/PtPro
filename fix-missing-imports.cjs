const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/client/ClientChecks.jsx',
  'src/pages/client/ClientDashboard.jsx',
  'src/pages/client/ClientSchedaAlimentazione.jsx',
  'src/pages/client/ClientSchedaAlimentazioneEnhanced.jsx',
  'src/pages/client/ClientSchedaAllenamento.jsx',
  'src/pages/admin/CollaboratoreDetail.jsx',
  'src/pages/admin/EditClient.jsx',
  'src/pages/admin/NewClient.jsx',
  'src/pages/shared/Onboarding.jsx',
  'src/pages/shared/SchedaAlimentazione.jsx',
  'src/pages/shared/SchedaAllenamento.jsx'
];

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Se già ha l'import, skip
  if (content.includes("from '../../config/tenant'") || content.includes('from "../config/tenant"')) {
    console.log(`✓ ${file} - già ha l'import`);
    continue;
  }
  
  // Trova l'ultimo import di firebase
  const firebaseImportMatch = content.match(/import.*from ['"].*firebase['"];?\n/g);
  if (firebaseImportMatch) {
    const lastFirebaseImport = firebaseImportMatch[firebaseImportMatch.length - 1];
    const insertIndex = content.lastIndexOf(lastFirebaseImport) + lastFirebaseImport.length;
    
    const importToAdd = "import { getTenantDoc, getTenantCollection, getTenantSubcollection } from '../../config/tenant';\n";
    
    content = content.slice(0, insertIndex) + importToAdd + content.slice(insertIndex);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${file} - import aggiunto`);
  } else {
    console.log(`⚠️  ${file} - non trovato import firebase`);
  }
}

console.log('\n✅ Import aggiunti!');
