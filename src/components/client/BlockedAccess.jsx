import React from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const BlockedAccess = ({ message, isPartialBlock = false, blockedScreens = [] }) => {
  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('app_role');
      navigate('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const defaultMessage = isPartialBlock
    ? 'Alcune sezioni dell\'app sono temporaneamente disabilitate per il tuo account.'
    : 'Il tuo accesso all\'app è stato temporaneamente sospeso.';

  const screenLabels = {
    workouts: 'Schede Allenamento',
    nutrition: 'Schede Alimentazione',
    checks: 'Check Settimanali',
    payments: 'Pagamenti',
    messages: 'Messaggi',
    profile: 'Profilo'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 max-w-lg w-full shadow-glow"
      >
        {/* Icona */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="bg-red-500/10 p-6 rounded-full">
            <Lock size={48} className="text-red-400" />
          </div>
        </motion.div>

        {/* Titolo */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl font-bold text-white text-center mb-3"
        >
          {isPartialBlock ? 'Accesso Limitato' : 'Accesso Sospeso'}
        </motion.h1>

        {/* Messaggio personalizzato o predefinito */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-300 text-sm leading-relaxed">
              {message || defaultMessage}
            </p>
          </div>
        </motion.div>

        {/* Lista sezioni bloccate (solo per blocco parziale) */}
        {isPartialBlock && blockedScreens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <p className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">
              Sezioni non disponibili:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {blockedScreens.map((screen, index) => (
                <motion.div
                  key={screen}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300"
                >
                  {screenLabels[screen] || screen}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Informazioni di contatto */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mb-6"
        >
          <p className="text-blue-200 text-sm text-center">
            Per maggiori informazioni o per ripristinare l'accesso, contatta il tuo trainer.
          </p>
        </motion.div>

        {/* Pulsante logout */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white preserve-white font-semibold rounded-lg transition-all shadow-lg"
        >
          <LogOut size={18} />
          Esci
        </motion.button>
      </motion.div>
    </div>
  );
};

export default BlockedAccess;
