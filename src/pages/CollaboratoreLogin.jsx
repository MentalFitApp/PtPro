import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from '../firebase';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CollaboratoreLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const collabDocRef = doc(db, 'collaboratori', user.uid);
          const collabDoc = await getDoc(collabDocRef);
          if (collabDoc.exists()) {
            const data = collabDoc.data();
            navigate(data.firstLogin ? '/collaboratore/first-access' : '/collaboratore/dashboard');
          } else {
            await auth.signOut();
          }
        } catch (err) {
          await auth.signOut();
        }
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    } catch (err) {
      setError('Email o password errate.');
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
        <p className="mt-4 text-sm">Verifica autenticazione...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 to-zinc-900">
      <motion.div
        className="w-full max-w-md bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 space-y-8 border border-white/10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-50">Login Collaboratore</h2>
          <p className="text-sm text-slate-400 mt-2">Accedi per compilare i tuoi report giornalieri.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full p-3 pl-10 bg-slate-800/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200"
              disabled={isSubmitting}
            />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full p-3 pl-10 pr-10 bg-slate-800/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200"
              disabled={isSubmitting}
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
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:bg-cyan-900"
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          >
            <LogIn size={18} />
            {isSubmitting ? 'Accesso...' : 'Accedi'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}