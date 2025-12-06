import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Zap, Crown, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTenantDoc, CURRENT_TENANT_ID } from '../../config/tenant';

// === ANIMATED STARS BACKGROUND ===
const AnimatedStars = () => {
  useEffect(() => {
    const existingStars = document.querySelector('.login-stars');
    if (existingStars) return;

    const container = document.createElement('div');
    container.className = 'login-stars fixed inset-0 pointer-events-none z-0';
    document.body.appendChild(container);

    // Crea 50 stelle premium con effetto twinkle
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'absolute rounded-full';
      
      const isGold = i % 6 === 0;
      const size = isGold ? 3 : i % 3 === 0 ? 2 : 1;
      
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.backgroundColor = isGold ? '#fbbf24' : '#60a5fa';
      star.style.boxShadow = isGold 
        ? '0 0 10px #fbbf24, 0 0 20px #fbbf24' 
        : '0 0 5px #60a5fa';
      star.style.animation = `twinkle ${2 + Math.random() * 3}s infinite, float ${10 + Math.random() * 10}s infinite ease-in-out`;
      
      container.appendChild(star);
    }

    return () => {
      container.remove();
    };
  }, []);

  return null;
};

// === LOGIN COMPONENTE COMPLETO ===
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isInitialCheck = true;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && isInitialCheck) {
        try {
          // Salva tenantId in localStorage (usa CURRENT_TENANT_ID come fallback)
          let tenantId = localStorage.getItem('tenantId');
          if (!tenantId) {
            // Prova a recuperarlo da users collection
            try {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists() && userDoc.data()?.tenantId) {
                tenantId = userDoc.data().tenantId;
              } else {
                tenantId = CURRENT_TENANT_ID; // Fallback al tenant configurato
              }
              localStorage.setItem('tenantId', tenantId);
              console.log('✅ TenantId salvato:', tenantId);
            } catch (err) {
              tenantId = CURRENT_TENANT_ID;
              localStorage.setItem('tenantId', tenantId);
              console.debug('Using default tenantId:', tenantId);
            }
          }

          const adminDocRef = getTenantDoc(db, 'roles', 'admins');
          const coachDocRef = getTenantDoc(db, 'roles', 'coaches');
          const clientDocRef = getTenantDoc(db, 'clients', user.uid);
          const collabDocRef = getTenantDoc(db, 'collaboratori', user.uid);
          const [adminDoc, coachDoc, clientDoc, collabDoc] = await Promise.all([
            getDoc(adminDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(coachDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(clientDocRef).catch(() => ({ exists: () => false, data: () => ({}) })),
            getDoc(collabDocRef).catch(() => ({ exists: () => false, data: () => ({}) }))
          ]);

          const isAdmin = adminDoc.exists() && adminDoc.data().uids.includes(user.uid);
          const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(user.uid);
          const isClient = clientDoc.exists() && clientDoc.data().isClient === true;
          const isCollaboratore = collabDoc.exists();

          console.log('🔍 Login check:', { 
            uid: user.uid, 
            isAdmin, 
            isCoach, 
            isClient, 
            isCollaboratore,
            collabData: collabDoc.exists() ? collabDoc.data() : 'N/A'
          });

          if (isAdmin) {
            sessionStorage.setItem('app_role', 'admin');
            navigate('/', { replace: true });
          } else if (isCoach) {
            sessionStorage.setItem('app_role', 'coach');
            navigate('/coach', { replace: true });
          } else if (isCollaboratore) {
            sessionStorage.setItem('app_role', 'collaboratore');
            const hasFirstLogin = collabDoc.data()?.firstLogin === true;
            console.log('👤 Collaboratore login, firstLogin:', hasFirstLogin);
            navigate(hasFirstLogin ? '/collaboratore/first-access' : '/collaboratore/dashboard', { replace: true });
          } else if (isClient) {
            sessionStorage.setItem('app_role', 'client');
            const hasFirstLogin = clientDoc.data()?.firstLogin === true;
            navigate(hasFirstLogin ? '/client/first-access' : '/client/dashboard', { replace: true });
          } else {
            console.error('❌ Nessun ruolo trovato per:', user.uid);
            setError('Accesso non autorizzato. Contatta l\'amministratore.');
            await signOut(auth);
          }
        } catch (err) {
          setError('Errore verifica ruolo. Riprova.');
        }
      }
      setIsCheckingAuth(false);
    });

    return () => {
      isInitialCheck = false;
      unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Salva tenantId in localStorage
      let tenantId = CURRENT_TENANT_ID; // Usa tenant configurato come default
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists() && userDoc.data()?.tenantId) {
          tenantId = userDoc.data().tenantId;
        }
      } catch (err) {
        console.debug('Using default tenantId from config');
      }
      localStorage.setItem('tenantId', tenantId);
      console.log('✅ TenantId salvato al login:', tenantId);

      const adminDocRef = getTenantDoc(db, 'roles', 'admins');
      const coachDocRef = getTenantDoc(db, 'roles', 'coaches');
      const clientDocRef = getTenantDoc(db, 'clients', userCredential.user.uid);
      const collabDocRef = getTenantDoc(db, 'collaboratori', userCredential.user.uid);
      const [adminDoc, coachDoc, clientDoc, collabDoc] = await Promise.all([
        getDoc(adminDocRef),
        getDoc(coachDocRef),
        getDoc(clientDocRef),
        getDoc(collabDocRef)
      ]);

      const isAdmin = adminDoc.exists() && adminDoc.data().uids.includes(userCredential.user.uid);
      const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(userCredential.user.uid);
      const isClient = clientDoc.exists() && clientDoc.data().isClient === true;
      const isCollaboratore = collabDoc.exists();

      // Aggiorna lastActive nel documento client
      if (isClient && clientDoc.exists()) {
        try {
          await updateDoc(clientDocRef, { lastActive: serverTimestamp() });
        } catch (e) {
          console.debug('Could not update lastActive:', e.message);
        }
      }

      if (isAdmin) {
        sessionStorage.setItem('app_role', 'admin');
        navigate('/');
      } else if (isCoach) {
        sessionStorage.setItem('app_role', 'coach');
        navigate('/coach');
      } else if (isCollaboratore) {
        sessionStorage.setItem('app_role', 'collaboratore');
        navigate(collabDoc.data().firstLogin ? '/collaboratore/first-access' : '/collaboratore/dashboard');
      } else if (isClient) {
        sessionStorage.setItem('app_role', 'client');
        navigate(clientDoc.data().firstLogin ? '/client/first-access' : '/client/dashboard');
      } else {
        setError('Accesso non autorizzato. Contatta l\'amministratore.');
        await signOut(auth);
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setError('Password errata. Riprova o reimposta la password.');
      } else if (error.code === 'auth/user-not-found') {
        setError('Utente non trovato. Verifica l\'email.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Credenziali non valide. Verifica email e password.');
      } else {
        setError('Errore login: ' + error.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Salva tenantId in localStorage
      let tenantId = CURRENT_TENANT_ID;
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists() && userDoc.data()?.tenantId) {
          tenantId = userDoc.data().tenantId;
        }
      } catch (err) {
        console.debug('Using default tenantId from config');
      }
      localStorage.setItem('tenantId', tenantId);
      console.log('✅ TenantId salvato al login Google:', tenantId);

      // Verifica ruolo
      const adminDocRef = getTenantDoc(db, 'roles', 'admins');
      const coachDocRef = getTenantDoc(db, 'roles', 'coaches');
      const clientDocRef = getTenantDoc(db, 'clients', userCredential.user.uid);
      const collabDocRef = getTenantDoc(db, 'collaboratori', userCredential.user.uid);
      const [adminDoc, coachDoc, clientDoc, collabDoc] = await Promise.all([
        getDoc(adminDocRef),
        getDoc(coachDocRef),
        getDoc(clientDocRef),
        getDoc(collabDocRef)
      ]);

      const isAdmin = adminDoc.exists() && adminDoc.data().uids.includes(userCredential.user.uid);
      const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(userCredential.user.uid);
      const isClient = clientDoc.exists() && clientDoc.data().isClient === true;
      const isCollaboratore = collabDoc.exists();

      // Aggiorna lastActive nel documento client
      if (isClient && clientDoc.exists()) {
        try {
          await updateDoc(clientDocRef, { lastActive: serverTimestamp() });
        } catch (e) {
          console.debug('Could not update lastActive:', e.message);
        }
      }

      if (isAdmin) {
        sessionStorage.setItem('app_role', 'admin');
        navigate('/');
      } else if (isCoach) {
        sessionStorage.setItem('app_role', 'coach');
        navigate('/coach');
      } else if (isCollaboratore) {
        sessionStorage.setItem('app_role', 'collaboratore');
        navigate(collabDoc.data().firstLogin ? '/collaboratore/first-access' : '/collaboratore/dashboard');
      } else if (isClient) {
        sessionStorage.setItem('app_role', 'client');
        navigate(clientDoc.data().firstLogin ? '/client/first-access' : '/client/dashboard');
      } else {
        setError('Account Google non collegato. Registrati prima con email/password e poi collega Google dal profilo.');
        await signOut(auth);
      }
    } catch (error) {
      console.error('❌ Errore login Google:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Popup chiuso. Riprova.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignora - popup già aperto
      } else {
        setError('Errore login Google: ' + error.message);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Inserisci un\'email per reimpostare la password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Email di reimpostazione inviata. Controlla la posta.');
    } catch (error) {
      setError('Errore invio email: ' + error.message);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-blue-500"></div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 w-6 h-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Animated Stars Background */}
      <AnimatedStars />

      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo e Titolo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="relative">
              <motion.div
                className="absolute -inset-3 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 rounded-full blur-xl"
                animate={{ 
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-blue-500/30 shadow-xl shadow-blue-500/30">
                <img 
                  src="/logo192.PNG" 
                  alt="FitFlow Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <motion.h1
              className="text-5xl font-black text-white relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.span
                className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 blur-xl opacity-40"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">FitFlow</span>
            </motion.h1>
          </motion.div>

          <motion.p
            className="text-slate-400 text-lg font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Accedi alla tua area riservata
          </motion.p>
        </div>

        {/* Card Login */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-glow p-8 space-y-6"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="nome@esempio.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors z-10"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm"
                >
                  <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white preserve-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <LogIn size={20} className="relative" />
              <span className="relative">Accedi</span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50"></div>
            </div>
            <div className="relative bg-slate-900/80 px-4 text-sm text-slate-500">
              oppure
            </div>
          </div>

          {/* Google Login Button */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-3 group shadow-sm hover:shadow-md"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Accedi con Google</span>
          </motion.button>

          {/* Info collegamento Google */}
          <p className="text-xs text-slate-500 text-center pt-2">
            ℹ️ Funziona solo se hai già collegato Google al tuo account
          </p>

          {/* Password Reset Link */}
          <div className="text-center pt-4 border-t border-slate-700/50">
            <button
              onClick={handleResetPassword}
              className="text-sm text-slate-400 hover:text-cyan-400 transition-colors font-medium inline-flex items-center gap-2 group"
            >
              <Lock size={14} className="group-hover:rotate-12 transition-transform" />
              Password dimenticata?
            </button>
          </div>
        </motion.div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 space-y-2"
        >
          <p className="text-slate-500 text-sm">
            Powered by <span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text font-bold">FitFlow</span> Platform
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
            <Crown size={12} className="text-yellow-500" />
            <span>Premium Fitness Management System</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;