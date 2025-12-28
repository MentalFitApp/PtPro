// src/pages/admin/TenantBranding.jsx
// Pagina Branding con tabs stile Settings
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, Save, RotateCcw, Sparkles, User, Users, 
  UserCheck, GraduationCap, AlertCircle, Upload, Image as ImageIcon, Check,
  Layout, Maximize2, Minimize2, Stars, Layers, Square, X, ArrowLeft, Building2
} from 'lucide-react';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { defaultBranding, colorPresets, uiDensityOptions } from '../../config/tenantBranding';
import { backgroundPresets, solidBackgroundColors } from '../../config/backgroundPresets';
import { applyThemeColors, applyUiDensity, applyBackgroundPreset, applyCardTransparency } from '../../hooks/useTenantBranding';
import { uploadToR2 } from '../../storageUtils';
import { CURRENT_TENANT_ID } from '../../config/tenant';

// ============ TABS ============
const TABS = {
  TENANT: 'tenant',
  PERSONAL: 'personal',
};

// ============ TAB BUTTON ============
const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap
      ${active 
        ? 'text-blue-400 border-b-2 border-blue-400'
        : 'text-slate-400 hover:text-white'
      }
    `}
  >
    <Icon size={16} />
    {label}
  </button>
);

// ============ MAIN COMPONENT ============
export default function TenantBranding() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS.TENANT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [savingDensity, setSavingDensity] = useState(false);
  const [savingBackground, setSavingBackground] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tenantId, setTenantId] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Form per branding tenant (logo, nomi)
  const [formData, setFormData] = useState({
    appName: defaultBranding.appName,
    adminAreaName: defaultBranding.adminAreaName,
    clientAreaName: defaultBranding.clientAreaName,
    coachAreaName: defaultBranding.coachAreaName,
    collaboratoreAreaName: defaultBranding.collaboratoreAreaName,
    logoUrl: null,
  });
  
  // Colori personalizzati utente
  const [userColorPreset, setUserColorPreset] = useState('blue');
  const [userColors, setUserColors] = useState(colorPresets.blue);
  const [customColors, setCustomColors] = useState({
    primary: '#3b82f6',
    accent: '#0ea5e9',
    stars: '#38bdf8',
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  // Densità UI
  const [userDensity, setUserDensity] = useState('normal');
  
  // Sfondo e trasparenza
  const [bgPreset, setBgPreset] = useState('starryNight');
  const [bgSolidColor, setBgSolidColor] = useState('#0f172a');
  const [cardTransparency, setCardTransparency] = useState(0.6);

  // Carica branding esistente
  useEffect(() => {
    const loadBranding = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const tid = CURRENT_TENANT_ID || localStorage.getItem('tenantId');
        setTenantId(tid);

        if (tid) {
          const brandingRef = doc(db, 'tenants', tid, 'settings', 'branding');
          const brandingDoc = await getDoc(brandingRef);
          
          if (brandingDoc.exists()) {
            const data = brandingDoc.data();
            setFormData({
              appName: data.appName || defaultBranding.appName,
              adminAreaName: data.adminAreaName || defaultBranding.adminAreaName,
              clientAreaName: data.clientAreaName || defaultBranding.clientAreaName,
              coachAreaName: data.coachAreaName || defaultBranding.coachAreaName,
              collaboratoreAreaName: data.collaboratoreAreaName || defaultBranding.collaboratoreAreaName,
              logoUrl: data.logoUrl || null,
            });
            if (data.logoUrl) {
              setLogoPreview(data.logoUrl);
            }
          }
        }

        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.colorPreset) {
            setUserColorPreset(userData.colorPreset);
            if (userData.colorPreset === 'custom' && userData.colors) {
              setUserColors(userData.colors);
              setCustomColors({
                primary: userData.colors.primary,
                accent: userData.colors.accent,
                stars: userData.colors.stars,
              });
              setShowCustomPicker(true);
            } else if (colorPresets[userData.colorPreset]) {
              setUserColors(colorPresets[userData.colorPreset]);
            }
          }
          
          if (userData.uiDensity) setUserDensity(userData.uiDensity);
          if (userData.backgroundPreset) setBgPreset(userData.backgroundPreset);
          if (userData.bgSolidColor) setBgSolidColor(userData.bgSolidColor);
          if (userData.cardTransparency !== undefined) setCardTransparency(userData.cardTransparency);
        }
      } catch (error) {
        console.error('Error loading branding:', error);
        setMessage({ type: 'error', text: 'Errore nel caricamento' });
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) loadBranding();
      else setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId) {
      setMessage({ type: 'error', text: 'Tenant non trovato' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const brandingRef = doc(db, 'tenants', tenantId, 'settings', 'branding');
      const payload = { ...formData, updatedAt: new Date().toISOString() };
      await setDoc(brandingRef, payload, { merge: true });

      try {
        localStorage.setItem('tenantBranding', JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent('tenantBrandingUpdated', { detail: { tenantId, branding: payload } }));
      } catch { /* noop */ }

      setMessage({ type: 'success', text: 'Salvato!' });
    } catch (error) {
      console.error('Error saving branding:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage({ type: 'error', text: 'Immagine non valida' }); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage({ type: 'error', text: 'Max 5MB' }); return; }

    setUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
      const logoUrl = await uploadToR2(file, tenantId, 'branding');
      setFormData({ ...formData, logoUrl });
      setMessage({ type: 'success', text: 'Logo caricato!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Errore upload' });
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoUrl: null });
    setLogoPreview(null);
  };

  const handleReset = () => {
    setFormData({
      appName: defaultBranding.appName,
      adminAreaName: defaultBranding.adminAreaName,
      clientAreaName: defaultBranding.clientAreaName,
      coachAreaName: defaultBranding.coachAreaName,
      collaboratoreAreaName: defaultBranding.collaboratoreAreaName,
      logoUrl: null,
    });
    setLogoPreview(null);
    setMessage({ type: 'info', text: 'Reset completato' });
  };

  const handleColorPresetSelect = async (presetKey) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const colors = colorPresets[presetKey];
    setUserColorPreset(presetKey);
    setUserColors(colors);
    setShowCustomPicker(false);
    applyThemeColors(colors);
    
    setSavingColors(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { colorPreset: presetKey, colors, updatedAt: new Date().toISOString() }, { merge: true });
      setMessage({ type: 'success', text: `Tema "${colors.name}" applicato!` });
    } catch (error) { console.error(error); }
    finally { setSavingColors(false); }
  };

  const handleCustomColorSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const colors = {
      name: 'Personalizzato',
      primary: customColors.primary,
      accent: customColors.accent,
      stars: customColors.stars,
      primaryLight: customColors.primary + '40',
      starsSecondary: customColors.stars + 'aa',
    };
    
    setUserColorPreset('custom');
    setUserColors(colors);
    applyThemeColors(colors);
    
    setSavingColors(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { colorPreset: 'custom', colors, updatedAt: new Date().toISOString() }, { merge: true });
      setMessage({ type: 'success', text: 'Colori salvati!' });
    } catch (error) { console.error(error); }
    finally { setSavingColors(false); }
  };

  const handleDensityChange = async (density) => {
    const user = auth.currentUser;
    if (!user) return;
    setUserDensity(density);
    applyUiDensity(density);
    setSavingDensity(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { uiDensity: density, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) { console.error(error); }
    finally { setSavingDensity(false); }
  };

  const handleBackgroundPresetChange = async (preset) => {
    const user = auth.currentUser;
    if (!user) return;
    setBgPreset(preset);
    applyBackgroundPreset(preset, bgSolidColor);
    setSavingBackground(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { backgroundPreset: preset, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) { console.error(error); }
    finally { setSavingBackground(false); }
  };

  const handleSolidColorChange = async (color) => {
    const user = auth.currentUser;
    if (!user) return;
    setBgSolidColor(color);
    applyBackgroundPreset('solid', color);
    try {
      await setDoc(doc(db, 'users', user.uid), { bgSolidColor: color, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) { console.error(error); }
  };

  const handleTransparencyChange = async (value) => {
    const user = auth.currentUser;
    if (!user) return;
    const transparency = parseFloat(value);
    setCardTransparency(transparency);
    applyCardTransparency(transparency);
    try {
      await setDoc(doc(db, 'users', user.uid), { cardTransparency: transparency, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) { console.error(error); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Branding</h1>
            <p className="text-sm text-slate-400">Personalizza l'aspetto della piattaforma</p>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto" aria-label="Chiudi messaggio"><X className="w-4 h-4" /></button>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-700/30 overflow-x-auto">
          <TabButton active={activeTab === TABS.TENANT} icon={Building2} label="Tenant" onClick={() => setActiveTab(TABS.TENANT)} />
          <TabButton active={activeTab === TABS.PERSONAL} icon={Palette} label="Personale" onClick={() => setActiveTab(TABS.PERSONAL)} />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            
            {/* TENANT TAB */}
            {activeTab === TABS.TENANT && (
              <div className="bg-theme-card backdrop-blur-xl rounded-2xl border border-theme p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">Impostazioni Tenant</h2>
                  <p className="text-sm text-slate-400">Queste impostazioni influenzano tutti gli utenti</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                      <Sparkles className="w-4 h-4 text-blue-400" /> Nome Applicazione
                    </label>
                    <input type="text" value={formData.appName} onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="es. FitFlow Pro" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <User className="w-4 h-4 text-purple-400" /> Area Admin
                      </label>
                      <input type="text" value={formData.adminAreaName} onChange={(e) => setFormData({ ...formData, adminAreaName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <GraduationCap className="w-4 h-4 text-cyan-400" /> Area Coach
                      </label>
                      <input type="text" value={formData.coachAreaName} onChange={(e) => setFormData({ ...formData, coachAreaName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <UserCheck className="w-4 h-4 text-green-400" /> Area Collaboratore
                      </label>
                      <input type="text" value={formData.collaboratoreAreaName} onChange={(e) => setFormData({ ...formData, collaboratoreAreaName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Users className="w-4 h-4 text-yellow-400" /> Area Cliente
                      </label>
                      <input type="text" value={formData.clientAreaName} onChange={(e) => setFormData({ ...formData, clientAreaName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                      <ImageIcon className="w-4 h-4 text-pink-400" /> Logo
                    </label>
                    <div className="flex items-start gap-4">
                      {logoPreview ? (
                        <div className="relative">
                          <img src={logoPreview} alt="Logo" className="h-16 w-auto rounded-lg border border-slate-600" />
                          <button type="button" onClick={handleRemoveLogo} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 bg-slate-700 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${uploadingLogo ? 'bg-slate-700 text-slate-500' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                        <Upload className="w-4 h-4" />
                        {uploadingLogo ? 'Caricamento...' : 'Carica'}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">PNG, JPG o WebP. Max 5MB.</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50">
                      {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      Salva
                    </button>
                    <button type="button" onClick={handleReset} className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg">
                      <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PERSONAL TAB */}
            {activeTab === TABS.PERSONAL && (
              <div className="space-y-6">
                {/* Tema Colori */}
                <div className="bg-theme-card backdrop-blur-xl rounded-2xl border border-theme p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Tema Colori</h3>
                  <p className="text-sm text-slate-400 mb-4">Scegli la palette (solo per te)</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(colorPresets).filter(([key]) => key !== 'custom').map(([key, preset]) => (
                      <button key={key} type="button" disabled={savingColors} onClick={() => handleColorPresetSelect(key)}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          userColorPreset === key ? 'border-white bg-slate-700/50' : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                        }`}>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent }} />
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.stars }} />
                        </div>
                        <span className="text-sm text-white">{preset.name}</span>
                        {userColorPreset === key && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-slate-900" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button type="button" onClick={() => setShowCustomPicker(!showCustomPicker)}
                    className={`mt-4 w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      showCustomPicker ? 'border-white bg-slate-700/50' : 'border-slate-600 border-dashed hover:border-slate-500'
                    }`}>
                    <Palette className="w-4 h-4" />
                    <span className="text-sm">Colori Personalizzati</span>
                  </button>

                  {showCustomPicker && (
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-600 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {['primary', 'accent', 'stars'].map((colorKey) => (
                          <div key={colorKey}>
                            <label className="text-xs text-slate-400 capitalize">{colorKey}</label>
                            <div className="flex items-center gap-2 mt-1">
                              <input type="color" value={customColors[colorKey]} onChange={(e) => setCustomColors({ ...customColors, [colorKey]: e.target.value })}
                                className="w-10 h-10 rounded cursor-pointer border border-slate-600" />
                              <input type="text" value={customColors[colorKey]} onChange={(e) => setCustomColors({ ...customColors, [colorKey]: e.target.value })}
                                className="flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={handleCustomColorSave} disabled={savingColors}
                        className="w-full py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg disabled:opacity-50">
                        {savingColors ? 'Salvataggio...' : 'Applica'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Densità UI */}
                <div className="bg-theme-card backdrop-blur-xl rounded-2xl border border-theme p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Densità Interfaccia</h3>
                  <p className="text-sm text-slate-400 mb-4">Regola la spaziatura degli elementi</p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(uiDensityOptions).map(([key, option]) => {
                      const Icon = key === 'compact' ? Minimize2 : key === 'spacious' ? Maximize2 : Layout;
                      return (
                        <button key={key} type="button" onClick={() => handleDensityChange(key)} disabled={savingDensity}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            userDensity === key ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                          }`}>
                          <Icon className={`w-5 h-5 ${userDensity === key ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span className={`text-sm ${userDensity === key ? 'text-white' : 'text-slate-300'}`}>{option.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sfondo */}
                <div className="bg-theme-card backdrop-blur-xl rounded-2xl border border-theme p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Sfondo</h3>
                  <p className="text-sm text-slate-400 mb-4">Scegli lo stile dello sfondo</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(backgroundPresets).map(([key, preset]) => (
                      <button key={key} type="button" onClick={() => handleBackgroundPresetChange(key)} disabled={savingBackground}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          bgPreset === key ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                        }`}>
                        <div className="w-full h-10 rounded-lg" style={{ background: preset.preview }} />
                        <span className={`text-xs ${bgPreset === key ? 'text-white' : 'text-slate-300'}`}>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {bgPreset === 'solid' && (
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-600">
                      <label className="text-xs text-slate-400 mb-2 block">Colore sfondo:</label>
                      <div className="flex flex-wrap gap-2">
                        {solidBackgroundColors.map((c) => (
                          <button key={c.id} type="button" onClick={() => handleSolidColorChange(c.color)}
                            className={`w-8 h-8 rounded-lg border-2 ${bgSolidColor === c.color ? 'border-white' : 'border-transparent'}`}
                            style={{ backgroundColor: c.color }} title={c.name} />
                        ))}
                        <input type="color" value={bgSolidColor} onChange={(e) => handleSolidColorChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Trasparenza */}
                <div className="bg-theme-card backdrop-blur-xl rounded-2xl border border-theme p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Trasparenza Card</h3>
                  <p className="text-sm text-slate-400 mb-4">Regola la trasparenza delle card</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Square className="w-4 h-4 text-slate-500" />
                      <input type="range" min="0.2" max="1" step="0.05" value={cardTransparency} onChange={(e) => handleTransparencyChange(e.target.value)}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                      <Layers className="w-4 h-4 text-emerald-400" />
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Trasparente</span>
                      <span className="text-emerald-400">{Math.round(cardTransparency * 100)}%</span>
                      <span>Opaco</span>
                    </div>

                    <div className="flex gap-2">
                      {[{ value: 1, label: 'Opaco' }, { value: 0.7, label: 'Medio' }, { value: 0.5, label: 'Glass' }, { value: 0.3, label: 'Ultra' }].map((preset) => (
                        <button key={preset.value} type="button" onClick={() => handleTransparencyChange(preset.value)}
                          className={`flex-1 py-2 text-xs rounded-lg transition-all ${
                            Math.abs(cardTransparency - preset.value) < 0.1
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                              : 'bg-slate-800/50 text-slate-400 border border-slate-600'
                          }`}>
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                  <p className="text-sm text-blue-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Le impostazioni personali si salvano automaticamente e non influenzano gli altri utenti.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
