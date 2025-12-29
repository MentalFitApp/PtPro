/**
 * 🍽️ Crea Preset Alimentare - Carb Cycling
 * 
 * Piano alimentare con ciclizzazione carboidrati:
 * - Giorni di allenamento (Lun, Mar, Gio, Ven): Carboidrati ALTI
 * - Giorni di riposo (Mer, Sab, Dom): Carboidrati BASSI
 * 
 * Uso: node scripts/create-preset-carb-cycling.cjs [tenantId]
 * Esempio: node scripts/create-preset-carb-cycling.cjs biondo-fitness-coach
 */

const admin = require('firebase-admin');
const path = require('path');

// Tenant ID da argomento o default
const TENANT_ID = process.argv[2] || 'biondo-fitness-coach';

// Inizializza Firebase Admin
const serviceAccount = require(path.join(__dirname, '../service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ============================================
// ALIMENTI BASE
// ============================================

const ALIMENTI = {
  // PROTEINE
  uova: { nome: "Uova intere", calorie: 155, proteine: 13, carboidrati: 1.1, grassi: 11 },
  albumi: { nome: "Albumi d'uovo", calorie: 52, proteine: 11, carboidrati: 0.7, grassi: 0.2 },
  petto_pollo: { nome: "Petto di pollo", calorie: 165, proteine: 31, carboidrati: 0, grassi: 3.6 },
  tacchino: { nome: "Petto di tacchino", calorie: 135, proteine: 30, carboidrati: 0, grassi: 1 },
  tonno_naturale: { nome: "Tonno al naturale", calorie: 116, proteine: 26, carboidrati: 0, grassi: 1 },
  salmone: { nome: "Salmone fresco", calorie: 208, proteine: 20, carboidrati: 0, grassi: 13 },
  merluzzo: { nome: "Merluzzo", calorie: 82, proteine: 18, carboidrati: 0, grassi: 0.7 },
  manzo_magro: { nome: "Manzo magro", calorie: 250, proteine: 26, carboidrati: 0, grassi: 15 },
  yogurt_greco: { nome: "Yogurt greco 0%", calorie: 59, proteine: 10, carboidrati: 3.6, grassi: 0.7 },
  fiocchi_latte: { nome: "Fiocchi di latte", calorie: 98, proteine: 11, carboidrati: 3.4, grassi: 4.3 },
  whey: { nome: "Whey protein", calorie: 120, proteine: 24, carboidrati: 3, grassi: 1.5 },
  
  // CARBOIDRATI
  riso_basmati: { nome: "Riso basmati", calorie: 350, proteine: 7, carboidrati: 78, grassi: 0.6 },
  riso_integrale: { nome: "Riso integrale", calorie: 362, proteine: 7.5, carboidrati: 76, grassi: 2.7 },
  pasta_integrale: { nome: "Pasta integrale", calorie: 348, proteine: 13, carboidrati: 66, grassi: 2.5 },
  pane_integrale: { nome: "Pane integrale", calorie: 247, proteine: 13, carboidrati: 41, grassi: 3.4 },
  avena: { nome: "Fiocchi d'avena", calorie: 389, proteine: 16.9, carboidrati: 66, grassi: 6.9 },
  patate: { nome: "Patate", calorie: 77, proteine: 2, carboidrati: 17, grassi: 0.1 },
  patate_dolci: { nome: "Patate dolci", calorie: 86, proteine: 1.6, carboidrati: 20, grassi: 0.1 },
  quinoa: { nome: "Quinoa", calorie: 368, proteine: 14, carboidrati: 64, grassi: 6 },
  farro: { nome: "Farro", calorie: 335, proteine: 15, carboidrati: 67, grassi: 2.5 },
  gallette_riso: { nome: "Gallette di riso", calorie: 387, proteine: 8, carboidrati: 81, grassi: 2.8 },
  
  // GRASSI
  olio_evo: { nome: "Olio EVO", calorie: 884, proteine: 0, carboidrati: 0, grassi: 100 },
  mandorle: { nome: "Mandorle", calorie: 579, proteine: 21, carboidrati: 22, grassi: 49 },
  noci: { nome: "Noci", calorie: 654, proteine: 15, carboidrati: 14, grassi: 65 },
  avocado: { nome: "Avocado", calorie: 160, proteine: 2, carboidrati: 9, grassi: 15 },
  burro_arachidi: { nome: "Burro di arachidi", calorie: 588, proteine: 25, carboidrati: 20, grassi: 50 },
  
  // VERDURE
  broccoli: { nome: "Broccoli", calorie: 34, proteine: 2.8, carboidrati: 7, grassi: 0.4 },
  spinaci: { nome: "Spinaci", calorie: 23, proteine: 2.9, carboidrati: 3.6, grassi: 0.4 },
  zucchine: { nome: "Zucchine", calorie: 17, proteine: 1.2, carboidrati: 3.1, grassi: 0.3 },
  insalata_mista: { nome: "Insalata mista", calorie: 20, proteine: 1.5, carboidrati: 3, grassi: 0.3 },
  pomodori: { nome: "Pomodori", calorie: 18, proteine: 0.9, carboidrati: 3.9, grassi: 0.2 },
  asparagi: { nome: "Asparagi", calorie: 20, proteine: 2.2, carboidrati: 3.9, grassi: 0.1 },
  fagiolini: { nome: "Fagiolini", calorie: 31, proteine: 1.8, carboidrati: 7, grassi: 0.1 },
  peperoni: { nome: "Peperoni", calorie: 31, proteine: 1, carboidrati: 6, grassi: 0.3 },
  cavolfiore: { nome: "Cavolfiore", calorie: 25, proteine: 1.9, carboidrati: 5, grassi: 0.3 },
  funghi: { nome: "Funghi champignon", calorie: 22, proteine: 3.1, carboidrati: 3.3, grassi: 0.3 },
  
  // FRUTTA
  banana: { nome: "Banana", calorie: 89, proteine: 1.1, carboidrati: 23, grassi: 0.3 },
  mela: { nome: "Mela", calorie: 52, proteine: 0.3, carboidrati: 14, grassi: 0.2 },
  frutti_bosco: { nome: "Frutti di bosco mix", calorie: 43, proteine: 1, carboidrati: 10, grassi: 0.3 },
  kiwi: { nome: "Kiwi", calorie: 61, proteine: 1.1, carboidrati: 15, grassi: 0.5 },
  arancia: { nome: "Arancia", calorie: 47, proteine: 0.9, carboidrati: 12, grassi: 0.1 },
};

// Helper per creare un alimento con quantità
const creaAlimento = (alimento, quantitaG) => ({
  nome: alimento.nome,
  quantita: quantitaG,
  unita: 'g',
  calorie: Math.round(alimento.calorie * quantitaG / 100),
  proteine: Math.round(alimento.proteine * quantitaG / 100 * 10) / 10,
  carboidrati: Math.round(alimento.carboidrati * quantitaG / 100 * 10) / 10,
  grassi: Math.round(alimento.grassi * quantitaG / 100 * 10) / 10,
});

// ============================================
// GIORNO DI ALLENAMENTO (HIGH CARB)
// ============================================
const giornoAllenamento = {
  pasti: [
    {
      nome: "Colazione",
      alimenti: [
        creaAlimento(ALIMENTI.avena, 80),
        creaAlimento(ALIMENTI.albumi, 150),
        creaAlimento(ALIMENTI.banana, 100),
        creaAlimento(ALIMENTI.mandorle, 15),
      ]
    },
    {
      nome: "Spuntino",
      alimenti: [
        creaAlimento(ALIMENTI.yogurt_greco, 200),
        creaAlimento(ALIMENTI.frutti_bosco, 100),
        creaAlimento(ALIMENTI.gallette_riso, 30),
      ]
    },
    {
      nome: "Pranzo",
      alimenti: [
        creaAlimento(ALIMENTI.petto_pollo, 180),
        creaAlimento(ALIMENTI.riso_basmati, 100),
        creaAlimento(ALIMENTI.broccoli, 200),
        creaAlimento(ALIMENTI.olio_evo, 10),
      ]
    },
    {
      nome: "Spuntino",
      alimenti: [
        creaAlimento(ALIMENTI.whey, 30),
        creaAlimento(ALIMENTI.banana, 100),
        creaAlimento(ALIMENTI.burro_arachidi, 15),
      ]
    },
    {
      nome: "Cena",
      alimenti: [
        creaAlimento(ALIMENTI.salmone, 180),
        creaAlimento(ALIMENTI.patate_dolci, 200),
        creaAlimento(ALIMENTI.spinaci, 150),
        creaAlimento(ALIMENTI.olio_evo, 10),
      ]
    }
  ]
};

// ============================================
// GIORNO DI RIPOSO (LOW CARB)
// ============================================
const giornoRiposo = {
  pasti: [
    {
      nome: "Colazione",
      alimenti: [
        creaAlimento(ALIMENTI.uova, 150), // 3 uova
        creaAlimento(ALIMENTI.avocado, 80),
        creaAlimento(ALIMENTI.spinaci, 100),
        creaAlimento(ALIMENTI.olio_evo, 5),
      ]
    },
    {
      nome: "Spuntino",
      alimenti: [
        creaAlimento(ALIMENTI.yogurt_greco, 200),
        creaAlimento(ALIMENTI.mandorle, 25),
      ]
    },
    {
      nome: "Pranzo",
      alimenti: [
        creaAlimento(ALIMENTI.tacchino, 200),
        creaAlimento(ALIMENTI.insalata_mista, 150),
        creaAlimento(ALIMENTI.pomodori, 100),
        creaAlimento(ALIMENTI.avocado, 50),
        creaAlimento(ALIMENTI.olio_evo, 15),
      ]
    },
    {
      nome: "Spuntino",
      alimenti: [
        creaAlimento(ALIMENTI.fiocchi_latte, 200),
        creaAlimento(ALIMENTI.noci, 20),
      ]
    },
    {
      nome: "Cena",
      alimenti: [
        creaAlimento(ALIMENTI.merluzzo, 200),
        creaAlimento(ALIMENTI.zucchine, 200),
        creaAlimento(ALIMENTI.fagiolini, 150),
        creaAlimento(ALIMENTI.olio_evo, 15),
      ]
    }
  ]
};

// ============================================
// VARIANTE GIORNO ALLENAMENTO 2
// ============================================
const giornoAllenamento2 = {
  pasti: [
    {
      nome: "Colazione",
      alimenti: [
        creaAlimento(ALIMENTI.pane_integrale, 80),
        creaAlimento(ALIMENTI.uova, 100), // 2 uova
        creaAlimento(ALIMENTI.albumi, 100),
        creaAlimento(ALIMENTI.mela, 150),
      ]
    },
    {
      nome: "Spuntino",
      alimenti: [
        creaAlimento(ALIMENTI.whey, 30),
        creaAlimento(ALIMENTI.banana, 100),
      ]
    },
    {
      nome: "Pranzo",
      alimenti: [
        creaAlimento(ALIMENTI.manzo_magro, 150),
        creaAlimento(ALIMENTI.pasta_integrale, 90),
        creaAlimento(ALIMENTI.pomodori, 150),
        creaAlimento(ALIMENTI.olio_evo, 10),
      ]
    },
    {
      nome: "Spuntino",
      alimenti: [
        creaAlimento(ALIMENTI.yogurt_greco, 200),
        creaAlimento(ALIMENTI.frutti_bosco, 80),
        creaAlimento(ALIMENTI.mandorle, 15),
      ]
    },
    {
      nome: "Cena",
      alimenti: [
        creaAlimento(ALIMENTI.petto_pollo, 180),
        creaAlimento(ALIMENTI.quinoa, 80),
        creaAlimento(ALIMENTI.asparagi, 150),
        creaAlimento(ALIMENTI.olio_evo, 10),
      ]
    }
  ]
};

// ============================================
// VARIANTE GIORNO RIPOSO 2
// ============================================
const giornoRiposo2 = {
  pasti: [
    {
      nome: "Colazione",
      alimenti: [
        creaAlimento(ALIMENTI.yogurt_greco, 250),
        creaAlimento(ALIMENTI.noci, 20),
        creaAlimento(ALIMENTI.frutti_bosco, 80),
      ]
    },
    {
      nome: "Spuntino",
      alimenti: [
        creaAlimento(ALIMENTI.uova, 100), // 2 uova sode
        creaAlimento(ALIMENTI.avocado, 60),
      ]
    },
    {
      nome: "Pranzo",
      alimenti: [
        creaAlimento(ALIMENTI.salmone, 180),
        creaAlimento(ALIMENTI.insalata_mista, 200),
        creaAlimento(ALIMENTI.peperoni, 100),
        creaAlimento(ALIMENTI.olio_evo, 15),
      ]
    },
    {
      nome: "Spuntino",
      alimenti: [
        creaAlimento(ALIMENTI.fiocchi_latte, 150),
        creaAlimento(ALIMENTI.mandorle, 20),
      ]
    },
    {
      nome: "Cena",
      alimenti: [
        creaAlimento(ALIMENTI.petto_pollo, 200),
        creaAlimento(ALIMENTI.cavolfiore, 200),
        creaAlimento(ALIMENTI.funghi, 150),
        creaAlimento(ALIMENTI.olio_evo, 15),
      ]
    }
  ]
};

// ============================================
// PRESET COMPLETO 7 GIORNI
// ============================================
const presetData = {
  name: "Carb Cycling - Allenamento/Riposo",
  data: {
    obiettivo: "Definizione",
    note: `🔄 CARB CYCLING - Piano settimanale

📅 DISTRIBUZIONE:
• Lun, Mar, Gio, Ven: Giorni ALLENAMENTO → Carboidrati ALTI (~200-250g)
• Mer, Sab, Dom: Giorni RIPOSO → Carboidrati BASSI (~80-100g)

📊 MACRO INDICATIVI:
Giorno Allenamento: ~2200 kcal | P: 180g | C: 220g | F: 60g
Giorno Riposo: ~1800 kcal | P: 180g | C: 80g | F: 80g

💡 NOTE:
- Nei giorni di allenamento i carboidrati sono concentrati pre e post workout
- Nei giorni di riposo i grassi sono leggermente più alti per compensare
- Proteine costanti ogni giorno per preservare massa muscolare
- Bere almeno 2.5-3L di acqua al giorno
- Verdure a volontà in tutti i pasti`,
    durataSettimane: "8",
    integrazione: "Whey protein post-workout, Omega-3 2g/die, Vitamina D 2000UI/die",
    giorni: {
      "Lunedì": giornoAllenamento,      // HIGH CARB - Allenamento
      "Martedì": giornoAllenamento2,    // HIGH CARB - Allenamento
      "Mercoledì": giornoRiposo,        // LOW CARB - Riposo
      "Giovedì": giornoAllenamento,     // HIGH CARB - Allenamento
      "Venerdì": giornoAllenamento2,    // HIGH CARB - Allenamento
      "Sabato": giornoRiposo2,          // LOW CARB - Riposo
      "Domenica": giornoRiposo,         // LOW CARB - Riposo
    }
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

// ============================================
// SALVATAGGIO NEL DATABASE
// ============================================
async function createPreset() {
  console.log('🍽️ Creazione Preset Carb Cycling');
  console.log('================================');
  console.log(`📍 Tenant: ${TENANT_ID}`);
  
  try {
    // Percorso multi-tenant
    const presetRef = db.collection('tenants').doc(TENANT_ID).collection('preset_alimentazione');
    
    // Verifica se esiste già
    const existingQuery = await presetRef.where('name', '==', presetData.name).get();
    
    if (!existingQuery.empty) {
      console.log('⚠️  Preset già esistente, aggiorno...');
      const docId = existingQuery.docs[0].id;
      await presetRef.doc(docId).update(presetData);
      console.log(`✅ Preset aggiornato: ${docId}`);
    } else {
      const docRef = await presetRef.add(presetData);
      console.log(`✅ Preset creato: ${docRef.id}`);
    }
    
    // Calcola i macro totali per verifica
    console.log('\n📊 Riepilogo Macro:');
    
    for (const [giorno, dati] of Object.entries(presetData.data.giorni)) {
      let totCal = 0, totP = 0, totC = 0, totG = 0;
      dati.pasti.forEach(pasto => {
        pasto.alimenti.forEach(al => {
          totCal += al.calorie || 0;
          totP += al.proteine || 0;
          totC += al.carboidrati || 0;
          totG += al.grassi || 0;
        });
      });
      const tipo = ['Lunedì', 'Martedì', 'Giovedì', 'Venerdì'].includes(giorno) ? '🏋️ HIGH' : '😴 LOW';
      console.log(`${giorno}: ${tipo} | ${Math.round(totCal)} kcal | P: ${Math.round(totP)}g | C: ${Math.round(totC)}g | G: ${Math.round(totG)}g`);
    }
    
    console.log('\n✅ Preset Carb Cycling creato con successo!');
    console.log('📌 Vai su Scheda Alimentazione → Importa Preset per usarlo');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
  
  process.exit(0);
}

createPreset();
