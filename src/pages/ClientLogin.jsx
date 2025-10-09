import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from '../firebase';
import { LogIn, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

// AnimatedBackground per tema stellato
const AnimatedBackground = () => {
  const starsContainerRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    let starsContainer = document.querySelector('.stars');
    if (!starsContainer) {
      starsContainer = document.createElement('div');
      starsContainer.className = 'stars';
      let starryBackground = document.querySelector('.starry-background');
      if (!starryBackground) {
        starryBackground = document.createElement('div');
        starryBackground.className = 'starry-background';
        document.body.appendChild(starryBackground);
      }
      starryBackground.appendChild(starsContainer);
      starsContainerRef.current = starsContainer;
    } else {
      starsContainerRef.current = starsContainer;
    }

    // Crea 50 stelle
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.setProperty('--top-offset', `${Math.random() * 100}vh`);
      star.style.setProperty('--fall-duration', `${8 + Math.random() * 6}s`);
      star.style.setProperty('--fall-delay', `${Math.random() * 5}s`);
      star.style.setProperty('--star-width', `${1 + Math.random() * 2}px`);
      starsContainerRef.current.appendChild(star);
    }

    isInitialized.current = true;

    return () => {
      if (starsContainerRef.current) {
        while (starsContainerRef.current.firstChild) {
          starsContainerRef.current.removeChild(starsContainerRef.current.firstChild);
        }
      }
    };
  }, []);

  return (
    <div className="starry-background">
      <div className="stars"></div>
    </div>
  );
};

const ClientLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Controlla se l'utente è già autenticato
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('Utente autenticato all\'avvio:', user.uid);
        const userDocRef = doc(db, "clients", user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists() && userDoc.data().isClient === true) {
            sessionStorage.setItem('app_role', 'client');
            navigate(userDoc.data().firstLogin ? '/client/first-access' : '/client/dashboard', { replace: true });
          } else {
            setError("Accesso non autorizzato. Area riservata ai clienti.");
          }
        } catch (err) {
          console.error("Errore nel recupero del documento cliente:", err);
          setError("Errore nel verificare l'account cliente.");
        }
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting || isCheckingAuth) {
      console.log('Submit bloccato: già in corso o autenticazione in corso');
      return;
    }
    setError('');
    setIsSubmitting(true);
    console.log('Tentativo di login con email:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, "clients", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().isClient === true) {
        sessionStorage.setItem('app_role', 'client');
        const isFirstLogin = userDoc.data().firstLogin === true;
        navigate(isFirstLogin ? '/client/first-access' : '/client/dashboard', { replace: true });
      } else {
        setError("Accesso non autorizzato. Area riservata ai clienti.");
      }
    } catch (err) {
      console.error("Errore di login:", err.message);
      setError(err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' 
        ? "Credenziali non valide. Riprova." 
        : "Errore durante il login. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
        <AnimatedBackground />
        <div className="flex flex-col justify-center items-center text-slate-200">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-sm">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  const inputContainerStyle = "relative";
  const inputStyle = "w-full p-3 pl-10 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-200";
  const iconStyle = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <AnimatedBackground />
      <motion.div 
        className="w-full max-w-md bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-8 space-y-8 shadow-2xl shadow-black/20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-50">Area Clienti</h2>
          <p className="text-slate-400 mt-2">Accedi con le credenziali fornite dal tuo coach.</p>
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
              disabled={isSubmitting || isCheckingAuth}
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
              disabled={isSubmitting || isCheckingAuth}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <motion.button 
              type="submit" 
              disabled={isSubmitting || isCheckingAuth}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-cyan-900 disabled:cursor-not-allowed"
              whileHover={{ scale: (isSubmitting || isCheckingAuth) ? 1 : 1.02 }}
              whileTap={{ scale: (isSubmitting || isCheckingAuth) ? 1 : 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <LogIn size={18} />
              {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </motion.button>
          </div>
        </form>
        <div className="text-center">
          <Link to="/client/forgot-password" className="text-sm text-slate-400 hover:text-cyan-400 hover:underline transition-colors">
            Password dimenticata?
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ClientLogin;