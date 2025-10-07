import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from '../firebase.js'; 
// --- 1. IMPORTIAMO LE NUOVE ICONE ---
import { LogIn, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

// Componente per lo sfondo animato (lo stesso del MainLayout)
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden bg-zinc-950">
    <div className="aurora-background"></div>
  </div>
);

const ClientLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, "clients", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().isClient === true) {
                sessionStorage.setItem('app_role', 'client');
                const isFirstLogin = userDoc.data().firstLogin === true;
                if (isFirstLogin) {
                    navigate('/client/first-access');
                } else {
                    navigate('/client/dashboard');
                }
            } else {
                setError("Accesso non autorizzato. Area riservata ai clienti.");
                await signOut(auth);
            }
        } catch (err) {
            setError("Credenziali non valide. Riprova.");
            console.error("Errore di login:", err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- 2. NUOVI STILI PER IL FORM ---
    const inputContainerStyle = "relative";
    const inputStyle = "w-full p-3 pl-10 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-200";
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
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-cyan-900 disabled:cursor-not-allowed"
                        >
                          <LogIn size={18} />
                          {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
                        </button>
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
