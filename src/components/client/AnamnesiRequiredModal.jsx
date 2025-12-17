import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Modal compatto che blocca l'accesso all'app finché il cliente non compila l'anamnesi
 * Viene mostrato al primo accesso se l'impostazione requireAnamnesiOnFirstAccess è attiva
 */
const AnamnesiRequiredModal = ({ clientName }) => {
  const navigate = useNavigate();

  const handleGoToAnamnesi = () => {
    navigate('/client/anamnesi');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
        className="relative bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
      >
        {/* Icona principale */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
            <ClipboardList size={28} className="text-white" />
          </div>
        </div>

        {/* Contenuto */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-white mb-1">
            Benvenuto{clientName ? `, ${clientName}` : ''}! 🎉
          </h1>
          <p className="text-slate-400 text-sm">
            Prima di iniziare, compila la tua anamnesi per personalizzare il tuo percorso
          </p>
        </div>

        {/* Pulsante */}
        <button
          onClick={handleGoToAnamnesi}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
        >
          Compila l'Anamnesi
          <ArrowRight size={18} />
        </button>

        {/* Nota tempo */}
        <p className="text-center text-slate-500 text-xs mt-3">
          ⏱️ Circa 5 minuti
        </p>
      </motion.div>
    </div>
  );
};

export default AnamnesiRequiredModal;
