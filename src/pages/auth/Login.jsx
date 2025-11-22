import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTenantDoc } from '../../config/tenant';

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
            navigate('/');
          } else if (isCoach) {
            sessionStorage.setItem('app_role', 'coach');
            navigate('/coach');
          } else if (isCollaboratore) {
            sessionStorage.setItem('app_role', 'collaboratore');
            const hasFirstLogin = collabDoc.data()?.firstLogin === true;
            console.log('👤 Collaboratore login, firstLogin:', hasFirstLogin);
            navigate(hasFirstLogin ? '/collaboratore/first-access' : '/collaboratore/dashboard');
          } else if (isClient) {
            sessionStorage.setItem('app_role', 'client');
            const hasFirstLogin = clientDoc.data()?.firstLogin === true;
            navigate(hasFirstLogin ? '/client/first-access' : '/client/dashboard');
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

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ef4444]"></div>
      </div>
    );
  }

  return (
    <>
      {/* SFONDO STELLATO */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#1b2735] to-[#090a0f] -z-10" />

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
                    className="absolute inset-x-0 -bottom-1 h-1 bg-[#ef4444] rounded-full"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: [0.6, 1, 0.6] }}
                    transition={{
                      scaleX: { duration: 0.8, ease: "easeOut" },
                      opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    style={{ filter: 'blur(4px)' }}
                  />
                  <motion.span
                    className="absolute inset-x-0 -bottom-2 h-2 bg-[#ef4444] rounded-full"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ filter: 'blur(8px)' }}
                  />
                </h1>
              </motion.div>

              <div className="flex items-center justify-center mb-8">
                <h2 className="text-xl font-medium text-slate-300">Accedi al tuo account</h2>
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
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 focus:border-[#ef4444]/30 transition-all"
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
                      className="w-full pl-12 pr-14 py-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 focus:border-[#ef4444]/30 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ef4444] transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[#ef4444] text-sm text-center font-medium">
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-4 bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold rounded-xl shadow-lg hover:shadow-[#ef4444]/50 transition-all duration-300"
                >
                  Accedi a MentalFit
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button onClick={handleResetPassword} className="text-sm text-slate-400 hover:text-[#ef4444] transition-colors">
                  Password dimenticata?
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;