import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

// === STELLE CADENTI VERTICALI (CODA SEGUE LA PUNTA) ===
const AnimatedStars = () => {
  const [stars, setStars] = useState([]);

  // === INIETTA STILE ANIMAZIONE CODA (DENTRO IL COMPONENTE) ===
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tail {
        from { height: 60px; opacity: 0.6; }
        to { height: 0; opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // === GENERA STELLE ===
  useEffect(() => {
    const starArray = [];
    for (let i = 0; i < 40; i++) {
      const size = i % 5 === 0 ? 1.6 : i % 3 === 0 ? 2.4 : 1.9;
      const isGold = i % 5 === 0;
      starArray.push({
        id: i,
        size,
        left: Math.random() * 100,
        duration: 7 + Math.random() * 10,
        delay: Math.random() * 8,
        isGold,
        opacity: isGold ? 0.9 : 0.7
      });
    }
    setStars(starArray);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute"
          initial={{ y: -80 }}
          animate={{ y: '110vh' }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            left: `${star.left}vw`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: star.isGold ? '#fbbf24' : '#ffffff',
            borderRadius: '50%',
            boxShadow: star.isGold 
              ? `0 0 ${star.size * 4}px #fbbf24` 
              : `0 0 ${star.size * 3}px #ffffff`,
            opacity: star.opacity
          }}
        >
          {/* CODA: SEGUE LA PUNTA (IN ALTO) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0.5 origin-bottom"
            style={{
              top: `${star.size}px`,
              height: '60px',
              background: star.isGold 
                ? 'linear-gradient(to top, rgba(251,191,36,0.8), transparent)' 
                : 'linear-gradient(to top, rgba(255,255,255,0.6), transparent)',
              animation: `tail ${star.duration}s ${star.delay}s linear infinite`
            }}
          />
        </motion.div>
      ))}
    </div>
  );
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const adminDocRef = doc(db, 'roles', 'admins');
          const coachDocRef = doc(db, 'roles', 'coaches');
          const clientDocRef = doc(db, 'clients', user.uid);
          const [adminDoc, coachDoc, clientDoc] = await Promise.all([
            getDoc(adminDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(coachDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(clientDocRef).catch(() => ({ exists: () => false, data: () => ({}) }))
          ]);

          const isAdmin = adminDoc.exists() && adminDoc.data().uids.includes(user.uid);
          const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(user.uid);
          const isClient = clientDoc.exists() && clientDoc.data().isClient === true;

          if (isAdmin) {
            sessionStorage.setItem('app_role', 'admin');
            navigate('/');
          } else if (isCoach) {
            sessionStorage.setItem('app_role', 'coach');
            navigate('/coach');
          } else if (isClient) {
            sessionStorage.setItem('app_role', 'client');
            navigate(clientDoc.data().firstLogin ? '/client/first-access' : '/client/dashboard');
          } else {
            setError('Accesso non autorizzato. Usa il login client se sei un cliente.');
          }
        } catch (err) {
          setError('Errore verifica ruolo. Riprova.');
        }
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const adminDocRef = doc(db, 'roles', 'admins');
      const coachDocRef = doc(db, 'roles', 'coaches');
      const clientDocRef = doc(db, 'clients', userCredential.user.uid);
      const [adminDoc, coachDoc, clientDoc] = await Promise.all([
        getDoc(adminDocRef),
        getDoc(coachDocRef),
        getDoc(clientDocRef)
      ]);

      const isAdmin = adminDoc.exists() && adminDoc.data().uids.includes(userCredential.user.uid);
      const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(userCredential.user.uid);
      const isClient = clientDoc.exists() && clientDoc.data().isClient === true;

      if (isAdmin) {
        sessionStorage.setItem('app_role', 'admin');
        navigate('/');
      } else if (isCoach) {
        sessionStorage.setItem('app_role', 'coach');
        navigate('/coach');
      } else if (isClient) {
        sessionStorage.setItem('app_role', 'client');
        navigate(clientDoc.data().firstLogin ? '/client/first-access' : '/client/dashboard');
      } else {
        setError('Accesso non autorizzato. Usa il login client se sei un cliente.');
        await signOut(auth);
        navigate('/client-login');
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setError('Password errata. Riprova o reimposta la password.');
      } else if (error.code === 'auth/user-not-found') {
        setError('Utente non trovato. Verifica l\'email o usa il login client.');
      } else {
        setError('Errore login: ' + error.message);
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#fbbf24]"></div>
      </div>
    );
  }

  return (
    <>
      {/* SFONDO STELLATO */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#1b2735] to-[#090a0f] -z-10" />

      {/* STELLE CADENTI */}
      <AnimatedStars />

      {/* BOX LOGIN – TRASPARENTE */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-md z-10"
        >
          <div className="absolute -inset-1 rounded-3xl blur-xl opacity-50 animate-glow-line-1"></div>
          <div className="absolute -inset-1 rounded-3xl blur-xl opacity-50 animate-glow-line-2"></div>

          <div className="relative bg-white/3 backdrop-blur-lg border border-white/8 rounded-3xl p-8 shadow-xl">
            <div className="absolute inset-0 rounded-3xl animate-glow-line-1 opacity-30"></div>
            <div className="absolute inset-0 rounded-3xl animate-glow-line-2 opacity-30"></div>

            <div className="relative z-10">
              <motion.div className="flex justify-center mb-8">
                <h1 className="text-4xl font-bold text-slate-100 relative">
                  <span className="relative z-10">MentalFit</span>
                  <motion.span
                    className="absolute inset-x-0 -bottom-1 h-1 bg-[#fbbf24] rounded-full"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: [0.6, 1, 0.6] }}
                    transition={{
                      scaleX: { duration: 0.8, ease: "easeOut" },
                      opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    style={{ filter: 'blur(4px)' }}
                  />
                  <motion.span
                    className="absolute inset-x-0 -bottom-2 h-2 bg-[#fbbf24] rounded-full"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ filter: 'blur(8px)' }}
                  />
                </h1>
              </motion.div>

              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-medium text-slate-300">Login Coach/Admin</h2>
                <Link to="/client-login" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#fbbf24] transition-colors">
                  <ArrowLeft size={16} /> Login Cliente
                </Link>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:border-[#fbbf24]/30 transition-all"
                      placeholder="tuo@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-14 py-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:border-[#fbbf24]/30 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#fbbf24] transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[#fbbf24] text-sm text-center font-medium">
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-4 bg-[#fbbf24] hover:bg-[#f59e0b] text-zinc-900 font-bold rounded-xl shadow-lg hover:shadow-[#fbbf24]/50 transition-all duration-300"
                >
                  Accedi a MentalFit
                </motion.button>
              </form>

              <button onClick={handleResetPassword} className="mt-6 text-sm text-slate-400 hover:text-[#fbbf24] w-full text-center transition-colors">
                Password dimenticata?
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;