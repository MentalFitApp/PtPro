import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';
// --- 1. IMPORTIAMO LE NUOVE ICONE ---
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';

// Componente per lo sfondo animato
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-900">
    <div className="aurora-background"></div>
  </div>
);

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = getAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Email di reset inviata! Controlla la tua casella di posta (anche lo spam).');
        } catch (err) {
            setError('Nessun utente trovato con questa email. Controlla che sia corretta.');
            console.error("Errore nel reset password:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- 2. NUOVI STILI PER IL FORM ---
    const inputContainerStyle = "relative";
    const inputStyle = "w-full p-3 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-200";
    const iconStyle = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400";

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <AnimatedBackground />
            <motion.div 
                className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700 p-8 space-y-8 shadow-2xl shadow-black/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-50">Recupera Password</h2>
                    <p className="text-slate-400 mt-2">Nessun problema, ti aiutiamo noi.</p>
                </div>
                
                {message ? (
                    <div className="text-center p-4 bg-emerald-900/50 text-emerald-300 rounded-lg border border-emerald-500/30">
                        <p>{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <p className="text-center text-sm text-slate-400">Inserisci la tua email per ricevere un link di recupero.</p>
                        <div className={inputContainerStyle}>
                           <Mail size={18} className={iconStyle} />
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="La tua email"
                                className={inputStyle}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-cyan-900 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                                {loading ? 'Invio in corso...' : 'Invia Link di Recupero'}
                            </button>
                        </div>
                    </form>
                )}
                
                <div className="text-center">
                    <Link to="/client-login" className="text-sm text-slate-400 hover:text-cyan-400 hover:underline transition-colors flex items-center justify-center gap-2">
                        <ArrowLeft size={16} /> Torna al Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
