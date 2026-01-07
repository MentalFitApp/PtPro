/**
 * Script per popolare il tenant di test con dati dimostrativi completi
 * 
 * Crea:
 * - 10 clienti con stati diversi (attivo, scaduto, in scadenza, nuovo)
 * - Chat con messaggi
 * - Check periodici con foto e misurazioni
 * - Anamnesi complete
 * - Pagamenti e rate
 * - Chiamate programmate
 * - Schede allenamento e alimentari
 * - Eventi calendario
 * - Attività recenti
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Inizializza Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const TENANT_ID = 'test-tenant'; // Tenant di test esistente

// === DATI DIMOSTRATIVI ===

const SAMPLE_CLIENTS = [
  {
    name: 'Marco Rossi',
    email: 'marco.rossi@example.com',
    phone: '+39 340 1234567',
    status: 'active',
    subscriptionType: 'Premium',
    monthlyFee: 150,
    scadenza: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // +45 giorni
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // -6 mesi
    goals: ['Perdita peso', 'Definizione muscolare'],
    weight: 82,
    height: 178,
    age: 32
  },
  {
    name: 'Laura Bianchi',
    email: 'laura.bianchi@example.com',
    phone: '+39 345 9876543',
    status: 'active',
    subscriptionType: 'Standard',
    monthlyFee: 100,
    scadenza: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 giorni (IN SCADENZA)
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    goals: ['Tonificazione', 'Miglioramento postura'],
    weight: 58,
    height: 165,
    age: 28
  },
  {
    name: 'Giuseppe Verdi',
    email: 'giuseppe.verdi@example.com',
    phone: '+39 338 5551234',
    status: 'expired',
    subscriptionType: 'Premium',
    monthlyFee: 150,
    scadenza: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // -10 giorni (SCADUTO)
    startDate: new Date(Date.now() - 270 * 24 * 60 * 60 * 1000),
    goals: ['Aumento massa muscolare'],
    weight: 75,
    height: 180,
    age: 35
  },
  {
    name: 'Sofia Romano',
    email: 'sofia.romano@example.com',
    phone: '+39 347 8889999',
    status: 'active',
    subscriptionType: 'Premium Plus',
    monthlyFee: 200,
    scadenza: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // -1 anno
    goals: ['Preparazione gara', 'Ipertrofia'],
    weight: 65,
    height: 170,
    age: 26
  },
  {
    name: 'Andrea Ferrari',
    email: 'andrea.ferrari@example.com',
    phone: '+39 340 7771111',
    status: 'new',
    subscriptionType: 'Trial',
    monthlyFee: 0,
    scadenza: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 giorni (TRIAL)
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // -2 giorni (NUOVO)
    goals: ['Perdita peso', 'Miglioramento fitness'],
    weight: 95,
    height: 175,
    age: 40
  },
  {
    name: 'Chiara Marino',
    email: 'chiara.marino@example.com',
    phone: '+39 349 3332222',
    status: 'active',
    subscriptionType: 'Standard',
    monthlyFee: 100,
    scadenza: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    goals: ['Tonificazione', 'Benessere generale'],
    weight: 62,
    height: 168,
    age: 30
  },
  {
    name: 'Luca Conti',
    email: 'luca.conti@example.com',
    phone: '+39 346 5554444',
    status: 'active',
    subscriptionType: 'Premium',
    monthlyFee: 150,
    scadenza: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    goals: ['Forza', 'Powerlifting'],
    weight: 88,
    height: 182,
    age: 29
  },
  {
    name: 'Francesca Gallo',
    email: 'francesca.gallo@example.com',
    phone: '+39 348 1112233',
    status: 'active',
    subscriptionType: 'Standard',
    monthlyFee: 100,
    scadenza: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 giorni (IN SCADENZA)
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    goals: ['Dimagrimento', 'Cardio'],
    weight: 70,
    height: 162,
    age: 33
  },
  {
    name: 'Roberto Colombo',
    email: 'roberto.colombo@example.com',
    phone: '+39 342 9998888',
    status: 'paused',
    subscriptionType: 'Premium',
    monthlyFee: 150,
    scadenza: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
    goals: ['Mantenimento', 'Salute'],
    weight: 80,
    height: 176,
    age: 45
  },
  {
    name: 'Elena Ricci',
    email: 'elena.ricci@example.com',
    phone: '+39 345 4445556',
    status: 'active',
    subscriptionType: 'Premium Plus',
    monthlyFee: 200,
    scadenza: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
    goals: ['Preparazione maratona', 'Endurance'],
    weight: 56,
    height: 167,
    age: 27
  }
];

const CHAT_MESSAGES = [
  { text: 'Ciao! Come ti senti oggi?', isCoach: true },
  { text: 'Tutto bene! Ho completato l\'allenamento di stamattina 💪', isCoach: false },
  { text: 'Ottimo! Come ti sei trovato con gli esercizi?', isCoach: true },
  { text: 'Molto bene, solo un po\' di fatica sugli squat', isCoach: false },
  { text: 'Perfetto, è normale all\'inizio. Continua così! 🔥', isCoach: true }
];

// === FUNZIONI DI CREAZIONE ===

async function createClients(tenantId) {
  console.log('\n👥 Creazione clienti...');
  const clientsRef = db.collection('tenants').doc(tenantId).collection('clients');
  const createdClients = [];

  for (const client of SAMPLE_CLIENTS) {
    // Genera revenue storico randomico (500-1200 per periodo)
    const revenue3m = Math.floor(Math.random() * 700) + 500;  // 500-1200
    const revenue6m = Math.floor(Math.random() * 700) + 500;  // 500-1200
    const revenue12m = Math.floor(Math.random() * 700) + 500; // 500-1200
    
    const clientRef = await clientsRef.add({
      ...client,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      tags: client.status === 'new' ? ['nuovo'] : client.status === 'expired' ? ['scaduto'] : [],
      notes: `Cliente ${client.status}. Obiettivi: ${client.goals.join(', ')}`,
      revenue: {
        last3Months: revenue3m,
        last6Months: revenue6m,
        last12Months: revenue12m,
        total: revenue3m + revenue6m + revenue12m
      }
    });

    createdClients.push({ id: clientRef.id, ...client });
    console.log(`  ✅ ${client.name} (${client.status}) - Revenue: €${revenue3m + revenue6m + revenue12m}`);
  }

  return createdClients;
}

async function createChecks(tenantId, clients) {
  console.log('\n📊 Creazione check periodici...');
  
  // Crea 2-3 check per ogni cliente attivo
  for (const client of clients.filter(c => c.status === 'active' || c.status === 'new')) {
    const checksRef = db.collection('tenants').doc(tenantId)
      .collection('clients').doc(client.id).collection('checks');
    
    const numChecks = Math.floor(Math.random() * 2) + 2; // 2-3 check
    
    for (let i = 0; i < numChecks; i++) {
      const daysAgo = (numChecks - i) * 14; // Ogni 14 giorni
      const checkDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      await checksRef.add({
        clientId: client.id,
        clientName: client.name,
        createdAt: admin.firestore.Timestamp.fromDate(checkDate),
        weight: Math.round(client.weight + (Math.random() * 4 - 2)), // ±2kg variazione, arrotondato
        bodyFat: Math.round((15 + Math.random() * 10) * 10) / 10, // 15-25%, 1 decimale
        muscleMass: Math.round(35 + Math.random() * 10), // 35-45kg arrotondato
        measurements: {
          chest: Math.round(95 + Math.random() * 10),
          waist: Math.round(80 + Math.random() * 10),
          hips: Math.round(100 + Math.random() * 10),
          arms: Math.round(35 + Math.random() * 5),
          legs: Math.round(55 + Math.random() * 10)
        },
        notes: i === 0 ? 'Ottimi progressi! Continuiamo così 💪' : 'Check di controllo',
        photos: []
      });
    }
    
    console.log(`  ✅ ${numChecks} check per ${client.name}`);
  }
}

async function createAnamnesi(tenantId, clients) {
  console.log('\n📋 Creazione anamnesi...');
  
  for (const client of clients) {
    const anamnesiRef = db.collection('tenants').doc(tenantId)
      .collection('clients').doc(client.id).collection('anamnesi');
    
    await anamnesiRef.add({
      clientId: client.id,
      clientName: client.name,
      type: 'Iniziale',
      createdAt: admin.firestore.Timestamp.fromDate(client.startDate),
      data: {
        medicalHistory: {
          injuries: client.age > 35 ? ['Lombalgia lieve'] : [],
          diseases: [],
          medications: [],
          allergies: []
        },
        lifestyle: {
          activityLevel: client.goals.includes('Preparazione gara') ? 'Molto attivo' : 'Moderatamente attivo',
          sleepHours: 7 + Math.floor(Math.random() * 2),
          stress: ['Basso', 'Medio', 'Alto'][Math.floor(Math.random() * 3)],
          smoking: false,
          alcohol: 'Occasionale'
        },
        nutrition: {
          diet: 'Onnivora',
          mealsPerDay: 4 + Math.floor(Math.random() * 2),
          waterIntake: 2 + Math.random(),
          supplements: client.goals.includes('Ipertrofia') ? ['Proteine', 'Creatina'] : []
        },
        goals: client.goals,
        motivation: 'Alta'
      }
    });
    
    console.log(`  ✅ Anamnesi per ${client.name}`);
  }
}

async function createPayments(tenantId, clients) {
  console.log('\n💳 Creazione pagamenti...');
  
  for (const client of clients) {
    if (client.monthlyFee === 0) continue; // Skip trial
    
    const paymentsRef = db.collection('tenants').doc(tenantId)
      .collection('clients').doc(client.id).collection('payments');
    
    const now = new Date();
    
    // Crea 2-3 pagamenti nel MESE CORRENTE (gennaio 2026)
    const paymentsThisMonth = Math.floor(Math.random() * 2) + 2; // 2-3 pagamenti
    
    for (let i = 0; i < paymentsThisMonth; i++) {
      // Data casuale nel mese corrente
      const dayOfMonth = Math.floor(Math.random() * 7) + 1; // Giorni 1-7 di gennaio
      const paymentDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
      
      // Alcuni sono nuovi incassi (isRenewal: false), altri rinnovi
      const isRenewal = i > 0; // Primo pagamento = nuovo incasso, altri = rinnovi
      
      await paymentsRef.add({
        clientId: client.id,
        clientName: client.name,
        amount: client.monthlyFee,
        duration: '1 mese',
        status: 'completed',
        method: ['card', 'bank_transfer', 'cash'][Math.floor(Math.random() * 3)],
        paymentDate: admin.firestore.Timestamp.fromDate(paymentDate),
        paymentMethod: ['Carta', 'Bonifico', 'Contanti'][Math.floor(Math.random() * 3)],
        dueDate: admin.firestore.Timestamp.fromDate(paymentDate),
        paidDate: admin.firestore.Timestamp.fromDate(paymentDate),
        isRenewal: isRenewal,
        isPast: false,
        createdAt: admin.firestore.Timestamp.fromDate(paymentDate)
      });
    }
    
    // Crea anche 1-2 pagamenti nei mesi precedenti
    const previousMonths = Math.floor(Math.random() * 2) + 1; // 1-2 mesi fa
    for (let m = 1; m <= previousMonths; m++) {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - m, Math.floor(Math.random() * 20) + 1);
      
      await paymentsRef.add({
        clientId: client.id,
        clientName: client.name,
        amount: client.monthlyFee,
        duration: '1 mese',
        status: 'completed',
        method: ['card', 'bank_transfer', 'cash'][Math.floor(Math.random() * 3)],
        paymentDate: admin.firestore.Timestamp.fromDate(prevMonthDate),
        paymentMethod: ['Carta', 'Bonifico', 'Contanti'][Math.floor(Math.random() * 3)],
        dueDate: admin.firestore.Timestamp.fromDate(prevMonthDate),
        paidDate: admin.firestore.Timestamp.fromDate(prevMonthDate),
        isRenewal: true, // Mesi precedenti = sempre rinnovi
        isPast: false,
        createdAt: admin.firestore.Timestamp.fromDate(prevMonthDate)
      });
    }
    
    console.log(`  ✅ ${paymentsThisMonth + previousMonths} pagamenti per ${client.name} (${paymentsThisMonth} questo mese)`);
  }
}

async function createChats(tenantId, clients, adminId) {
  console.log('\n💬 Creazione chat...');
  
  // Crea chat per primi 5 clienti
  for (const client of clients.slice(0, 5)) {
    const chatRef = db.collection('tenants').doc(tenantId).collection('chats').doc(client.id);
    
    const messages = [];
    for (let i = 0; i < CHAT_MESSAGES.length; i++) {
      const msg = CHAT_MESSAGES[i];
      messages.push({
        id: `msg_${Date.now()}_${i}`,
        text: msg.text,
        senderId: msg.isCoach ? adminId : client.id,
        senderName: msg.isCoach ? 'Coach Demo' : client.name,
        timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - (CHAT_MESSAGES.length - i) * 60 * 60 * 1000)),
        read: i < CHAT_MESSAGES.length - 2
      });
    }
    
    const lastMsg = messages[messages.length - 1];
    
    // Crea oggetto unreadCount dinamico
    const unreadCount = {
      [client.id]: 0
    };
    unreadCount[adminId] = 2; // 2 messaggi non letti dall'admin
    
    await chatRef.set({
      clientId: client.id,
      clientName: client.name,
      participants: [adminId, client.id],
      messages: messages,
      lastMessage: lastMsg.text,
      lastMessageAt: lastMsg.timestamp,
      unreadCount: unreadCount,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`  ✅ Chat con ${client.name} (${messages.length} messaggi)`);
  }
}

async function createWorkouts(tenantId, clients) {
  console.log('\n🏋️ Creazione schede allenamento...');
  
  const workoutTemplates = [
    {
      name: 'Full Body',
      days: ['Lunedì', 'Mercoledì', 'Venerdì'],
      exercises: [
        { name: 'Squat', sets: 4, reps: '8-12', rest: '90s' },
        { name: 'Panca Piana', sets: 4, reps: '8-12', rest: '90s' },
        { name: 'Stacco', sets: 3, reps: '6-10', rest: '120s' },
        { name: 'Military Press', sets: 3, reps: '10-12', rest: '60s' },
        { name: 'Trazioni', sets: 3, reps: 'max', rest: '90s' }
      ]
    },
    {
      name: 'Upper/Lower Split',
      days: ['Lunedì', 'Martedì', 'Giovedì', 'Venerdì'],
      exercises: [
        { name: 'Panca Piana', sets: 4, reps: '8-10', rest: '90s' },
        { name: 'Rematore', sets: 4, reps: '10-12', rest: '90s' },
        { name: 'Squat', sets: 4, reps: '8-12', rest: '120s' },
        { name: 'Leg Curl', sets: 3, reps: '12-15', rest: '60s' }
      ]
    }
  ];
  
  for (const client of clients.filter(c => c.status === 'active')) {
    const template = workoutTemplates[Math.floor(Math.random() * workoutTemplates.length)];
    const workoutsRef = db.collection('tenants').doc(tenantId)
      .collection('clients').doc(client.id).collection('workouts');
    
    await workoutsRef.add({
      clientId: client.id,
      clientName: client.name,
      name: template.name,
      days: template.days,
      exercises: template.exercises,
      startDate: admin.firestore.Timestamp.fromDate(client.startDate),
      endDate: admin.firestore.Timestamp.fromDate(client.scadenza),
      isActive: true,
      createdAt: FieldValue.serverTimestamp()
    });
    
    console.log(`  ✅ Scheda "${template.name}" per ${client.name}`);
  }
}

async function createNutritionPlans(tenantId, clients) {
  console.log('\n🍎 Creazione piani alimentari...');
  
  for (const client of clients.filter(c => c.subscriptionType.includes('Premium'))) {
    const nutritionRef = db.collection('tenants').doc(tenantId)
      .collection('clients').doc(client.id).collection('nutrition');
    
    const calories = client.goals.includes('Perdita peso') 
      ? Math.round(client.weight * 25) 
      : Math.round(client.weight * 35);
    
    await nutritionRef.add({
      clientId: client.id,
      clientName: client.name,
      name: 'Piano Nutrizionale Personalizzato',
      dailyCalories: calories,
      macros: {
        proteins: Math.round(client.weight * 2),
        carbs: Math.round(calories * 0.4 / 4),
        fats: Math.round(calories * 0.3 / 9)
      },
      meals: [
        { name: 'Colazione', time: '08:00', calories: Math.round(calories * 0.25) },
        { name: 'Spuntino', time: '11:00', calories: Math.round(calories * 0.10) },
        { name: 'Pranzo', time: '13:00', calories: Math.round(calories * 0.35) },
        { name: 'Merenda', time: '17:00', calories: Math.round(calories * 0.10) },
        { name: 'Cena', time: '20:00', calories: Math.round(calories * 0.20) }
      ],
      isActive: true,
      createdAt: FieldValue.serverTimestamp()
    });
    
    console.log(`  ✅ Piano alimentare per ${client.name} (${calories} kcal)`);
  }
}

async function createCalendarEvents(tenantId, clients) {
  console.log('\n📅 Creazione eventi calendario...');
  const eventsRef = db.collection('tenants').doc(tenantId).collection('calendar');
  
  // Crea eventi per le prossime 2 settimane
  for (let day = 0; day < 14; day++) {
    const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000);
    const numEvents = Math.floor(Math.random() * 3) + 1; // 1-3 eventi al giorno
    
    for (let e = 0; e < numEvents; e++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const hour = 9 + e * 3 + Math.floor(Math.random() * 2); // Mattina o pomeriggio
      const eventDate = new Date(date.setHours(hour, 0, 0, 0));
      
      await eventsRef.add({
        clientId: client.id,
        clientName: client.name,
        title: `Seduta con ${client.name}`,
        type: ['training', 'consultation', 'check'][Math.floor(Math.random() * 3)],
        date: admin.firestore.Timestamp.fromDate(eventDate),
        duration: 60,
        status: 'scheduled',
        notes: '',
        createdAt: FieldValue.serverTimestamp()
      });
    }
  }
  
  console.log(`  ✅ Eventi creati per le prossime 2 settimane`);
}

async function createCallRequests(tenantId, clients) {
  console.log('\n📞 Creazione richieste chiamate...');
  const callsRef = db.collection('tenants').doc(tenantId).collection('callRequests');
  
  // 3-4 richieste di chiamata
  for (let i = 0; i < 4; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const daysFromNow = Math.floor(Math.random() * 7) + 1;
    const scheduledDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    scheduledDate.setHours(10 + i * 2, 0, 0, 0);
    
    await callsRef.add({
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      reason: ['Consulenza iniziale', 'Check progressi', 'Adeguamento programma', 'Domande alimentazione'][i % 4],
      status: i === 0 ? 'completed' : 'scheduled',
      scheduledAt: admin.firestore.Timestamp.fromDate(scheduledDate),
      notes: i === 0 ? 'Chiamata completata. Cliente soddisfatto.' : '',
      createdAt: FieldValue.serverTimestamp()
    });
  }
  
  console.log(`  ✅ 4 richieste di chiamata create`);
}

async function createLeads(tenantId) {
  console.log('\n🎯 Creazione leads...');
  const leadsRef = db.collection('tenants').doc(tenantId).collection('leads');
  
  const sampleLeads = [
    { name: 'Mario Neri', phone: '+39 340 1111111', status: 'new', source: 'Instagram' },
    { name: 'Anna Gialli', phone: '+39 345 2222222', status: 'contacted', source: 'Referral' },
    { name: 'Paolo Verdi', phone: '+39 348 3333333', status: 'interested', source: 'Landing Page' },
    { name: 'Giulia Rosa', phone: '+39 342 4444444', status: 'negotiating', source: 'WhatsApp' },
  ];
  
  for (const lead of sampleLeads) {
    await leadsRef.add({
      ...lead,
      email: lead.name.toLowerCase().replace(' ', '.') + '@example.com',
      notes: `Lead da ${lead.source}`,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
      lastContact: FieldValue.serverTimestamp()
    });
  }
  
  console.log(`  ✅ ${sampleLeads.length} leads creati`);
}

async function updateDashboardStats(tenantId, clients) {
  console.log('\n📈 Aggiornamento statistiche dashboard...');
  
  const statsRef = db.collection('tenants').doc(tenantId).collection('stats').doc('current');
  
  const totalRevenue = clients.reduce((sum, c) => sum + c.monthlyFee, 0);
  const activeClients = clients.filter(c => c.status === 'active').length;
  
  await statsRef.set({
    totalClients: clients.length,
    activeClients: activeClients,
    newClientsThisMonth: clients.filter(c => c.status === 'new').length,
    expiringClients: clients.filter(c => {
      const daysToExpiry = Math.floor((c.scadenza - Date.now()) / (24 * 60 * 60 * 1000));
      return daysToExpiry >= 0 && daysToExpiry <= 7;
    }).length,
    expiredClients: clients.filter(c => c.status === 'expired').length,
    monthlyRevenue: totalRevenue,
    updatedAt: FieldValue.serverTimestamp()
  });
  
  console.log(`  ✅ Statistiche aggiornate`);
}

// === MAIN ===

async function populateTestData() {
  try {
    console.log('🚀 Popolamento tenant di test con dati dimostrativi...');
    console.log(`📋 Tenant ID: ${TENANT_ID}\n`);
    
    // Verifica che il tenant esista
    const tenantDoc = await db.collection('tenants').doc(TENANT_ID).get();
    if (!tenantDoc.exists) {
      console.error(`❌ Tenant "${TENANT_ID}" non trovato!`);
      console.log('💡 Esegui prima: node scripts/create-test-tenant.cjs');
      process.exit(1);
    }
    
    // Ottieni l'admin ID reale del tenant
    const adminId = 'zqpnkHtDpIMjyhpvWBSo4Y8e8t32'; // test-admin@fitflowsapp.com
    
    console.log(`👤 Admin ID: ${adminId}\n`);
    
    // Crea tutti i dati
    const clients = await createClients(TENANT_ID);
    await createChecks(TENANT_ID, clients);
    await createAnamnesi(TENANT_ID, clients);
    await createPayments(TENANT_ID, clients);
    await createChats(TENANT_ID, clients, adminId); // Passa adminId
    await createWorkouts(TENANT_ID, clients);
    await createNutritionPlans(TENANT_ID, clients);
    await createCalendarEvents(TENANT_ID, clients);
    await createCallRequests(TENANT_ID, clients);
    await createLeads(TENANT_ID);
    await updateDashboardStats(TENANT_ID, clients);
    
    console.log('\n🎉 Dati dimostrativi creati con successo!');
    console.log('\n📊 Riepilogo:');
    console.log(`  • ${clients.length} clienti`);
    console.log(`  • Check periodici con misurazioni`);
    console.log(`  • Anamnesi complete`);
    console.log(`  • Storico pagamenti`);
    console.log(`  • Chat con messaggi`);
    console.log(`  • Schede allenamento e alimentari`);
    console.log(`  • Eventi calendario prossimi 14 giorni`);
    console.log(`  • Richieste chiamate`);
    console.log(`  • Leads nel funnel`);
    console.log(`  • Statistiche dashboard\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante il popolamento dati:', error);
    process.exit(1);
  }
}

populateTestData();
