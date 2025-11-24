import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Users, FileText, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
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
              <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
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
                <h2 className="text-3xl font-bold text-white mb-3">Privacy Policy</h2>
                <p className="text-slate-400 text-sm">
                  Ultimo aggiornamento: <strong className="text-white">24 Novembre 2025</strong>
                </p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed">
                La tua privacy è importante per noi. Questa Privacy Policy spiega come raccogliamo, 
                utilizziamo, proteggiamo e condividiamo le tue informazioni personali quando utilizzi 
                la nostra piattaforma <strong className="text-white">PtPro (FlowFit Pro)</strong>.
              </p>
            </div>
          </div>

          {/* Sezioni */}
          <div className="space-y-6">
            
            {/* 1. Informazioni Raccolte */}
            <Section
              icon={Database}
              title="1. Informazioni che Raccogliamo"
              iconColor="from-blue-500 to-cyan-500"
            >
              <h4 className="text-white font-semibold mb-3">Informazioni Fornite dall'Utente:</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-300 mb-4">
                <li>Nome, cognome, email e numero di telefono</li>
                <li>Credenziali di accesso (username/password criptate)</li>
                <li>Dati anagrafici e informazioni di contatto</li>
                <li>Dati relativi a schede di allenamento e anamnesi</li>
                <li>Foto e contenuti caricati (schede, check fotografici)</li>
              </ul>

              <h4 className="text-white font-semibold mb-3">Informazioni Raccolte Automaticamente:</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-300 mb-4">
                <li>Indirizzo IP e dati di navigazione</li>
                <li>Tipo di dispositivo e browser utilizzato</li>
                <li>Timestamp di accesso e utilizzo della piattaforma</li>
                <li>Dati di utilizzo e preferenze (attraverso cookie)</li>
              </ul>

              <h4 className="text-white font-semibold mb-3">Dati da Integrazioni di Terze Parti:</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                <li><strong>Instagram/Facebook:</strong> Profilo pubblico, follower, post, insights (solo se autorizzi)</li>
                <li><strong>Google Calendar:</strong> Eventi calendario (solo se autorizzi)</li>
                <li><strong>Stripe:</strong> Informazioni di pagamento (gestite da Stripe, non memorizzate da noi)</li>
              </ul>
            </Section>

            {/* 2. Come Utilizziamo i Dati */}
            <Section
              icon={Eye}
              title="2. Come Utilizziamo le Tue Informazioni"
              iconColor="from-purple-500 to-pink-500"
            >
              <p className="text-slate-300 mb-4">
                Utilizziamo le informazioni raccolte per:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                <li><strong>Fornire i nostri servizi:</strong> Gestione clienti, schede allenamento, calendario, chat</li>
                <li><strong>Migliorare l'esperienza utente:</strong> Personalizzazione dashboard e contenuti</li>
                <li><strong>Comunicazioni:</strong> Email di notifica, aggiornamenti, promemoria</li>
                <li><strong>Sicurezza:</strong> Prevenzione frodi, protezione account, autenticazione</li>
                <li><strong>Analytics:</strong> Statistiche d'uso aggregate (anonimizzate)</li>
                <li><strong>Supporto tecnico:</strong> Risoluzione problemi e assistenza clienti</li>
                <li><strong>Integrazioni social:</strong> Visualizzare dati Instagram/Facebook (solo se autorizzi)</li>
              </ul>
            </Section>

            {/* 3. Condivisione Dati */}
            <Section
              icon={Users}
              title="3. Condivisione delle Informazioni"
              iconColor="from-orange-500 to-red-500"
            >
              <p className="text-slate-300 mb-4">
                <strong>Non vendiamo mai i tuoi dati personali.</strong> Condividiamo informazioni solo in questi casi:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                <li><strong>Service provider fidati:</strong> Firebase (database), Cloudflare R2 (storage), Stripe (pagamenti)</li>
                <li><strong>Richieste legali:</strong> Quando richiesto dalla legge o per proteggere diritti legali</li>
                <li><strong>Con il tuo consenso esplicito:</strong> Ad esempio, per integrazioni con servizi terzi</li>
                <li><strong>Multi-tenant isolation:</strong> I dati di ogni tenant (palestra/coach) sono completamente isolati</li>
              </ul>
            </Section>

            {/* 4. Protezione Dati */}
            <Section
              icon={Lock}
              title="4. Sicurezza e Protezione dei Dati"
              iconColor="from-green-500 to-teal-500"
            >
              <p className="text-slate-300 mb-4">
                Implementiamo misure di sicurezza avanzate:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                <li><strong>Crittografia:</strong> HTTPS/SSL per tutte le connessioni</li>
                <li><strong>Firebase Security Rules:</strong> Controllo accessi granulare multi-tenant</li>
                <li><strong>Password:</strong> Hash con algoritmi sicuri (bcrypt/Firebase Auth)</li>
                <li><strong>Storage sicuro:</strong> File su Cloudflare R2 con permessi restrittivi</li>
                <li><strong>Token OAuth:</strong> Salvati server-side, mai esposti al frontend</li>
                <li><strong>Backup regolari:</strong> Sistema di backup automatico giornaliero</li>
                <li><strong>Monitoring:</strong> Logging e monitoraggio accessi anomali</li>
              </ul>
            </Section>

            {/* 5. Cookie */}
            <Section
              icon={FileText}
              title="5. Cookie e Tecnologie di Tracciamento"
              iconColor="from-yellow-500 to-orange-500"
            >
              <p className="text-slate-300 mb-4">
                Utilizziamo cookie per:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300 mb-4">
                <li><strong>Cookie essenziali:</strong> Autenticazione e sessione utente</li>
                <li><strong>Cookie di preferenze:</strong> Tema (dark/light), lingua, impostazioni UI</li>
                <li><strong>Cookie analytics:</strong> Google Analytics per statistiche d'uso (anonimizzate)</li>
              </ul>
              <p className="text-slate-300">
                Puoi disabilitare i cookie nelle impostazioni del browser, ma alcune funzionalità potrebbero non funzionare.
              </p>
            </Section>

            {/* 6. I Tuoi Diritti */}
            <Section
              icon={Shield}
              title="6. I Tuoi Diritti (GDPR)"
              iconColor="from-indigo-500 to-purple-500"
            >
              <p className="text-slate-300 mb-4">
                In conformità al GDPR, hai diritto a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                <li><strong>Accesso:</strong> Richiedere copia dei tuoi dati personali</li>
                <li><strong>Rettifica:</strong> Correggere dati inesatti o incompleti</li>
                <li><strong>Cancellazione:</strong> Richiedere eliminazione dei tuoi dati ("diritto all'oblio")</li>
                <li><strong>Portabilità:</strong> Ricevere i tuoi dati in formato leggibile</li>
                <li><strong>Opposizione:</strong> Opporti al trattamento per motivi legittimi</li>
                <li><strong>Limitazione:</strong> Richiedere limitazione del trattamento</li>
                <li><strong>Revoca consenso:</strong> Revocare autorizzazioni date (es: integrazioni)</li>
              </ul>
              <p className="text-slate-300 mt-4">
                Per esercitare questi diritti, contattaci a: <a href="mailto:privacy@flowfitpro.it" className="text-blue-400 hover:text-blue-300">privacy@flowfitpro.it</a>
              </p>
            </Section>

            {/* 7. Conservazione Dati */}
            <Section
              icon={Database}
              title="7. Conservazione dei Dati"
              iconColor="from-cyan-500 to-blue-500"
            >
              <p className="text-slate-300 mb-4">
                Conserviamo i tuoi dati per il tempo necessario a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                <li>Fornire i servizi richiesti</li>
                <li>Adempiere obblighi legali (es: fatturazione 10 anni)</li>
                <li>Risolvere controversie e prevenire frodi</li>
              </ul>
              <p className="text-slate-300 mt-4">
                Dopo la cancellazione dell'account, i dati vengono eliminati entro <strong className="text-white">30 giorni</strong> 
                (salvo obblighi di legge).
              </p>
            </Section>

            {/* 8. Trasferimenti Internazionali */}
            <Section
              icon={Users}
              title="8. Trasferimenti Internazionali"
              iconColor="from-pink-500 to-red-500"
            >
              <p className="text-slate-300">
                I tuoi dati possono essere trasferiti e conservati su server situati nell'Unione Europea e negli USA. 
                Utilizziamo provider conformi a GDPR con adeguate garanzie (es: Firebase/Google Cloud, Cloudflare).
              </p>
            </Section>

            {/* 9. Minori */}
            <Section
              icon={Shield}
              title="9. Privacy dei Minori"
              iconColor="from-blue-500 to-indigo-500"
            >
              <p className="text-slate-300">
                Il nostro servizio non è destinato a minori di <strong className="text-white">16 anni</strong>. 
                Se veniamo a conoscenza di aver raccolto dati di minori, procederemo immediatamente alla cancellazione.
              </p>
            </Section>

            {/* 10. Modifiche */}
            <Section
              icon={FileText}
              title="10. Modifiche alla Privacy Policy"
              iconColor="from-purple-500 to-pink-500"
            >
              <p className="text-slate-300">
                Potremmo aggiornare questa Privacy Policy periodicamente. Le modifiche saranno pubblicate su questa pagina 
                con la data di "Ultimo aggiornamento" in alto. Ti consigliamo di rivedere regolarmente questa policy.
              </p>
            </Section>

            {/* 11. Contatti */}
            <Section
              icon={Mail}
              title="11. Contatti"
              iconColor="from-green-500 to-emerald-500"
            >
              <p className="text-slate-300 mb-4">
                Per domande sulla Privacy Policy o per esercitare i tuoi diritti:
              </p>
              <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                <p className="text-white font-semibold mb-2">PtPro - FlowFit Pro</p>
                <p className="text-slate-300 text-sm mb-1">
                  📧 Email: <a href="mailto:privacy@flowfitpro.it" className="text-blue-400 hover:text-blue-300">privacy@flowfitpro.it</a>
                </p>
                <p className="text-slate-300 text-sm mb-1">
                  📧 Supporto: <a href="mailto:support@flowfitpro.it" className="text-blue-400 hover:text-blue-300">support@flowfitpro.it</a>
                </p>
                <p className="text-slate-300 text-sm">
                  🌐 Sito: <a href="https://flowfitpro.it" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">https://flowfitpro.it</a>
                </p>
              </div>
            </Section>

          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <Shield className="text-green-400" size={20} />
              <p className="text-green-400 font-medium">
                GDPR Compliant • Sicuro • Trasparente
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Componente Section riusabile
function Section({ icon: Icon, title, iconColor, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-slate-800/30 rounded-2xl shadow-lg p-8 backdrop-blur-md border border-slate-700/50"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 bg-gradient-to-br ${iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="text-white" size={24} />
        </div>
        <h3 className="text-2xl font-bold text-white pt-2">{title}</h3>
      </div>
      <div className="prose prose-invert max-w-none">
        {children}
      </div>
    </motion.div>
  );
}
