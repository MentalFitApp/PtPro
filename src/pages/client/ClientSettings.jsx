import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Download, Trash2, Link as LinkIcon, Settings, Bell, BellOff, 
  Check, Smartphone, Mail, User, Lock, AlertCircle, Key, Eye, EyeOff, Loader2,
  Sparkles, RotateCcw, Sun, Moon, Zap
} from 'lucide-react';
import SmartNotificationSettings from '../../components/notifications/SmartNotificationSettings';
import GDPRSettings from '../../components/settings/GDPRSettings';
import LinkAccountCard from '../../components/LinkAccountCard';
import ChangeEmailCard from '../../components/settings/ChangeEmailCard';
import { auth, db } from '../../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import { setDoc, serverTimestamp, getDoc, updateDoc, doc } from 'firebase/firestore';
import { getTenantDoc } from '../../config/tenant';
import { applyCardTransparency } from '../../hooks/useTenantBranding';
import { useTheme } from '../../contexts/ThemeContext';

const VAPID_KEY = 'BPBjZH1KnB4fCdqy5VobaJvb_mC5UTPKxodeIhyhl6PrRBZ1r6bd6nFqoloeDXSXKb4uffOVSupUGHQ4Q0l9Ato';

/**
 * Pagina Impostazioni Client - Layout a Tab come Admin
 */
