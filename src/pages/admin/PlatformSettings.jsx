import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Shield, Search, Lock, Unlock, Eye, Settings as SettingsIcon,
  MessageSquare, Calendar, FileText, Activity, BookOpen, Globe, Layers,
  Utensils, Dumbbell, Settings, Save, X, Check, Sliders, Video, Upload,
  Play, Trash2, AlertCircle
} from 'lucide-react';
import { db } from '../../firebase';
import { getDocs, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getTenantCollection, getTenantDoc } from '../../config/tenant';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

// Definizione completa funzionalità piattaforma
const PLATFORM_FEATURES = {
  pages: {
    label: 'Pagine Cliente',
    icon: Eye,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Activity, description: 'Panoramica e metriche principali' },
      { id: 'anamnesi', label: 'Anamnesi', icon: FileText, description: 'Questionario anamnesi e storico' },
      { id: 'checks', label: 'Check Periodici', icon: Activity, description: 'Aggiornamenti progressi settimanali/mensili' },
      { id: 'payments', label: 'Pagamenti', icon: FileText, description: 'Storico pagamenti e fatture' },
      { id: 'chat', label: 'Chat', icon: MessageSquare, description: 'Comunicazione diretta con il trainer' },
      { id: 'scheda-alimentazione', label: 'Scheda Alimentazione', icon: Utensils, description: 'Piano alimentare personalizzato' },
      { id: 'scheda-allenamento', label: 'Scheda Allenamento', icon: Dumbbell, description: 'Piano di allenamento' },
      { id: 'courses', label: 'Corsi', icon: BookOpen, description: 'Accesso ai corsi formativi' },
      { id: 'community', label: 'Community', icon: Users, description: 'Forum e interazione community' },
      { id: 'settings', label: 'Impostazioni', icon: Settings, description: 'Impostazioni account cliente' },
    ]
  },
  features: {
    label: 'Funzionalità Avanzate',
    icon: Sliders,
    items: [
      { id: 'food-swap', label: 'Sostituzione Alimenti', icon: Utensils, description: 'Permetti ai clienti di sostituire alimenti nella scheda alimentazione' },
      { id: 'pdf-export', label: 'Esportazione PDF', icon: FileText, description: 'Download schede in formato PDF' },
      { id: 'calendar-booking', label: 'Prenotazioni Calendario', icon: Calendar, description: 'Prenotazione appuntamenti diretta' },
      { id: 'progress-photos', label: 'Foto Progressi', icon: Activity, description: 'Upload e confronto foto progressi' },
      { id: 'custom-workouts', label: 'Allenamenti Personalizzati', icon: Dumbbell, description: 'Creazione allenamenti custom dal cliente' },
    ]
  }
};

const DEFAULT_PERMISSIONS = {
  access: true,
  pages: Object.fromEntries(PLATFORM_FEATURES.pages.items.map(item => [item.id, true])),
  features: Object.fromEntries(PLATFORM_FEATURES.features.items.map(item => [item.id, true]))
};

const DEFAULT_GLOBAL_SETTINGS = {
  allowSelfRegistration: true,
  autoApproveBookings: true,
  requirePaymentForAccess: false,
  welcomeVideo: {
    enabled: false,
    url: '',
    title: 'Benvenuto nella piattaforma!',
    description: 'Guarda questo video per iniziare',
    fileName: '',
    uploadedAt: null
  },
  disabledFeatures: {
    // PAGINE - Ogni pagina può essere disabilitata globalmente
    'dashboard': { disabled: false, message: '' },
    'anamnesi': { disabled: false, message: '' },
    'checks': { disabled: false, message: '' },
    'payments': { disabled: false, message: '' },
    'chat': { disabled: false, message: '' },
    'scheda-alimentazione': { disabled: false, message: '' },
    'scheda-allenamento': { disabled: false, message: '' },
    'courses': { disabled: false, message: '' },
    'community': { disabled: false, message: '' },
    'settings': { disabled: false, message: '' },
    
    // FUNZIONALITÀ AVANZATE
    'food-swap': { disabled: false, message: '' },
    'pdf-export': { disabled: false, message: '' },
    'calendar-booking': { disabled: false, message: '' },
    'progress-photos': { disabled: false, message: '' },
    'custom-workouts': { disabled: false, message: '' },
  }
};

