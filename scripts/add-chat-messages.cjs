const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const TENANT_ID = 'test-tenant';
const ADMIN_ID = 'zqpnkHtDpIMjyhpvWBSo4Y8e8t32';

const CHAT_MESSAGES = [
  { text: 'Ciao! Come procede con la scheda di questa settimana?', isCoach: true },
  { text: 'Bene coach! Ho completato tutti gli allenamenti. Però ho una domanda sugli squat...', isCoach: false },
  { text: 'Dimmi pure! Qual è il dubbio?', isCoach: true },
  { text: 'Non riesco a scendere sotto il parallelo senza perdere l\'equilibrio. Consigli?', isCoach: false },
  { text: 'Prova ad allargare leggermente la stance e concentrati sul mantenere il peso sui talloni. Lavoriamo sulla mobilità delle caviglie la prossima sessione! 💪', isCoach: true }
];

async function addMessagesToChats() {
  console.log('💬 Aggiunta messaggi alle chat esistenti...\n');
  
  try {
    const chatsSnapshot = await db
      .collection('tenants')
      .doc(TENANT_ID)
      .collection('chats')
      .get();
    
    if (chatsSnapshot.empty) {
      console.log('❌ Nessuna chat trovata');
      return;
    }
    
    for (const chatDoc of chatsSnapshot.docs) {
      const chatData = chatDoc.data();
      const chatId = chatDoc.id;
      const clientId = chatData.clientId;
      const clientName = chatData.clientName;
      
      console.log(`📝 Aggiunta messaggi alla chat con ${clientName}...`);
      
      // Crea sottocollezione messages
      const messagesRef = db
        .collection('tenants')
        .doc(TENANT_ID)
        .collection('chats')
        .doc(chatId)
        .collection('messages');
      
      // Elimina messaggi esistenti se presenti
      const existingMessages = await messagesRef.get();
      const batch = db.batch();
      existingMessages.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      // Aggiungi nuovi messaggi
      for (let i = 0; i < CHAT_MESSAGES.length; i++) {
        const msg = CHAT_MESSAGES[i];
        const timestamp = new Date(Date.now() - (CHAT_MESSAGES.length - i) * 60 * 60 * 1000);
        
        await messagesRef.add({
          content: msg.text,
          type: 'text',
          senderId: msg.isCoach ? ADMIN_ID : clientId,
          senderName: msg.isCoach ? 'Coach Demo' : clientName,
          senderPhoto: null,
          createdAt: admin.firestore.Timestamp.fromDate(timestamp),
          read: i < CHAT_MESSAGES.length - 2, // Ultimi 2 messaggi non letti
          mediaUrl: null,
          fileName: null,
          fileSize: null
        });
      }
      
      // Aggiorna il documento della chat con l'ultimo messaggio
      const lastMsg = CHAT_MESSAGES[CHAT_MESSAGES.length - 1];
      const lastMsgTimestamp = new Date(Date.now() - 60 * 60 * 1000);
      
      await chatDoc.ref.update({
        lastMessage: lastMsg.text,
        lastMessageAt: admin.firestore.Timestamp.fromDate(lastMsgTimestamp),
        updatedAt: admin.firestore.Timestamp.now()
      });
      
      console.log(`  ✅ ${CHAT_MESSAGES.length} messaggi aggiunti`);
    }
    
    console.log('\n✅ Tutti i messaggi sono stati aggiunti con successo!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

addMessagesToChats().then(() => {
  console.log('\n🎉 Script completato!');
  process.exit(0);
});
