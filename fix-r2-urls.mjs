/**
 * Script per migrare tutti gli URL da media.flowfitpro.it al formato R2 pubblico
 * 
 * Cerca in tutte le collezioni Firestore e aggiorna gli URL dei file
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDU4GmH6xLhrEd2jSkyATXJOasIyEfisXY",
  authDomain: "biondo-fitness-coach.firebaseapp.com",
  projectId: "biondo-fitness-coach",
  storageBucket: "biondo-fitness-coach.firebasestorage.app",
  messagingSenderId: "1086406111438",
  appId: "1:1086406111438:web:1c8c3d9e49f1ffdb77609f",
  measurementId: "G-869HQ5KGVX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const R2_ACCOUNT_ID = '7682069cf34302dfc6988fbe193f2ba6';
const R2_BUCKET = 'fitflow';
const OLD_DOMAIN = 'https://media.flowfitpro.it';
const NEW_BASE_URL = `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

/**
 * Converti URL vecchio in nuovo formato
 */
function convertUrl(oldUrl) {
  if (!oldUrl || !oldUrl.includes(OLD_DOMAIN)) {
    return oldUrl;
  }
  
  // Estrai il path dopo il dominio
  const path = oldUrl.replace(OLD_DOMAIN, '').replace(/^\//, '');
  return `${NEW_BASE_URL}/${path}`;
}

/**
 * Aggiorna ricorsivamente tutti gli URL in un oggetto
 */
function updateUrlsInObject(obj) {
  let hasChanges = false;
  const updated = { ...obj };
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.includes(OLD_DOMAIN)) {
      updated[key] = convertUrl(value);
      hasChanges = true;
      console.log(`  ✓ ${key}: ${value.substring(0, 60)}...`);
      console.log(`    → ${updated[key].substring(0, 60)}...`);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const result = updateUrlsInObject(value);
      if (result.hasChanges) {
        updated[key] = result.updated;
        hasChanges = true;
      }
    } else if (Array.isArray(value)) {
      const updatedArray = value.map(item => {
        if (typeof item === 'string' && item.includes(OLD_DOMAIN)) {
          hasChanges = true;
          return convertUrl(item);
        } else if (typeof item === 'object' && item !== null) {
          const result = updateUrlsInObject(item);
          if (result.hasChanges) {
            hasChanges = true;
            return result.updated;
          }
        }
        return item;
      });
      if (hasChanges) {
        updated[key] = updatedArray;
      }
    }
  }
  
  return { updated, hasChanges };
}

/**
 * Processa una collezione Firestore
 */
async function processCollection(collectionName) {
  console.log(`\n📂 Processando collezione: ${collectionName}`);
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    let updated = 0;
    let skipped = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const result = updateUrlsInObject(data);
      
      if (result.hasChanges) {
        console.log(`\n  📝 Aggiornamento documento: ${docSnapshot.id}`);
        await updateDoc(doc(db, collectionName, docSnapshot.id), result.updated);
        updated++;
      } else {
        skipped++;
      }
    }
    
    console.log(`✅ ${collectionName}: ${updated} aggiornati, ${skipped} saltati`);
    return { updated, skipped };
    
  } catch (error) {
    console.error(`❌ Errore processando ${collectionName}:`, error.message);
    return { updated: 0, skipped: 0, error: true };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Inizio migrazione URL da media.flowfitpro.it a R2 pubblico\n');
  console.log(`Old domain: ${OLD_DOMAIN}`);
  console.log(`New base URL: ${NEW_BASE_URL}\n`);
  
  const collections = [
    'community_posts',
    'users',
    'clients',
    'schedaAlimentazione',
    'schedaAllenamento',
    'anamnesi',
    'notifications',
    'pagamenti'
  ];
  
  let totalUpdated = 0;
  let totalSkipped = 0;
  
  for (const collectionName of collections) {
    const result = await processCollection(collectionName);
    totalUpdated += result.updated;
    totalSkipped += result.skipped;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Migrazione completata!`);
  console.log(`   Totale documenti aggiornati: ${totalUpdated}`);
  console.log(`   Totale documenti saltati: ${totalSkipped}`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
