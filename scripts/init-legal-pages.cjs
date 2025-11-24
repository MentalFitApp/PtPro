const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const privacyContent = {
  title: "Privacy Policy",
  subtitle: "Ultimo aggiornamento: 24 Novembre 2025",
  intro: "La tua privacy è importante per noi. Questa Privacy Policy spiega come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali quando utilizzi FlowFit Pro.",
  sections: [
    {
      icon: "database",
      title: "1. Dati che Raccogliamo",
      content: [
        "**Dati di registrazione**: Nome, cognome, email, numero di telefono",
        "**Dati del profilo**: Foto profilo, biografia, specializzazioni (per personal trainer)",
        "**Dati di utilizzo**: Informazioni su come utilizzi la piattaforma, preferenze, statistiche",
        "**Dati tecnici**: Indirizzo IP, tipo di browser, sistema operativo, timestamp di accesso"
      ]
    },
    {
      icon: "target",
      title: "2. Come Utilizziamo i Dati",
      content: [
        "Fornire e migliorare i nostri servizi",
        "Personalizzare l'esperienza utente",
        "Comunicare aggiornamenti importanti e novità",
        "Garantire la sicurezza della piattaforma",
        "Rispettare obblighi legali e normativi"
      ]
    },
    {
      icon: "users",
      title: "3. Condivisione dei Dati",
      content: [
        "**Non vendiamo i tuoi dati** a terze parti",
        "Condividiamo dati solo con:",
        "- Provider di servizi tecnici (hosting, email, analytics)",
        "- Autorità legali quando richiesto dalla legge",
        "- Partner commerciali solo con tuo esplicito consenso"
      ]
    },
    {
      icon: "lock",
      title: "4. Sicurezza",
      content: [
        "Utilizziamo crittografia SSL/TLS per tutte le comunicazioni",
        "I dati sono conservati su server sicuri con backup regolari",
        "Accesso limitato ai dati solo al personale autorizzato",
        "Monitoraggio continuo per rilevare accessi non autorizzati"
      ]
    },
    {
      icon: "eye",
      title: "5. Cookie e Tecnologie Simili",
      content: [
        "Utilizziamo cookie per:",
        "- Mantenere la sessione di login attiva",
        "- Ricordare le tue preferenze",
        "- Analizzare l'utilizzo della piattaforma (Google Analytics)",
        "Puoi disabilitare i cookie dalle impostazioni del tuo browser"
      ]
    },
    {
      icon: "shield",
      title: "6. I Tuoi Diritti (GDPR)",
      content: [
        "**Diritto di accesso**: Puoi richiedere una copia dei tuoi dati",
        "**Diritto di rettifica**: Puoi correggere dati inesatti",
        "**Diritto di cancellazione**: Puoi richiedere la rimozione dei tuoi dati",
        "**Diritto di limitazione**: Puoi limitare il trattamento dei dati",
        "**Diritto di portabilità**: Puoi ottenere i dati in formato leggibile",
        "Per esercitare questi diritti: privacy@flowfitpro.it"
      ]
    },
    {
      icon: "database",
      title: "7. Conservazione dei Dati",
      content: [
        "Conserviamo i dati per il tempo necessario a fornire i servizi",
        "Dati di account attivi: conservati finché l'account è attivo",
        "Dati di account cancellati: eliminati entro 30 giorni dalla richiesta",
        "Backup: conservati per 90 giorni per motivi di sicurezza"
      ]
    },
    {
      icon: "globe",
      title: "8. Trasferimenti Internazionali",
      content: [
        "I dati sono principalmente conservati in server EU (GDPR compliant)",
        "Alcuni servizi terzi potrebbero trasferire dati fuori dall'UE",
        "Garantiamo meccanismi di protezione adeguati (es. Standard Contractual Clauses)"
      ]
    },
    {
      icon: "users",
      title: "9. Minori",
      content: [
        "I nostri servizi sono destinati a utenti maggiorenni (18+)",
        "Non raccogliamo consapevolmente dati di minori di 18 anni",
        "Se scopriamo dati di minori, li elimineremo immediatamente"
      ]
    },
    {
      icon: "filetext",
      title: "10. Modifiche alla Privacy Policy",
      content: [
        "Ci riserviamo il diritto di aggiornare questa policy",
        "Notificheremo modifiche sostanziali via email",
        "L'uso continuato dei servizi implica accettazione delle modifiche"
      ]
    }
  ],
  contact: {
    title: "Contatti Privacy",
    email: "privacy@flowfitpro.it",
    address: "FlowFit Pro S.r.l. - Via Example 123, 00100 Roma, Italia",
    dpo: "Data Protection Officer: dpo@flowfitpro.it"
  }
};

