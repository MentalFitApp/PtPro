// src/pages/tenant/IntegrationsHub.jsx
// Pagina centralizzata per gestire tutte le integrazioni del trainer
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebOnlyBanner } from '../../components/subscription/WebOnlyNotice';
import {
  MessageCircle, Instagram, Calendar, Mail, CreditCard, Video,
  CheckCircle, XCircle, AlertCircle, Settings, ExternalLink,
  RefreshCw, Link2, Unlink, ChevronRight, Zap, Bell, Users,
  FileText, Clock, Send, Edit3, Plus, Trash2, Save, X,
  Smartphone, Globe, Shield, Sparkles
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OAuthButton from '../../components/integrations/OAuthButton';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

// === INTEGRATION CONFIGS ===
const INTEGRATIONS = {
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Invia messaggi automatici ai clienti per scadenze, promemoria e comunicazioni',
    icon: MessageCircle,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    features: [
      'Messaggi automatici scadenza abbonamento',
      'Promemoria appuntamenti',
      'Auguri di compleanno',
      'Template personalizzabili'
    ],
    hasOAuth: true,
    oauthProvider: 'whatsapp'
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    description: 'Collega il tuo profilo Instagram Business per analytics e gestione',
    icon: Instagram,
    color: 'from-pink-500 via-purple-500 to-orange-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-400',
    features: [
      'Analytics follower e engagement',
      'Gestione post e stories',
      'Insights dettagliati',
      'Messaggi diretti'
    ],
    hasOAuth: true,
    oauthProvider: 'instagram',
    hubRoute: '/instagram'
  },
  google_calendar: {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sincronizza appuntamenti e sessioni con Google Calendar',
    icon: Calendar,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    features: [
      'Sync bidirezionale eventi',
      'Notifiche automatiche',
      'Gestione disponibilità',
      'Integrazione Booking'
    ],
    hasOAuth: true,
    oauthProvider: 'google',
    hubRoute: '/calendar'
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    description: 'Gestisci pagamenti, abbonamenti e fatturazione',
    icon: CreditCard,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    features: [
      'Pagamenti online',
      'Abbonamenti ricorrenti',
      'Fatturazione automatica',
      'Report finanziari'
    ],
    hasOAuth: true,
    oauthProvider: 'stripe'
  },
  zoom: {
    id: 'zoom',
    name: 'Zoom',
    description: 'Crea meeting automatici per sessioni online',
    icon: Video,
    color: 'from-blue-600 to-blue-700',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-600/30',
    textColor: 'text-blue-400',
    features: [
      'Meeting automatici',
      'Link personalizzati',
      'Registrazione sessioni',
      'Waiting room'
    ],
    hasOAuth: true,
    oauthProvider: 'zoom'
  },
  email: {
    id: 'email',
    name: 'Email Marketing',
    description: 'Invia email automatiche e newsletter ai clienti',
    icon: Mail,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    features: [
      'Email automatiche scadenza',
      'Newsletter periodiche',
      'Template personalizzati',
      'Analytics aperture'
    ],
    hasOAuth: false,
    comingSoon: true
  }
};

