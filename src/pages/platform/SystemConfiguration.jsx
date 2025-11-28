import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Save, Settings, Globe, Mail, Database,
  Server, Code, Shield, Zap, AlertCircle, CheckCircle,
  Eye, EyeOff, RefreshCw, Package, DollarSign, Users,
  Lock, Key, FileText, Bell, Cloud, Activity, ToggleLeft, ToggleRight
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { invalidateSubscriptionPlansCache } from '../../config/subscriptionPlans';

export default function SystemConfiguration() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showSecrets, setShowSecrets] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Configuration states
  const [generalConfig, setGeneralConfig] = useState({
    platformName: 'FitFlow Platform',
    supportEmail: 'support@fitflow.com',
    maintenanceMode: false,
    allowNewSignups: true,
    maxTenantsPerUser: 3
  });
  
  const [subscriptionPlans, setSubscriptionPlans] = useState([
    { id: 'free', name: 'Free', price: 0, maxUsers: 5, maxClients: 20, features: ['Basic Dashboard', 'Email Support'] },
    { id: 'starter', name: 'Starter', price: 29, maxUsers: 10, maxClients: 50, features: ['All Free features', 'Priority Support', 'Custom Branding'] },
    { id: 'professional', name: 'Professional', price: 79, maxUsers: 25, maxClients: 200, features: ['All Starter features', 'Advanced Analytics', 'API Access'] },
    { id: 'enterprise', name: 'Enterprise', price: 199, maxUsers: -1, maxClients: -1, features: ['All Professional features', '24/7 Support', 'Custom Integrations', 'SLA'] }
  ]);
  
  const [featureFlags, setFeatureFlags] = useState({
    enableAdvancedAnalytics: true,
    enableAIRecommendations: false,
    enableVideoUploads: true,
    enableCommunityFeatures: true,
    enableMarketplace: false,
    enableMobileApp: true,
    enableCustomDomains: false,
    enableSSO: false
  });
  
  const [rateLimits, setRateLimits] = useState({
    apiCallsPerMinute: 100,
    uploadsPerDay: 50,
    emailsPerHour: 20,
    webhooksPerMinute: 30
  });
  
  const [integrations, setIntegrations] = useState({
    stripe: {
      enabled: true,
      publicKey: 'pk_live_***',
      secretKey: '***'
    },
    sendgrid: {
      enabled: true,
      apiKey: '***'
    },
    cloudflareR2: {
      enabled: true,
      accountId: '***',
      accessKeyId: '***',
      secretAccessKey: '***',
      bucketName: 'fitflow-storage'
    },
    firebase: {
      enabled: true,
      projectId: 'ptpro-fitness',
      apiKey: '***'
    }
  });
  
  const [notifications, setNotifications] = useState({
    emailOnNewTenant: true,
    emailOnSubscriptionChange: true,
    emailOnError: true,
    slackWebhook: '',
    discordWebhook: ''
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Load from Firestore
      const configDoc = await getDoc(doc(db, 'platform_config', 'settings'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        if (data.general) setGeneralConfig(data.general);
        if (data.subscriptionPlans) setSubscriptionPlans(data.subscriptionPlans);
        if (data.featureFlags) setFeatureFlags(data.featureFlags);
        if (data.rateLimits) setRateLimits(data.rateLimits);
        if (data.integrations) setIntegrations(data.integrations);
        if (data.notifications) setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!confirm('Salvare le modifiche alla configurazione globale?')) return;
    
    try {
      setSaving(true);
      
      const configData = {
        general: generalConfig,
        subscriptionPlans,
        featureFlags,
        rateLimits,
        integrations: {
          ...integrations,
          // Don't save visible secrets
          stripe: { ...integrations.stripe, secretKey: '***' },
          sendgrid: { ...integrations.sendgrid, apiKey: '***' },
          cloudflareR2: { 
            ...integrations.cloudflareR2, 
            accessKeyId: '***', 
            secretAccessKey: '***' 
          },
          firebase: { ...integrations.firebase, apiKey: '***' }
        },
        notifications,
        lastUpdated: Timestamp.now(),
        updatedBy: auth.currentUser.uid
      };
      
      await setDoc(doc(db, 'platform_config', 'settings'), configData, { merge: true });
      
      // Invalida cache per sincronizzare altre pagine
      invalidateSubscriptionPlansCache();
      
      setHasChanges(false);
      alert('✅ Configurazione salvata con successo! Le modifiche sono ora attive.');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('❌ Errore nel salvataggio della configurazione');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeature = (feature) => {
    setFeatureFlags(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
    setHasChanges(true);
  };

  const handleUpdatePlan = (planId, field, value) => {
    setSubscriptionPlans(prev => prev.map(plan => 
      plan.id === planId ? { ...plan, [field]: value } : plan
    ));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento configurazione...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'plans', label: 'Subscription Plans', icon: <Package size={18} /> },
    { id: 'features', label: 'Feature Flags', icon: <Zap size={18} /> },
    { id: 'limits', label: 'Rate Limits', icon: <Shield size={18} /> },
    { id: 'integrations', label: 'Integrations', icon: <Code size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/platform-dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
              System Configuration
            </h1>
            <p className="text-slate-400">
              Manage global platform settings, plans, and integrations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                <AlertCircle size={16} />
                Unsaved changes
              </span>
            )}
            
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {showSecrets ? <EyeOff size={18} /> : <Eye size={18} />}
              <span className="text-white text-sm">
                {showSecrets ? 'Hide Secrets' : 'Show Secrets'}
              </span>
            </button>
            
            <button
              onClick={loadConfiguration}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className="text-slate-400" />
            </button>
            
            <button
              onClick={handleSaveConfiguration}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                hasChanges 
                  ? 'bg-green-600 hover:bg-green-700 text-white preserve-white' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <ConfigSection title="Platform Settings" icon={<Globe className="text-blue-400" />}>
              <ConfigField
                label="Platform Name"
                value={generalConfig.platformName}
                onChange={(value) => {
                  setGeneralConfig(prev => ({ ...prev, platformName: value }));
                  setHasChanges(true);
                }}
                type="text"
              />
              <ConfigField
                label="Support Email"
                value={generalConfig.supportEmail}
                onChange={(value) => {
                  setGeneralConfig(prev => ({ ...prev, supportEmail: value }));
                  setHasChanges(true);
                }}
                type="email"
              />
              <ConfigField
                label="Max Tenants per User"
                value={generalConfig.maxTenantsPerUser}
                onChange={(value) => {
                  setGeneralConfig(prev => ({ ...prev, maxTenantsPerUser: parseInt(value) }));
                  setHasChanges(true);
                }}
                type="number"
              />
            </ConfigSection>

            <ConfigSection title="Platform Mode" icon={<Activity className="text-green-400" />}>
              <ToggleField
                label="Maintenance Mode"
                description="Disabilita l'accesso alla piattaforma (tranne CEO)"
                enabled={generalConfig.maintenanceMode}
                onChange={(value) => {
                  setGeneralConfig(prev => ({ ...prev, maintenanceMode: value }));
                  setHasChanges(true);
                }}
              />
              <ToggleField
                label="Allow New Signups"
                description="Permetti la registrazione di nuovi tenant"
                enabled={generalConfig.allowNewSignups}
                onChange={(value) => {
                  setGeneralConfig(prev => ({ ...prev, allowNewSignups: value }));
                  setHasChanges(true);
                }}
              />
            </ConfigSection>
          </div>
        )}

        {/* SUBSCRIPTION PLANS TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {subscriptionPlans.map((plan) => (
              <ConfigSection 
                key={plan.id}
                title={`${plan.name} Plan`} 
                icon={<Package className={`${
                  plan.id === 'enterprise' ? 'text-purple-400' :
                  plan.id === 'professional' ? 'text-blue-400' :
                  plan.id === 'starter' ? 'text-green-400' :
                  'text-slate-400'
                }`} />}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ConfigField
                    label="Price (€/month)"
                    value={plan.price}
                    onChange={(value) => handleUpdatePlan(plan.id, 'price', parseFloat(value))}
                    type="number"
                  />
                  <ConfigField
                    label="Max Users"
                    value={plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}
                    onChange={(value) => handleUpdatePlan(plan.id, 'maxUsers', value === 'Unlimited' ? -1 : parseInt(value))}
                    type="text"
                  />
                  <ConfigField
                    label="Max Clients"
                    value={plan.maxClients === -1 ? 'Unlimited' : plan.maxClients}
                    onChange={(value) => handleUpdatePlan(plan.id, 'maxClients', value === 'Unlimited' ? -1 : parseInt(value))}
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Features</label>
                  <div className="flex flex-wrap gap-2">
                    {plan.features.map((feature, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-800/50 rounded-full text-xs text-slate-300">
                        <CheckCircle className="inline w-3 h-3 mr-1 text-green-400" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </ConfigSection>
            ))}
          </div>
        )}

        {/* FEATURE FLAGS TAB */}
        {activeTab === 'features' && (
          <ConfigSection title="Global Feature Flags" icon={<Zap className="text-yellow-400" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(featureFlags).map(([key, value]) => (
                <ToggleField
                  key={key}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  description={`Abilita/disabilita globally per tutti i tenant`}
                  enabled={value}
                  onChange={() => handleToggleFeature(key)}
                />
              ))}
            </div>
          </ConfigSection>
        )}

        {/* RATE LIMITS TAB */}
        {activeTab === 'limits' && (
          <ConfigSection title="API Rate Limits" icon={<Shield className="text-red-400" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConfigField
                label="API Calls per Minute"
                value={rateLimits.apiCallsPerMinute}
                onChange={(value) => {
                  setRateLimits(prev => ({ ...prev, apiCallsPerMinute: parseInt(value) }));
                  setHasChanges(true);
                }}
                type="number"
                description="Limite chiamate API per tenant"
              />
              <ConfigField
                label="Uploads per Day"
                value={rateLimits.uploadsPerDay}
                onChange={(value) => {
                  setRateLimits(prev => ({ ...prev, uploadsPerDay: parseInt(value) }));
                  setHasChanges(true);
                }}
                type="number"
                description="Upload file giornalieri per tenant"
              />
              <ConfigField
                label="Emails per Hour"
                value={rateLimits.emailsPerHour}
                onChange={(value) => {
                  setRateLimits(prev => ({ ...prev, emailsPerHour: parseInt(value) }));
                  setHasChanges(true);
                }}
                type="number"
                description="Email inviate orarie per tenant"
              />
              <ConfigField
                label="Webhooks per Minute"
                value={rateLimits.webhooksPerMinute}
                onChange={(value) => {
                  setRateLimits(prev => ({ ...prev, webhooksPerMinute: parseInt(value) }));
                  setHasChanges(true);
                }}
                type="number"
                description="Webhook chiamate per minuto"
              />
            </div>
          </ConfigSection>
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {/* Stripe */}
            <ConfigSection title="Stripe" icon={<DollarSign className="text-indigo-400" />}>
              <ToggleField
                label="Enable Stripe"
                enabled={integrations.stripe.enabled}
                onChange={(value) => {
                  setIntegrations(prev => ({
                    ...prev,
                    stripe: { ...prev.stripe, enabled: value }
                  }));
                  setHasChanges(true);
                }}
              />
              {integrations.stripe.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <ConfigField
                    label="Public Key"
                    value={integrations.stripe.publicKey}
                    onChange={(value) => {
                      setIntegrations(prev => ({
                        ...prev,
                        stripe: { ...prev.stripe, publicKey: value }
                      }));
                      setHasChanges(true);
                    }}
                    type="text"
                  />
                  <ConfigField
                    label="Secret Key"
                    value={showSecrets ? integrations.stripe.secretKey : '***************'}
                    onChange={(value) => {
                      setIntegrations(prev => ({
                        ...prev,
                        stripe: { ...prev.stripe, secretKey: value }
                      }));
                      setHasChanges(true);
                    }}
                    type={showSecrets ? 'text' : 'password'}
                    secret
                  />
                </div>
              )}
            </ConfigSection>

            {/* SendGrid */}
            <ConfigSection title="SendGrid" icon={<Mail className="text-blue-400" />}>
              <ToggleField
                label="Enable SendGrid"
                enabled={integrations.sendgrid.enabled}
                onChange={(value) => {
                  setIntegrations(prev => ({
                    ...prev,
                    sendgrid: { ...prev.sendgrid, enabled: value }
                  }));
                  setHasChanges(true);
                }}
              />
              {integrations.sendgrid.enabled && (
                <ConfigField
                  label="API Key"
                  value={showSecrets ? integrations.sendgrid.apiKey : '***************'}
                  onChange={(value) => {
                    setIntegrations(prev => ({
                      ...prev,
                      sendgrid: { ...prev.sendgrid, apiKey: value }
                    }));
                    setHasChanges(true);
                  }}
                  type={showSecrets ? 'text' : 'password'}
                  secret
                />
              )}
            </ConfigSection>

            {/* Cloudflare R2 */}
            <ConfigSection title="Cloudflare R2" icon={<Cloud className="text-orange-400" />}>
              <ToggleField
                label="Enable Cloudflare R2"
                enabled={integrations.cloudflareR2.enabled}
                onChange={(value) => {
                  setIntegrations(prev => ({
                    ...prev,
                    cloudflareR2: { ...prev.cloudflareR2, enabled: value }
                  }));
                  setHasChanges(true);
                }}
              />
              {integrations.cloudflareR2.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <ConfigField
                    label="Account ID"
                    value={showSecrets ? integrations.cloudflareR2.accountId : '***************'}
                    onChange={(value) => {
                      setIntegrations(prev => ({
                        ...prev,
                        cloudflareR2: { ...prev.cloudflareR2, accountId: value }
                      }));
                      setHasChanges(true);
                    }}
                    type={showSecrets ? 'text' : 'password'}
                    secret
                  />
                  <ConfigField
                    label="Bucket Name"
                    value={integrations.cloudflareR2.bucketName}
                    onChange={(value) => {
                      setIntegrations(prev => ({
                        ...prev,
                        cloudflareR2: { ...prev.cloudflareR2, bucketName: value }
                      }));
                      setHasChanges(true);
                    }}
                    type="text"
                  />
                  <ConfigField
                    label="Access Key ID"
                    value={showSecrets ? integrations.cloudflareR2.accessKeyId : '***************'}
                    onChange={(value) => {
                      setIntegrations(prev => ({
                        ...prev,
                        cloudflareR2: { ...prev.cloudflareR2, accessKeyId: value }
                      }));
                      setHasChanges(true);
                    }}
                    type={showSecrets ? 'text' : 'password'}
                    secret
                  />
                  <ConfigField
                    label="Secret Access Key"
                    value={showSecrets ? integrations.cloudflareR2.secretAccessKey : '***************'}
                    onChange={(value) => {
                      setIntegrations(prev => ({
                        ...prev,
                        cloudflareR2: { ...prev.cloudflareR2, secretAccessKey: value }
                      }));
                      setHasChanges(true);
                    }}
                    type={showSecrets ? 'text' : 'password'}
                    secret
                  />
                </div>
              )}
            </ConfigSection>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <ConfigSection title="Email Notifications" icon={<Mail className="text-blue-400" />}>
              <div className="space-y-4">
                <ToggleField
                  label="New Tenant Notifications"
                  description="Ricevi email quando un nuovo tenant si registra"
                  enabled={notifications.emailOnNewTenant}
                  onChange={(value) => {
                    setNotifications(prev => ({ ...prev, emailOnNewTenant: value }));
                    setHasChanges(true);
                  }}
                />
                <ToggleField
                  label="Subscription Change Notifications"
                  description="Ricevi email quando un tenant cambia piano"
                  enabled={notifications.emailOnSubscriptionChange}
                  onChange={(value) => {
                    setNotifications(prev => ({ ...prev, emailOnSubscriptionChange: value }));
                    setHasChanges(true);
                  }}
                />
                <ToggleField
                  label="Error Notifications"
                  description="Ricevi email per errori critici della piattaforma"
                  enabled={notifications.emailOnError}
                  onChange={(value) => {
                    setNotifications(prev => ({ ...prev, emailOnError: value }));
                    setHasChanges(true);
                  }}
                />
              </div>
            </ConfigSection>

            <ConfigSection title="Webhook Notifications" icon={<Code className="text-purple-400" />}>
              <ConfigField
                label="Slack Webhook URL"
                value={notifications.slackWebhook}
                onChange={(value) => {
                  setNotifications(prev => ({ ...prev, slackWebhook: value }));
                  setHasChanges(true);
                }}
                type="text"
                placeholder="https://hooks.slack.com/services/..."
              />
              <ConfigField
                label="Discord Webhook URL"
                value={notifications.discordWebhook}
                onChange={(value) => {
                  setNotifications(prev => ({ ...prev, discordWebhook: value }));
                  setHasChanges(true);
                }}
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
              />
            </ConfigSection>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Utility Components
const ConfigSection = ({ title, icon, children }) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
      {icon}
      {title}
    </h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const ConfigField = ({ label, value, onChange, type = 'text', description, placeholder, secret }) => (
  <div>
    <label className="block text-sm font-medium text-slate-400 mb-2">
      {label}
      {secret && <Lock className="inline w-3 h-3 ml-1 text-red-400" />}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
    />
    {description && (
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    )}
  </div>
);

const ToggleField = ({ label, description, enabled, onChange }) => (
  <div className="flex items-start justify-between p-4 bg-slate-800/30 rounded-lg">
    <div className="flex-1">
      <p className="text-white font-medium">{label}</p>
      {description && (
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        enabled 
          ? 'bg-green-600 hover:bg-green-700' 
          : 'bg-slate-700 hover:bg-slate-600'
      }`}
    >
      {enabled ? <ToggleRight className="text-white" size={20} /> : <ToggleLeft className="text-slate-400" size={20} />}
      <span className="text-white text-sm font-medium">
        {enabled ? 'ON' : 'OFF'}
      </span>
    </button>
  </div>
);
