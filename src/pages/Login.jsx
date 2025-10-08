import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, Mail, Lock, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

// Componente per lo sfondo animato
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden bg-zinc-950">
    <div className="starry-background">
      <div className="stars"></div>
    </div>
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Controlla se l'utente è già autenticato all'avvio
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const uid = user.uid;
        console.log('Utente autenticato all\'avvio:', uid);
        // Verifica se l'UID è un Owner
        const isAdmin = ["QwWST9OVOlTOi5oheyCqfpXLOLg2", "3j0AXIRa4XdHq1ywCl4UBxJNsku2", "AeZKjJYu5zMZ4mvffaGiqCBb0cF2"].includes(uid);
        if (isAdmin) {
          sessionStorage.setItem('app_role', 'admin');
          navigate('/');
        } else {
          console.log('Utente non autorizzato come admin:', uid);
          auth.signOut(); // Disconnetti se non è un admin
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      console.log('Submit bloccato: già in corso');
      return;
    }
    setError('');
    setIsSubmitting(true);
    console.log('Tentativo di login con email:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      console.log('Login riuscito, UID:', uid);

      // Verifica se l'UID è un Owner
      const isAdmin = ["QwWST9OVOlTOi5oheyCqfpXLOLg2", "3j0AXIRa4XdHq1ywCl4UBxJNsku2", "AeZKjJYu5zMZ4mvffaGiqCBb0cF2"].includes(uid);
      if (isAdmin) {
        sessionStorage.setItem('app_role', 'admin');
        navigate('/');
      } else {
        throw new Error('Solo gli amministratori possono accedere a questa area.');
      }
    } catch (err) {
      console.error("Errore di login admin:", err.code, err.message);
      setError(err.message === 'auth/wrong-password' || err.message === 'auth/user-not-found' 
        ? "Credenziali non valide. Riprova." 
        : err.message);
      if (auth.currentUser) {
        await auth.signOut(); // Disconnetti in caso di errore
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = () => {
    console.log('Navigazione a /client/forgot-password');
    navigate('/client/forgot-password');
  };

  // Stili per il form
  const inputContainerStyle = "relative";
  const inputStyle = "w-full p-3 pl-10 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-200";
  const iconStyle = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      <motion.div 
        className="w-full max-w-md bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-8 space-y-8 shadow-2xl shadow-black/20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-50">Accesso Admin</h2>
          <p className="text-slate-400 mt-2">Bentornato, accedi al tuo Command Center.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className={inputContainerStyle}>
            <Mail size={18} className={iconStyle} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className={inputStyle}
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
          <div className={inputContainerStyle}>
            <Lock size={18} className={iconStyle} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className={inputStyle}
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <motion.button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:bg-rose-900 disabled:cursor-not-allowed"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <LogIn size={18} />
              {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </motion.button>
          </div>
        </form>
        <motion.button
          onClick={handleResetPassword}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-slate-200 bg-rose-600/80 rounded-lg hover:bg-rose-700 transition-colors border border-rose-500/30"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <KeyRound size={18} />
          Recupera Password
        </motion.button>
      </motion.div>
    </div>
  );
}