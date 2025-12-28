// src/components/LinkAccountBanner.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { 
  shouldShowLinkSuggestion, 
  dismissLinkSuggestion,
  linkGoogleAccount 
} from '../utils/accountLinking';

/**
 * Banner suggerimento per collegare account Google
 * Appare dopo il primo login per utenti email/password
 * Multi-tenant: salva la preferenza in localStorage e provider nel tenant
 */
export default function LinkAccountBanner() {
  const currentUser = auth.currentUser;
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const shouldShow = shouldShowLinkSuggestion(currentUser);
      setShow(shouldShow);
    }
  }, [currentUser]);

  async function handleLinkGoogle() {
    setLoading(true);
    setMessage(null);

    const result = await linkGoogleAccount();

    if (result.success) {
      setMessage({ type: 'success', text: '✅ Google collegato con successo!' });
      
      // Chiudi il banner dopo 2 secondi
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.error });
      setLoading(false);
      
      // Rimuovi messaggio errore dopo 5 secondi
      setTimeout(() => setMessage(null), 5000);
    }
  }

  function handleDismiss() {
    dismissLinkSuggestion();
    setShow(false);
  }

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-2.5 sm:p-4 shadow-sm mb-3 sm:mb-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-xs sm:text-base leading-tight">
                🚀 Accesso veloce
              </h3>
              <p className="text-xs text-gray-600 leading-tight">
                Collega Google
              </p>
            </div>
          </div>

          {/* Pulsante chiudi */}
          <button
            onClick={handleDismiss}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Vantaggi - nascondi su mobile per risparmiare spazio */}
        <div className="hidden sm:grid grid-cols-3 gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="text-green-500">✓</span>
            <span>Login veloce</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="text-green-500">✓</span>
            <span>Più sicuro</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="text-green-500">✓</span>
            <span>Non perdi account</span>
          </div>
        </div>

        {/* Messaggio di feedback */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsanti azione */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleLinkGoogle}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 bg-white border-2 border-blue-300 rounded-lg font-semibold text-xs sm:text-sm text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm sm:text-base">Collegamento...</span>
              </>
            ) : (
              <>
                <span className="text-xs sm:text-sm">Collega Google</span>
                <span>→</span>
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            disabled={loading}
            className="px-3 py-1.5 sm:px-4 sm:py-2.5 text-gray-600 hover:text-gray-800 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
          >
            Più tardi
          </button>
        </div>

        {/* Nota privacy - nascondi su mobile */}
        <p className="hidden sm:block text-xs text-gray-500 mt-2">
          ℹ️ Il tuo account email rimane attivo. Potrai sempre accedere con email e password.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
