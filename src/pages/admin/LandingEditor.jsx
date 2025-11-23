import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { 
  Save, 
  Eye, 
  RefreshCw, 
  Palette, 
  Type, 
  Image, 
  DollarSign,
  Star,
  Zap
} from 'lucide-react';

export default function LandingEditor() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const tenantId = localStorage.getItem('tenantId') || 'mentalfit-default';
      const landingDoc = await getDoc(doc(db, 'tenants', tenantId, 'settings', 'landing'));
      
      if (landingDoc.exists()) {
        setConfig(landingDoc.data());
      }
    } catch (error) {
      console.error('Error loading landing config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const tenantId = localStorage.getItem('tenantId') || 'mentalfit-default';
      
      // Salva la configurazione landing
      await setDoc(doc(db, 'tenants', tenantId, 'settings', 'landing'), config);
      
      // Se c'è uno slug, salvalo anche nel documento tenant principale
      if (config?.siteSlug) {
        await setDoc(doc(db, 'tenants', tenantId), { 
          siteSlug: config.siteSlug 
        }, { merge: true });
      }
      
      alert('✅ Configurazione salvata con successo!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('❌ Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Generale', icon: <Palette size={18} /> },
    { id: 'hero', label: 'Hero Section', icon: <Type size={18} /> },
    { id: 'features', label: 'Features', icon: <Zap size={18} /> },
    { id: 'pricing', label: 'Pricing', icon: <DollarSign size={18} /> },
    { id: 'testimonials', label: 'Testimonials', icon: <Star size={18} /> },
    { id: 'contact', label: 'Contatti & Social', icon: <Star size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Editor Landing Page</h1>
            <p className="text-slate-400">Personalizza la tua landing page multi-tenant</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                const slug = config?.siteSlug;
                const url = slug ? `/site/${slug}` : '/site';
                window.open(url, '_blank');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Eye size={18} />
              Anteprima
            </button>
            <button
              onClick={loadConfig}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw size={18} />
              Ricarica
            </button>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Impostazioni Generali</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nome App / Business</label>
                <input
                  type="text"
                  value={config?.branding?.appName || ''}
                  onChange={(e) => updateField('branding.appName', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">URL Logo</label>
                <input
                  type="text"
                  value={config?.branding?.logoUrl || ''}
                  onChange={(e) => updateField('branding.logoUrl', e.target.value)}
                  placeholder="/logo192.PNG o URL esterno"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug Sito (URL Personalizzato)</label>
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400">flowfitpro.it/site/</span>
                  <input
                    type="text"
                    value={config?.siteSlug || ''}
                    onChange={(e) => updateField('siteSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="mio-business"
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-sm text-slate-400 mt-2">Caratteri consentiti: lettere, numeri, trattini</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Colore Primario</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config?.branding?.primaryColor || '#3b82f6'}
                      onChange={(e) => updateField('branding.primaryColor', e.target.value)}
                      className="w-16 h-10 rounded-lg"
                    />
                    <input
                      type="text"
                      value={config?.branding?.primaryColor || '#3b82f6'}
                      onChange={(e) => updateField('branding.primaryColor', e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Colore Accent</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config?.branding?.accentColor || '#60a5fa'}
                      onChange={(e) => updateField('branding.accentColor', e.target.value)}
                      className="w-16 h-10 rounded-lg"
                    />
                    <input
                      type="text"
                      value={config?.branding?.accentColor || '#60a5fa'}
                      onChange={(e) => updateField('branding.accentColor', e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dominio Personalizzato (Piano Enterprise)</label>
                <input
                  type="text"
                  value={config?.customDomain || ''}
                  onChange={(e) => updateField('customDomain', e.target.value)}
                  placeholder="tuodominio.com"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-sm text-slate-400 mt-2">Lascia vuoto per usare flowfitpro.it/site/tuo-slug</p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config?.enabled !== false}
                    onChange={(e) => updateField('enabled', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span>Sito Abilitato (visibile al pubblico)</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Hero Section</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Titolo</label>
                <input
                  type="text"
                  value={config?.hero?.title || ''}
                  onChange={(e) => updateField('hero.title', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sottotitolo</label>
                <textarea
                  value={config?.hero?.subtitle || ''}
                  onChange={(e) => updateField('hero.subtitle', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Primario</label>
                  <input
                    type="text"
                    value={config?.hero?.ctaPrimary || ''}
                    onChange={(e) => updateField('hero.ctaPrimary', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Secondario</label>
                  <input
                    type="text"
                    value={config?.hero?.ctaSecondary || ''}
                    onChange={(e) => updateField('hero.ctaSecondary', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={config?.hero?.showStats || false}
                    onChange={(e) => updateField('hero.showStats', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span>Mostra Statistiche</span>
                </label>

                {config?.hero?.showStats && (
                  <div className="grid grid-cols-3 gap-4 ml-6">
                    {config?.hero?.stats?.map((stat, index) => (
                      <div key={index} className="space-y-2">
                        <input
                          type="text"
                          placeholder="Valore"
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...config.hero.stats];
                            newStats[index].value = e.target.value;
                            updateField('hero.stats', newStats);
                          }}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Label"
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...config.hero.stats];
                            newStats[index].label = e.target.value;
                            updateField('hero.stats', newStats);
                          }}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Contatti e Social Media</h2>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informazioni di Contatto</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={config?.contact?.email || ''}
                    onChange={(e) => updateField('contact.email', e.target.value)}
                    placeholder="info@tuobusiness.com"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telefono</label>
                  <input
                    type="tel"
                    value={config?.contact?.phone || ''}
                    onChange={(e) => updateField('contact.phone', e.target.value)}
                    placeholder="+39 123 456 7890"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Indirizzo</label>
                  <input
                    type="text"
                    value={config?.contact?.address || ''}
                    onChange={(e) => updateField('contact.address', e.target.value)}
                    placeholder="Via Roma 123, Milano"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold">Social Media</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Facebook</label>
                  <input
                    type="url"
                    value={config?.social?.facebook || ''}
                    onChange={(e) => updateField('social.facebook', e.target.value)}
                    placeholder="https://facebook.com/tuapagina"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Instagram</label>
                  <input
                    type="url"
                    value={config?.social?.instagram || ''}
                    onChange={(e) => updateField('social.instagram', e.target.value)}
                    placeholder="https://instagram.com/tuoprofilo"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={config?.social?.linkedin || ''}
                    onChange={(e) => updateField('social.linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/tuaazienda"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Twitter</label>
                  <input
                    type="url"
                    value={config?.social?.twitter || ''}
                    onChange={(e) => updateField('social.twitter', e.target.value)}
                    placeholder="https://twitter.com/tuoaccount"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aggiungi altre tab se necessario */}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Nota:</strong> Le modifiche saranno visibili immediatamente sulla landing page pubblica dopo il salvataggio.
          </p>
        </div>
      </div>
    </div>
  );
}
