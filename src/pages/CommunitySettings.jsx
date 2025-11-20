import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Settings, Video, Users, Award, Bell, Lock, Save, ChevronRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Pannello Impostazioni Community
 * Per Admin: gestione completa (video benvenuto, livelli, notifiche, ecc.)
 * Per Utente: opzioni limitate (notifiche, privacy)
 */

export default function CommunitySettings() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Settings state
  const [settings, setSettings] = useState({
    // Video benvenuto
    welcomeVideo: {
      enabled: true,
      url: '',
      title: 'Benvenuto in MentalFit',
      description: 'Guarda il video di benvenuto del coach',
    },
    // Onboarding
    onboarding: {
      requireProfilePhoto: true,
      requireWelcomePost: true,
      requireQuestionnaire: true,
      sendPrivateVoiceMessage: true,
      bookingWindowHours: 48,
    },
    // Livelli gamification
    levels: [
      { id: 1, name: 'Start', minLikes: 0, maxLikes: 1, color: 'slate', unlocks: [] },
      { id: 2, name: 'Intermedio', minLikes: 2, maxLikes: 15, color: 'blue', unlocks: ['Group Calls settimanali'] },
      { id: 3, name: 'Pro', minLikes: 16, maxLikes: 49, color: 'purple', unlocks: ['Sistema di Massimo Riposo'] },
      { id: 4, name: 'Elite', minLikes: 50, maxLikes: 99, color: 'orange', unlocks: ['Protocollo Anti-Stress'] },
      { id: 5, name: 'MentalFit', minLikes: 100, maxLikes: 999999, color: 'rose', unlocks: ['+1 mese in regalo', 'Bonus segreto'] },
    ],
    // Canali community
    channels: {
      vittorie: { enabled: true, name: 'Vittorie', requireApproval: false },
      domande: { enabled: true, name: 'Domande', requireApproval: false },
      consigli: { enabled: true, name: 'Consigli', requireApproval: false },
    },
    // Notifiche
    notifications: {
      newPost: true,
      newComment: true,
      newLike: true,
      levelUp: true,
      adminMessages: true,
    },
    // Moderazione
    moderation: {
      autoModeration: false,
      requireApprovalNewUsers: false,
      profanityFilter: true,
    },
  });

  const [expandedSections, setExpandedSections] = useState({
    video: true,
    onboarding: false,
    levels: false,
    channels: false,
    notifications: false,
    moderation: false,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Check if admin
        const roleDoc = await getDoc(doc(db, 'roles', 'superadmins'));
        const isUserAdmin = roleDoc.exists() && roleDoc.data().uids?.includes(user.uid);
        setIsAdmin(isUserAdmin);
        
        // Load settings
        await loadSettings();
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'community'));
      if (settingsDoc.exists()) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...settingsDoc.data(),
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'community'), settings, { merge: true });
      setMessage({ type: 'success', text: 'Impostazioni salvate con successo!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const SettingsSection = ({ title, icon: Icon, section, children }) => {
    const isExpanded = expandedSections[section];
    
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <button
          onClick={() => toggleSection(section)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="text-rose-400" size={20} />
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronDown className="text-slate-400" size={20} />
          ) : (
            <ChevronRight className="text-slate-400" size={20} />
          )}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-700"
            >
              <div className="p-4 space-y-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const ToggleSwitch = ({ label, description, checked, onChange, disabled = false }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-sm font-medium text-slate-200">{label}</label>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-rose-600' : 'bg-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-rose-400" size={32} />
            <h1 className="text-3xl font-bold text-slate-100">Impostazioni Community</h1>
          </div>
          <p className="text-slate-400">
            {isAdmin 
              ? 'Gestisci tutte le impostazioni della community e dell\'onboarding'
              : 'Personalizza le tue preferenze'
            }
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-emerald-900/40 border border-emerald-600/50 text-emerald-300'
              : 'bg-red-900/40 border border-red-600/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Video Benvenuto - Solo Admin */}
          {isAdmin && (
            <SettingsSection title="Video di Benvenuto" icon={Video} section="video">
              <ToggleSwitch
                label="Abilita video benvenuto"
                description="Mostra il video di benvenuto ai nuovi utenti"
                checked={settings.welcomeVideo.enabled}
                onChange={(val) => updateSetting('welcomeVideo.enabled', val)}
              />
              
              {settings.welcomeVideo.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">URL Video</label>
                    <input
                      type="url"
                      value={settings.welcomeVideo.url}
                      onChange={(e) => updateSetting('welcomeVideo.url', e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Titolo</label>
                    <input
                      type="text"
                      value={settings.welcomeVideo.title}
                      onChange={(e) => updateSetting('welcomeVideo.title', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Descrizione</label>
                    <textarea
                      value={settings.welcomeVideo.description}
                      onChange={(e) => updateSetting('welcomeVideo.description', e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </>
              )}
            </SettingsSection>
          )}

          {/* Onboarding - Solo Admin */}
          {isAdmin && (
            <SettingsSection title="Onboarding" icon={Users} section="onboarding">
              <ToggleSwitch
                label="Richiedi foto profilo"
                description="L'utente deve caricare una foto profilo"
                checked={settings.onboarding.requireProfilePhoto}
                onChange={(val) => updateSetting('onboarding.requireProfilePhoto', val)}
              />
              
              <ToggleSwitch
                label="Richiedi post di benvenuto"
                description="L'utente deve presentarsi nella community"
                checked={settings.onboarding.requireWelcomePost}
                onChange={(val) => updateSetting('onboarding.requireWelcomePost', val)}
              />
              
              <ToggleSwitch
                label="Richiedi questionario"
                description="L'utente deve compilare il questionario iniziale"
                checked={settings.onboarding.requireQuestionnaire}
                onChange={(val) => updateSetting('onboarding.requireQuestionnaire', val)}
              />
              
              <ToggleSwitch
                label="Messaggio vocale privato"
                description="Invia notifica al coach per mandare messaggio vocale personalizzato"
                checked={settings.onboarding.sendPrivateVoiceMessage}
                onChange={(val) => updateSetting('onboarding.sendPrivateVoiceMessage', val)}
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Finestra prenotazione primo appuntamento (ore)
                </label>
                <input
                  type="number"
                  value={settings.onboarding.bookingWindowHours}
                  onChange={(e) => updateSetting('onboarding.bookingWindowHours', parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Timer entro cui deve essere consegnato il programma dopo la prima chiamata
                </p>
              </div>
            </SettingsSection>
          )}

          {/* Livelli - Solo Admin */}
          {isAdmin && (
            <SettingsSection title="Sistema Livelli" icon={Award} section="levels">
              <p className="text-sm text-slate-400 mb-4">
                Gestisci i livelli di gamificazione e i premi sbloccabili
              </p>
              
              {settings.levels.map((level, index) => (
                <div key={level.id} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-slate-800 border-2 border-${level.color}-500 flex items-center justify-center font-bold text-${level.color}-400`}>
                        {level.id}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={level.name}
                          onChange={(e) => {
                            const newLevels = [...settings.levels];
                            newLevels[index].name = e.target.value;
                            updateSetting('levels', newLevels);
                          }}
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <input
                        type="number"
                        value={level.minLikes}
                        onChange={(e) => {
                          const newLevels = [...settings.levels];
                          newLevels[index].minLikes = parseInt(e.target.value);
                          updateSetting('levels', newLevels);
                        }}
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        value={level.maxLikes}
                        onChange={(e) => {
                          const newLevels = [...settings.levels];
                          newLevels[index].maxLikes = parseInt(e.target.value);
                          updateSetting('levels', newLevels);
                        }}
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      />
                      <span>likes</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    <strong>Sblocca:</strong> {level.unlocks.join(', ') || 'Nessun bonus'}
                  </div>
                </div>
              ))}
            </SettingsSection>
          )}

          {/* Notifiche - Tutti */}
          <SettingsSection title="Notifiche" icon={Bell} section="notifications">
            <ToggleSwitch
              label="Nuovi post"
              description="Ricevi notifiche per nuovi post nella community"
              checked={settings.notifications.newPost}
              onChange={(val) => updateSetting('notifications.newPost', val)}
            />
            
            <ToggleSwitch
              label="Nuovi commenti"
              description="Ricevi notifiche per commenti ai tuoi post"
              checked={settings.notifications.newComment}
              onChange={(val) => updateSetting('notifications.newComment', val)}
            />
            
            <ToggleSwitch
              label="Nuovi like"
              description="Ricevi notifiche quando qualcuno mette like ai tuoi contenuti"
              checked={settings.notifications.newLike}
              onChange={(val) => updateSetting('notifications.newLike', val)}
            />
            
            <ToggleSwitch
              label="Passaggio livello"
              description="Ricevi notifiche quando passi di livello"
              checked={settings.notifications.levelUp}
              onChange={(val) => updateSetting('notifications.levelUp', val)}
            />
            
            <ToggleSwitch
              label="Messaggi dal coach"
              description="Ricevi notifiche per messaggi privati dal coach"
              checked={settings.notifications.adminMessages}
              onChange={(val) => updateSetting('notifications.adminMessages', val)}
            />
          </SettingsSection>

          {/* Moderazione - Solo Admin */}
          {isAdmin && (
            <SettingsSection title="Moderazione" icon={Lock} section="moderation">
              <ToggleSwitch
                label="Auto-moderazione"
                description="Filtra automaticamente contenuti inappropriati"
                checked={settings.moderation.autoModeration}
                onChange={(val) => updateSetting('moderation.autoModeration', val)}
              />
              
              <ToggleSwitch
                label="Approva nuovi utenti"
                description="I post dei nuovi utenti richiedono approvazione"
                checked={settings.moderation.requireApprovalNewUsers}
                onChange={(val) => updateSetting('moderation.requireApprovalNewUsers', val)}
              />
              
              <ToggleSwitch
                label="Filtro parolacce"
                description="Censura automaticamente linguaggio inappropriato"
                checked={settings.moderation.profanityFilter}
                onChange={(val) => updateSetting('moderation.profanityFilter', val)}
              />
            </SettingsSection>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 sticky bottom-4">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold transition-colors shadow-lg"
          >
            <Save size={20} />
            {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </button>
        </div>
      </div>
    </div>
  );
}
