// src/pages/auth/SetupAccount.jsx
// Pagina per setup account tramite Magic Link
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { KeyRound, Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Animated Background
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-900">
    <div className="aurora-background"></div>
  </div>
);

export default function SetupAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('validating'); // validating, valid, invalid, success, error
  const [tokenData, setTokenData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const functions = getFunctions(undefined, 'europe-west1');
  const auth = getAuth();

  // Valida il token al caricamento
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('invalid');
        setError('Link non valido');
        return;
      }

      try {
        const validateMagicLink = httpsCallable(functions, 'validateMagicLink');
        const result = await validateMagicLink({ token });

        if (result.data.valid) {
          setTokenData(result.data);
          setStatus('valid');
        } else {
          setStatus('invalid');
          setError(result.data.reason || 'Link non valido o scaduto');
        }
      } catch (err) {
        console.error('Errore validazione token:', err);
        setStatus('invalid');
        setError('Errore nella validazione del link. Riprova o richiedi un nuovo link.');
      }
    };

    validateToken();
  }, [token, functions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validazioni
    if (newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setIsSubmitting(true);

    try {
      // Chiama la Cloud Function per completare il setup
      const completeMagicLinkSetup = httpsCallable(functions, 'completeMagicLinkSetup');
      const result = await completeMagicLinkSetup({ token, newPassword });

      if (result.data.success) {
        setStatus('success');
        
        // Dopo 2 secondi, prova a fare il login automatico
        setTimeout(async () => {
          try {
            await signInWithEmailAndPassword(auth, result.data.email, newPassword);
            navigate('/client/dashboard', { replace: true });
          } catch (loginErr) {
            // Se il login automatico fallisce, manda al login manuale
            navigate('/login', { replace: true });
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Errore setup:', err);
      setError(err.message || 'Errore durante l\'attivazione. Riprova.');
      setIsSubmitting(false);
    }
  };

  // Rendering in base allo stato
  const renderContent = () => {
    switch (status) {
      case 'validating':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-300">Verifica link in corso...</p>
          </motion.div>
        );

      case 'invalid':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Link non valido</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <p className="text-sm text-slate-500 mb-4">
              Contatta il tuo coach per ricevere un nuovo link di attivazione.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Vai al Login
            </button>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">Account Attivato! 🎉</h2>
            <p className="text-slate-400 mb-4">
              La tua password è stata impostata con successo.
            </p>
            <p className="text-sm text-slate-500">
              Accesso automatico in corso...
            </p>
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto mt-4" />
          </motion.div>
        );

      case 'valid':
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Saluto personalizzato */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Ciao {tokenData?.name?.split(' ')[0] || 'e benvenuto'}! 👋
              </h2>
              <p className="text-slate-400 mt-2">
                Imposta la tua password per attivare l'account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (solo visualizzazione) */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <div className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300">
                  {tokenData?.email}
                </div>
              </div>

              {/* Nuova Password */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nuova Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caratteri"
                    className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Conferma Password */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Conferma Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ripeti la password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Errore */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Attivazione in corso...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Attiva Account
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-slate-500 mt-6">
              Hai già un account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-400 hover:text-blue-300"
              >
                Accedi qui
              </button>
            </p>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}