// === WHATSAPP MESSAGE TEMPLATES ===
const DEFAULT_TEMPLATES = [
  {
    id: 'subscription_expiring_7d',
    name: 'Scadenza Abbonamento (7 giorni)',
    trigger: 'subscription_expiring',
    triggerDays: 7,
    message: 'Ciao {nome}! 👋\n\nHo notato che il tuo programma con me sta per scadere tra 7 giorni.\n\nSe vuoi continuare il tuo percorso fitness, scrivimi per rinnovare! 💪\n\nA presto,\n{trainer_name}',
    enabled: true,
    type: 'automatic'
  },
  {
    id: 'subscription_expiring_3d',
    name: 'Scadenza Abbonamento (3 giorni)',
    trigger: 'subscription_expiring',
    triggerDays: 3,
    message: 'Ciao {nome}! ⏰\n\nMancano solo 3 giorni alla scadenza del tuo programma!\n\nNon perdere i progressi fatti finora - contattami per il rinnovo.\n\n{trainer_name}',
    enabled: true,
    type: 'automatic'
  },
  {
    id: 'subscription_expired',
    name: 'Abbonamento Scaduto',
    trigger: 'subscription_expired',
    triggerDays: 0,
    message: 'Ciao {nome},\n\nIl tuo programma è scaduto oggi. 📅\n\nMi farebbe piacere continuare a seguirti - fammi sapere se vuoi riprendere!\n\n{trainer_name}',
    enabled: true,
    type: 'automatic'
  },
  {
    id: 'birthday',
    name: 'Auguri Compleanno',
    trigger: 'birthday',
    triggerDays: 0,
    message: 'Buon compleanno {nome}! 🎂🎉\n\nTi auguro una giornata fantastica!\n\n{trainer_name}',
    enabled: true,
    type: 'automatic'
  },
  {
    id: 'appointment_reminder',
    name: 'Promemoria Appuntamento',
    trigger: 'appointment',
    triggerDays: 1,
    message: 'Ciao {nome}! 📅\n\nTi ricordo che domani abbiamo appuntamento alle {ora}.\n\nA domani!\n{trainer_name}',
    enabled: true,
    type: 'automatic'
  },
  {
    id: 'welcome',
    name: 'Benvenuto Nuovo Cliente',
    trigger: 'new_client',
    triggerDays: 0,
    message: 'Ciao {nome}! 🎉\n\nBenvenuto/a! Sono felice di iniziare questo percorso insieme.\n\nSe hai domande, scrivimi pure qui!\n\n{trainer_name}',
    enabled: true,
    type: 'automatic'
  },
  {
    id: 'manual_followup',
    name: 'Follow-up Manuale',
    trigger: 'manual',
    triggerDays: null,
    message: 'Ciao {nome}! 👋\n\nCome stai? Volevo sapere come procede il tuo allenamento.\n\nFammi sapere se hai bisogno di supporto!\n\n{trainer_name}',
    enabled: true,
    type: 'manual'
  }
];

