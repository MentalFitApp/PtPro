import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from '../../firebase.js';
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTenantDoc } from '../../config/tenant';

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
  <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-900">
    <div className="aurora-background"></div>
  </div>
);

const FirstAccess = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState(''); // 'client' o 'collaboratore'
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const determineUserType = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Controlla se è cliente
        const clientDoc = await getDoc(getTenantDoc(db, 'clients', user.uid));
        if (clientDoc.exists() && clientDoc.data().firstLogin) {
          setUserType('client');
          return;
        }

        // Controlla se è collaboratore
        const collabDoc = await getDoc(getTenantDoc(db, 'collaboratori', user.uid));
        if (collabDoc.exists() && collabDoc.data().firstLogin) {
          setUserType('collaboratore');
          return;
        }

        // Se non è firstLogin, reindirizza
        navigate(clientDoc.exists() ? '/client/dashboard' : '/collaboratore/dashboard');
      } catch (err) {
        setError('Errore verifica account.');
      }
    };

    determineUserType();
  }, [user, navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (!user) {
      setError("Utente non autenticato. Effettua nuovamente il login.");
      setTimeout(() => navigate('/login'), 3000);
      setIsSubmitting(false);
      return;
    }
    if (!currentPassword) {
      setError("Inserisci la password temporanea ricevuta.");
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
      // Re-autentica l'utente con la password corrente prima di cambiarla
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Aggiorna password
      await updatePassword(user, newPassword);

      // Aggiorna documento corretto nella struttura multi-tenant
      const collectionName = userType === 'client' ? 'clients' : 'collaboratori';
      const userDocRef = getTenantDoc(db, collectionName, user.uid);
      await updateDoc(userDocRef, { firstLogin: false });

      console.log(`Campo firstLogin aggiornato a false per ${userType}:`, user.uid);

      // Attendo 500ms per dare tempo a Firestore di propagare la modifica
      await new Promise(resolve => setTimeout(resolve, 500));

      setSuccess("Password aggiornata! Sarai reindirizzato alla dashboard.");
      setTimeout(() => {
        navigate(userType === 'client' ? '/client/dashboard' : '/collaboratore/dashboard');
      }, 2000);
    } catch (err) {
      console.error("Errore aggiornamento password:", err.code, err.message, { uid: user?.uid, userType });
      
      // Gestisci errori specifici
      if (err.code === 'auth/wrong-password') {
        setError("La password temporanea inserita non è corretta. Verifica e riprova.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Troppi tentativi falliti. Riprova più tardi o contatta il supporto.");
      } else if (err.code === 'auth/requires-recent-login') {
        setError("Sessione scaduta. Effettua nuovamente il login e riprova.");
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError("Si è verificato un errore durante l'aggiornamento della password. " + (err.message || "Riprova."));
      }
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full pl-10 pr-3 py-2.5 mt-1 bg-slate-700/50 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200 placeholder:text-slate-500";
  const labelStyle = "block text-sm font-medium text-slate-300";

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatedBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700 p-8 space-y-8"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-50">Imposta la tua Password</h2>
            <p className="mt-2 text-slate-400">Scegli una password personale per i futuri accessi.</p>
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label htmlFor="current-password" className={labelStyle}>Password Temporanea</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  id="current-password" 
                  type="password" 
                  required 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  className={inputStyle}
                  placeholder="Inserisci la password temporanea"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Usa la password temporanea che hai ricevuto via email</p>
            </div>
            <div>
              <label htmlFor="new-password" className={labelStyle}>Nuova Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  id="new-password" 
                  type="password" 
                  required 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className={inputStyle}
                  placeholder="Minimo 6 caratteri"
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className={labelStyle}>Conferma Nuova Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  id="confirm-password" 
                  type="password" 
                  required 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className={inputStyle}
                  placeholder="Ripeti la nuova password"
                />
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