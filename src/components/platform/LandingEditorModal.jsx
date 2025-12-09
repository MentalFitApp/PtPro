// src/components/platform/LandingEditorModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Globe, Image, Type, Layout } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function LandingEditorModal({ tenant, onClose, onSave }) {
  const toast = useToast();
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setConfig(tenant.config || {
        hero: { title: '', subtitle: '', ctaPrimary: 'Inizia Ora', ctaSecondary: 'Scopri di più' },
        branding: { appName: tenant.tenantName, logoUrl: '/logo192.png' },
        siteSlug: tenant.tenantId,
        enabled: true
      });
    }
  }, [tenant]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (!tenant || !config) return null;

  const tabs = [
    { id: 'general', label: 'Generale', icon: <Layout size={16} /> },
    { id: 'hero', label: 'Hero Section', icon: <Type size={16} /> },
    { id: 'branding', label: 'Branding', icon: <Image size={16} /> },
    { id: 'seo', label: 'SEO', icon: <Globe size={16} /> }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800 rounded-2xl p-6 max-w-5xl w-full border border-slate-700 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Globe className="w-7 h-7 text-purple-500" />
                Editor Landing Page
              </h2>
              <p className="text-slate-400 mt-1">{tenant.tenantName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-700">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Slug Sito (URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">flowfitpro.it/site/</span>
                    <input
                      type="text"
                      value={config.siteSlug || ''}
                      onChange={(e) => setConfig({ ...config, siteSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="nome-sito"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Solo lettere minuscole, numeri e trattini</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dominio Custom (Enterprise)
                  </label>
                  <input
                    type="text"
                    value={config.customDomain || ''}
                    onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="www.tuosito.com"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={config.enabled !== false}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="enabled" className="text-slate-300 flex-1">
                    <span className="font-medium">Landing Page Abilitata</span>
                    <p className="text-xs text-slate-500 mt-1">Il sito sarà accessibile pubblicamente</p>
                  </label>
                </div>
              </div>
            )}

            {/* Hero Tab */}
            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Titolo Hero
                  </label>
                  <input
                    type="text"
                    value={config.hero?.title || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      hero: { ...config.hero, title: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Trasforma il Tuo Business Fitness"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Sottotitolo Hero
                  </label>
                  <textarea
                    value={config.hero?.subtitle || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      hero: { ...config.hero, subtitle: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Descrizione del servizio..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      CTA Primario
                    </label>
                    <input
                      type="text"
                      value={config.hero?.ctaPrimary || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        hero: { ...config.hero, ctaPrimary: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Inizia Ora"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      CTA Secondario
                    </label>
                    <input
                      type="text"
                      value={config.hero?.ctaSecondary || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        hero: { ...config.hero, ctaSecondary: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Scopri di più"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome App
                  </label>
                  <input
                    type="text"
                    value={config.branding?.appName || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      branding: { ...config.branding, appName: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="FitFlow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL Logo
                  </label>
                  <input
                    type="text"
                    value={config.branding?.logoUrl || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      branding: { ...config.branding, logoUrl: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="/logo192.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Colore Primario
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.branding?.primaryColor || '#3b82f6'}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, primaryColor: e.target.value }
                        })}
                        className="w-16 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.branding?.primaryColor || '#3b82f6'}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, primaryColor: e.target.value }
                        })}
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Colore Accento
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.branding?.accentColor || '#60a5fa'}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, accentColor: e.target.value }
                        })}
                        className="w-16 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.branding?.accentColor || '#60a5fa'}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, accentColor: e.target.value }
                        })}
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={config.seo?.title || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      seo: { ...config.seo, title: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Titolo per motori di ricerca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={config.seo?.description || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      seo: { ...config.seo, description: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Descrizione per motori di ricerca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Keywords (separate da virgola)
                  </label>
                  <input
                    type="text"
                    value={config.seo?.keywords || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      seo: { ...config.seo, keywords: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="personal trainer, fitness, gestione clienti"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
            >
              Annulla
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
