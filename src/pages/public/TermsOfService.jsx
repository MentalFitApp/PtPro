import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, AlertCircle, CheckCircle, XCircle, Scale } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-white">Termini e Condizioni</h1>
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
                <FileText className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-3">Termini e Condizioni d'Uso</h2>
                <p className="text-slate-400 text-sm">
                  Ultimo aggiornamento: <strong className="text-white">24 Novembre 2025</strong>
                </p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed">
                Benvenuto su <strong className="text-white">PtPro (FlowFit Pro)</strong>. Utilizzando la nostra 
                piattaforma, accetti i seguenti Termini e Condizioni. Ti preghiamo di leggerli attentamente.
              </p>
            </div>
          </div>

          {/* Sezioni */}
          <div className="space-y-6">
            
            <Section
              icon={CheckCircle}
              title="1. Accettazione dei Termini"
              iconColor="from-green-500 to-emerald-500"
            >
              <p className="text-slate-300 mb-4">
                Accedendo e utilizzando PtPro, accetti di essere vincolato da questi Termini e Condizioni, 
                dalla nostra Privacy Policy e da tutte le leggi applicabili.
              </p>
              <p className="text-slate-300">
                Se non accetti questi termini, <strong className="text-white">non utilizzare il servizio</strong>.
              </p>
            </Section>

            <Section
              icon={Shield}
              title="2. Descrizione del Servizio"
              iconColor="from-blue-500 to-cyan-500"
            >
              <p className="text-slate-300 mb-4">
                PtPro è una piattaforma SaaS multi-tenant per:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                <li>Gestione clienti per personal trainer e palestre</li>
                <li>Creazione e distribuzione di schede di allenamento</li>
                <li>Gestione calendario e appuntamenti</li>
                <li>Chat e comunicazione coach-clienti</li>
                <li>Gestione pagamenti e abbonamenti</li>
                <li>Analytics e statistiche</li>
                <li>Integrazioni con servizi terzi (Instagram, Google Calendar, etc.)</li>
              </ul>
            </Section>

            <Section
              icon={AlertCircle}
              title="3. Registrazione e Account"
              iconColor="from-yellow-500 to-orange-500"
            >
              <h4 className="text-white font-semibold mb-3">3.1 Requisiti</h4>
              <p className="text-slate-300 mb-4">
                Per utilizzare PtPro devi:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300 mb-4">
                <li>Avere almeno 16 anni</li>
                <li>Fornire informazioni accurate e complete</li>
                <li>Mantenere la sicurezza del tuo account</li>
                <li>Notificarci immediatamente in caso di accesso non autorizzato</li>
              </ul>

              <h4 className="text-white font-semibold mb-3">3.2 Responsabilità Account</h4>
              <p className="text-slate-300">
                Sei responsabile di tutte le attività che si verificano sul tuo account. 
                Non condividere le tue credenziali con terzi.
              </p>
            </Section>

            <Section
              icon={XCircle}
              title="4. Uso Accettabile"
              iconColor="from-red-500 to-pink-500"
            >
              <p className="text-slate-300 mb-4">
                <strong className="text-white">È VIETATO:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                <li>Utilizzare il servizio per scopi illegali</li>
                <li>Violare diritti di proprietà intellettuale</li>
                <li>Caricare contenuti offensivi, diffamatori o inappropriati</li>
                <li>Tentare di accedere ad account di altri utenti</li>
                <li>Distribuire malware, virus o codice dannoso</li>
                <li>Utilizzare bot o automazioni non autorizzate</li>
                <li>Sovraccaricare o danneggiare l'infrastruttura</li>
                <li>Rivendere il servizio senza autorizzazione</li>
              </ul>
            </Section>

            <Section
              icon={Scale}
              title="5. Proprietà Intellettuale"
              iconColor="from-purple-500 to-indigo-500"
            >
              <h4 className="text-white font-semibold mb-3">5.1 Nostri Diritti</h4>
              <p className="text-slate-300 mb-4">
                Tutti i diritti di proprietà intellettuale sulla piattaforma (design, codice, logo, testi) 
                appartengono a PtPro/FlowFit Pro e sono protetti da leggi sul copyright.
              </p>

              <h4 className="text-white font-semibold mb-3">5.2 Tuoi Contenuti</h4>
              <p className="text-slate-300">
                Mantieni tutti i diritti sui contenuti che carichi (foto, schede, documenti). 
                Concedendoci una licenza limitata per visualizzarli e distribuirli all'interno della piattaforma.
              </p>
            </Section>

            <Section
              icon={Shield}
              title="6. Abbonamenti e Pagamenti"
              iconColor="from-green-500 to-teal-500"
            >
              <h4 className="text-white font-semibold mb-3">6.1 Piani</h4>
              <p className="text-slate-300 mb-4">
                Offriamo diversi piani di abbonamento con funzionalità variabili. 
                I prezzi sono indicati sul nostro sito e possono variare.
              </p>

              <h4 className="text-white font-semibold mb-3">6.2 Fatturazione</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-300 mb-4">
                <li>Fatturazione mensile o annuale</li>
                <li>Rinnovo automatico (puoi disattivarlo)</li>
                <li>Pagamenti tramite Stripe (carta di credito/debito)</li>
                <li>Fattura elettronica disponibile</li>
              </ul>

              <h4 className="text-white font-semibold mb-3">6.3 Rimborsi</h4>
              <p className="text-slate-300">
                Offriamo rimborso entro <strong className="text-white">14 giorni</strong> dall'acquisto 
                se non hai utilizzato il servizio. Dopo tale periodo, non sono previsti rimborsi.
              </p>
            </Section>

            <Section
              icon={AlertCircle}
              title="7. Cancellazione e Sospensione"
              iconColor="from-orange-500 to-red-500"
            >
              <h4 className="text-white font-semibold mb-3">7.1 Da Parte Tua</h4>
              <p className="text-slate-300 mb-4">
                Puoi cancellare il tuo account in qualsiasi momento dalle impostazioni. 
                I dati verranno eliminati entro 30 giorni.
              </p>

              <h4 className="text-white font-semibold mb-3">7.2 Da Parte Nostra</h4>
              <p className="text-slate-300">
                Ci riserviamo il diritto di sospendere o terminare il tuo account se:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300 mt-2">
                <li>Violi questi Termini</li>
                <li>Usi il servizio per scopi illegali</li>
                <li>Non paghi gli abbonamenti</li>
                <li>Su richiesta delle autorità</li>
              </ul>
            </Section>

            <Section
              icon={Shield}
              title="8. Limitazione di Responsabilità"
              iconColor="from-blue-500 to-purple-500"
            >
              <p className="text-slate-300 mb-4">
                <strong className="text-white">IL SERVIZIO È FORNITO "COSÌ COM'È"</strong>, 
                senza garanzie di alcun tipo.
              </p>
              <p className="text-slate-300 mb-4">
                Non siamo responsabili per:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                <li>Perdita di dati (mantieni backup propri)</li>
                <li>Interruzioni del servizio o downtime</li>
                <li>Danni indiretti o conseguenti</li>
                <li>Azioni di terze parti o integrazioni esterne</li>
                <li>Uso improprio della piattaforma</li>
              </ul>
              <p className="text-slate-300 mt-4">
                La nostra responsabilità massima è limitata all'importo pagato negli ultimi 12 mesi.
              </p>
            </Section>

            <Section
              icon={AlertCircle}
              title="9. Modifiche ai Termini"
              iconColor="from-yellow-500 to-orange-500"
            >
              <p className="text-slate-300">
                Ci riserviamo il diritto di modificare questi Termini in qualsiasi momento. 
                Le modifiche saranno effettive immediatamente dopo la pubblicazione. 
                L'uso continuato del servizio costituisce accettazione dei nuovi termini.
              </p>
            </Section>

            <Section
              icon={Scale}
              title="10. Legge Applicabile"
              iconColor="from-indigo-500 to-purple-500"
            >
              <p className="text-slate-300">
                Questi Termini sono regolati dalle leggi italiane. 
                Per qualsiasi controversia, il foro competente è quello di <strong className="text-white">Milano, Italia</strong>.
              </p>
            </Section>

            <Section
              icon={FileText}
              title="11. Contatti"
              iconColor="from-cyan-500 to-blue-500"
            >
              <p className="text-slate-300 mb-4">
                Per domande sui Termini e Condizioni:
              </p>
              <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                <p className="text-white font-semibold mb-2">PtPro - FlowFit Pro</p>
                <p className="text-slate-300 text-sm mb-1">
                  📧 Email: <a href="mailto:legal@flowfitpro.it" className="text-blue-400 hover:text-blue-300">legal@flowfitpro.it</a>
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
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <CheckCircle className="text-blue-400" size={20} />
              <p className="text-blue-400 font-medium">
                Utilizzando PtPro accetti questi Termini
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
