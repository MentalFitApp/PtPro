import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase.js';
// --- 1. NUOVE ICONE DA LUCIDE-REACT ---
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Importa AnimatePresence

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-red-400 p-8">
          Si è verificato un errore: {this.state.error.message}. Riprova o contatta il supporto.
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 2. COMPONENTI UI RIUTILIZZABILI ---
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden bg-zinc-950">
    <div className="aurora-background"></div>
  </div>
);

const FirstAccess = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (!user) {
      setError("Utente non autenticato. Effettua nuovamente il login.");
      setTimeout(() => navigate('/client-login'), 3000);
      setIsSubmitting(false);
      return;
    }
    if (newPassword.length < 6) {
      setError("La nuova password deve contenere almeno 6 caratteri.");
      setIsSubmitting(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Le password non coincidono. Riprova.");
      setIsSubmitting(false);
      return;
    }

    try {
      await updatePassword(user, newPassword);
      const userDocRef = doc(db, "clients", user.uid);
      await updateDoc(userDocRef, { firstLogin: false });
      setSuccess("Password aggiornata! Sarai reindirizzato alla dashboard.");
      setTimeout(() => navigate('/client/dashboard'), 3000);
    } catch (err) {
      setError("Si è verificato un errore. Riprova.");
      console.error("Errore aggiornamento password:", err);
      setIsSubmitting(false);
    }
  };

  // --- 3. STILI AGGIORNATI ---
  const inputStyle = "w-full pl-10 pr-3 py-2.5 mt-1 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200 placeholder:text-slate-500";
  const labelStyle = "block text-sm font-medium text-slate-300";

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatedBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-8 space-y-8"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-50">Imposta la tua Password</h2>
            <p className="mt-2 text-slate-400">Scegli una password personale per i futuri accessi.</p>
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label htmlFor="new-password" className={labelStyle}>Nuova Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input id="new-password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputStyle} />
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className={labelStyle}>Conferma Nuova Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyle} />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-400 text-sm text-center flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                disabled={isSubmitting || !!success}
              >
                {success ? 'Reindirizzamento...' : isSubmitting ? 'Salvataggio...' : 'Imposta Nuova Password'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
};

export default FirstAccess;