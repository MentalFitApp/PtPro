import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertTriangle, CheckCircle, Eye, EyeOff, Info, Loader2 } from 'lucide-react';
import { 
  verifyBeforeUpdateEmail, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  GoogleAuthProvider,
  reauthenticateWithPopup
} from 'firebase/auth';
import { auth } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';

/**
 * Componente per il cambio email del cliente
 * Supporta sia email/password che Google OAuth
 */
const ChangeEmailCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: form, 2: success
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const currentUser = auth.currentUser;
  
  // Controlla se l'utente usa Google OAuth
  const isGoogleUser = currentUser?.providerData?.some(p => p.providerId === 'google.com');
  const isPasswordUser = currentUser?.providerData?.some(p => p.providerId === 'password');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newEmail || !newEmail.includes('@')) {
      setError('Inserisci un\'email valida');
      return;
    }
    
    if (newEmail === currentUser.email) {
      setError('La nuova email è uguale a quella attuale');
      return;
    }
    
    setLoading(true);
    
    try {
      // Ri-autenticazione richiesta prima di cambiare email
      if (isGoogleUser && !isPasswordUser) {
        // Utente solo Google: usa popup per ri-autenticazione
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else if (isPasswordUser) {
        // Utente email/password: richiedi password
        if (!password) {
          setError('Inserisci la password attuale per confermare');
          setLoading(false);
          return;
        }
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      }
      
      // Invia email di verifica alla nuova email
      // L'email verrà aggiornata SOLO dopo che l'utente clicca il link
      await verifyBeforeUpdateEmail(currentUser, newEmail);
      
      // Aggiorna anche il documento client con la nuova email (pending)
      try {
        await updateDoc(getTenantDoc(db, 'clients', currentUser.uid), {
          pendingEmail: newEmail,
          emailChangeRequestedAt: new Date()
        });
      } catch (err) {
        console.debug('Could not update client doc:', err);
      }
      
      setStep(2);
    } catch (err) {
      console.error('Errore cambio email:', err);
      
      if (err.code === 'auth/wrong-password') {
        setError('Password non corretta');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Questa email è già in uso da un altro account');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email non valida');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Per sicurezza, esci e rientra prima di cambiare email');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Autenticazione annullata');
      } else {
        setError(err.message || 'Errore durante il cambio email');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setStep(1);
    setNewEmail('');
    setPassword('');
    setError('');
  };
  
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="text-blue-400" size={24} />
          <div>
            <h2 className="text-lg font-bold text-white">Cambia Email</h2>
            <p className="text-sm text-slate-400">{currentUser?.email}</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Modifica
        </button>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              {step === 1 ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Info Box */}
                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Come funziona:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-300/80">
                        <li>Inserisci la nuova email</li>
                        <li>Riceverai un link di conferma sulla nuova email</li>
                        <li>Clicca il link per completare il cambio</li>
                      </ol>
                      <p className="mt-2 text-amber-300">
                        ⚠️ Controlla anche nella cartella <strong>Spam</strong> se non vedi l'email!
                      </p>
                    </div>
                  </div>
                  
                  {/* Nuova Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nuova Email
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="nuova@email.com"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="email"
                    />
                  </div>
                  
                  {/* Password (solo per utenti email/password) */}
                  {isPasswordUser && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Password Attuale (per conferma)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Google User Info */}
                  {isGoogleUser && !isPasswordUser && (
                    <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                      <Info className="text-slate-400 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-slate-400">
                        Accedi con Google: ti verrà chiesto di confermare l'identità con il tuo account Google
                      </p>
                    </div>
                  )}
                  
                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                      <AlertTriangle size={18} />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  
                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !newEmail}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        'Invia Link di Conferma'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-emerald-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Email Inviata!</h3>
                  <p className="text-slate-400 mb-4">
                    Abbiamo inviato un link di conferma a:
                  </p>
                  <p className="text-lg font-medium text-cyan-400 mb-4">{newEmail}</p>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                    <p className="text-amber-300 text-sm">
                      ⚠️ <strong>Non vedi l'email?</strong> Controlla nella cartella <strong>Spam</strong> o <strong>Posta indesiderata</strong>!
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">
                    Clicca il link nell'email per completare il cambio. L'email attuale rimarrà valida fino alla conferma.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Chiudi
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChangeEmailCard;
