import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';
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

export default function ClientLogin() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Controlla se è un primo accesso
        const checkFirstLogin = async () => {
          try {
            const clientDocRef = doc(db, 'clients', user.uid);
            const clientDoc = await getDoc(clientDocRef);
            if (clientDoc.exists() && clientDoc.data().isClient && clientDoc.data().firstLogin) {
              navigate('/client/first-access');
            } else {
              navigate('/client/dashboard');
            }
          } catch (err) {
            console.error('Errore nel controllo firstLogin:', err);
            setError('Errore durante la verifica del profilo. Riprova.');
            setIsCheckingAuth(false);
          }
        };
        checkFirstLogin();
      } else {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Il redirect è gestito da onAuthStateChanged sopra
    } catch (err) {
      console.error('Errore login:', err);
      setError('Email o password non valide. Riprova.');
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-zinc-950 text-slate-200">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
        <p className="mt-4 text-sm">Verifica autenticazione...</p>
      </div>
    );
  }

  const inputContainerStyle = "relative";
  const inputStyle = "w-full p-3 pl-10 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200";
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
          <h2 className="text-3xl font-bold text-slate-50">Login Cliente</h2>
          <p className="text-sm text-slate-400 mt-2">Accedi al tuo account per gestire il tuo percorso.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
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
}