// src/components/LinkAccountCard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import {
  getLinkedProviders,
  isProviderLinked,
  linkGoogleAccount,
  linkFacebookAccount,
  unlinkProvider,
  getProviderDisplayName,
  getProviderIcon
} from '../utils/accountLinking';

/**
 * Card per gestire i provider collegati all'account
 * Supporta collegamento e scollegamento di Google, Facebook, etc.
 * Multi-tenant: salva i provider nel documento utente del tenant
 */
export default function LinkAccountCard() {
  const currentUser = auth.currentUser;
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadProviders();
    }
  }, [currentUser]);

  async function loadProviders() {
    const linkedProviders = await getLinkedProviders(currentUser);
    setProviders(linkedProviders);
    console.log('🔗 Provider collegati:', linkedProviders);
  }

  async function handleLinkGoogle() {
    setLoading(true);
    setMessage(null);

    const result = await linkGoogleAccount();

    if (result.success) {
      setMessage({ type: 'success', text: '✅ Account Google collegato con successo!' });
      await loadProviders();
    } else {
      setMessage({ type: 'error', text: result.error });
    }

    setLoading(false);

    // Rimuovi messaggio dopo 5 secondi
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleLinkFacebook() {
    setLoading(true);
    setMessage(null);

    const result = await linkFacebookAccount();

    if (result.success) {
      setMessage({ type: 'success', text: '✅ Account Facebook collegato con successo!' });
      await loadProviders();
    } else {
      setMessage({ type: 'error', text: result.error });
    }

    setLoading(false);
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleUnlink(providerId) {
    if (!confirm(`Vuoi davvero scollegare ${getProviderDisplayName(providerId)}?`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await unlinkProvider(providerId);

    if (result.success) {
      setMessage({ type: 'success', text: `✅ ${getProviderDisplayName(providerId)} scollegato` });
      await loadProviders();
    } else {
      setMessage({ type: 'error', text: result.error });
    }

    setLoading(false);
    setTimeout(() => setMessage(null), 5000);
  }

  const hasGoogle = isProviderLinked(currentUser, 'google.com');
  const hasFacebook = isProviderLinked(currentUser, 'facebook.com');
  const hasPassword = isProviderLinked(currentUser, 'password');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🔗 Metodi di Accesso
        </h3>
        <p className="text-sm text-gray-600">
          Collega il tuo account a Google o Facebook per accedere più velocemente
        </p>
      </div>

      {/* Messaggio di feedback */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista provider collegati */}
      <div className="space-y-3 mb-6">
        {providers.map((provider, idx) => (
          <motion.div
            key={provider.providerId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                {typeof getProviderIcon(provider.providerId) === 'string' && 
                 getProviderIcon(provider.providerId).startsWith('http') ? (
                  <img 
                    src={getProviderIcon(provider.providerId)} 
                    alt={provider.providerId}
                    className="w-6 h-6"
                  />
                ) : (
                  <span className="text-2xl">{getProviderIcon(provider.providerId)}</span>
                )}
              </div>
              
              <div>
                <div className="font-semibold text-gray-900">
                  {getProviderDisplayName(provider.providerId)}
                </div>
                <div className="text-sm text-gray-600">
                  {provider.email || 'Collegato'}
                </div>
              </div>
            </div>

            {/* Pulsante scollega (solo se ci sono più provider) */}
            {providers.length > 1 && provider.providerId !== 'password' && (
              <button
                onClick={() => handleUnlink(provider.providerId)}
                disabled={loading}
                className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                Scollega
              </button>
            )}

            {provider.providerId === 'password' && providers.length > 1 && (
              <span className="text-sm text-gray-500 italic">
                Principale
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pulsanti per collegare nuovi provider */}
      <div className="space-y-3">
        {!hasGoogle && (
          <button
            onClick={handleLinkGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            {loading ? 'Collegamento...' : 'Collega Google'}
          </button>
        )}

        {!hasFacebook && (
          <button
            onClick={handleLinkFacebook}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg"
              alt="Facebook"
              className="w-5 h-5"
            />
            {loading ? 'Collegamento...' : 'Collega Facebook'}
          </button>
        )}
      </div>

      {/* Info di sicurezza */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <div className="text-blue-600 text-xl">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Perché collegare un account?</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Accedi più velocemente senza inserire la password</li>
              <li>• Maggiore sicurezza con l'autenticazione a due fattori</li>
              <li>• Non perderai mai l'accesso al tuo account</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Avviso se ha solo un provider */}
      {providers.length === 1 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex gap-3">
            <div className="text-amber-600 text-xl">⚠️</div>
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Collega un secondo metodo di accesso</p>
              <p className="text-amber-700 mt-1">
                Se hai solo email e password e la dimentichi, potresti perdere l'accesso al tuo account.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
