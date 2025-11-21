const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Configurazione Firebase (usa la stessa del tuo progetto)
const firebaseConfig = {
  // Inserisci qui la tua configurazione Firebase
  apiKey: "AIzaSyD...",
  authDomain: "ptpro-....firebaseapp.com",
  projectId: "ptpro-...",
  storageBucket: "ptpro-....appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createSampleLevels() {
  try {
    console.log('Creazione livelli di esempio...');

    // Livelli di esempio
    const levels = [
      {
        name: 'Principiante',
        description: 'Benvenuto nella community! Continua a partecipare per salire di livello.',
        minPoints: 0,
        color: 'from-gray-500 to-slate-500',
        icon: 'Trophy',
        requirements: {
          posts: 0,
          reactions: 0,
          comments: 0,
          courses_completed: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Attivo',
        description: 'Stai diventando parte attiva della community!',
        minPoints: 50,
        color: 'from-blue-500 to-cyan-500',
        icon: 'Trophy',
        requirements: {
          posts: 2,
          reactions: 10,
          comments: 5,
          courses_completed: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Esperto',
        description: 'Le tue conoscenze e contributi sono preziosi per la community.',
        minPoints: 200,
        color: 'from-purple-500 to-pink-500',
        icon: 'Trophy',
        requirements: {
          posts: 10,
          reactions: 50,
          comments: 25,
          courses_completed: 1
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Maestro',
        description: 'Sei un punto di riferimento per gli altri membri!',
        minPoints: 500,
        color: 'from-amber-500 to-orange-500',
        icon: 'Trophy',
        requirements: {
          posts: 25,
          reactions: 150,
          comments: 75,
          courses_completed: 3
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Leggenda',
        description: 'La tua presenza illumina la nostra community. Grazie per essere qui!',
        minPoints: 1000,
        color: 'from-rose-500 to-red-500',
        icon: 'Trophy',
        requirements: {
          posts: 50,
          reactions: 300,
          comments: 150,
          courses_completed: 5
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Aggiungi livelli
    for (const level of levels) {
      await addDoc(collection(db, 'levels'), level);
      console.log(`Livello "${level.name}" creato`);
    }

    // Rewards di esempio
    const rewards = [
      {
        name: 'Accesso Corso Base',
        description: 'Sblocca l\'accesso al corso introduttivo sul fitness',
        type: 'course_access',
        requiredLevel: null, // Sarà impostato dopo aver creato i livelli
        data: {
          courseId: 'intro-fitness'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Accesso Live Room',
        description: 'Partecipa alle sessioni live esclusive per membri attivi',
        type: 'live_room_access',
        requiredLevel: null,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Badge Community',
        description: 'Ricevi un badge speciale per il tuo impegno',
        type: 'badge',
        requiredLevel: null,
        data: {
          badgeIcon: 'Star',
          badgeColor: 'gold'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Moderatore Junior',
        description: 'Ottieni privilegi di moderazione limitati',
        type: 'role',
        requiredLevel: null,
        data: {
          permissions: ['moderate_posts', 'view_reports']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Prima ottieni i riferimenti ai livelli creati
    const levelsSnapshot = await getDocs(collection(db, 'levels'));
    const createdLevels = levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Trova i livelli per i rewards
    const attivoLevel = createdLevels.find(l => l.name === 'Attivo');
    const espertoLevel = createdLevels.find(l => l.name === 'Esperto');
    const maestroLevel = createdLevels.find(l => l.name === 'Maestro');

    // Aggiorna i requiredLevel nei rewards
    rewards[0].requiredLevel = attivoLevel.id; // Corso base per livello Attivo
    rewards[1].requiredLevel = espertoLevel.id; // Live room per livello Esperto
    rewards[2].requiredLevel = maestroLevel.id; // Badge per livello Maestro
    rewards[3].requiredLevel = maestroLevel.id; // Ruolo moderatore per livello Maestro

    // Aggiungi rewards
    for (const reward of rewards) {
      await addDoc(collection(db, 'rewards'), reward);
      console.log(`Reward "${reward.name}" creato`);
    }

    console.log('✅ Livelli e rewards di esempio creati con successo!');
    console.log('\nPer usare questo script:');
    console.log('1. Inserisci la tua configurazione Firebase nel file');
    console.log('2. Esegui: node create-sample-levels.js');

  } catch (error) {
    console.error('Errore durante la creazione:', error);
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  createSampleLevels();
}

module.exports = { createSampleLevels };