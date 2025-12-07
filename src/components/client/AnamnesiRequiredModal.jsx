import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Modal che blocca l'accesso all'app finché il cliente non compila l'anamnesi
 * Viene mostrato al primo accesso se l'impostazione requireAnamnesiOnFirstAccess è attiva
 */
const AnamnesiRequiredModal = ({ clientName }) => {
  const navigate = useNavigate();

  const handleGoToAnamnesi = () => {
    navigate('/client/anamnesi');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Sfondo animato */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="relative bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
      >
        {/* Icona principale */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-5 rounded-2xl shadow-lg">
              <ClipboardList size={40} className="text-white" />
            </div>
          </div>
        </motion.div>

        {/* Contenuto */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Benvenuto{clientName ? `, ${clientName}` : ''}! 🎉
          </h1>
          <p className="text-slate-300 text-lg mb-6">
            Prima di iniziare, compila la tua anamnesi
          </p>
        </motion.div>

        {/* Card informativa */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-5 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
              <FileText size={24} className="text-amber-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white mb-1">Perché l'anamnesi?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                L'anamnesi ci permette di conoscere il tuo stato di salute, i tuoi obiettivi e le tue esigenze. 
                È fondamentale per creare un piano personalizzato e sicuro per te.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cosa includerà */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h4 className="text-slate-300 text-sm font-medium mb-3">Cosa ti chiederemo:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              'Dati personali',
              'Obiettivi fitness',
              'Storia medica',
              'Abitudini alimentari',
              'Attività fisica attuale',
              'Misurazioni corporee'
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-center gap-2 text-slate-400"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pulsante */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={handleGoToAnamnesi}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-lg"
        >
          Compila l'Anamnesi
          <ArrowRight size={20} />
        </motion.button>

        {/* Nota tempo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-slate-500 text-xs mt-4"
        >
          ⏱️ Richiede circa 5-10 minuti
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AnamnesiRequiredModal;
