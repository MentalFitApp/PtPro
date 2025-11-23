// src/components/platform/BrandingEditorModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Palette, Image as ImageIcon, Type } from 'lucide-react';

export default function BrandingEditorModal({ tenant, onClose, onSave }) {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setConfig(tenant.config || {
        appName: tenant.tenantName,
        adminAreaName: 'Area Personale',
        clientAreaName: 'Area Cliente',
        coachAreaName: 'Area Coach',
        collaboratoreAreaName: 'Area Collaboratore',
        logoUrl: null,
        primaryColor: '#3b82f6',
        accentColor: '#60a5fa'
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
      alert('❌ Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (!tenant || !config) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800 rounded-2xl p-6 max-w-3xl w-full border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Palette className="w-7 h-7 text-yellow-500" />
                Editor Branding
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

          {/* Content */}
          <div className="space-y-6">
            {/* App Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Type className="w-4 h-4 text-purple-400" />
                Nome App
              </label>
              <input
                type="text"
                value={config.appName || ''}
                onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="FitFlow"
              />
              <p className="text-xs text-slate-500 mt-1">Nome visualizzato nella piattaforma</p>
            </div>

            {/* Area Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Area Admin
                </label>
                <input
                  type="text"
                  value={config.adminAreaName || ''}
                  onChange={(e) => setConfig({ ...config, adminAreaName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Area Personale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Area Cliente
                </label>
                <input
                  type="text"
                  value={config.clientAreaName || ''}
                  onChange={(e) => setConfig({ ...config, clientAreaName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Area Cliente"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Area Coach
                </label>
                <input
                  type="text"
                  value={config.coachAreaName || ''}
                  onChange={(e) => setConfig({ ...config, coachAreaName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Area Coach"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Area Collaboratore
                </label>
                <input
                  type="text"
                  value={config.collaboratoreAreaName || ''}
                  onChange={(e) => setConfig({ ...config, collaboratoreAreaName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Area Collaboratore"
                />
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                URL Logo
              </label>
              <input
                type="text"
                value={config.logoUrl || ''}
                onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="/logo192.PNG o URL esterno"
              />
              {config.logoUrl && (
                <div className="mt-2 p-2 bg-slate-700/30 rounded-lg flex items-center gap-2">
                  <img src={config.logoUrl} alt="Logo preview" className="w-10 h-10 rounded object-cover" />
                  <span className="text-xs text-slate-400">Preview logo</span>
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Colore Primario
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.primaryColor || '#3b82f6'}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor || '#3b82f6'}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
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
                    value={config.accentColor || '#60a5fa'}
                    onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.accentColor || '#60a5fa'}
                    onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <p className="text-xs text-slate-400 mb-2">Preview:</p>
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                {config.logoUrl && (
                  <img src={config.logoUrl} alt="Logo" className="w-8 h-8 rounded" />
                )}
                <div>
                  <p className="text-white font-bold" style={{ color: config.primaryColor }}>
                    {config.appName}
                  </p>
                  <p className="text-xs text-slate-400">{config.adminAreaName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              {saving ? 'Salvataggio...' : 'Salva Branding'}
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
