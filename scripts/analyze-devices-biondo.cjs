// scripts/analyze-devices-biondo.cjs
// Analizza i dispositivi dei clienti del tenant biondo

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const TENANT_ID = 'biondo-fitness-coach';

async function analyzeDevices() {
  console.log('🔍 Analisi dispositivi per tenant:', TENANT_ID);
  console.log('='.repeat(60));
  
  try {
    // 1. Analizza dalla collezione clients (lastDevice)
    console.log('\n📱 DISPOSITIVI DAI CLIENTI (lastDevice)\n');
    
    const clientsSnap = await db
      .collection('tenants')
      .doc(TENANT_ID)
      .collection('clients')
      .get();
    
    const stats = {
      total: 0,
      withDevice: 0,
      ios: 0,
      android: 0,
      windows: 0,
      macos: 0,
      linux: 0,
      other: 0,
      mobile: 0,
      tablet: 0,
      desktop: 0,
      pwa: 0,
      devices: []
    };
    
    clientsSnap.forEach(doc => {
      const data = doc.data();
      stats.total++;
      
      if (data.lastDevice) {
        stats.withDevice++;
        
        const device = data.lastDevice;
        const os = typeof device === 'string' 
          ? device.toLowerCase() 
          : (device.os || '').toLowerCase();
        
        // Conta OS
        if (os.includes('ios') || os.includes('iphone') || os.includes('ipad')) {
          stats.ios++;
        } else if (os.includes('android')) {
          stats.android++;
        } else if (os.includes('windows')) {
          stats.windows++;
        } else if (os.includes('macos') || os.includes('mac os')) {
          stats.macos++;
        } else if (os.includes('linux')) {
          stats.linux++;
        } else {
          stats.other++;
        }
        
        // Conta tipo dispositivo
        if (typeof device === 'object') {
          if (device.deviceType === 'Mobile') stats.mobile++;
          else if (device.deviceType === 'Tablet') stats.tablet++;
          else stats.desktop++;
          
          if (device.isStandalone) stats.pwa++;
          
          stats.devices.push({
            name: data.name || data.displayName || 'N/D',
            email: data.email || 'N/D',
            os: device.os || 'N/D',
            osVersion: device.osVersion || '',
            browser: device.browser || 'N/D',
            deviceType: device.deviceType || 'N/D',
            deviceModel: device.deviceModel || '',
            isPWA: device.isStandalone || false
          });
        }
      }
    });
    
    // Stampa risultati
    console.log(`Totale clienti: ${stats.total}`);
    console.log(`Con dati dispositivo: ${stats.withDevice} (${((stats.withDevice/stats.total)*100).toFixed(1)}%)`);
    console.log('');
    
    console.log('📊 SISTEMA OPERATIVO:');
    console.log(`  🍎 iOS (iPhone/iPad): ${stats.ios} (${((stats.ios/stats.withDevice)*100).toFixed(1)}%)`);
    console.log(`  🤖 Android: ${stats.android} (${((stats.android/stats.withDevice)*100).toFixed(1)}%)`);
    console.log(`  🪟 Windows: ${stats.windows} (${((stats.windows/stats.withDevice)*100).toFixed(1)}%)`);
    console.log(`  🍏 macOS: ${stats.macos} (${((stats.macos/stats.withDevice)*100).toFixed(1)}%)`);
    console.log(`  🐧 Linux: ${stats.linux}`);
    console.log(`  ❓ Altro: ${stats.other}`);
    console.log('');
    
    console.log('📱 TIPO DISPOSITIVO:');
    console.log(`  📱 Mobile: ${stats.mobile} (${((stats.mobile/stats.withDevice)*100).toFixed(1)}%)`);
    console.log(`  📱 Tablet: ${stats.tablet} (${((stats.tablet/stats.withDevice)*100).toFixed(1)}%)`);
    console.log(`  💻 Desktop: ${stats.desktop} (${((stats.desktop/stats.withDevice)*100).toFixed(1)}%)`);
    console.log('');
    
    console.log('📲 INSTALLAZIONE:');
    console.log(`  ✅ PWA installata: ${stats.pwa}`);
    console.log(`  🌐 Browser: ${stats.withDevice - stats.pwa}`);
    console.log('');
    
    // Dettaglio iOS vs Android
    const mobileTotal = stats.ios + stats.android;
    if (mobileTotal > 0) {
      console.log('='.repeat(60));
      console.log('📊 RIEPILOGO MOBILE (iOS vs Android):');
      console.log('='.repeat(60));
      console.log(`  🍎 iOS: ${stats.ios} (${((stats.ios/mobileTotal)*100).toFixed(1)}%)`);
      console.log(`  🤖 Android: ${stats.android} (${((stats.android/mobileTotal)*100).toFixed(1)}%)`);
      console.log('');
      
      // Grafico ASCII
      const iosBar = '█'.repeat(Math.round(stats.ios / mobileTotal * 30));
      const androidBar = '█'.repeat(Math.round(stats.android / mobileTotal * 30));
      console.log(`  iOS:     ${iosBar} ${stats.ios}`);
      console.log(`  Android: ${androidBar} ${stats.android}`);
    }
    
    // 2. Analizza anche FCM tokens per piattaforme
    console.log('\n');
    console.log('='.repeat(60));
    console.log('🔔 TOKEN NOTIFICHE (FCM) PER PIATTAFORMA:');
    console.log('='.repeat(60));
    
    const fcmSnap = await db
      .collection('tenants')
      .doc(TENANT_ID)
      .collection('fcmTokens')
      .get();
    
    const fcmStats = {
      total: 0,
      ios: 0,
      android: 0,
      pwa: 0
    };
    
    fcmSnap.forEach(doc => {
      const data = doc.data();
      fcmStats.total++;
      
      const platform = (data.platform || '').toLowerCase();
      if (platform.includes('ios')) fcmStats.ios++;
      else if (platform.includes('android')) fcmStats.android++;
      
      if (data.isPWA) fcmStats.pwa++;
    });
    
    console.log(`Totale token FCM: ${fcmStats.total}`);
    console.log(`  🍎 iOS: ${fcmStats.ios}`);
    console.log(`  🤖 Android/Web: ${fcmStats.android}`);
    console.log(`  📲 PWA: ${fcmStats.pwa}`);
    
    // Lista dettagliata dispositivi
    console.log('\n');
    console.log('='.repeat(60));
    console.log('📋 DETTAGLIO DISPOSITIVI CLIENTI:');
    console.log('='.repeat(60));
    
    // Ordina per OS
    stats.devices.sort((a, b) => {
      if (a.os.includes('iOS') && !b.os.includes('iOS')) return -1;
      if (!a.os.includes('iOS') && b.os.includes('iOS')) return 1;
      return a.name.localeCompare(b.name);
    });
    
    stats.devices.forEach((d, i) => {
      const icon = d.os.includes('iOS') ? '🍎' : d.os.includes('Android') ? '🤖' : '💻';
      const pwaIcon = d.isPWA ? ' [PWA]' : '';
      console.log(`${i+1}. ${icon} ${d.name}`);
      console.log(`   ${d.os} ${d.osVersion} • ${d.browser} • ${d.deviceType}${pwaIcon}`);
      if (d.deviceModel) console.log(`   Modello: ${d.deviceModel}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
  
  process.exit(0);
}

analyzeDevices();
