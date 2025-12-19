/**
 * Script per creare il preset Form Popup "Protocollo Maglietta Piena"
 * e applicarlo alla landing page Protocollo Inverno
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
const TENANT_ID = 'biondo-fitness-coach';

// Configurazione del preset con tutti i campi personalizzati
const PRESET_CONFIG = {
  name: '🏋️ Protocollo Maglietta Piena',
  description: 'Form completo per lead qualificati fitness',
  config: {
    formPopupTitle: 'Scarica gratuitamente il "Protocollo Maglietta Piena"',
    formPopupSubtitle: 'Lascia qui i tuoi dati, assicurati di inserire correttamente la tua email per ricevere subito il protocollo gratuito.',
    formPopupFields: 'custom',
    formPopupCustomFields: [
      {
        id: 'nome',
        label: 'Il tuo nome',
        type: 'text',
        required: true,
        placeholder: 'Mario'
      },
      {
        id: 'cognome',
        label: 'Il tuo cognome',
        type: 'text',
        required: true,
        placeholder: 'Rossi'
      },
      {
        id: 'email',
        label: 'La tua mail',
        type: 'email',
        required: true,
        placeholder: 'mario.rossi@email.com'
      },
      {
        id: 'telefono',
        label: 'Il tuo numero',
        type: 'tel',
        required: true,
        placeholder: '+39 333 1234567'
      },
      {
        id: 'data_nascita',
        label: 'Data di nascita',
        type: 'date',
        required: true,
        placeholder: ''
      },
      {
        id: 'fisico_partenza',
        label: "Qual'è il tuo fisico di partenza?",
        type: 'select',
        required: true,
        placeholder: 'Seleziona...',
        options: 'Secco,Grasso,Skinny Fat'
      },
      {
        id: 'obiettivo',
        label: "Qual'è il tuo Obiettivo?",
        type: 'textarea',
        required: true,
        placeholder: 'Descrivi il tuo obiettivo...'
      },
      {
        id: 'esperienza_allenamento',
        label: 'Da quanto ti alleni?',
        type: 'select',
        required: true,
        placeholder: 'Seleziona...',
        options: 'Mai,Da meno di 1 anno,Da più di 1 anno'
      },
      {
        id: 'motivazione',
        label: 'Perché vuoi cambiare?',
        type: 'textarea',
        required: true,
        placeholder: 'La tua motivazione...'
      },
      {
        id: 'lavoro_disponibilita',
        label: 'Cosa fai nella vita? E quanto puoi allenarti a settimana?',
        type: 'textarea',
        required: true,
        placeholder: 'Es: Lavoro come cameriere, posso allenarmi dalle 2 alle 3 volte a settimana'
      }
    ],
    formPopupSubmitText: 'Scarica il Protocollo GRATIS',
    formPopupSuccessMessage: '🎉 Perfetto! Controlla la tua email (anche spam) per scaricare il Protocollo Maglietta Piena!',
    formPopupAfterSubmit: 'message',
    formPopupRedirectUrl: '',
    formPopupWhatsappNumber: '',
  },
  createdAt: new Date().toISOString(),
};

async function createPresetAndApply() {
  try {
    console.log('🚀 Creazione preset e applicazione alla landing page...\n');
    
    // 1. Salva il preset nel database
    const presetId = 'protocollo_maglietta_piena';
    await db
      .collection('tenants')
      .doc(TENANT_ID)
      .collection('form_popup_presets')
      .doc(presetId)
      .set(PRESET_CONFIG);
    
    console.log('✅ Preset salvato: ' + PRESET_CONFIG.name);
    console.log('   ID: ' + presetId);
    
    // 2. Trova la landing page Protocollo Inverno
    const snapshot = await db
      .collection('tenants')
      .doc(TENANT_ID)
      .collection('landing_pages')
      .where('slug', '==', 'protocollo-inverno')
      .get();
    
    if (snapshot.empty) {
      console.log('⚠️  Landing page "protocollo-inverno" non trovata');
      process.exit(1);
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // 3. Aggiorna tutti i blocchi CTA con form_popup
    const updatedBlocks = data.blocks.map(block => {
      if (block.settings && block.settings.ctaAction === 'form_popup') {
        // Applica la configurazione del preset
        return {
          ...block,
          settings: {
            ...block.settings,
            formPopupTitle: PRESET_CONFIG.config.formPopupTitle,
            formPopupSubtitle: PRESET_CONFIG.config.formPopupSubtitle,
            formPopupFields: PRESET_CONFIG.config.formPopupFields,
            formPopupCustomFields: PRESET_CONFIG.config.formPopupCustomFields,
            formPopupSubmitText: PRESET_CONFIG.config.formPopupSubmitText,
            formPopupSuccessMessage: PRESET_CONFIG.config.formPopupSuccessMessage,
            formPopupAfterSubmit: PRESET_CONFIG.config.formPopupAfterSubmit,
          }
        };
      }
      return block;
    });
    
    // 4. Aggiorna anche il blocco form se presente
    const finalBlocks = updatedBlocks.map(block => {
      if (block.type === 'form' && block.settings?.isPopup) {
        return {
          ...block,
          settings: {
            ...block.settings,
            title: PRESET_CONFIG.config.formPopupTitle,
            subtitle: PRESET_CONFIG.config.formPopupSubtitle,
            fields: PRESET_CONFIG.config.formPopupCustomFields.map(f => {
              const fieldConfig = {
                id: f.id,
                type: f.type,
                label: f.label,
                placeholder: f.placeholder || '',
                required: f.required || false,
              };
              // Aggiungi options solo se è un select
              if (f.type === 'select' && f.options) {
                fieldConfig.options = f.options.split(',').map(o => o.trim());
              }
              return fieldConfig;
            }),
            submitText: PRESET_CONFIG.config.formPopupSubmitText,
            successMessage: PRESET_CONFIG.config.formPopupSuccessMessage,
          }
        };
      }
      return block;
    });
    
    await doc.ref.update({ 
      blocks: finalBlocks,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('\n✅ Landing page aggiornata con il nuovo form!');
    console.log('\n📋 Campi del form:');
    PRESET_CONFIG.config.formPopupCustomFields.forEach((field, i) => {
      console.log(`   ${i + 1}. ${field.label} (${field.type})${field.required ? ' *' : ''}`);
    });
    
    console.log('\n📊 I lead raccolti saranno visibili in:');
    console.log('   Admin → Leads → (filtro per fonte: protocollo-inverno)');
    console.log('\n🎉 Fatto!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

createPresetAndApply();