const ClientSettings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [notificationStatus, setNotificationStatus] = useState('unknown');
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [notification, setNotification] = useState(null);
  const [starsOpacity, setStarsOpacity] = useState(0.5);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  
  // State per cambio password
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setNotificationStatus('unsupported');
    } else {
      setNotificationStatus(Notification.permission);
    }
    
    // Carica preferenze aspetto utente
    const loadAppearance = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.cardTransparency !== undefined) {
            setStarsOpacity(data.cardTransparency);
            applyCardTransparency(data.cardTransparency);
          }
        }
      } catch (error) {
        console.error('Error loading appearance:', error);
      }
    };
    loadAppearance();
  }, []);

  const handleEnableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    
    setIsEnablingNotifications(true);
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      
      if (permission === 'granted') {
        try {
          const messaging = getMessaging();
          const token = await getToken(messaging, { vapidKey: VAPID_KEY });
          
          if (token && auth.currentUser) {
            const userId = auth.currentUser.uid;
            const tokenRef = getTenantDoc(db, 'fcmTokens', userId);
            const existingDoc = await getDoc(tokenRef);
            
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            
            if (existingDoc.exists()) {
              await updateDoc(tokenRef, {
                token,
                updatedAt: serverTimestamp(),
                platform: isIOS ? 'ios' : 'android/web',
                isPWA
              });
            } else {
              await setDoc(tokenRef, {
                userId,
                token,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                platform: isIOS ? 'ios' : 'android/web',
                isPWA,
                enabled: true
              });
            }
            showNotification('success', 'Notifiche attivate con successo!');
          }
        } catch (fcmError) {
          console.error('[FCM] Errore token:', fcmError);
        }
      }
    } catch (error) {
      console.error('Errore richiesta permessi:', error);
      showNotification('error', 'Errore durante l\'attivazione delle notifiche');
    } finally {
      setIsEnablingNotifications(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handler per cambio password
  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showNotification('error', 'Compila tutti i campi');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('error', 'Le password non coincidono');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showNotification('error', 'La password deve essere di almeno 6 caratteri');
      return;
    }

    setChangingPassword(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) {
        showNotification('error', 'Utente non autenticato');
        return;
      }
      
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.oldPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);
      
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showNotification('success', 'Password cambiata con successo!');
    } catch (error) {
      console.error('Errore cambio password:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showNotification('error', 'Password attuale non corretta');
      } else if (error.code === 'auth/too-many-requests') {
        showNotification('error', 'Troppi tentativi. Riprova più tardi');
      } else {
        showNotification('error', 'Errore durante il cambio password');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPWA = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator?.standalone);

  const tabs = [
    {
      id: 'account',
      label: 'Account',
      icon: User,
      description: 'Email e account collegati',
      color: 'blue'
    },
    {
      id: 'appearance',
      label: 'Aspetto',
      icon: Sparkles,
      description: 'Personalizza l\'interfaccia',
      color: 'amber'
    },
    {
      id: 'notifications',
      label: 'Notifiche',
      icon: Bell,
      description: 'Gestisci le notifiche push',
      color: 'purple'
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: Shield,
      description: 'GDPR e dati personali',
      color: 'emerald'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1920px] mx-auto">
        {/* Header Mobile */}
        <div className="lg:hidden px-4 py-4 border-b border-slate-700/30 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-1">
            <Settings className="text-cyan-400" size={24} />
            Impostazioni
          </h1>
          <p className="text-slate-400 text-xs">
            Gestisci account, notifiche e privacy
          </p>
        </div>

        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl border shadow-2xl ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 backdrop-blur-sm'
                  : 'bg-red-500/10 border-red-500/30 text-red-400 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                {notification.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layout Desktop/Mobile */}
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block lg:w-72 xl:w-80 bg-slate-900/30 border-r border-slate-700/30 sticky top-0 h-screen overflow-y-auto">
            <div className="p-6 border-b border-slate-700/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-600/20 rounded-lg">
                  <Settings className="text-cyan-400" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-100">
                    Impostazioni
                  </h1>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Gestisci il tuo account e le preferenze
              </p>
            </div>

            <nav className="p-4 space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                const bgActiveClasses = {
                  blue: 'bg-blue-600/20 border-2 border-blue-500/50',
                  emerald: 'bg-emerald-600/20 border-2 border-emerald-500/50',
                  purple: 'bg-purple-600/20 border-2 border-purple-500/50',
                  amber: 'bg-amber-600/20 border-2 border-amber-500/50'
                };
                
                const indicatorClasses = {
                  blue: 'bg-blue-500',
                  emerald: 'bg-emerald-500',
                  purple: 'bg-purple-500',
                  amber: 'bg-amber-500'
                };
                
                const iconActiveClasses = {
                  blue: 'text-blue-400',
                  emerald: 'text-emerald-400',
                  purple: 'text-purple-400',
                  amber: 'text-amber-400'
                };
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl transition-all group relative ${
                      isActive
                        ? bgActiveClasses[tab.color]
                        : 'bg-slate-800/30 border-2 border-transparent hover:border-slate-600/50 hover:bg-slate-800/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-full ${indicatorClasses[tab.color]}`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <div className="flex items-center gap-3 mb-1">
                      <Icon 
                        size={22} 
                        className={isActive ? iconActiveClasses[tab.color] : 'text-slate-400 group-hover:text-slate-300'} 
                      />
                      <span className={`font-semibold text-sm ${
                        isActive ? 'text-slate-100' : 'text-slate-300 group-hover:text-slate-100'
                      }`}>
                        {tab.label}
                      </span>
                    </div>
                    <p className={`text-xs ml-8 ${
                      isActive ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'
                    }`}>
                      {tab.description}
                    </p>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Tabs */}
          <div className="lg:hidden flex gap-2 px-4 py-3 overflow-x-auto bg-slate-900/50 border-b border-slate-700/30">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                {/* TAB: Account */}
                {activeTab === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Header */}
                    <div className="hidden lg:block mb-8">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <User className="text-blue-400" size={28} />
                        Account
                      </h2>
                      <p className="text-slate-400 mt-1">
                        Gestisci email e account collegati
                      </p>
                    </div>

                    {/* Cambio Email */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <div className="flex items-center gap-3 mb-4">
                        <Mail className="text-blue-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Cambio Email</h3>
                      </div>
                      <ChangeEmailCard />
                    </div>

                    {/* Cambio Password */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <div className="flex items-center gap-3 mb-4">
                        <Key className="text-amber-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Cambio Password</h3>
                      </div>
                      <p className="text-slate-400 mb-6">
                        Modifica la password del tuo account per mantenere la sicurezza.
                      </p>
                      
                      <div className="space-y-4">
                        {/* Password Attuale */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Password Attuale</label>
                          <div className="relative">
                            <input
                              type={showPasswords.old ? 'text' : 'password'}
                              value={passwordForm.oldPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                              placeholder="Inserisci la password attuale"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                              {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                        
                        {/* Nuova Password */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Nuova Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                              placeholder="Inserisci la nuova password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                              {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                        
                        {/* Conferma Password */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Conferma Nuova Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                              placeholder="Ripeti la nuova password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                              {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                        
                        <button
                          onClick={handleChangePassword}
                          disabled={changingPassword || !passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                          {changingPassword ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <>
                              <Key size={20} />
                              Cambia Password
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Account Collegati */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <div className="flex items-center gap-3 mb-4">
                        <LinkIcon className="text-indigo-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Account Collegati</h3>
                      </div>
                      <p className="text-slate-400 mb-6">
                        Collega Google o Facebook per accedere più velocemente.
                      </p>
                      <LinkAccountCard />
                    </div>
                  </motion.div>
                )}

                {/* TAB: Aspetto */}
                {activeTab === 'appearance' && (
                  <motion.div
                    key="appearance"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Header */}
                    <div className="hidden lg:block mb-8">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="text-amber-400" size={28} />
                        Aspetto
                      </h2>
                      <p className="text-slate-400 mt-1">
                        Personalizza l'aspetto dell'interfaccia
                      </p>
                    </div>

                    {/* Tema Interfaccia */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <div className="flex items-center gap-3 mb-4">
                        {isDark ? <Moon className="text-blue-400" size={24} /> : <Sun className="text-amber-400" size={24} />}
                        <h3 className="text-xl font-bold text-white">Tema Interfaccia</h3>
                      </div>
                      <p className="text-slate-400 mb-6">
                        Scegli tra modalità chiara o scura per l'interfaccia.
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => isDark && toggleTheme()}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                            !isDark 
                              ? 'border-blue-500 bg-blue-500/10' 
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className={`p-3 rounded-full ${!isDark ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
                            <Sun size={24} className={!isDark ? 'text-amber-400' : 'text-slate-500'} />
                          </div>
                          <span className={`font-medium ${!isDark ? 'text-white' : 'text-slate-400'}`}>Tema Chiaro</span>
                          <span className="text-xs text-slate-500">Ideale per uso diurno</span>
                        </button>
                        
                        <button
                          onClick={() => !isDark && toggleTheme()}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                            isDark 
                              ? 'border-blue-500 bg-blue-500/10' 
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className={`p-3 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
                            <Moon size={24} className={isDark ? 'text-blue-400' : 'text-slate-500'} />
                          </div>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-400'}`}>Tema Scuro</span>
                          <span className="text-xs text-slate-500">Ideale per uso notturno</span>
                        </button>
                      </div>
                    </div>

                    {/* Luminosità Stelle */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="text-amber-400" size={24} />
                          <h3 className="text-xl font-bold text-white">Luminosità Stelle</h3>
                        </div>
                        <button
                          onClick={() => {
                            setStarsOpacity(0.5);
                            applyCardTransparency(0.5);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <RotateCcw size={14} />
                          Reset
                        </button>
                      </div>
                      <p className="text-slate-400 mb-6">
                        Regola la luminosità delle stelle animate nello sfondo.
                      </p>

                      <div className="space-y-4">
                        {/* Slider */}
                        <div className="space-y-3">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={1 - starsOpacity}
                            onChange={(e) => {
                              const newValue = 1 - parseFloat(e.target.value);
                              setStarsOpacity(newValue);
                              applyCardTransparency(newValue);
                            }}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Spente</span>
                            <span className="text-amber-400 font-medium">{Math.round((1 - starsOpacity) * 100)}%</span>
                            <span>Luminose</span>
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: 1, label: 'Spente' },
                            { value: 0.75, label: 'Basse' },
                            { value: 0.5, label: 'Medie' },
                            { value: 0, label: 'Luminose' },
                          ].map((p) => (
                            <button
                              key={p.value}
                              onClick={() => {
                                setStarsOpacity(p.value);
                                applyCardTransparency(p.value);
                              }}
                              className={`py-2 text-xs rounded-lg border transition-all ${
                                Math.abs(starsOpacity - p.value) < 0.1
                                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                                  : 'border-slate-700 text-slate-500 hover:border-slate-600'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {/* Preview */}
                        <div className="relative mt-4 p-4 rounded-xl border border-slate-700 overflow-hidden bg-slate-900/50">
                          <div className="absolute inset-0 overflow-hidden">
                            {[...Array(15)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                                style={{
                                  left: `${Math.random() * 100}%`,
                                  top: `${Math.random() * 100}%`,
                                  opacity: 1 - starsOpacity,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              />
                            ))}
                          </div>
                          <div className="relative text-center py-4">
                            <p className="text-sm text-slate-300">Anteprima stelle</p>
                            <p className="text-xs text-slate-500 mt-1">Opacità: {Math.round((1 - starsOpacity) * 100)}%</p>
                          </div>
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={async () => {
                            const user = auth.currentUser;
                            if (!user) return;
                            setSavingAppearance(true);
                            try {
                              await setDoc(doc(db, 'users', user.uid), {
                                cardTransparency: starsOpacity,
                                updatedAt: new Date().toISOString(),
                              }, { merge: true });
                              showNotification('success', 'Preferenze salvate!');
                            } catch (error) {
                              console.error('Error saving:', error);
                              showNotification('error', 'Errore nel salvataggio');
                            } finally {
                              setSavingAppearance(false);
                            }
                          }}
                          disabled={savingAppearance}
                          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                          {savingAppearance ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <>
                              <Check size={20} />
                              Salva Preferenze
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: Notifiche */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Header */}
                    <div className="hidden lg:block mb-8">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Bell className="text-purple-400" size={28} />
                        Notifiche
                      </h2>
                      <p className="text-slate-400 mt-1">
                        Gestisci le notifiche push per rimanere aggiornato
                      </p>
                    </div>

                    {/* Notifiche Push */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <div className="flex items-center gap-3 mb-4">
                        <Bell className="text-purple-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Notifiche Push</h3>
                      </div>
                      <p className="text-slate-400 mb-6">
                        Ricevi notifiche per messaggi dal coach, nuove schede e promemoria.
                      </p>

                      {notificationStatus === 'unsupported' ? (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <p className="text-amber-200 text-sm">
                            Il tuo browser non supporta le notifiche push.
                          </p>
                        </div>
                      ) : notificationStatus === 'granted' ? (
                        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check size={20} className="text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-emerald-400 font-medium">Notifiche Attive</p>
                            <p className="text-slate-400 text-sm">Riceverai notifiche push per aggiornamenti importanti</p>
                          </div>
                        </div>
                      ) : notificationStatus === 'denied' ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <div className="flex items-center gap-3 mb-3">
                            <BellOff size={20} className="text-red-400" />
                            <p className="text-red-400 font-medium">Notifiche Bloccate</p>
                          </div>
                          <p className="text-slate-400 text-sm">
                            Hai bloccato le notifiche. Per riattivarle, vai nelle impostazioni del browser e consenti le notifiche per questo sito.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <button
                            onClick={handleEnableNotifications}
                            disabled={isEnablingNotifications}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isEnablingNotifications ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Bell size={20} />
                                Attiva Notifiche
                              </>
                            )}
                          </button>
                          
                          {isIOS && !isPWA && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                              <div className="flex items-start gap-2">
                                <Smartphone size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-200/80">
                                  <strong>iOS:</strong> Per ricevere notifiche su iPhone/iPad, aggiungi questa app alla schermata Home tramite il menu di condivisione di Safari.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Smart Notifications */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="text-amber-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Smart Reminder</h3>
                      </div>
                      <p className="text-slate-400 mb-6">
                        Configura reminder intelligenti per allenamenti, check-in e obiettivi.
                      </p>
                      <SmartNotificationSettings />
                    </div>

                    {/* Info Notifiche */}
                    <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <h4 className="text-lg font-semibold text-white mb-3">Cosa riceverai</h4>
                      <ul className="space-y-2 text-slate-400">
                        <li className="flex items-center gap-2">
                          <span className="text-xl">💬</span>
                          <span>Messaggi dal tuo coach</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-xl">📋</span>
                          <span>Nuove schede e programmi</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-xl">✅</span>
                          <span>Promemoria check settimanali</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-xl">📅</span>
                          <span>Appuntamenti e scadenze</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-xl">🔥</span>
                          <span>Alert streak e traguardi</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {/* TAB: Privacy */}
                {activeTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Header */}
                    <div className="hidden lg:block mb-8">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-emerald-400" size={28} />
                        Privacy e GDPR
                      </h2>
                      <p className="text-slate-400 mt-1">
                        Gestisci i tuoi dati personali in conformità con il GDPR
                      </p>
                    </div>

                    {/* Privacy e GDPR */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="text-emerald-400" size={24} />
                        <h3 className="text-xl font-bold text-white">I Tuoi Dati</h3>
                      </div>
                      <p className="text-slate-400 mb-6">
                        In conformità con il GDPR, hai diritto di accedere, esportare ed eliminare i tuoi dati personali.
                      </p>
                      <GDPRSettings />
                    </div>

                    {/* Info Diritti */}
                    <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                      <h4 className="text-lg font-semibold text-white mb-3">I Tuoi Diritti</h4>
                      <ul className="space-y-3 text-slate-400">
                        <li className="flex items-start gap-2">
                          <Download size={16} className="text-cyan-400 mt-1 flex-shrink-0" />
                          <span><strong className="text-slate-200">Esportazione:</strong> Scarica una copia completa dei tuoi dati in formato JSON</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Trash2 size={16} className="text-red-400 mt-1 flex-shrink-0" />
                          <span><strong className="text-slate-200">Eliminazione:</strong> Richiedi la cancellazione permanente del tuo account e dati</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Lock size={16} className="text-emerald-400 mt-1 flex-shrink-0" />
                          <span><strong className="text-slate-200">Protezione:</strong> I tuoi dati sono protetti e usati solo per i nostri servizi</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
