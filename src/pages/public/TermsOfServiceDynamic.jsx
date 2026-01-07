import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, CheckCircle, XCircle, CreditCard, AlertTriangle, Loader2, Users, Shield } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const defaultContent = {
  title: "Termini e Condizioni di Servizio",
  subtitle: "Ultimo aggiornamento: 7 Gennaio 2026",
  intro: "Benvenuto su FitFlows. Utilizzando i nostri servizi, accetti di essere vincolato dai seguenti termini e condizioni. Ti invitiamo a leggerli attentamente.",
  sections: [
    {
      icon: "scale",
      title: "1. Accettazione dei Termini",
      content: [
        "Accedendo e utilizzando FitFlows, accetti di essere vincolato da questi Termini e Condizioni",
        "Se non accetti questi termini, non utilizzare i nostri servizi",
        "Ci riserviamo il diritto di modificare questi termini in qualsiasi momento",
        "L'uso continuato dopo le modifiche costituisce accettazione dei nuovi termini"
      ]
    },
    {
      icon: "filetext",
      title: "2. Descrizione del Servizio",
      content: [
        "FitFlows è una piattaforma SaaS per personal trainer e professionisti del fitness",
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
        "FitFlows e tutti i suoi contenuti sono di proprietà del titolare del servizio",
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
        "I prezzi sono indicati in Euro (€)",
        "Il pagamento avviene tramite carta di credito o altri metodi disponibili",
        "L'abbonamento si rinnova automaticamente fino a cancellazione",
        "Puoi cancellare in qualsiasi momento dalla dashboard",
        "I rimborsi sono gestiti caso per caso entro 14 giorni dall'acquisto"
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
      title: "8. ESONERO DI RESPONSABILITÀ - IMPORTANTE",
      content: [
        "**LEGGERE ATTENTAMENTE QUESTA SEZIONE**",
        "FitFlows è esclusivamente una **piattaforma tecnologica** che fornisce strumenti software",
        "I Personal Trainer, Coach, Nutrizionisti e altri professionisti che utilizzano FitFlows sono **soggetti terzi completamente indipendenti**",
        "FitFlows **NON fornisce** consulenze fitness, mediche, nutrizionali o di altro tipo",
        "FitFlows **NON verifica** le qualifiche, certificazioni o competenze dei professionisti iscritti",
        "FitFlows **NON è responsabile** per:",
        "- Programmi di allenamento o alimentazione creati dai professionisti sulla piattaforma",
        "- Lesioni, danni alla salute o qualsiasi conseguenza derivante dall'esecuzione di tali programmi",
        "- La condotta, professionalità o affidabilità dei coach iscritti",
        "- Controversie economiche o legali tra professionisti e i loro clienti",
        "- Risultati promessi o attesi dai programmi",
        "**AVVERTENZA**: Prima di iniziare qualsiasi programma di allenamento o dieta, consulta sempre un medico. Verifica sempre le credenziali del professionista a cui ti affidi."
      ]
    },
    {
      icon: "alerttriangle",
      title: "9. Limitazione di Responsabilità",
      content: [
        "FitFlows è fornito \"come disponibile\" senza garanzie di alcun tipo",
        "Non garantiamo che il servizio sia ininterrotto o privo di errori",
        "Non siamo responsabili per perdite di dati, profitti o danni indiretti",
        "La nostra responsabilità massima è limitata all'importo pagato negli ultimi 12 mesi",
        "Non siamo responsabili per contenuti di terze parti o integrazioni esterne",
        "L'utente utilizza la piattaforma a proprio rischio e pericolo"
      ]
    },
    {
      icon: "shield",
      title: "10. Indennizzo",
      content: [
        "Accetti di indennizzarci da qualsiasi reclamo derivante dal tuo uso del servizio",
        "Questo include violazioni di questi termini o violazioni di diritti di terzi",
        "I professionisti che offrono servizi tramite la piattaforma sono gli unici responsabili delle loro attività"
      ]
    },
    {
      icon: "filetext",
      title: "11. Modifiche ai Termini",
      content: [
        "Ci riserviamo il diritto di modificare questi termini in qualsiasi momento",
        "Modifiche sostanziali saranno notificate via email con 30 giorni di anticipo",
        "L'uso continuato dopo le modifiche costituisce accettazione",
        "Puoi cancellare l'account se non accetti le nuove condizioni"
      ]
    },
    {
      icon: "scale",
      title: "12. Legge Applicabile",
      content: [
        "Questi termini sono regolati dalla legge italiana",
        "Per qualsiasi controversia si farà riferimento al Foro competente in base alla residenza dell'utente",
        "In caso di clausole invalide, le altre rimangono in vigore",
        "Le comunicazioni ufficiali avverranno tramite email"
      ]
    }
  ],
  contact: {
    title: "Contatti Legali",
    email: "legal@fitflows.app",
    address: "FitFlows - Servizio gestito da privato",
    pec: "Richieste legali: legal@fitflows.app"
  }
};

export default function TermsOfServiceDynamic() {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTermsContent();
  }, []);

  const loadTermsContent = async () => {
    try {
      const termsDoc = await getDoc(doc(db, 'platform', 'settings', 'landingPages', 'terms'));
      
      if (termsDoc.exists()) {
        const data = termsDoc.data();
        setContent(data.content || defaultContent);
      }
    } catch (error) {
      console.error('Error loading terms content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      scale: Scale,
      filetext: FileText,
      users: Users,
      check: CheckCircle,
      shield: Shield,
      creditcard: CreditCard,
      xcircle: XCircle,
      alerttriangle: AlertTriangle
    };
    const IconComponent = icons[iconName?.toLowerCase()] || FileText;
    return <IconComponent size={24} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-white">{content.title}</h1>
            </div>
            <a 
              href="/"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Torna alla Home
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Intro */}
          <div className="bg-slate-800/30 rounded-2xl shadow-lg p-8 mb-8 backdrop-blur-md border border-slate-700/50">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-3">{content.title}</h2>
                <p className="text-slate-400 text-sm">{content.subtitle}</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed">{content.intro}</p>
            </div>
          </div>

          {/* Sections */}
          {content.sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-slate-800/30 rounded-2xl shadow-lg p-8 mb-6 backdrop-blur-md border border-slate-700/50"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  {getIcon(section.icon)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">{section.title}</h3>
                  <div className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <p key={itemIndex} className="text-slate-300 leading-relaxed">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Contact */}
          <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl shadow-lg p-8 backdrop-blur-md border border-purple-500/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Scale className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-4">{content.contact.title}</h3>
                <div className="space-y-2">
                  <p className="text-slate-300">
                    <strong>Email:</strong> <a href={`mailto:${content.contact.email}`} className="text-blue-400 hover:underline">{content.contact.email}</a>
                  </p>
                  <p className="text-slate-300">
                    <strong>Indirizzo:</strong> {content.contact.address}
                  </p>
                  <p className="text-slate-300">
                    <strong>PEC:</strong> <a href={`mailto:${content.contact.pec}`} className="text-blue-400 hover:underline">{content.contact.pec}</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800/50 border-t border-slate-700/50 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm">
            © 2025 FlowFit Pro. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </div>
  );
}
