import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Users, FileText, Mail, Loader2, Target, Globe } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Default content se non configurato
const defaultContent = {
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

export default function PrivacyPolicyDynamic() {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrivacyContent();
  }, []);

  const loadPrivacyContent = async () => {
    try {
      // Carica contenuto da piattaforma/settings/privacy
      const privacyDoc = await getDoc(doc(db, 'platform', 'settings', 'landingPages', 'privacy'));
      
      if (privacyDoc.exists()) {
        const data = privacyDoc.data();
        setContent(data.content || defaultContent);
      }
    } catch (error) {
      console.error('Error loading privacy content:', error);
      // Usa default content
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      database: Database,
      lock: Lock,
      users: Users,
      shield: Shield,
      eye: Eye,
      filetext: FileText,
      mail: Mail,
      globe: Users,
      target: Target
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="text-white" size={20} />
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield className="text-white" size={32} />
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
                <Mail className="text-white" size={24} />
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
                    <strong>DPO:</strong> <a href={`mailto:${content.contact.dpo}`} className="text-blue-400 hover:underline">{content.contact.dpo}</a>
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
