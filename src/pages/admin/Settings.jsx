// src/pages/admin/Settings.jsx
// Pagina Impostazioni completa stile HubFit con tabs
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebOnlyBanner } from '../../components/subscription/WebOnlyNotice';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { uploadToR2 } from '../../cloudflareStorage';
import { useTenantBranding } from '../../hooks/useTenantBranding';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { 
  User, Camera, Mail, Lock, Bell, AlertTriangle, Palette,
  ArrowLeft, Save, Trash2, Eye, EyeOff, Check, Globe, Scale, Ruler, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VAPID_KEY = 'BPBjZH1KnB4fCdqy5VobaJvb_mC5UTPKxodeIhyhl6PrRBZ1r6bd6nFqoloeDXSXKb4uffOVSupUGHQ4Q0l9Ato';

// ============ TABS ============
const TABS = {
  PROFILE: 'profile',
  BRANDING: 'branding',
  NOTIFICATIONS: 'notifications',
  PASSWORD: 'password',
  DANGER: 'danger'
};

// ============ TAB BUTTON ============
const TabButton = ({ active, icon: Icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap
      ${active 
        ? danger 
          ? 'text-rose-400 border-b-2 border-rose-400' 
          : 'text-blue-400 border-b-2 border-blue-400'
        : danger
          ? 'text-rose-400/60 hover:text-rose-400'
          : 'text-slate-400 hover:text-white'
      }
    `}
  >
    <Icon size={16} />
    {label}
  </button>
);

// ============ MAIN COMPONENT ============
export default function Settings() {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const currentUser = auth.currentUser;
  const { branding, updateBranding, loading: brandingLoading } = useTenantBranding();
  
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    displayName: '',
    email: currentUser?.email || '',
    photoURL: '',
    phone: '',
    timezone: 'Europe/Rome',
    country: 'IT',
    weightUnit: 'kg',
    lengthUnit: 'cm'
  });
  const [previewImage, setPreviewImage] = useState(null);
  
  // Branding state
  const [brandingForm, setBrandingForm] = useState({
    appName: '',
    tagline: '',
    primaryColor: '#3B82F6',
    logoURL: ''
  });
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Password state
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
  
  // Notifications state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    newClient: true,
    newLead: true,
    newEvent: true,
    newAnamnesi: true,
    newCheck: true,
    callRequest: true,
    payments: true,
    expiring: true,
    message: true
  });

  // Load profile
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [currentUser, navigate]);

  // Sync branding form when branding loads
  useEffect(() => {
    if (branding) {
      setBrandingForm({
        appName: branding.appName || '',
        tagline: branding.tagline || '',
        primaryColor: branding.primaryColor || '#3B82F6',
        logoURL: branding.logoURL || ''
      });
      setLogoPreview(branding.logoURL);
    }
  }, [branding]);

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(getTenantDoc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile({
          displayName: data.displayName || currentUser.displayName || '',
          email: data.email || currentUser.email || '',
          photoURL: data.photoURL || currentUser.photoURL || '',
          phone: data.phone || '',
          timezone: data.timezone || 'Europe/Rome',
          country: data.country || 'IT',
          weightUnit: data.weightUnit || 'kg',
          lengthUnit: data.lengthUnit || 'cm'
        });
        setPreviewImage(data.photoURL || currentUser.photoURL);
        
        // Load notification preferences
        if (data.notifications) {
          setNotifications(prev => ({ ...prev, ...data.notifications }));
        }
      } else {
        setProfile(prev => ({
          ...prev,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || ''
        }));
        setPreviewImage(currentUser.photoURL);
      }
    } catch (error) {
      console.error('Errore caricamento profilo:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ PROFILE HANDLERS ============
  const handleImageChange = async (e, type = 'profile') => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Per favore seleziona un\'immagine valida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('L\'immagine deve essere inferiore a 5MB');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'profile') {
          setPreviewImage(reader.result);
        } else {
          setLogoPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);

      const folder = type === 'profile' ? 'profile-photos' : 'branding';
      const photoURL = await uploadToR2(file, currentUser.uid, folder, null, true);

      if (type === 'profile') {
        setProfile(prev => ({ ...prev, photoURL }));
      } else {
        setBrandingForm(prev => ({ ...prev, logoURL: photoURL }));
      }
    } catch (error) {
      console.error('Errore upload:', error);
      toast.error('Errore durante il caricamento: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile.displayName.trim()) {
      toast.warning('Il nome è obbligatorio');
      return;
    }

    setSaving(true);
    try {
      const userRef = getTenantDoc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        uid: currentUser.uid,
        displayName: profile.displayName.trim(),
        email: profile.email,
        photoURL: profile.photoURL || '',
        phone: profile.phone || '',
        timezone: profile.timezone,
        country: profile.country,
        weightUnit: profile.weightUnit,
        lengthUnit: profile.lengthUnit,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast.success('Profilo salvato con successo!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // ============ BRANDING HANDLERS ============
  const saveBranding = async () => {
    setSaving(true);
    try {
      await updateBranding(brandingForm);
      toast.success('Branding salvato con successo!');
    } catch (error) {
      console.error('Errore salvataggio branding:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // ============ PASSWORD HANDLERS ============
  const changePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.warning('Compila tutti i campi');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.warning('Le password non coincidono');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.warning('La password deve essere di almeno 6 caratteri');
      return;
    }

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.oldPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);
      
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password cambiata con successo!');
    } catch (error) {
      console.error('Errore cambio password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Password attuale non corretta');
      } else {
        toast.error('Errore: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // ============ NOTIFICATIONS HANDLERS ============
  const [enablingPush, setEnablingPush] = useState(false);
  const [pushStatus, setPushStatus] = useState(null); // 'granted' | 'denied' | 'default'

  // Check permessi push all'avvio
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPushStatus(Notification.permission);
    }
  }, []);

  // Toggle notifiche push con richiesta permessi browser
  const handleTogglePush = async () => {
    // Se le notifiche sono già attive, disattivale solo localmente
    if (notifications.push) {
      setNotifications(n => ({ ...n, push: false }));
      // Disabilita in Firestore ma non elimina il token
      try {
        const tokenRef = getTenantDoc(db, 'fcmTokens', currentUser.uid);
        await setDoc(tokenRef, { enabled: false }, { merge: true });
      } catch (e) {
        console.error('Errore disabilitazione token:', e);
      }
      return;
    }

    // Altrimenti, richiedi i permessi del browser
    setEnablingPush(true);
    try {
      // Verifica supporto
      if (typeof Notification === 'undefined') {
        toast.warning('Il tuo browser non supporta le notifiche push');
        return;
      }

      // Richiedi permesso
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission === 'granted') {
        // Ottieni token FCM
        const messaging = getMessaging();
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
          // Salva token in Firestore
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

          const tokenRef = getTenantDoc(db, 'fcmTokens', currentUser.uid);
          const existingDoc = await getDoc(tokenRef);

          if (existingDoc.exists()) {
            await updateDoc(tokenRef, {
              token: token,
              updatedAt: serverTimestamp(),
              platform: isIOS ? 'ios' : 'android/web',
              isPWA: isPWA,
              enabled: true
            });
          } else {
            await setDoc(tokenRef, {
              userId: currentUser.uid,
              token: token,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              platform: isIOS ? 'ios' : 'android/web',
              isPWA: isPWA,
              enabled: true
            });
          }

          setNotifications(n => ({ ...n, push: true }));
          console.log('[FCM] Token salvato:', token.substring(0, 30) + '...');
        } else {
          toast.warning('Non è stato possibile ottenere il token. Prova a ricaricare la pagina.');
        }
      } else if (permission === 'denied') {
        toast.warning('Hai negato i permessi per le notifiche. Puoi cambiarli dalle impostazioni del browser.');
      }
    } catch (error) {
      console.error('Errore attivazione push:', error);
      toast.error('Errore durante l\'attivazione delle notifiche: ' + error.message);
    } finally {
      setEnablingPush(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      const userRef = getTenantDoc(db, 'users', currentUser.uid);
      await setDoc(userRef, { notifications }, { merge: true });
      toast.success('Preferenze notifiche salvate!');
    } catch (error) {
      console.error('Errore salvataggio notifiche:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // ============ DELETE ACCOUNT ============
  const initiateDeleteAccount = async () => {
    const confirmed = await confirmDelete(
      'il tuo account\n\n' +
      'Questa azione è IRREVERSIBILE e cancellerà:\n' +
      '• Tutti i tuoi dati\n' +
      '• Informazioni clienti\n' +
      '• Programmi di allenamento\n' +
      '• Storico pagamenti'
    );

    if (confirmed) {
      setShowDeleteModal(true);
    }
  };

  const executeDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Inserisci la password');
      return;
    }

    setDeleting(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Delete user document
      await deleteDoc(getTenantDoc(db, 'users', currentUser.uid));
      
      // Delete auth user
      await deleteUser(currentUser);
      
      navigate('/login');
    } catch (error) {
      console.error('Errore eliminazione account:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Password non corretta');
      } else {
        toast.error('Errore: ' + error.message);
      }
    } finally {
      setDeleting(false);
      setDeletePassword('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Impostazioni</h1>
        </div>

        {/* Web Only Banner per pagamenti */}
        <WebOnlyBanner
          title="Gestione Abbonamento"
          message="Per gestire il tuo abbonamento, fatture e metodi di pagamento, accedi dal browser web."
          className="mb-6"
        />

        {/* Tabs */}
        <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 overflow-hidden">
        <div className="flex items-center gap-1 border-b border-slate-700/30 overflow-x-auto scrollbar-hide">
          <TabButton 
            active={activeTab === TABS.PROFILE} 
            icon={User} 
            label="Profilo" 
            onClick={() => setActiveTab(TABS.PROFILE)} 
          />
          <TabButton 
            active={activeTab === TABS.BRANDING} 
            icon={Palette} 
            label="Branding" 
            onClick={() => setActiveTab(TABS.BRANDING)} 
          />
          <TabButton 
            active={activeTab === TABS.NOTIFICATIONS} 
            icon={Bell} 
            label="Notifiche" 
            onClick={() => setActiveTab(TABS.NOTIFICATIONS)} 
          />
          <TabButton 
            active={activeTab === TABS.PASSWORD} 
            icon={Lock} 
            label="Password" 
            onClick={() => setActiveTab(TABS.PASSWORD)} 
          />
          <TabButton 
            active={activeTab === TABS.DANGER} 
            icon={AlertTriangle} 
            label="Danger" 
            onClick={() => setActiveTab(TABS.DANGER)} 
            danger
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* ============ PROFILE TAB ============ */}
            {activeTab === TABS.PROFILE && (
              <div className="p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {previewImage ? (
                        <img src={previewImage} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-slate-600" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                          {profile.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <label className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-sm text-white cursor-pointer transition-colors flex items-center gap-2">
                      <Camera size={16} />
                      Cambia Foto
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} className="hidden" />
                    </label>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nome</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={profile.displayName}
                        onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
                        className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                        placeholder="Il tuo nome"
                      />
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-sm text-slate-300 transition-colors disabled:opacity-50"
                      >
                        Aggiorna
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                      <Mail size={14} />
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-white">{profile.email}</p>
                      <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-sm text-slate-300 transition-colors">
                        Cambia Email
                      </button>
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                      <Globe size={14} />
                      Fuso Orario
                    </label>
                    <select
                      value={profile.timezone}
                      onChange={(e) => setProfile(p => ({ ...p, timezone: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="Europe/Rome">(GMT +01:00) Europe/Rome</option>
                      <option value="Europe/London">(GMT +00:00) Europe/London</option>
                      <option value="America/New_York">(GMT -05:00) America/New_York</option>
                      <option value="America/Los_Angeles">(GMT -08:00) America/Los_Angeles</option>
                    </select>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Paese</label>
                    <select
                      value={profile.country}
                      onChange={(e) => setProfile(p => ({ ...p, country: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="IT">🇮🇹 Italy</option>
                      <option value="US">🇺🇸 United States</option>
                      <option value="GB">🇬🇧 United Kingdom</option>
                      <option value="DE">🇩🇪 Germany</option>
                      <option value="FR">🇫🇷 France</option>
                      <option value="ES">🇪🇸 Spain</option>
                    </select>
                  </div>

                  {/* Units */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                        <Scale size={14} />
                        Unità Peso
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-slate-700/30">
                        <button
                          onClick={() => setProfile(p => ({ ...p, weightUnit: 'kg' }))}
                          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                            profile.weightUnit === 'kg' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
                          }`}
                        >
                          Metric (kg)
                        </button>
                        <button
                          onClick={() => setProfile(p => ({ ...p, weightUnit: 'lb' }))}
                          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                            profile.weightUnit === 'lb' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
                          }`}
                        >
                          US/Imperial (lb)
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                        <Ruler size={14} />
                        Unità Lunghezza
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-slate-700/30">
                        <button
                          onClick={() => setProfile(p => ({ ...p, lengthUnit: 'cm' }))}
                          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                            profile.lengthUnit === 'cm' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
                          }`}
                        >
                          Metric (cm)
                        </button>
                        <button
                          onClick={() => setProfile(p => ({ ...p, lengthUnit: 'inch' }))}
                          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                            profile.lengthUnit === 'inch' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
                          }`}
                        >
                          US/Imperial (inch)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Salva Modifiche
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ============ BRANDING TAB ============ */}
            {activeTab === TABS.BRANDING && (
              <div className="grid lg:grid-cols-2 gap-4 p-4 sm:p-6">
                {/* Form */}
                <div className="bg-slate-700/20 backdrop-blur-sm rounded-2xl border border-slate-600/30 p-4 sm:p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Palette size={18} className="text-blue-400" />
                    Elementi
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">Personalizza il brand con il tuo stile unico.</p>
                  
                  <div className="space-y-5">
                    {/* Logo */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Icona</label>
                      <div className="flex items-center gap-4">
                        {logoPreview ? (
                          <img src={logoPreview} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-600" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                            {brandingForm.appName?.charAt(0) || 'P'}
                          </div>
                        )}
                        <label className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-sm text-white cursor-pointer transition-colors">
                          Cambia
                          <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* App Name */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Nome</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={brandingForm.appName}
                          onChange={(e) => setBrandingForm(f => ({ ...f, appName: e.target.value.slice(0, 25) }))}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                          placeholder="Nome app"
                          maxLength={25}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                          {brandingForm.appName.length} / 25
                        </span>
                      </div>
                    </div>

                    {/* Tagline */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Headline</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={brandingForm.tagline}
                          onChange={(e) => setBrandingForm(f => ({ ...f, tagline: e.target.value.slice(0, 35) }))}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                          placeholder="Slogan"
                          maxLength={35}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                          {brandingForm.tagline.length} / 35
                        </span>
                      </div>
                    </div>

                    {/* Theme Color */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Tema</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={brandingForm.primaryColor}
                          onChange={(e) => setBrandingForm(f => ({ ...f, primaryColor: e.target.value }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={brandingForm.primaryColor.toUpperCase()}
                          onChange={(e) => setBrandingForm(f => ({ ...f, primaryColor: e.target.value }))}
                          className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white focus:outline-none focus:border-blue-500/50 font-mono"
                        />
                      </div>
                    </div>

                    {/* Save */}
                    <button
                      onClick={saveBranding}
                      disabled={saving}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Salvataggio...' : 'Salva modifiche'}
                    </button>

                    <button className="w-full text-center text-sm text-slate-500 hover:text-slate-400 transition-colors">
                      ripristina ai valori predefiniti
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-700/20 backdrop-blur-sm rounded-2xl border border-slate-600/30 p-4 sm:p-5">
                  <h3 className="font-semibold text-white mb-4">Anteprima</h3>
                  <p className="text-sm text-slate-400 mb-6">Vedi come appare il brand ai tuoi clienti.</p>
                  
                  {/* Mock Phone */}
                  <div className="max-w-[280px] mx-auto">
                    <div 
                      className="rounded-[2rem] p-4 border-4 border-slate-700"
                      style={{ background: `linear-gradient(135deg, ${brandingForm.primaryColor}20, ${brandingForm.primaryColor}05)` }}
                    >
                      {/* Status bar mock */}
                      <div className="flex justify-between items-center mb-4 px-2">
                        <div className="flex items-center gap-2">
                          {logoPreview ? (
                            <img src={logoPreview} alt="" className="w-6 h-6 rounded" />
                          ) : (
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: brandingForm.primaryColor }}
                            >
                              {brandingForm.appName?.charAt(0) || 'P'}
                            </div>
                          )}
                          <span className="text-white font-medium text-sm">{brandingForm.appName || 'App Name'}</span>
                        </div>
                        <div className="flex gap-1">
                          <Bell size={14} className="text-slate-400" />
                        </div>
                      </div>
                      
                      {/* Content mock */}
                      <div className="bg-slate-900/80 rounded-2xl p-4">
                        <p className="text-white text-sm mb-1">Ciao Cliente,</p>
                        <p className="text-slate-400 text-xs">{brandingForm.tagline || 'La tua app di fitness'}</p>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: brandingForm.primaryColor + '40' }} />
                            <div className="flex-1">
                              <div className="h-2 bg-slate-700 rounded w-20" />
                              <div className="h-1.5 bg-slate-800 rounded w-12 mt-1" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: brandingForm.primaryColor + '40' }} />
                            <div className="flex-1">
                              <div className="h-2 bg-slate-700 rounded w-24" />
                              <div className="h-1.5 bg-slate-800 rounded w-16 mt-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============ NOTIFICATIONS TAB ============ */}
            {activeTab === TABS.NOTIFICATIONS && (
              <div className="p-4 sm:p-6">
                <h3 className="font-semibold text-white mb-2">Preferenze Notifiche</h3>
                <p className="text-sm text-slate-400 mb-6">Scegli quali notifiche vuoi ricevere.</p>
                
                {/* Sezione Generale */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Bell size={14} className="text-blue-400" />
                    Generale
                  </h4>
                  <div className="space-y-3">
                    {/* Toggle Notifiche Push - con richiesta permessi browser */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔔</span>
                        <div>
                          <p className="text-white font-medium">Notifiche Push</p>
                          <p className="text-xs text-slate-500">
                            {pushStatus === 'denied' 
                              ? '⚠️ Bloccate dal browser - Abilita dalle impostazioni' 
                              : 'Notifiche sul browser/dispositivo'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleTogglePush}
                        disabled={enablingPush || pushStatus === 'denied'}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          notifications.push ? 'bg-blue-500' : 'bg-slate-700'
                        } ${(enablingPush || pushStatus === 'denied') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {enablingPush ? (
                          <Loader2 size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-spin" />
                        ) : (
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            notifications.push ? 'right-1' : 'left-1'
                          }`} />
                        )}
                      </button>
                    </div>
                    
                    {/* Toggle Email */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📧</span>
                        <div>
                          <p className="text-white font-medium">Notifiche Email</p>
                          <p className="text-xs text-slate-500">Ricevi aggiornamenti via email</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications(n => ({ ...n, email: !n.email }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          notifications.email ? 'bg-blue-500' : 'bg-slate-700'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          notifications.email ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sezione Lead & Clienti */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <User size={14} className="text-emerald-400" />
                    Lead & Clienti
                  </h4>
                  <div className="space-y-3">
                    {[
                      { key: 'newLead', label: 'Nuovo Lead', desc: 'Quando arriva un nuovo lead da landing page', icon: '🎯' },
                      { key: 'newClient', label: 'Nuovo Cliente', desc: 'Quando un cliente si registra', icon: '👤' },
                      { key: 'callRequest', label: 'Richiesta Chiamata', desc: 'Quando un cliente richiede una chiamata', icon: '📞' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <p className="text-white font-medium">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            notifications[item.key] ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            notifications[item.key] ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sezione Attività */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Check size={14} className="text-cyan-400" />
                    Attività & Documenti
                  </h4>
                  <div className="space-y-3">
                    {[
                      { key: 'newEvent', label: 'Nuovo Evento', desc: 'Eventi calendario e appuntamenti', icon: '📅' },
                      { key: 'newAnamnesi', label: 'Nuova Anamnesi', desc: 'Quando un cliente compila l\'anamnesi', icon: '📋' },
                      { key: 'newCheck', label: 'Nuovo Check', desc: 'Quando un cliente invia un check', icon: '✅' },
                      { key: 'message', label: 'Messaggi Chat', desc: 'Nuovi messaggi nella chat', icon: '💬' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <p className="text-white font-medium">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            notifications[item.key] ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            notifications[item.key] ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sezione Pagamenti */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400" />
                    Pagamenti & Scadenze
                  </h4>
                  <div className="space-y-3">
                    {[
                      { key: 'payments', label: 'Pagamenti', desc: 'Notifiche sui pagamenti ricevuti', icon: '💰' },
                      { key: 'expiring', label: 'Scadenze', desc: 'Abbonamenti in scadenza', icon: '⚠️' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <p className="text-white font-medium">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            notifications[item.key] ? 'bg-amber-500' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            notifications[item.key] ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={saveNotifications}
                  disabled={saving}
                  className="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      Salva Preferenze
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ============ PASSWORD TAB ============ */}
            {activeTab === TABS.PASSWORD && (
              <div className="p-4 sm:p-6 max-w-md">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Lock size={18} />
                  Cambia Password
                </h3>
                <p className="text-sm text-slate-400 mb-6">Aggiorna la password del tuo account.</p>
                
                <div className="space-y-4">
                  {/* Old Password */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Password Attuale</label>
                    <div className="relative">
                      <input
                        type={showPasswords.old ? 'text' : 'password'}
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm(f => ({ ...f, oldPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(s => ({ ...s, old: !s.old }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nuova Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(s => ({ ...s, new: !s.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Conferma Nuova Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={changePassword}
                    disabled={saving}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Aggiornamento...' : 'Cambia Password'}
                  </button>
                </div>
              </div>
            )}

            {/* ============ DANGER TAB ============ */}
            {activeTab === TABS.DANGER && (
              <div className="p-4 sm:p-6 max-w-md">
                <div className="bg-slate-900/30 rounded-xl border border-slate-700/30 p-4 sm:p-5">
                  <h3 className="font-semibold text-white mb-2">Elimina Account</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Il tuo account e tutti i dati associati verranno programmati per l'eliminazione.
                  </p>
                  
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-amber-400">Attenzione</p>
                        <p className="text-sm text-slate-300 mt-1">
                          Eliminando il tuo account verranno rimossi tutti i tuoi dati, incluse le informazioni sui clienti, i programmi di allenamento e lo storico pagamenti.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={initiateDeleteAccount}
                    className="w-full py-3 bg-transparent border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Elimina Account
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>

      {/* Delete Account Password Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !deleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <Lock className="text-rose-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white">Conferma Password</h3>
              </div>
              
              <p className="text-slate-300 text-sm mb-4">
                Per completare l'eliminazione del tuo account, inserisci la tua password:
              </p>

              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="La tua password"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && executeDeleteAccount()}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  disabled={deleting}
                  className="flex-1 py-3 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={executeDeleteAccount}
                  disabled={deleting || !deletePassword}
                  className="flex-1 py-3 bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Elimina
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