// === INTEGRATION CARD COMPONENT ===
const IntegrationCard = ({ 
  integration, 
  status, 
  onConnect, 
  onDisconnect, 
  onSettings, 
  onOpenHub 
}) => {
  const Icon = integration.icon;
  const isConnected = status?.enabled;
  const isComingSoon = integration.comingSoon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-slate-800/60 backdrop-blur-sm rounded-xl border ${
        isConnected ? integration.borderColor : 'border-slate-700/50'
      } overflow-hidden`}
    >
      {/* Coming Soon Badge */}
      {isComingSoon && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
          Prossimamente
        </div>
      )}

      {/* Connected Badge */}
      {isConnected && !isComingSoon && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
          <CheckCircle size={12} />
          Connesso
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center shadow-lg`}>
            <Icon className="text-white" size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{integration.name}</h3>
            <p className="text-sm text-slate-400 mt-1">{integration.description}</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {integration.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle size={14} className={integration.textColor} />
              {feature}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isComingSoon ? (
            <button 
              disabled
              className="flex-1 py-2.5 px-4 bg-slate-700/50 text-slate-500 rounded-lg font-medium cursor-not-allowed"
            >
              In arrivo
            </button>
          ) : isConnected ? (
            <>
              {integration.hubRoute && (
                <button
                  onClick={() => onOpenHub(integration.hubRoute)}
                  className={`flex-1 py-2.5 px-4 ${integration.bgColor} ${integration.textColor} rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-80 transition-opacity`}
                >
                  <ExternalLink size={16} />
                  Gestisci
                </button>
              )}
              <button
                onClick={() => onSettings(integration.id)}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Settings size={18} className="text-slate-400" />
              </button>
              <button
                onClick={() => onDisconnect(integration.id)}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Unlink size={18} className="text-red-400" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onConnect(integration)}
              className={`flex-1 py-2.5 px-4 bg-gradient-to-r ${integration.color} text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg`}
            >
              <Link2 size={16} />
              Collega
            </button>
          )}
        </div>

        {/* Connection Info */}
        {isConnected && status?.connected_at && (
          <p className="text-xs text-slate-500 mt-3 text-center">
            Connesso il {new Date(status.connected_at.seconds * 1000).toLocaleDateString('it-IT')}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// === WHATSAPP SETTINGS MODAL ===
const WhatsAppSettingsModal = ({ isOpen, onClose, templates, onSaveTemplates }) => {
  const toast = useToast();
  const [editingTemplates, setEditingTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditingTemplates([...templates]);
    }
  }, [isOpen, templates]);

  const handleTemplateChange = (id, field, value) => {
    setEditingTemplates(prev => 
      prev.map(t => t.id === id ? { ...t, [field]: value } : t)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveTemplates(editingTemplates);
      toast.success('Template salvati con successo');
      onClose();
    } catch (error) {
      console.error('Errore salvataggio template:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <MessageCircle className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Impostazioni WhatsApp</h2>
              <p className="text-sm text-slate-400">Gestisci i template dei messaggi automatici</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Templates List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                Template Messaggi
              </h3>
              {editingTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setActiveTemplate(template)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    activeTemplate?.id === template.id
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-slate-700/30 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{template.name}</span>
                    <div className="flex items-center gap-2">
                      {template.type === 'automatic' ? (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                          <Zap size={10} /> Auto
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-xs rounded-full">
                          Manuale
                        </span>
                      )}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={template.enabled}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTemplateChange(template.id, 'enabled', e.target.checked);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {template.trigger === 'subscription_expiring' && `Inviato ${template.triggerDays} giorni prima della scadenza`}
                    {template.trigger === 'subscription_expired' && 'Inviato il giorno della scadenza'}
                    {template.trigger === 'birthday' && 'Inviato il giorno del compleanno'}
                    {template.trigger === 'appointment' && `Inviato ${template.triggerDays} giorno prima dell'appuntamento`}
                    {template.trigger === 'new_client' && 'Inviato alla creazione del cliente'}
                    {template.trigger === 'manual' && 'Inviato manualmente dalla scheda cliente'}
                  </p>
                </button>
              ))}
            </div>

            {/* Template Editor */}
            <div className="bg-slate-700/30 rounded-xl p-6">
              {activeTemplate ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-white">{activeTemplate.name}</h4>
                    <span className="text-xs text-slate-400">
                      Variabili: {'{nome}'}, {'{trainer_name}'}, {'{ora}'}, {'{data}'}
                    </span>
                  </div>
                  <textarea
                    value={editingTemplates.find(t => t.id === activeTemplate.id)?.message || ''}
                    onChange={(e) => handleTemplateChange(activeTemplate.id, 'message', e.target.value)}
                    className="w-full h-64 bg-slate-800/50 border border-slate-600 rounded-lg p-4 text-white text-sm resize-none focus:outline-none focus:border-green-500"
                    placeholder="Scrivi il messaggio..."
                  />
                  <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-2">Anteprima:</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {editingTemplates.find(t => t.id === activeTemplate.id)?.message
                        .replace('{nome}', 'Mario')
                        .replace('{trainer_name}', 'Coach Alex')
                        .replace('{ora}', '10:00')
                        .replace('{data}', '15 Dicembre')
                      }
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <FileText size={48} className="text-slate-500 mb-4" />
                  <p className="text-slate-400">Seleziona un template per modificarlo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save size={16} />
                Salva Template
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// === CONNECT MODAL ===
const ConnectModal = ({ isOpen, onClose, integration, onSuccess, onError }) => {
  if (!isOpen || !integration) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center mx-auto mb-6`}>
            {React.createElement(integration.icon, { className: 'text-white', size: 32 })}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Collega {integration.name}
          </h2>
          <p className="text-slate-400 text-center mb-6">
            {integration.description}
          </p>

          {/* Features */}
          <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-400 mb-3">Con questa integrazione potrai:</p>
            <div className="space-y-2">
              {integration.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle size={14} className={integration.textColor} />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* OAuth Button */}
          {integration.hasOAuth && (
            <OAuthButton
              provider={integration.oauthProvider}
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
              onError={onError}
              className="w-full"
            />
          )}

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 text-slate-400 hover:text-white transition-colors"
          >
            Annulla
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// === MAIN COMPONENT ===
export default function IntegrationsHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tenantId = localStorage.getItem('tenantId');
  const toast = useToast();
  const { confirmAction } = useConfirm();
  
  const [loading, setLoading] = useState(true);
  const [integrationStatuses, setIntegrationStatuses] = useState({});
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showWhatsAppSettings, setShowWhatsAppSettings] = useState(false);

  // Apri WhatsApp settings se navigato con ?tab=whatsapp
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'whatsapp') {
      setShowWhatsAppSettings(true);
      // Rimuovi il parametro dall'URL
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      // Carica stato di tutte le integrazioni
      const integrationsRef = collection(db, `tenants/${tenantId}/integrations`);
      const snapshot = await getDocs(integrationsRef);
      
      const statuses = {};
      snapshot.forEach(doc => {
        statuses[doc.id] = doc.data();
      });
      setIntegrationStatuses(statuses);

      // Carica template WhatsApp
      const templatesRef = doc(db, `tenants/${tenantId}/settings/whatsapp_templates`);
      const templatesSnap = await getDoc(templatesRef);
      
      if (templatesSnap.exists()) {
        setWhatsappTemplates(templatesSnap.data().templates || []);
      } else {
        // Inizializza con template di default
        setWhatsappTemplates(DEFAULT_TEMPLATES);
        await setDoc(templatesRef, { templates: DEFAULT_TEMPLATES });
      }
    } catch (error) {
      console.error('Errore caricamento integrazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (integration) => {
    setSelectedIntegration(integration);
    setShowConnectModal(true);
  };

  const handleDisconnect = async (integrationId) => {
    const ok = await confirmAction(
      `Sei sicuro di voler disconnettere ${INTEGRATIONS[integrationId]?.name}?`,
      'Disconnetti Integrazione',
      'Disconnetti'
    );
    if (!ok) return;
    
    try {
      const integrationRef = doc(db, `tenants/${tenantId}/integrations/${integrationId}`);
      await updateDoc(integrationRef, {
        enabled: false,
        access_token: null,
        refresh_token: null,
        disconnected_at: new Date()
      });
      
      await loadIntegrations();
      toast.success('Integrazione disconnessa con successo');
    } catch (error) {
      console.error('Errore disconnessione:', error);
      toast.error('Errore durante la disconnessione');
    }
  };

  const handleSettings = (integrationId) => {
    if (integrationId === 'whatsapp') {
      setShowWhatsAppSettings(true);
    }
  };

  const handleOpenHub = (route) => {
    navigate(route);
  };

  const handleSaveWhatsAppTemplates = async (templates) => {
    const templatesRef = doc(db, `tenants/${tenantId}/settings/whatsapp_templates`);
    await setDoc(templatesRef, { 
      templates,
      updated_at: new Date()
    });
    setWhatsappTemplates(templates);
  };

  const handleOAuthSuccess = async () => {
    await loadIntegrations();
  };

  const handleOAuthError = (error) => {
    console.error('Errore OAuth:', error);
    toast.error('Errore durante la connessione');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Web Only Banner per Stripe/Pagamenti */}
      <WebOnlyBanner
        title="Configurazione Pagamenti"
        message="Per collegare Stripe e gestire i pagamenti, accedi dal browser web."
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Integrazioni</h1>
            <p className="text-slate-400">Collega i tuoi strumenti preferiti per automatizzare il tuo business</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-sm text-slate-400">Attive</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Object.values(integrationStatuses).filter(s => s?.enabled).length}
          </p>
        </div>
        <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={18} className="text-blue-400" />
            <span className="text-sm text-slate-400">Disponibili</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Object.keys(INTEGRATIONS).filter(k => !INTEGRATIONS[k].comingSoon).length}
          </p>
        </div>
        <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={18} className="text-amber-400" />
            <span className="text-sm text-slate-400">Automazioni</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {whatsappTemplates.filter(t => t.enabled && t.type === 'automatic').length}
          </p>
        </div>
        <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-purple-400" />
            <span className="text-sm text-slate-400">Prossimamente</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Object.keys(INTEGRATIONS).filter(k => INTEGRATIONS[k].comingSoon).length}
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(INTEGRATIONS).map(integration => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            status={integrationStatuses[integration.id]}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSettings={handleSettings}
            onOpenHub={handleOpenHub}
          />
        ))}
      </div>

      {/* Modals */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        integration={selectedIntegration}
        onSuccess={handleOAuthSuccess}
        onError={handleOAuthError}
      />

      <WhatsAppSettingsModal
        isOpen={showWhatsAppSettings}
        onClose={() => setShowWhatsAppSettings(false)}
        templates={whatsappTemplates}
        onSaveTemplates={handleSaveWhatsAppTemplates}
      />
    </div>
  );
}