export default function PlatformSettings() {
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [globalSettings, setGlobalSettings] = useState(DEFAULT_GLOBAL_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);
  const [featureMessage, setFeatureMessage] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const clientsRef = getTenantCollection(db, 'clients');
      const snapshot = await getDocs(clientsRef);
      
      const clientsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        permissions: doc.data().permissions || DEFAULT_PERMISSIONS
      }));

      setClients(clientsList.sort((a, b) => (a.name || '').localeCompare(b.name || '')));

      const settingsRef = getTenantDoc(db, 'platform_settings', 'global');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const loadedSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...settingsSnap.data() };
        // Merge disabledFeatures per assicurarsi che tutte le features esistano
        if (loadedSettings.disabledFeatures) {
          loadedSettings.disabledFeatures = {
            ...DEFAULT_GLOBAL_SETTINGS.disabledFeatures,
            ...loadedSettings.disabledFeatures
          };
        }
        setGlobalSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
      showNotification('Errore nel caricamento dei dati', 'error');
    }
    setLoading(false);
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setPermissions(client.permissions || DEFAULT_PERMISSIONS);
  };

  const handleToggleAccess = () => {
    setPermissions(prev => ({ ...prev, access: !prev.access }));
  };

  const handleTogglePage = (pageId) => {
    setPermissions(prev => ({
      ...prev,
      pages: { ...prev.pages, [pageId]: !prev.pages[pageId] }
    }));
  };

  const handleToggleFeature = (featureId) => {
    setPermissions(prev => ({
      ...prev,
      features: { ...prev.features, [featureId]: !prev.features[featureId] }
    }));
  };

  const handleEnableAll = () => {
    setPermissions({
      access: true,
      pages: Object.fromEntries(PLATFORM_FEATURES.pages.items.map(item => [item.id, true])),
      features: Object.fromEntries(PLATFORM_FEATURES.features.items.map(item => [item.id, true]))
    });
  };

  const handleDisableAll = () => {
    setPermissions({
      access: false,
      pages: Object.fromEntries(PLATFORM_FEATURES.pages.items.map(item => [item.id, false])),
      features: Object.fromEntries(PLATFORM_FEATURES.features.items.map(item => [item.id, false]))
    });
  };

  const handleSaveClientPermissions = async () => {
    if (!selectedClient) return;
    
    setSaving(true);
    try {
      const clientRef = getTenantDoc(db, 'clients', selectedClient.id);
      await updateDoc(clientRef, {
        permissions,
        updatedAt: new Date().toISOString()
      });

      setClients(prev => prev.map(c => 
        c.id === selectedClient.id ? { ...c, permissions } : c
      ));

      showNotification('Permessi salvati con successo', 'success');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      showNotification('Errore nel salvataggio', 'error');
    }
    setSaving(false);
  };

  const handleSaveGlobalSettings = async () => {
    setSaving(true);
    try {
      const settingsRef = getTenantDoc(db, 'platform_settings', 'global');
      await setDoc(settingsRef, {
        ...globalSettings,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showNotification('Impostazioni globali salvate', 'success');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      showNotification('Errore nel salvataggio', 'error');
    }
    setSaving(false);
  };

  const handleVideoFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verifica tipo file
    if (!file.type.startsWith('video/')) {
      showNotification('Seleziona un file video valido', 'error');
      return;
    }

    // Verifica dimensione (1GB = 1073741824 bytes)
    const maxSize = 1073741824;
    if (file.size > maxSize) {
      showNotification('Il file supera il limite di 1GB', 'error');
      return;
    }

    setVideoFile(file);
  };

  const handleUploadVideo = async () => {
    if (!videoFile) return;

    setUploadingVideo(true);
    setUploadProgress(0);

    try {
      const storage = getStorage();
      const timestamp = Date.now();
      const videoRef = ref(storage, `tenant_videos/welcome_${timestamp}_${videoFile.name}`);
      
      const uploadTask = uploadBytesResumable(videoRef, videoFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Errore upload:', error);
          showNotification('Errore durante il caricamento', 'error');
          setUploadingVideo(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Elimina il vecchio video se esiste
          if (globalSettings.welcomeVideo?.url) {
            try {
              const oldVideoRef = ref(storage, globalSettings.welcomeVideo.url);
              await deleteObject(oldVideoRef);
            } catch (error) {
              console.log('Vecchio video non trovato o già eliminato');
            }
          }

          // Salva il nuovo video
          const updatedSettings = {
            ...globalSettings,
            welcomeVideo: {
              ...globalSettings.welcomeVideo,
              url: downloadURL,
              fileName: videoFile.name,
              uploadedAt: new Date().toISOString()
            }
          };

          setGlobalSettings(updatedSettings);
          
          const settingsRef = getTenantDoc(db, 'platform_settings', 'global');
          await setDoc(settingsRef, {
            ...updatedSettings,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          showNotification('Video caricato con successo', 'success');
          setVideoFile(null);
          setUploadingVideo(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Errore:', error);
      showNotification('Errore durante il caricamento', 'error');
      setUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!globalSettings.welcomeVideo?.url) return;
    
    if (!confirm('Sei sicuro di voler eliminare il video di benvenuto?')) return;

    setSaving(true);
    try {
      const storage = getStorage();
      const videoRef = ref(storage, globalSettings.welcomeVideo.url);
      await deleteObject(videoRef);

      const updatedSettings = {
        ...globalSettings,
        welcomeVideo: {
          enabled: false,
          url: '',
          title: 'Benvenuto nella piattaforma!',
          description: 'Guarda questo video per iniziare',
          fileName: '',
          uploadedAt: null
        }
      };

      setGlobalSettings(updatedSettings);
      
      const settingsRef = getTenantDoc(db, 'platform_settings', 'global');
      await setDoc(settingsRef, {
        ...updatedSettings,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showNotification('Video eliminato con successo', 'success');
    } catch (error) {
      console.error('Errore eliminazione:', error);
      showNotification('Errore durante l\'eliminazione', 'error');
    }
    setSaving(false);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredClients = clients.filter(client =>
    (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-100 flex items-center gap-3 mb-2">
            <SettingsIcon className="text-blue-400" size={32} />
            Gestione Piattaforma
          </h1>
          <p className="text-slate-400 text-sm">
            Configura funzionalità, permessi e impostazioni della piattaforma
          </p>
        </div>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 p-4 rounded-xl border ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'clients'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <Users size={18} className="inline mr-2" />
            Permessi Clienti
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'global'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <Globe size={18} className="inline mr-2" />
            Impostazioni Globali
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'features'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={18} className="inline mr-2" />
            Funzionalità
          </button>
        </div>

        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Cerca cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedClient?.id === client.id
                        ? 'bg-blue-600/20 border-2 border-blue-500/50'
                        : 'bg-slate-900/30 border border-slate-700/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{client.name}</p>
                        <p className="text-xs text-slate-400 truncate">{client.email}</p>
                      </div>
                      <div>
                        {client.permissions?.access !== false ? (
                          <Unlock size={16} className="text-emerald-400" />
                        ) : (
                          <Lock size={16} className="text-red-400" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedClient ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                    <div>
                      <h2 className="text-xl font-bold text-slate-100">{selectedClient.name}</h2>
                      <p className="text-sm text-slate-400">{selectedClient.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X size={20} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {permissions?.access ? (
                          <Unlock className="text-emerald-400" size={24} />
                        ) : (
                          <Lock className="text-red-400" size={24} />
                        )}
                        <div>
                          <p className="font-semibold text-slate-100">Accesso all'App</p>
                          <p className="text-xs text-slate-400">
                            {permissions?.access ? 'Cliente può accedere' : 'Accesso revocato'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleAccess}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          permissions?.access
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {permissions?.access ? 'Attivo' : 'Bloccato'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={handleEnableAll}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      Abilita Tutto
                    </button>
                    <button
                      onClick={handleDisableAll}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Disabilita Tutto
                    </button>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
                      <Eye size={20} className="text-blue-400" />
                      {PLATFORM_FEATURES.pages.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PLATFORM_FEATURES.pages.items.map(page => {
                        const Icon = page.icon;
                        const isEnabled = permissions?.pages?.[page.id];
                        return (
                          <button
                            key={page.id}
                            onClick={() => handleTogglePage(page.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isEnabled
                                ? 'border-emerald-500/50 bg-emerald-500/10'
                                : 'border-slate-700/50 bg-slate-900/30'
                            }`}
                            title={page.description}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon size={16} className={isEnabled ? 'text-emerald-400' : 'text-slate-500'} />
                                <span className={`text-sm font-medium ${isEnabled ? 'text-slate-100' : 'text-slate-400'}`}>
                                  {page.label}
                                </span>
                              </div>
                              {isEnabled ? (
                                <Check size={16} className="text-emerald-400" />
                              ) : (
                                <X size={16} className="text-slate-500" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
                      <Sliders size={20} className="text-blue-400" />
                      {PLATFORM_FEATURES.features.label}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {PLATFORM_FEATURES.features.items.map(feature => {
                        const Icon = feature.icon;
                        const isEnabled = permissions?.features?.[feature.id];
                        return (
                          <button
                            key={feature.id}
                            onClick={() => handleToggleFeature(feature.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isEnabled
                                ? 'border-blue-500/50 bg-blue-500/10'
                                : 'border-slate-700/50 bg-slate-900/30'
                            }`}
                            title={feature.description}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Icon size={16} className={isEnabled ? 'text-blue-400' : 'text-slate-500'} />
                                <span className={`text-sm font-medium ${isEnabled ? 'text-slate-100' : 'text-slate-400'}`}>
                                  {feature.label}
                                </span>
                              </div>
                              {isEnabled ? (
                                <Check size={16} className="text-blue-400" />
                              ) : (
                                <X size={16} className="text-slate-500" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 ml-6">{feature.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveClientPermissions}
                    disabled={saving}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Salva Permessi
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
                  <Shield size={48} className="text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Seleziona un cliente per gestire i permessi</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Impostazioni Globali Piattaforma</h2>
            <p className="text-slate-400 text-sm mb-6">
              Queste impostazioni si applicano a tutti i clienti del tuo tenant
            </p>

            {/* Impostazioni Generali */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Impostazioni Generali</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-100">Registrazione Autonoma</p>
                    <p className="text-xs text-slate-400">Permetti ai clienti di registrarsi autonomamente</p>
                  </div>
                  <button
                    onClick={() => setGlobalSettings(prev => ({ ...prev, allowSelfRegistration: !prev.allowSelfRegistration }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      globalSettings.allowSelfRegistration
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {globalSettings.allowSelfRegistration ? 'Abilitato' : 'Disabilitato'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-100">Approvazione Automatica Prenotazioni</p>
                    <p className="text-xs text-slate-400">Approva automaticamente le prenotazioni dei clienti</p>
                  </div>
                  <button
                    onClick={() => setGlobalSettings(prev => ({ ...prev, autoApproveBookings: !prev.autoApproveBookings }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      globalSettings.autoApproveBookings
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {globalSettings.autoApproveBookings ? 'Abilitato' : 'Disabilitato'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-100">Richiedi Pagamento per Accesso</p>
                    <p className="text-xs text-slate-400">Blocca l'accesso ai clienti con pagamenti in sospeso</p>
                  </div>
                  <button
                    onClick={() => setGlobalSettings(prev => ({ ...prev, requirePaymentForAccess: !prev.requirePaymentForAccess }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      globalSettings.requirePaymentForAccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {globalSettings.requirePaymentForAccess ? 'Abilitato' : 'Disabilitato'}
                  </button>
                </div>
              </div>
            </div>

            {/* Video di Benvenuto */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Video di Benvenuto</h3>
              <p className="text-sm text-slate-400 mb-4">
                Carica un video personalizzato mostrato ai nuovi clienti al primo accesso (max 1GB)
              </p>

              <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                {/* Toggle Video Benvenuto */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Video className={globalSettings.welcomeVideo?.enabled ? 'text-blue-400' : 'text-slate-500'} size={24} />
                    <div>
                      <p className="font-medium text-slate-100">Mostra Video al Primo Accesso</p>
                      <p className="text-xs text-slate-400">
                        {globalSettings.welcomeVideo?.enabled ? 'Video attivo per nuovi clienti' : 'Nessun video impostato'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGlobalSettings(prev => ({
                      ...prev,
                      welcomeVideo: {
                        ...prev.welcomeVideo,
                        enabled: !prev.welcomeVideo?.enabled
                      }
                    }))}
                    disabled={!globalSettings.welcomeVideo?.url}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      globalSettings.welcomeVideo?.enabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {globalSettings.welcomeVideo?.enabled ? 'Attivo' : 'Disattivo'}
                  </button>
                </div>

                {/* Titolo e Descrizione */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Titolo Video</label>
                    <input
                      type="text"
                      value={globalSettings.welcomeVideo?.title || ''}
                      onChange={(e) => setGlobalSettings(prev => ({
                        ...prev,
                        welcomeVideo: {
                          ...prev.welcomeVideo,
                          title: e.target.value
                        }
                      }))}
                      placeholder="Benvenuto nella piattaforma!"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Descrizione</label>
                    <input
                      type="text"
                      value={globalSettings.welcomeVideo?.description || ''}
                      onChange={(e) => setGlobalSettings(prev => ({
                        ...prev,
                        welcomeVideo: {
                          ...prev.welcomeVideo,
                          description: e.target.value
                        }
                      }))}
                      placeholder="Guarda questo video per iniziare"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Video Corrente */}
                {globalSettings.welcomeVideo?.url && (
                  <div className="mb-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Play size={18} className="text-emerald-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-200">Video Caricato</p>
                          <p className="text-xs text-slate-400">{globalSettings.welcomeVideo.fileName}</p>
                          {globalSettings.welcomeVideo.uploadedAt && (
                            <p className="text-xs text-slate-500 mt-1">
                              Caricato il {new Date(globalSettings.welcomeVideo.uploadedAt).toLocaleString('it-IT')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={globalSettings.welcomeVideo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
                        >
                          <Play size={14} />
                          Anteprima
                        </a>
                        <button
                          onClick={handleDeleteVideo}
                          disabled={saving}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Elimina
                        </button>
                      </div>
                    </div>

                    {/* Preview Video */}
                    <video
                      src={globalSettings.welcomeVideo.url}
                      controls
                      className="w-full rounded-lg bg-black max-h-64"
                    />
                  </div>
                )}

                {/* Upload Nuovo Video */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileSelect}
                      disabled={uploadingVideo}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className={`flex-1 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        videoFile
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                      } ${uploadingVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Upload size={20} className={videoFile ? 'text-blue-400' : 'text-slate-400'} />
                        <div className="flex-1 min-w-0">
                          {videoFile ? (
                            <>
                              <p className="text-sm font-medium text-slate-200 truncate">{videoFile.name}</p>
                              <p className="text-xs text-slate-400">
                                {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-slate-300">
                                {globalSettings.welcomeVideo?.url ? 'Sostituisci video' : 'Seleziona video'}
                              </p>
                              <p className="text-xs text-slate-400">Max 1GB - MP4, MOV, AVI, ecc.</p>
                            </>
                          )}
                        </div>
                      </div>
                    </label>
                    
                    {videoFile && (
                      <button
                        onClick={handleUploadVideo}
                        disabled={uploadingVideo}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                      >
                        {uploadingVideo ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload size={18} />
                            Carica
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {uploadingVideo && (
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-300 mb-1">Suggerimenti per il video:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Durata consigliata: 2-5 minuti</li>
                        <li>Spiega le funzionalità principali della piattaforma</li>
                        <li>Mostra come navigare e utilizzare le sezioni</li>
                        <li>Formato consigliato: MP4 con codec H.264</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Limitazioni Funzionalità Globali */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Controllo Accessi Piattaforma</h3>
              <p className="text-sm text-slate-400 mb-4">
                Limita l'accesso a pagine e funzionalità per tutti i clienti con messaggi personalizzati
              </p>
              
              {/* Pagine */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Eye size={18} className="text-blue-400" />
                  Pagine Cliente
                </h4>
                <div className="space-y-3">
                  {PLATFORM_FEATURES.pages.items.map(page => {
                    const Icon = page.icon;
                    const isDisabled = globalSettings.disabledFeatures?.[page.id]?.disabled || false;
                    const message = globalSettings.disabledFeatures?.[page.id]?.message || '';
                    const isEditing = editingFeature === page.id;

                    return (
                      <div key={page.id} className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon size={18} className={isDisabled ? 'text-red-400' : 'text-emerald-400'} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-100">{page.label}</p>
                              <p className="text-xs text-slate-400 truncate">{page.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newDisabled = !isDisabled;
                              setGlobalSettings(prev => ({
                                ...prev,
                                disabledFeatures: {
                                  ...prev.disabledFeatures,
                                  [page.id]: {
                                    disabled: newDisabled,
                                    message: prev.disabledFeatures?.[page.id]?.message || ''
                                  }
                                }
                              }));
                              if (newDisabled && !message) {
                                setEditingFeature(page.id);
                                setFeatureMessage('');
                              }
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${
                              isDisabled
                                ? 'bg-red-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {isDisabled ? 'Bloccata' : 'Accessibile'}
                          </button>
                        </div>

                        {isDisabled && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            {isEditing ? (
                              <div className="space-y-2">
                                <label className="text-xs text-slate-400">Messaggio mostrato ai clienti:</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={featureMessage}
                                    onChange={(e) => setFeatureMessage(e.target.value)}
                                    placeholder="es: Sezione in aggiornamento"
                                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      setGlobalSettings(prev => ({
                                        ...prev,
                                        disabledFeatures: {
                                          ...prev.disabledFeatures,
                                          [page.id]: {
                                            disabled: true,
                                            message: featureMessage
                                          }
                                        }
                                      }));
                                      setEditingFeature(null);
                                      setFeatureMessage('');
                                    }}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingFeature(null);
                                      setFeatureMessage('');
                                    }}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <button
                                    onClick={() => setFeatureMessage('Sezione in manutenzione. Sarà disponibile a breve.')}
                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                  >
                                    In manutenzione
                                  </button>
                                  <button
                                    onClick={() => setFeatureMessage('Funzione disponibile solo per abbonamenti premium.')}
                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                  >
                                    Solo premium
                                  </button>
                                  <button
                                    onClick={() => setFeatureMessage('Sezione temporaneamente non disponibile.')}
                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                  >
                                    Non disponibile
                                  </button>
                                  <button
                                    onClick={() => setFeatureMessage('Contatta il tuo trainer per maggiori informazioni.')}
                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                  >
                                    Contatta trainer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-300 italic">
                                  "{message || 'Nessun messaggio impostato'}"
                                </p>
                                <button
                                  onClick={() => {
                                    setEditingFeature(page.id);
                                    setFeatureMessage(message);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                  Modifica
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Funzionalità Avanzate */}
              <div>
                <h4 className="text-md font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Sliders size={18} className="text-purple-400" />
                  Funzionalità Avanzate
                </h4>
                <div className="space-y-3">
                  {PLATFORM_FEATURES.features.items.map(feature => {
                    const Icon = feature.icon;
                    const isDisabled = globalSettings.disabledFeatures?.[feature.id]?.disabled || false;
                    const message = globalSettings.disabledFeatures?.[feature.id]?.message || '';
                    const isEditing = editingFeature === feature.id;

                    return (
                      <div key={feature.id} className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon size={18} className={isDisabled ? 'text-red-400' : 'text-purple-400'} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-100">{feature.label}</p>
                              <p className="text-xs text-slate-400 truncate">{feature.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newDisabled = !isDisabled;
                              setGlobalSettings(prev => ({
                                ...prev,
                                disabledFeatures: {
                                  ...prev.disabledFeatures,
                                  [feature.id]: {
                                    disabled: newDisabled,
                                    message: prev.disabledFeatures?.[feature.id]?.message || ''
                                  }
                                }
                              }));
                              if (newDisabled && !message) {
                                setEditingFeature(feature.id);
                                setFeatureMessage('');
                              }
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${
                              isDisabled
                                ? 'bg-red-600 text-white'
                                : 'bg-purple-600 text-white'
                            }`}
                          >
                            {isDisabled ? 'Disabilitata' : 'Abilitata'}
                          </button>
                        </div>

                        {isDisabled && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            {isEditing ? (
                              <div className="space-y-2">
                                <label className="text-xs text-slate-400">Messaggio mostrato ai clienti:</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={featureMessage}
                                    onChange={(e) => setFeatureMessage(e.target.value)}
                                    placeholder="es: Funzione temporaneamente non disponibile"
                                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      setGlobalSettings(prev => ({
                                        ...prev,
                                        disabledFeatures: {
                                          ...prev.disabledFeatures,
                                          [feature.id]: {
                                            disabled: true,
                                            message: featureMessage
                                          }
                                        }
                                      }));
                                      setEditingFeature(null);
                                      setFeatureMessage('');
                                    }}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingFeature(null);
                                      setFeatureMessage('');
                                    }}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <button
                                    onClick={() => setFeatureMessage('Funzione in manutenzione. Sarà disponibile a breve.')}
                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                  >
                                    In manutenzione
                                  </button>
                                  <button
                                    onClick={() => setFeatureMessage('Funzione disponibile solo per abbonamenti premium.')}
                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                  >
                                    Solo premium
                                  </button>
                                  <button
                                    onClick={() => setFeatureMessage('Funzione temporaneamente non disponibile.')}
                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                  >
                                    Non disponibile
                                  </button>
                                  <button
                                    onClick={() => setFeatureMessage('Contatta il tuo trainer per attivare questa funzione.')}
                                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                  >
                                    Contatta trainer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-300 italic">
                                  "{message || 'Nessun messaggio impostato'}"
                                </p>
                                <button
                                  onClick={() => {
                                    setEditingFeature(feature.id);
                                    setFeatureMessage(message);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                  Modifica
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveGlobalSettings}
              disabled={saving}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salva Impostazioni Globali
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Funzionalità Piattaforma</h2>
            <p className="text-slate-400 text-sm mb-6">
              Panoramica di tutte le funzionalità disponibili e loro descrizione
            </p>

            {Object.entries(PLATFORM_FEATURES).map(([key, category]) => {
              const CategoryIcon = category.icon;
              return (
                <div key={key} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <CategoryIcon size={20} className="text-blue-400" />
                    {category.label}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.items.map(item => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="p-4 bg-slate-900/50 border border-slate-700/30 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-600/20 rounded-lg flex-shrink-0">
                              <Icon size={18} className="text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-100 mb-1">{item.label}</p>
                              <p className="text-xs text-slate-400">{item.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
