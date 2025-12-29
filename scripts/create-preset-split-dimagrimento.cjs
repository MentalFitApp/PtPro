/**
 * 🏋️ Crea Preset Scheda Split 4 Giorni - Dimagrimento
 * 
 * Split: Push/Pull/Legs/Full Body
 * Livello: Intermedio
 * Obiettivo: Dimagrimento
 * 
 * Uso: node scripts/create-preset-split-dimagrimento.cjs [tenantId]
 * Esempio: node scripts/create-preset-split-dimagrimento.cjs biondo-fitness-coach
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

// Preset scheda split 4 giorni per dimagrimento
const presetData = {
  name: "Split 4 Giorni - Dimagrimento Intermedio",
  data: {
    obiettivo: "Definizione",
    livello: "Intermedio",
    durataSettimane: "8",
    note: "Scheda split 4 giorni ottimizzata per il dimagrimento. Focus su volume moderato, tempi di recupero brevi e inserimento di cardio HIIT. Mantenere deficit calorico di 300-500 kcal. Riposo attivo nei giorni off.",
    giorni: {
      "Lunedì": {
        esercizi: [
          // PUSH DAY - Petto, Spalle, Tricipiti
          {
            nome: "Panca piana con bilanciere",
            nameIt: "Panca piana con bilanciere",
            gruppoMuscolare: "Petto",
            bodyPartIt: "Petto",
            attrezzo: "Bilanciere",
            equipmentIt: "Bilanciere",
            serie: "4",
            ripetizioni: "10-12",
            recupero: "60",
            noteEsercizio: "Controllare la discesa, esplosivo in salita",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0025.gif"
          },
          {
            nome: "Croci ai cavi alti",
            nameIt: "Croci ai cavi alti",
            gruppoMuscolare: "Petto",
            bodyPartIt: "Petto",
            attrezzo: "Cavo",
            equipmentIt: "Cavo",
            serie: "3",
            ripetizioni: "12-15",
            recupero: "45",
            noteEsercizio: "Squeeze al centro, focus sulla contrazione",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0160.gif"
          },
          {
            nome: "Military press con manubri",
            nameIt: "Military press con manubri",
            gruppoMuscolare: "Spalle",
            bodyPartIt: "Spalle",
            attrezzo: "Manubrio",
            equipmentIt: "Manubrio",
            serie: "4",
            ripetizioni: "10-12",
            recupero: "60",
            noteEsercizio: "Non inarcare la schiena",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0405.gif"
          },
          {
            nome: "Alzate laterali con manubri",
            nameIt: "Alzate laterali con manubri",
            gruppoMuscolare: "Spalle",
            bodyPartIt: "Spalle",
            attrezzo: "Manubrio",
            equipmentIt: "Manubrio",
            serie: "3",
            ripetizioni: "15",
            recupero: "30",
            noteEsercizio: "Peso leggero, focus sulla tecnica",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0334.gif"
          },
          {
            nome: "French press con bilanciere EZ",
            nameIt: "French press con bilanciere EZ",
            gruppoMuscolare: "Braccia",
            bodyPartIt: "Braccia",
            attrezzo: "Bilanciere EZ",
            equipmentIt: "Bilanciere EZ",
            serie: "3",
            ripetizioni: "12",
            recupero: "45",
            noteEsercizio: "Gomiti fermi, solo avambracci in movimento",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0182.gif"
          },
          {
            nome: "Push down ai cavi",
            nameIt: "Push down ai cavi",
            gruppoMuscolare: "Braccia",
            bodyPartIt: "Braccia",
            attrezzo: "Cavo",
            equipmentIt: "Cavo",
            serie: "3",
            ripetizioni: "15",
            recupero: "30",
            noteEsercizio: "Contrazione completa in basso"
          },
          {
            type: "circuit-start",
            isMarker: true
          },
          {
            nome: "Cardio HIIT - Bike",
            nameIt: "Cardio HIIT - Bike",
            gruppoMuscolare: "Cardio",
            bodyPartIt: "Cardio",
            attrezzo: "Cyclette",
            equipmentIt: "Cyclette",
            serie: "8",
            ripetizioni: "30s sprint / 30s recupero",
            recupero: "0",
            noteEsercizio: "8 minuti totali di HIIT"
          },
          {
            type: "circuit-end",
            isMarker: true
          }
        ]
      },
      "Martedì": {
        esercizi: [
          // PULL DAY - Schiena, Bicipiti
          {
            nome: "Trazioni alla sbarra",
            nameIt: "Trazioni alla sbarra",
            gruppoMuscolare: "Schiena",
            bodyPartIt: "Schiena",
            attrezzo: "Corpo libero",
            equipmentIt: "Corpo libero",
            serie: "4",
            ripetizioni: "8-10",
            recupero: "60",
            noteEsercizio: "Se non riesci, usa elastico assistito",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0651.gif"
          },
          {
            nome: "Rematore con bilanciere",
            nameIt: "Rematore con bilanciere",
            gruppoMuscolare: "Schiena",
            bodyPartIt: "Schiena",
            attrezzo: "Bilanciere",
            equipmentIt: "Bilanciere",
            serie: "4",
            ripetizioni: "10-12",
            recupero: "60",
            noteEsercizio: "Schiena parallela al pavimento, tira verso l'ombelico",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0027.gif"
          },
          {
            nome: "Lat machine presa larga",
            nameIt: "Lat machine presa larga",
            gruppoMuscolare: "Schiena",
            bodyPartIt: "Schiena",
            attrezzo: "Cavo",
            equipmentIt: "Cavo",
            serie: "3",
            ripetizioni: "12",
            recupero: "45",
            noteEsercizio: "Tira verso il petto, gomiti in basso",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0160.gif"
          },
          {
            nome: "Face pull ai cavi",
            nameIt: "Face pull ai cavi",
            gruppoMuscolare: "Spalle",
            bodyPartIt: "Spalle",
            attrezzo: "Cavo",
            equipmentIt: "Cavo",
            serie: "3",
            ripetizioni: "15",
            recupero: "30",
            noteEsercizio: "Ottimo per postura e deltoide posteriore"
          },
          {
            nome: "Curl con bilanciere",
            nameIt: "Curl con bilanciere",
            gruppoMuscolare: "Braccia",
            bodyPartIt: "Braccia",
            attrezzo: "Bilanciere",
            equipmentIt: "Bilanciere",
            serie: "3",
            ripetizioni: "12",
            recupero: "45",
            noteEsercizio: "Non dondolare, movimento controllato",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0031.gif"
          },
          {
            nome: "Curl a martello con manubri",
            nameIt: "Curl a martello con manubri",
            gruppoMuscolare: "Braccia",
            bodyPartIt: "Braccia",
            attrezzo: "Manubrio",
            equipmentIt: "Manubrio",
            serie: "3",
            ripetizioni: "12",
            recupero: "30",
            noteEsercizio: "Alternato o simultaneo",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0313.gif"
          },
          {
            type: "circuit-start",
            isMarker: true
          },
          {
            nome: "Cardio HIIT - Vogatore",
            nameIt: "Cardio HIIT - Vogatore",
            gruppoMuscolare: "Cardio",
            bodyPartIt: "Cardio",
            attrezzo: "Vogatore",
            equipmentIt: "Vogatore",
            serie: "6",
            ripetizioni: "40s sprint / 20s recupero",
            recupero: "0",
            noteEsercizio: "6 minuti totali di HIIT"
          },
          {
            type: "circuit-end",
            isMarker: true
          }
        ]
      },
      "Mercoledì": {
        esercizi: [] // Riposo o cardio leggero
      },
      "Giovedì": {
        esercizi: [
          // LEGS DAY - Gambe complete
          {
            nome: "Squat con bilanciere",
            nameIt: "Squat con bilanciere",
            gruppoMuscolare: "Gambe",
            bodyPartIt: "Gambe",
            attrezzo: "Bilanciere",
            equipmentIt: "Bilanciere",
            serie: "4",
            ripetizioni: "10-12",
            recupero: "90",
            noteEsercizio: "Profondità almeno parallelo, ginocchia in linea con i piedi",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0043.gif"
          },
          {
            nome: "Leg press",
            nameIt: "Leg press",
            gruppoMuscolare: "Gambe",
            bodyPartIt: "Gambe",
            attrezzo: "Macchina a leva",
            equipmentIt: "Macchina a leva",
            serie: "4",
            ripetizioni: "12-15",
            recupero: "60",
            noteEsercizio: "Piedi alti per glutei, bassi per quadricipiti",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0738.gif"
          },
          {
            nome: "Affondi camminati con manubri",
            nameIt: "Affondi camminati con manubri",
            gruppoMuscolare: "Gambe",
            bodyPartIt: "Gambe",
            attrezzo: "Manubrio",
            equipmentIt: "Manubrio",
            serie: "3",
            ripetizioni: "12 per gamba",
            recupero: "60",
            noteEsercizio: "Passo lungo per glutei",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0291.gif"
          },
          {
            nome: "Leg curl sdraiato",
            nameIt: "Leg curl sdraiato",
            gruppoMuscolare: "Gambe",
            bodyPartIt: "Gambe",
            attrezzo: "Macchina a leva",
            equipmentIt: "Macchina a leva",
            serie: "3",
            ripetizioni: "12-15",
            recupero: "45",
            noteEsercizio: "Contrazione completa in alto"
          },
          {
            nome: "Leg extension",
            nameIt: "Leg extension",
            gruppoMuscolare: "Gambe",
            bodyPartIt: "Gambe",
            attrezzo: "Macchina a leva",
            equipmentIt: "Macchina a leva",
            serie: "3",
            ripetizioni: "15",
            recupero: "45",
            noteEsercizio: "Contrazione di picco in alto"
          },
          {
            nome: "Calf raises in piedi",
            nameIt: "Calf raises in piedi",
            gruppoMuscolare: "Polpacci",
            bodyPartIt: "Polpacci",
            attrezzo: "Macchina a leva",
            equipmentIt: "Macchina a leva",
            serie: "4",
            ripetizioni: "15-20",
            recupero: "30",
            noteEsercizio: "Range completo, stretch in basso"
          },
          {
            type: "circuit-start",
            isMarker: true
          },
          {
            nome: "Cardio LISS - Camminata inclinata",
            nameIt: "Cardio LISS - Camminata inclinata",
            gruppoMuscolare: "Cardio",
            bodyPartIt: "Cardio",
            attrezzo: "Tapis roulant",
            equipmentIt: "Tapis roulant",
            serie: "1",
            ripetizioni: "15 minuti",
            recupero: "0",
            noteEsercizio: "Inclinazione 10-12%, velocità 5-6 km/h"
          },
          {
            type: "circuit-end",
            isMarker: true
          }
        ]
      },
      "Venerdì": {
        esercizi: [
          // FULL BODY + CORE - Metabolico
          {
            type: "circuit-start",
            isMarker: true
          },
          {
            nome: "Burpees",
            nameIt: "Burpees",
            gruppoMuscolare: "Cardio",
            bodyPartIt: "Cardio",
            attrezzo: "Corpo libero",
            equipmentIt: "Corpo libero",
            serie: "4",
            ripetizioni: "10",
            recupero: "30",
            noteEsercizio: "Movimento esplosivo completo"
          },
          {
            nome: "Kettlebell swing",
            nameIt: "Kettlebell swing",
            gruppoMuscolare: "Gambe",
            bodyPartIt: "Gambe",
            attrezzo: "Kettlebell",
            equipmentIt: "Kettlebell",
            serie: "4",
            ripetizioni: "15",
            recupero: "30",
            noteEsercizio: "Spinta di anche, non di braccia",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0548.gif"
          },
          {
            nome: "Push up",
            nameIt: "Push up",
            gruppoMuscolare: "Petto",
            bodyPartIt: "Petto",
            attrezzo: "Corpo libero",
            equipmentIt: "Corpo libero",
            serie: "4",
            ripetizioni: "15",
            recupero: "30",
            noteEsercizio: "Core attivo, corpo in linea",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0662.gif"
          },
          {
            nome: "Rematore con manubrio",
            nameIt: "Rematore con manubrio",
            gruppoMuscolare: "Schiena",
            bodyPartIt: "Schiena",
            attrezzo: "Manubrio",
            equipmentIt: "Manubrio",
            serie: "4",
            ripetizioni: "12 per lato",
            recupero: "30",
            noteEsercizio: "Tira il gomito alto",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0292.gif"
          },
          {
            type: "circuit-end",
            isMarker: true
          },
          {
            nome: "Plank",
            nameIt: "Plank",
            gruppoMuscolare: "Addome",
            bodyPartIt: "Addome",
            attrezzo: "Corpo libero",
            equipmentIt: "Corpo libero",
            serie: "3",
            ripetizioni: "45 secondi",
            recupero: "30",
            noteEsercizio: "Non far cadere i fianchi",
            gifUrl: "https://media.flowfitpro.it/exercises/gifs/0628.gif"
          },
          {
            nome: "Mountain climbers",
            nameIt: "Mountain climbers",
            gruppoMuscolare: "Addome",
            bodyPartIt: "Addome",
            attrezzo: "Corpo libero",
            equipmentIt: "Corpo libero",
            serie: "3",
            ripetizioni: "20 per gamba",
            recupero: "30",
            noteEsercizio: "Velocità controllata, core stabile"
          },
          {
            nome: "Russian twist",
            nameIt: "Russian twist",
            gruppoMuscolare: "Addome",
            bodyPartIt: "Addome",
            attrezzo: "Palla medica",
            equipmentIt: "Palla medica",
            serie: "3",
            ripetizioni: "20 totali",
            recupero: "30",
            noteEsercizio: "Piedi sollevati per maggiore difficoltà"
          },
          {
            nome: "Crunch bicicletta",
            nameIt: "Crunch bicicletta",
            gruppoMuscolare: "Addome",
            bodyPartIt: "Addome",
            attrezzo: "Corpo libero",
            equipmentIt: "Corpo libero",
            serie: "3",
            ripetizioni: "15 per lato",
            recupero: "30",
            noteEsercizio: "Gomito verso ginocchio opposto"
          },
          {
            type: "circuit-start",
            isMarker: true
          },
          {
            nome: "Cardio HIIT Finisher",
            nameIt: "Cardio HIIT Finisher",
            gruppoMuscolare: "Cardio",
            bodyPartIt: "Cardio",
            attrezzo: "Corpo libero",
            equipmentIt: "Corpo libero",
            serie: "4",
            ripetizioni: "30s jumping jacks / 30s rest",
            recupero: "0",
            noteEsercizio: "Finisher brucia calorie!"
          },
          {
            type: "circuit-end",
            isMarker: true
          }
        ]
      },
      "Sabato": {
        esercizi: [] // Riposo o cardio leggero (camminata, nuoto)
      },
      "Domenica": {
        esercizi: [] // Riposo completo
      }
    }
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

async function createPreset() {
  console.log(`🏋️ Creazione preset "Split 4 Giorni - Dimagrimento Intermedio"...`);
  console.log(`   🏢 Tenant: ${TENANT_ID}\n`);
  
  try {
    // Multi-tenant: salva nella subcollection del tenant
    const presetsRef = db.collection('tenants').doc(TENANT_ID).collection('preset_allenamento');
    const docRef = await presetsRef.add(presetData);
    
    console.log('✅ Preset creato con successo!');
    console.log(`   📄 ID: ${docRef.id}`);
    console.log(`   🏢 Tenant: ${TENANT_ID}`);
    console.log(`   📝 Nome: ${presetData.name}`);
    console.log(`   🎯 Obiettivo: ${presetData.data.obiettivo}`);
    console.log(`   📊 Livello: ${presetData.data.livello}`);
    console.log(`   📅 Durata: ${presetData.data.durataSettimane} settimane`);
    console.log('\n📋 Struttura Split:');
    console.log('   🔴 Lunedì: PUSH (Petto, Spalle, Tricipiti) + HIIT');
    console.log('   🔵 Martedì: PULL (Schiena, Bicipiti) + HIIT');
    console.log('   ⚪ Mercoledì: Riposo');
    console.log('   🟢 Giovedì: LEGS (Gambe complete) + LISS');
    console.log('   🟡 Venerdì: FULL BODY Metabolico + Core + HIIT');
    console.log('   ⚪ Sabato/Domenica: Riposo');
    
    console.log('\n🎉 Ora puoi importare questo preset dalla scheda allenamento di qualsiasi cliente!');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
  
  process.exit(0);
}

createPreset();
