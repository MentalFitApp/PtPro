/**
 * Script per aggiornare i CTA della landing page Protocollo Inverno
 */
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'biondo-fitness-coach'
  });
}

const db = admin.firestore();

async function updateCTAActions() {
  const snapshot = await db
    .collection('tenants')
    .doc('biondo-fitness-coach')
    .collection('landing_pages')
    .where('slug', '==', 'protocollo-inverno')
    .get();
  
  if (snapshot.empty) {
    console.log('Landing page non trovata');
    return;
  }
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  
  // Update blocks with ctaAction: 'popup' to 'form_popup'
  const updatedBlocks = data.blocks.map(block => {
    if (block.settings && block.settings.ctaAction === 'popup') {
      block.settings.ctaAction = 'form_popup';
      // Aggiungi impostazioni form popup
      block.settings.formPopupTitle = 'Ricevi il Protocollo Inverno';
      block.settings.formPopupSubtitle = 'Inserisci i tuoi dati e ricevi subito la guida gratuita';
      block.settings.formPopupFields = 'name,email,phone';
      block.settings.formPopupSubmitText = 'Scarica GRATIS';
      block.settings.formPopupSuccessMessage = '🎉 Perfetto! Controlla la tua email per scaricare il Protocollo Inverno!';
      block.settings.formPopupAfterSubmit = 'message';
    }
    return block;
  });
  
  await doc.ref.update({ blocks: updatedBlocks });
  console.log('✅ CTA Actions aggiornate a form_popup');
  process.exit(0);
}

updateCTAActions();
