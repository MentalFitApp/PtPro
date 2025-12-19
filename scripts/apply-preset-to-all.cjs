const admin = require('firebase-admin');
const sa = require('../service-account.json');

admin.initializeApp({ credential: admin.credential.cert(sa), projectId: 'biondo-fitness-coach' });
const db = admin.firestore();

const PRESET = {
  formPopupTitle: 'Scarica gratuitamente il "Protocollo Maglietta Piena"',
  formPopupSubtitle: 'Lascia qui i tuoi dati, assicurati di inserire correttamente la tua email per ricevere subito il protocollo gratuito.',
  formPopupFields: 'custom',
  formPopupCustomFields: [
    { id: 'nome', label: 'Il tuo nome', type: 'text', required: true, placeholder: 'Mario' },
    { id: 'cognome', label: 'Il tuo cognome', type: 'text', required: true, placeholder: 'Rossi' },
    { id: 'email', label: 'La tua mail', type: 'email', required: true, placeholder: 'mario.rossi@email.com' },
    { id: 'telefono', label: 'Il tuo numero', type: 'tel', required: true, placeholder: '+39 333 1234567' },
    { id: 'data_nascita', label: 'Data di nascita', type: 'date', required: true, placeholder: '' },
    { id: 'fisico_partenza', label: "Qual'è il tuo fisico di partenza?", type: 'select', required: true, placeholder: 'Seleziona...', options: 'Secco,Grasso,Skinny Fat' },
    { id: 'obiettivo', label: "Qual'è il tuo Obiettivo?", type: 'textarea', required: true, placeholder: 'Descrivi il tuo obiettivo...' },
    { id: 'esperienza_allenamento', label: 'Da quanto ti alleni?', type: 'select', required: true, placeholder: 'Seleziona...', options: 'Mai,Da meno di 1 anno,Da più di 1 anno' },
    { id: 'motivazione', label: 'Perché vuoi cambiare?', type: 'textarea', required: true, placeholder: 'La tua motivazione...' },
    { id: 'lavoro_disponibilita', label: 'Cosa fai nella vita? E quanto puoi allenarti a settimana?', type: 'textarea', required: true, placeholder: 'Es: Lavoro come cameriere, posso allenarmi dalle 2 alle 3 volte a settimana' }
  ],
  formPopupSubmitText: 'Scarica il Protocollo GRATIS',
  formPopupSuccessMessage: '🎉 Perfetto! Controlla la tua email per scaricare il Protocollo!',
  formPopupAfterSubmit: 'message',
};

db.collection('tenants').doc('biondo-fitness-coach').collection('landing_pages')
  .where('slug', '==', 'protocollo-inverno').get()
  .then(snap => {
    const doc = snap.docs[0];
    const data = doc.data();
    const blocks = data.blocks.map(b => {
      if (b.settings && b.settings.ctaAction === 'form_popup') {
        return { ...b, settings: { ...b.settings, ...PRESET } };
      }
      return b;
    });
    return doc.ref.update({ blocks });
  })
  .then(() => {
    console.log('✅ Tutti i form popup aggiornati con preset "Dati 1"');
    process.exit(0);
  });
