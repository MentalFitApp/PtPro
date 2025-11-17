import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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

    for (let i = 0; i < 30; i++) {
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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          console.log('Utente autenticato all\'avvio:', { uid: user.uid, email: user.email });
          
          const adminDocRef = doc(db, 'roles', 'admins');
          const coachDocRef = doc(db, 'roles', 'coaches');
          const clientDocRef = doc(db, 'clients', user.uid);
          
          const [adminDoc, coachDoc, clientDoc] = await Promise.all([
            getDoc(adminDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(coachDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(clientDocRef).catch(() => ({ exists: () => false, data: () => ({}) }))
          ]);

          const isAdmin = adminDoc.exists() && adminDoc.data().uids?.includes(user.uid);
          const isCoach = coachDoc.exists() && coachDoc.data().uids?.includes(user.uid);
          const isClient = clientDoc.exists() && clientDoc.data().isClient === true;

          console.log('Debug ruolo in ClientLogin:', {
            uid: user.uid,
            email: user.email,
            isAdmin,
            isCoach,
            isClient,
            clientDocData: clientDoc.exists() ? clientDoc.data() : null
          });

          if (isAdmin || isCoach) {
            setError('Accesso non autorizzato per admin/coach. Usa il login admin.');
            await auth.signOut();
            setIsCheckingAuth(false);
            return;
          }
          
          if (isClient) {
            sessionStorage.setItem('app_role', 'client');
            navigate(clientDoc.data().firstLogin ? '/client/first-access' : '/client/dashboard');
          } else {
            setError('Accesso non autorizzato. Contatta il tuo coach.');
            await auth.signOut();
          }
        }
      } catch (err) {
        console.error('Errore verifica ruolo:', err);
        setError('Errore durante la verifica del ruolo. Riprova.');
      } finally {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();
      
      if (!trimmedEmail || !trimmedPassword) {
        setError('Email e password sono obbligatori.');
        setIsSubmitting(false);
        return;
      }

      console.log('Tentativo di login:', { email: trimmedEmail });
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      console.log('Login riuscito:', { uid: userCredential.user.uid, email: userCredential.user.email });
      // Il redirect è gestito da onAuthStateChanged sopra
    } catch (err) {
      console.error('Errore login:', err.code, err.message);
      setError(
        err.code === 'auth/invalid-credential' ? 'Credenziali non valide. Verifica email e password.' :
        err.code === 'auth/user-not-found' ? 'Utente non trovato. Verifica l\'email.' :
        err.code === 'auth/wrong-password' ? 'Password errata. Riprova.' :
        err.code === 'auth/too-many-requests' ? 'Troppi tentativi. Riprova tra qualche minuto.' :
        err.code === 'auth/network-request-failed' ? 'Errore di connessione. Verifica la tua rete.' :
        'Errore durante il login: ' + err.message
      );
      setIsSubmitting(false);
    }
  };

  const inputContainerStyle = "relative";
  const inputStyle = "w-full p-3 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200";
  const iconStyle = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400";

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
        <p className="mt-4 text-sm">Verifica autenticazione...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      <motion.div
        className="w-full max-w-md bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 space-y-8 shadow-2xl shadow-black/20"
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className={`${inputStyle} pr-10`}
              autoComplete="current-password"
              disabled={isSubmitting || isCheckingAuth}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
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
          <Link to="/login" className="text-sm text-slate-400 hover:text-cyan-400 hover:underline transition-colors block mt-2">
            Sei un coach o admin? Accedi qui
          </Link>
        </div>
      </motion.div>
    </div>
  );
}