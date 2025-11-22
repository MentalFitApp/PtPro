const fs = require('fs');
const path = require('path');

function fixTypoInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Fix: getTenantSubgetTenantSubgetTenantSubcollection → getTenantSubcollection
  let fixed = content.replace(/getTenantSubgetTenantSubgetTenantSubcollection/g, 'getTenantSubcollection');
  
  // Fix: getTenantSubgetTenantSubcollection → getTenantSubcollection
  fixed = fixed.replace(/getTenantSubgetTenantSubcollection/g, 'getTenantSubcollection');
  
  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      if (fixTypoInFile(filePath)) {
        console.log('✅ Fixed:', filePath);
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

const srcDir = path.join(__dirname, 'src');
const fixedCount = walkDir(srcDir);

console.log(`\n✅ Totale file corretti: ${fixedCount}`);
