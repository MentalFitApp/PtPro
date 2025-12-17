import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useForm } from 'react-hook-form';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Gift,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const functions = getFunctions(undefined, 'europe-west1');

// Componente per la validazione password in tempo reale
const PasswordStrengthIndicator = ({ password }) => {
  const checks = [
    { label: 'Almeno 8 caratteri', valid: password.length >= 8 },
    { label: 'Almeno una maiuscola', valid: /[A-Z]/.test(password) },
    { label: 'Almeno una minuscola', valid: /[a-z]/.test(password) },
    { label: 'Almeno un numero', valid: /\d/.test(password) },
  ];

  const validCount = checks.filter(c => c.valid).length;
  const strengthPercent = (validCount / checks.length) * 100;
  
  const strengthColor = 
    strengthPercent <= 25 ? 'bg-red-500' :
    strengthPercent <= 50 ? 'bg-orange-500' :
    strengthPercent <= 75 ? 'bg-yellow-500' :
    'bg-green-500';

  return (
    <div className="mt-2 space-y-2">
      {/* Barra di forza */}
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${strengthColor}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>
      
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1 text-xs">
        {checks.map((check, i) => (
          <div 
            key={i}
            className={`flex items-center gap-1 ${check.valid ? 'text-green-400' : 'text-slate-500'}`}
          >
            {check.valid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {check.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AcceptInvite() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  const navigate = useNavigate();

  // Stati
  const [step, setStep] = useState('loading'); // loading | code-input | form | success | error
  const [invitation, setInvitation] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acceptPrivacy: false,
    }
  });

  const password = watch('password', '');

  // Valida invito all'avvio
  useEffect(() => {
    if (token) {
      validateInvite({ token });
    } else if (codeFromUrl) {
      validateInvite({ code: codeFromUrl });
    } else {
      setStep('code-input');
    }
  }, [token, codeFromUrl]);

  const validateInvite = async ({ token: tokenToValidate, code: codeToValidate }) => {
    setIsValidating(true);
    setError('');
    
    try {
      const validateInvitation = httpsCallable(functions, 'validateInvitation');
      const result = await validateInvitation({ 
        token: tokenToValidate, 
        code: codeToValidate 
      });

      if (result.data.valid) {
        setInvitation(result.data.invitation);
        
        // Pre-compila i campi se disponibili
        if (result.data.invitation.clientData) {
          const { name, email, phone } = result.data.invitation.clientData;
          if (name) setValue('name', name);
          if (email) setValue('email', email);
          if (phone) setValue('phone', phone);
        }
        
        setStep('form');
      } else {
        setError(result.data.reason || 'Invito non valido');
        setStep('error');
      }
    } catch (err) {
      console.error('Errore validazione invito:', err);
      setError(err.message || 'Errore di connessione');
      setStep('error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim().length >= 6) {
      validateInvite({ code: manualCode.trim().toUpperCase() });
    }
  };

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const completeInvitation = httpsCallable(functions, 'completeInvitation');
      const result = await completeInvitation({
        token: invitation.token,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password: data.password,
        acceptTerms: data.acceptTerms,
        acceptPrivacy: data.acceptPrivacy,
      });

      if (result.data.success) {
        setStep('success');
      } else {
        setError(result.data.message || 'Errore durante la registrazione');
      }
    } catch (err) {
      console.error('Errore registrazione:', err);
      setError(err.message || 'Errore durante la registrazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stili dinamici basati sul branding tenant
  const brandColor = invitation?.tenantColors?.primary || '#3b82f6';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card principale */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header con logo tenant */}
          <div 
            className="p-6 text-center border-b border-slate-700/50"
            style={{ 
              background: `linear-gradient(135deg, ${brandColor}20, transparent)` 
            }}
          >
            {invitation?.tenantLogo ? (
              <img 
                src={invitation.tenantLogo} 
                alt={invitation.tenantName}
                className="h-16 mx-auto mb-3 rounded-xl"
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: brandColor }}
              >
                {invitation?.tenantName?.charAt(0) || '🏋️'}
              </div>
            )}
            <h1 className="text-xl font-bold text-white">
              {step === 'success' 
                ? 'Registrazione Completata!' 
                : invitation?.tenantName 
                  ? `Benvenuto in ${invitation.tenantName}`
                  : 'Completa la Registrazione'}
            </h1>
            {invitation?.welcomeMessage && step === 'form' && (
              <p className="text-slate-400 mt-2 text-sm">
                {invitation.welcomeMessage}
              </p>
            )}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              
              {/* STEP: Loading */}
              {step === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-slate-400">Verifica invito in corso...</p>
                </motion.div>
              )}

              {/* STEP: Inserimento codice manuale */}
              {step === 'code-input' && (
                <motion.div
                  key="code-input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center mb-6">
                    <Gift className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <p className="text-slate-300">
                      Inserisci il codice invito ricevuto
                    </p>
                  </div>

                  <form onSubmit={handleCodeSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="Es: ABC123"
                        maxLength={6}
                        className="w-full text-center text-2xl font-mono tracking-[0.5em] py-4 px-6 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        <AlertCircle size={16} />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={manualCode.length < 6 || isValidating}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Verifica...
                        </>
                      ) : (
                        <>
                          Continua
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP: Form registrazione */}
              {step === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Nome completo *
                      </label>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          {...register('name', { required: 'Nome richiesto' })}
                          className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Mario Rossi"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="email"
                          {...register('email', { 
                            required: 'Email richiesta',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Email non valida'
                            }
                          })}
                          className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="mario@email.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Telefono (opzionale) */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Telefono <span className="text-slate-500">(opzionale)</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="tel"
                          {...register('phone')}
                          className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="+39 123 456 7890"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password', { 
                            required: 'Password richiesta',
                            minLength: { value: 8, message: 'Minimo 8 caratteri' }
                          })}
                          className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {password && <PasswordStrengthIndicator password={password} />}
                      {errors.password && (
                        <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                      )}
                    </div>

                    {/* Conferma Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Conferma Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...register('confirmPassword', { 
                            required: 'Conferma password',
                            validate: value => value === password || 'Le password non coincidono'
                          })}
                          className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    {/* Consensi */}
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('acceptTerms', { required: 'Devi accettare i termini' })}
                          className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                        />
                        <span className="text-sm text-slate-400">
                          Accetto i{' '}
                          <a href="/terms" target="_blank" className="text-blue-400 hover:underline">
                            Termini e Condizioni
                          </a>
                          {' '}*
                        </span>
                      </label>
                      {errors.acceptTerms && (
                        <p className="text-red-400 text-sm">{errors.acceptTerms.message}</p>
                      )}

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('acceptPrivacy', { required: 'Devi accettare la privacy policy' })}
                          className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                        />
                        <span className="text-sm text-slate-400">
                          Accetto la{' '}
                          <a href="/privacy" target="_blank" className="text-blue-400 hover:underline">
                            Privacy Policy
                          </a>
                          {' '}*
                        </span>
                      </label>
                      {errors.acceptPrivacy && (
                        <p className="text-red-400 text-sm">{errors.acceptPrivacy.message}</p>
                      )}
                    </div>

                    {/* Errore generale */}
                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        <AlertCircle size={16} />
                        {error}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      style={{ backgroundColor: isSubmitting ? undefined : brandColor }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Registrazione in corso...
                        </>
                      ) : (
                        <>
                          <Shield size={18} />
                          Completa Registrazione
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP: Success */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Benvenuto a bordo! 🎉
                  </h2>
                  <p className="text-slate-400 mb-6">
                    La tua registrazione è stata completata con successo.<br />
                    Ora puoi accedere alla piattaforma.
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Accedi ora
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

              {/* STEP: Error */}
              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Invito Non Valido
                  </h2>
                  <p className="text-slate-400 mb-6">
                    {error}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setError('');
                        setManualCode('');
                        setStep('code-input');
                      }}
                      className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                    >
                      Inserisci un altro codice
                    </button>
                    <p className="text-sm text-slate-500">
                      Se il problema persiste, contatta il tuo coach.
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Hai già un account?{' '}
          <button 
            onClick={() => navigate('/login')}
            className="text-blue-400 hover:underline"
          >
            Accedi qui
          </button>
        </p>
      </motion.div>
    </div>
  );
}
