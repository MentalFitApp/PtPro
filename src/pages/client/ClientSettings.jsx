import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Download, Trash2, Link as LinkIcon, Settings } from 'lucide-react';
import GDPRSettings from '../../components/settings/GDPRSettings';
import LinkAccountCard from '../../components/LinkAccountCard';
import ChangeEmailCard from '../../components/settings/ChangeEmailCard';

/**
 * Pagina Impostazioni Client
 * Include gestione privacy e GDPR
 */
const ClientSettings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="text-cyan-400" size={36} />
            Impostazioni
          </h1>
          <p className="text-slate-400">
            Gestisci le tue preferenze, privacy e dati personali
          </p>
        </div>

        {/* Account Collegati */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-glow mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white">Account Collegati</h2>
          </div>
          <p className="text-slate-400 mb-6">
            Collega Google o Facebook per accedere più velocemente al tuo account.
          </p>

          <LinkAccountCard />
        </motion.div>

        {/* Cambio Email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <ChangeEmailCard />
        </motion.div>

        {/* Privacy e GDPR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-glow mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-cyan-400" size={24} />
            <h2 className="text-xl font-bold text-white">Privacy e Dati Personali</h2>
          </div>
          <p className="text-slate-400 mb-6">
            In conformità con il GDPR, hai diritto di accedere, esportare ed eliminare i tuoi dati personali.
          </p>

          <GDPRSettings />
        </motion.div>

        {/* Info Aggiuntive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30"
        >
          <h3 className="text-lg font-semibold text-white mb-3">I Tuoi Diritti</h3>
          <ul className="space-y-2 text-slate-400">
            <li className="flex items-start gap-2">
              <Download size={16} className="text-cyan-400 mt-1 flex-shrink-0" />
              <span><strong>Esportazione Dati:</strong> Puoi scaricare una copia completa di tutti i tuoi dati in formato JSON</span>
            </li>
            <li className="flex items-start gap-2">
              <Trash2 size={16} className="text-red-400 mt-1 flex-shrink-0" />
              <span><strong>Eliminazione Account:</strong> Puoi richiedere la cancellazione permanente del tuo account e di tutti i dati associati</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield size={16} className="text-green-400 mt-1 flex-shrink-0" />
              <span><strong>Protezione:</strong> I tuoi dati sono protetti e utilizzati solo per fornire i nostri servizi</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ClientSettings;