const termsContent = {
  title: "Termini e Condizioni di Servizio",
  subtitle: "Ultimo aggiornamento: 24 Novembre 2025",
  intro: "Benvenuto su FlowFit Pro. Utilizzando i nostri servizi, accetti di essere vincolato dai seguenti termini e condizioni. Ti invitiamo a leggerli attentamente.",
  sections: [
    {
      icon: "scale",
      title: "1. Accettazione dei Termini",
      content: [
        "Accedendo e utilizzando FlowFit Pro, accetti di essere vincolato da questi Termini e Condizioni",
        "Se non accetti questi termini, non utilizzare i nostri servizi",
        "Ci riserviamo il diritto di modificare questi termini in qualsiasi momento",
        "L'uso continuato dopo le modifiche costituisce accettazione dei nuovi termini"
      ]
    },
    {
      icon: "filetext",
      title: "2. Descrizione del Servizio",
      content: [
        "FlowFit Pro è una piattaforma SaaS per personal trainer e professionisti del fitness",
        "Offriamo strumenti per gestione clienti, schede allenamento, calendario, chat e analytics",
        "Il servizio è fornito \"come disponibile\" senza garanzie di disponibilità continua",
        "Ci riserviamo il diritto di modificare o interrompere servizi con preavviso"
      ]
    },
    {
      icon: "users",
      title: "3. Registrazione e Account",
      content: [
        "Devi essere maggiorenne (18+) per creare un account",
        "Sei responsabile della sicurezza delle tue credenziali di accesso",
        "Non condividere il tuo account con altre persone",
        "Notificaci immediatamente in caso di accesso non autorizzato",
        "Possiamo sospendere o terminare account che violano questi termini"
      ]
    },
    {
      icon: "check",
      title: "4. Uso Accettabile",
      content: [
        "✅ **Puoi**: Utilizzare la piattaforma per gestire il tuo business fitness professionale",
        "✅ **Puoi**: Caricare contenuti di tua proprietà o per cui hai licenza",
        "❌ **Non puoi**: Utilizzare il servizio per attività illegali",
        "❌ **Non puoi**: Caricare contenuti offensivi, diffamatori o che violano diritti altrui",
        "❌ **Non puoi**: Tentare di hackerare o compromettere la sicurezza della piattaforma",
        "❌ **Non puoi**: Fare reverse engineering del software"
      ]
    },
    {
      icon: "shield",
      title: "5. Proprietà Intellettuale",
      content: [
        "FlowFit Pro e tutti i suoi contenuti sono di proprietà di FlowFit Pro S.r.l.",
        "Ti concediamo una licenza limitata, non esclusiva e revocabile per utilizzare il servizio",
        "I contenuti che carichi rimangono di tua proprietà",
        "Ci concedi una licenza per utilizzare i tuoi contenuti al fine di fornire il servizio"
      ]
    },
    {
      icon: "creditcard",
      title: "6. Pagamenti e Abbonamenti",
      content: [
        "Gli abbonamenti sono fatturati mensilmente o annualmente in base al piano scelto",
        "I prezzi sono indicati in Euro (€) e IVA esclusa",
        "Il pagamento avviene tramite carta di credito o bonifico bancario",
        "L'abbonamento si rinnova automaticamente fino a cancellazione",
        "Puoi cancellare in qualsiasi momento dalla dashboard",
        "I rimborsi sono gestiti caso per caso entro 30 giorni dall'acquisto"
      ]
    },
    {
      icon: "xcircle",
      title: "7. Cancellazione e Sospensione",
      content: [
        "Puoi cancellare il tuo abbonamento in qualsiasi momento",
        "La cancellazione ha effetto dalla fine del periodo di fatturazione corrente",
        "Dopo la cancellazione, i dati vengono conservati per 30 giorni poi eliminati",
        "Possiamo sospendere l'account in caso di violazione dei termini",
        "Possiamo terminare l'account con 30 giorni di preavviso"
      ]
    },
    {
      icon: "alerttriangle",
      title: "8. Limitazione di Responsabilità",
      content: [
        "FlowFit Pro è fornito \"come disponibile\" senza garanzie di alcun tipo",
        "Non garantiamo che il servizio sia ininterrotto o privo di errori",
        "Non siamo responsabili per perdite di dati, profitti o danni indiretti",
        "La nostra responsabilità massima è limitata all'importo pagato negli ultimi 12 mesi",
        "Non siamo responsabili per contenuti di terze parti o integrazioni esterne"
      ]
    },
    {
      icon: "shield",
      title: "9. Indennizzo",
      content: [
        "Accetti di indennizzarci da qualsiasi reclamo derivante dal tuo uso del servizio",
        "Questo include violazioni di questi termini o violazioni di diritti di terzi",
        "Ci difenderemo a nostre spese, ma puoi partecipare con tuo avvocato"
      ]
    },
    {
      icon: "filetext",
      title: "10. Modifiche ai Termini",
      content: [
        "Ci riserviamo il diritto di modificare questi termini in qualsiasi momento",
        "Modifiche sostanziali saranno notificate via email con 30 giorni di anticipo",
        "L'uso continuato dopo le modifiche costituisce accettazione",
        "Puoi cancellare l'account se non accetti le nuove condizioni"
      ]
    },
    {
      icon: "scale",
      title: "11. Legge Applicabile",
      content: [
        "Questi termini sono regolati dalla legge italiana",
        "Qualsiasi controversia sarà gestita dal Tribunale di Roma",
        "In caso di clausole invalide, le altre rimangono in vigore"
      ]
    }
  ],
  contact: {
    title: "Contatti Legali",
    email: "legal@flowfitpro.it",
    address: "FlowFit Pro S.r.l. - Via Example 123, 00100 Roma, Italia",
    pec: "flowfitpro@pec.it"
  }
};

async function initLegalPages() {
  try {
    console.log('🔄 Initializing legal pages in Firestore...');

    // Create platform/settings collection if not exists
    const platformSettingsRef = db.collection('platform').doc('settings');
    
    // Create landingPages subcollection
    const privacyRef = platformSettingsRef.collection('landingPages').doc('privacy');
    const termsRef = platformSettingsRef.collection('landingPages').doc('terms');

    // Set Privacy Policy
    await privacyRef.set({
      content: privacyContent,
      type: 'privacy',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Privacy Policy initialized');

    // Set Terms of Service
    await termsRef.set({
      content: termsContent,
      type: 'terms',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Terms of Service initialized');

    console.log('\n📍 Firestore paths:');
    console.log('   - platform/settings/landingPages/privacy');
    console.log('   - platform/settings/landingPages/terms');
    console.log('\n🌐 Public URLs:');
    console.log('   - http://localhost:5173/privacy');
    console.log('   - http://localhost:5173/terms');
    console.log('\n✨ Done! You can now edit these pages from CEO Dashboard → Landing Pages');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initLegalPages();
