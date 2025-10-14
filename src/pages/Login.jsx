import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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
        console.log('Utente autenticato all\'avvio:', { uid: user.uid, email: user.email });
        try {
          const adminDocRef = doc(db, 'roles', 'admins');
          const coachDocRef = doc(db, 'roles', 'coaches');
          const clientDocRef = doc(db, 'clients', user.uid);
          const [adminDoc, coachDoc, clientDoc] = await Promise.all([
            getDoc(adminDocRef).catch(err => {
              console.error('Errore fetch /roles/admins:', err.message);
              return { exists: () => false, data: () => ({ uids: [] }) };
            }),
            getDoc(coachDocRef).catch(err => {
              console.error('Errore fetch /roles/coaches:', err.message);
              return { exists: () => false, data: () => ({ uids: [] }) };
            }),
            getDoc(clientDocRef).catch(err => {
              console.error('Errore fetch /clients:', err.message);
              return { exists: () => false, data: () => ({}) };
            })
          ]);

          const isAdmin = adminDoc.exists() && adminDoc.data().uids.includes(user.uid);
          const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(user.uid);
          const isClient = clientDoc.exists() && clientDoc.data().isClient === true;

          console.log('Debug ruolo in Login:', {
            uid: user.uid,
            email: user.email,
            isAdmin,
            isCoach,
            isClient,
            adminUids: adminDoc.data()?.uids,
            coachUids: coachDoc.data()?.uids
          });

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
            console.warn('Ruolo non riconosciuto per UID:', user.uid);
            setError('Accesso non autorizzato. Usa il login client se sei un cliente.');
            // Non eseguiamo logout qui, gestito nel submit
          }
        } catch (err) {
          console.error('Errore verifica ruolo:', err);
          setError('Errore durante la verifica del ruolo. Riprova.');
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
      console.log('Login riuscito:', { uid: userCredential.user.uid, email: userCredential.user.email });

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

      console.log('Debug ruolo post-login:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        isAdmin,
        isCoach,
        isClient,
        adminUids: adminDoc.data()?.uids,
        coachUids: coachDoc.data()?.uids
      });

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
        console.warn('Ruolo non riconosciuto per UID:', userCredential.user.uid);
        setError('Accesso non autorizzato. Usa il login client se sei un cliente.');
        // Logout solo se necessario
        await signOut(auth);
        navigate('/client-login');
      }
    } catch (error) {
      console.error('Errore login:', error.code, error.message);
      if (error.code === 'auth/wrong-password') {
        setError('Password errata. Riprova o reimposta la password.');
      } else if (error.code === 'auth/user-not-found') {
        setError('Utente non trovato. Verifica l\'email o usa il login client.');
      } else {
        setError('Errore durante il login: ' + error.message);
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
      setError('Email di reimpostazione password inviata. Controlla la tua casella di posta.');
    } catch (error) {
      console.error('Errore reset password:', error);
      setError('Errore nell\'invio dell\'email di reimpostazione: ' + error.message);
    }
  };

  const inputStyle = "w-full p-2.5 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 placeholder:text-slate-500";
  const labelStyle = "block mb-1 text-sm font-medium text-slate-300";
  const buttonStyle = "w-full p-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors disabled:bg-rose-900 disabled:cursor-not-allowed";

  if (isCheckingAuth) return (
    <div className="min-h-screen flex justify-center items-center bg-zinc-950">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6 sm:p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-50">Login Coach/Admin</h1>
          <Link to="/client-login" className="flex items-center gap-2 text-sm text-slate-400 hover:text-rose-500">
            <ArrowLeft size={16} /> Login Cliente
          </Link>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={labelStyle}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputStyle} pl-10`}
                placeholder="Inserisci la tua email"
              />
            </div>
          </div>
          <div>
            <label className={labelStyle}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputStyle} pl-10 pr-10`}
                placeholder="Inserisci la tua password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className={buttonStyle}>Accedi</button>
        </form>
        <button
          onClick={handleResetPassword}
          className="mt-4 text-sm text-slate-400 hover:text-rose-500 w-full text-center"
        >
          Password dimenticata?
        </button>
      </motion.div>
    </div>
  );
};

export default Login;