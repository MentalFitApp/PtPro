// src/pages/admin/TenantBranding.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, Save, RotateCcw, Sparkles, User, Users, 
  UserCheck, GraduationCap, CheckCircle, AlertCircle, Upload, Image as ImageIcon, Pipette, Check,
  Layout, Maximize2, Minimize2, Stars, Layers, Square, Moon, Sun, Sliders, Eye, X, 
  Calendar, MessageSquare, Dumbbell, TrendingUp, Heart, ExternalLink
} from 'lucide-react';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { defaultBranding, colorPresets, uiDensityOptions } from '../../config/tenantBranding';
import { backgroundPresets, solidBackgroundColors, defaultBackgroundSettings } from '../../config/backgroundPresets';
import { applyThemeColors, applyUiDensity, applyBackgroundPreset, applyCardTransparency } from '../../hooks/useTenantBranding';
import { uploadToR2 } from '../../storageUtils';
import { CURRENT_TENANT_ID } from '../../config/tenant';

// === COMPONENTE PREVIEW IMMERSIVO ===
const ImmersivePreview = ({ 
  isOpen, 
  onClose, 
  bgPreset, 
  bgSolidColor,
  cardTransparency, 
  userColors,
  userDensity 
}) => {
  if (!isOpen) return null;
  
  // Calcola gli stili dinamici
  const cardBgStyle = {
    backgroundColor: `rgba(30, 41, 59, ${cardTransparency})`,
    backdropFilter: cardTransparency < 0.95 ? `blur(${Math.round((1 - cardTransparency) * 20)}px)` : 'none',
  };
  
  const gradientStyle = userColors ? {
    background: `linear-gradient(135deg, ${userColors.primary}, ${userColors.accent})`,
    boxShadow: `0 4px 20px ${userColors.primary}40`,
  } : {};

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ 
          background: bgPreset === 'solid' ? bgSolidColor : 
                     bgPreset === 'gradient' ? `linear-gradient(135deg, #0f172a, #1e1b4b)` :
                     '#0f172a'
        }}
      >
        {/* Stelle animate simulate */}
        {bgPreset !== 'solid' && bgPreset !== 'gradient' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(bgPreset === 'galaxy' ? 40 : bgPreset === 'minimal' ? 8 : 20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: bgPreset === 'nebula' ? `${3 + Math.random() * 4}px` : `${1 + Math.random() * 2}px`,
                  height: bgPreset === 'nebula' ? `${3 + Math.random() * 4}px` : `${1 + Math.random() * 2}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  background: userColors?.stars || '#38bdf8',
                  boxShadow: bgPreset === 'nebula' 
                    ? `0 0 ${10 + Math.random() * 20}px ${userColors?.stars || '#38bdf8'}`
                    : `0 0 4px ${userColors?.stars || '#38bdf8'}`,
                }}
                animate={
                  bgPreset === 'classic' ? {
                    x: [-100, 100],
                    opacity: [0.3, 1, 0.3],
                  } : bgPreset === 'nebula' ? {
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  } : bgPreset === 'aurora' ? {
                    y: [0, -30, 0],
                    opacity: [0.5, 1, 0.5],
                  } : bgPreset === 'galaxy' ? {
                    x: [0, 20, 0, -20, 0],
                    y: [0, -10, -20, -10, 0],
                    opacity: [0.4, 0.8, 0.6, 1, 0.4],
                  } : {
                    opacity: [0.2, 0.8, 0.2],
                  }
                }
                transition={{
                  duration: bgPreset === 'minimal' ? 6 + Math.random() * 4 : 
                           bgPreset === 'galaxy' ? 20 + Math.random() * 20 :
                           3 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: 'easeInOut',
                }}
              />
            ))}
            
            {/* Aurora waves */}
            {bgPreset === 'aurora' && (
              <>
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20"
                  style={{ background: `linear-gradient(to top, ${userColors?.primary || '#06b6d4'}40, transparent)` }}
                  animate={{ y: [0, -20, 0], opacity: [0.15, 0.25, 0.15] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-1/3 opacity-15"
                  style={{ background: `linear-gradient(to top, ${userColors?.accent || '#8b5cf6'}30, transparent)` }}
                  animate={{ y: [0, -30, 0], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
              </>
            )}
          </div>
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Anteprima Live
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center p-8 pt-20">
          <div className="w-full max-w-4xl space-y-6">
            
            {/* Title */}
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl md:text-4xl font-bold text-white text-center mb-8"
            >
              La tua <span style={{ color: userColors?.primary || '#3b82f6' }}>Dashboard</span> Personale
            </motion.h1>

            {/* Stats Cards Row */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { icon: Users, label: 'Clienti', value: '24', color: userColors?.primary },
                { icon: Calendar, label: 'Appuntamenti', value: '8', color: userColors?.accent },
                { icon: TrendingUp, label: 'Progressi', value: '+12%', color: '#10b981' },
                { icon: Heart, label: 'Feedback', value: '4.9', color: '#f43f5e' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-600/50 p-4"
                  style={cardBgStyle}
                >
                  <stat.icon className="w-6 h-6 mb-2" style={{ color: stat.color }} />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Main Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-slate-600/50 p-6"
              style={cardBgStyle}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: `${userColors?.primary || '#3b82f6'}20` }}
                >
                  <Dumbbell className="w-7 h-7" style={{ color: userColors?.primary || '#3b82f6' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Scheda Allenamento</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Visualizza e modifica le schede dei tuoi clienti con il nuovo editor drag & drop.
                  </p>
                  <button
                    className="px-5 py-2.5 rounded-lg text-white font-semibold text-sm"
                    style={gradientStyle}
                  >
                    Apri Editor
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Two Column Cards */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid md:grid-cols-2 gap-4"
            >
              <div className="rounded-xl border border-slate-600/50 p-5" style={cardBgStyle}>
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-5 h-5" style={{ color: userColors?.accent || '#0ea5e9' }} />
                  <h4 className="font-semibold text-white">Messaggi Recenti</h4>
                </div>
                {['Marco R.', 'Giulia S.', 'Andrea P.'].map((name, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-slate-600" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{name}</p>
                      <p className="text-xs text-slate-500">Ultimo messaggio...</p>
                    </div>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: userColors?.stars || '#38bdf8' }}
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-600/50 p-5" style={cardBgStyle}>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5" style={{ color: userColors?.primary || '#3b82f6' }} />
                  <h4 className="font-semibold text-white">Prossimi Appuntamenti</h4>
                </div>
                {['Oggi, 15:00', 'Oggi, 17:30', 'Domani, 09:00'].map((time, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: `${userColors?.primary || '#3b82f6'}20`, color: userColors?.primary || '#3b82f6' }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">Sessione PT</p>
                      <p className="text-xs text-slate-500">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Info Bar */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-slate-500 text-sm"
            >
              Sfondo: <span className="text-slate-400">{backgroundPresets[bgPreset]?.name || 'Classico'}</span> • 
              Trasparenza: <span className="text-slate-400">{Math.round(cardTransparency * 100)}%</span> • 
              Densità: <span className="text-slate-400">{uiDensityOptions[userDensity]?.name || 'Normale'}</span>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function TenantBranding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [savingDensity, setSavingDensity] = useState(false);
  const [savingBackground, setSavingBackground] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tenantId, setTenantId] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form per branding tenant (logo, nomi)
  const [formData, setFormData] = useState({
    appName: defaultBranding.appName,
    adminAreaName: defaultBranding.adminAreaName,
    clientAreaName: defaultBranding.clientAreaName,
    coachAreaName: defaultBranding.coachAreaName,
    collaboratoreAreaName: defaultBranding.collaboratoreAreaName,
    logoUrl: null,
  });
  
  // Colori personalizzati utente (separato)
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
  const [bgPreset, setBgPreset] = useState('classic');
  const [bgSolidColor, setBgSolidColor] = useState('#0f172a');
  const [bgGradientColors, setBgGradientColors] = useState(['#0f172a', '#1e1b4b']);
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
        // Ottieni tenantId dal localStorage o usa quello configurato
        let tid = localStorage.getItem('tenantId') || CURRENT_TENANT_ID;
        
        // Se non c'è nel localStorage, salvalo per la prossima volta
        if (!localStorage.getItem('tenantId')) {
          localStorage.setItem('tenantId', tid);
          console.log('✅ TenantId salvato:', tid);
        }
        
        setTenantId(tid);

        // Carica branding tenant (logo, nomi)
        try {
          const brandingDoc = await getDoc(doc(db, 'tenants', tid, 'settings', 'branding'));
          
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
        } catch (error) {
          console.error('Error loading branding:', error);
        }
        
        // Carica colori e densità personalizzati utente
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Colori
            if (userData.colorPreset) {
              setUserColorPreset(userData.colorPreset);
              if (userData.colorPreset === 'custom' && userData.customColors) {
                setUserColors(userData.customColors);
                setCustomColors(userData.customColors);
                setShowCustomPicker(true);
              } else {
                setUserColors(colorPresets[userData.colorPreset] || colorPresets.blue);
              }
            }
            
            // Densità
            if (userData.uiDensity) {
              setUserDensity(userData.uiDensity);
            }
            
            // Sfondo
            if (userData.bgPreset) {
              setBgPreset(userData.bgPreset);
              applyBackgroundPreset(userData.bgPreset, userData.bgSolidColor, userData.bgGradientColors);
            }
            if (userData.bgSolidColor) {
              setBgSolidColor(userData.bgSolidColor);
            }
            if (userData.bgGradientColors) {
              setBgGradientColors(userData.bgGradientColors);
            }
            
            // Trasparenza card
            if (userData.cardTransparency !== undefined) {
              setCardTransparency(userData.cardTransparency);
              applyCardTransparency(userData.cardTransparency);
            }
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
        
      } catch (error) {
        console.error('Error in loadBranding:', error);
        setMessage({ type: 'error', text: 'Errore nel caricamento delle impostazioni' });
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, []);

  // Salva branding tenant (logo, nomi) - solo per admin
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const brandingRef = doc(db, 'tenants', tenantId, 'settings', 'branding');
      await setDoc(brandingRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setMessage({ type: 'success', text: 'Impostazioni salvate con successo! Ricarica la pagina per vedere le modifiche.' });
    } catch (error) {
      console.error('Error saving branding:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Per favore carica un\'immagine valida (JPG, PNG, WebP)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      setMessage({ type: 'error', text: 'L\'immagine deve essere inferiore a 5MB' });
      return;
    }

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });

    try {
      // Crea preview locale
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload su R2
      const logoUrl = await uploadToR2(file, tenantId, 'branding');
      
      setFormData({ ...formData, logoUrl });
      setMessage({ type: 'success', text: 'Logo caricato! Ricorda di cliccare "Salva Modifiche"' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Errore durante il caricamento del logo' });
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoUrl: null });
    setLogoPreview(null);
    setMessage({ type: 'info', text: 'Logo rimosso. Ricorda di salvare le modifiche.' });
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
    setMessage({ type: 'info', text: 'Ripristinati i valori predefiniti' });
  };

  // Seleziona un preset colore e applica immediatamente
  const handleColorPresetSelect = async (presetKey) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const colors = colorPresets[presetKey];
    setUserColorPreset(presetKey);
    setUserColors(colors);
    setShowCustomPicker(false);
    
    // Applica immediatamente i colori
    applyThemeColors(colors);
    
    // Salva nel profilo utente (usa setDoc con merge per creare se non esiste)
    setSavingColors(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        colorPreset: presetKey,
        colors: colors,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setMessage({ type: 'success', text: `Tema "${colors.name}" applicato!` });
    } catch (error) {
      console.error('Error saving color preset:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio del tema colori' });
    } finally {
      setSavingColors(false);
    }
  };

  // Salva colori personalizzati
  const handleCustomColorSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Genera colori derivati dal colore primario
    const hexToHsl = (hex) => {
      let r = parseInt(hex.slice(1, 3), 16) / 255;
      let g = parseInt(hex.slice(3, 5), 16) / 255;
      let b = parseInt(hex.slice(5, 7), 16) / 255;
      let max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) { h = s = 0; }
      else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      return [h * 360, s * 100, l * 100];
    };
    
    const hslToHex = (h, s, l) => {
      s /= 100; l /= 100;
      const a = s * Math.min(l, 1 - l);
      const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };
    
    const [h, s, l] = hexToHsl(customColors.primary);
    
    const fullCustomColors = {
      name: 'Personalizzato',
      primary: customColors.primary,
      primaryLight: hslToHex(h, s, Math.min(l + 10, 90)),
      primaryDark: hslToHex(h, s, Math.max(l - 10, 20)),
      accent: customColors.accent,
      accentLight: hslToHex(hexToHsl(customColors.accent)[0], s, Math.min(l + 10, 90)),
      stars: customColors.stars,
      starsSecondary: customColors.accent,
    };
    
    setUserColorPreset('custom');
    setUserColors(fullCustomColors);
    applyThemeColors(fullCustomColors);
    
    setSavingColors(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        colorPreset: 'custom',
        customColors: fullCustomColors,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setMessage({ type: 'success', text: 'Colori personalizzati salvati!' });
    } catch (error) {
      console.error('Error saving custom colors:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio' });
    } finally {
      setSavingColors(false);
    }
  };

  // Cambia densità UI
  const handleDensityChange = async (density) => {
    const user = auth.currentUser;
    if (!user) return;
    
    setUserDensity(density);
    applyUiDensity(density);
    
    setSavingDensity(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uiDensity: density,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setMessage({ type: 'success', text: `Densità "${uiDensityOptions[density].name}" applicata!` });
    } catch (error) {
      console.error('Error saving density:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio' });
    } finally {
      setSavingDensity(false);
    }
  };

  // Cambia preset sfondo
  const handleBackgroundPresetChange = async (preset) => {
    const user = auth.currentUser;
    if (!user) return;
    
    setBgPreset(preset);
    applyBackgroundPreset(preset, bgSolidColor, bgGradientColors);
    
    setSavingBackground(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        bgPreset: preset,
        bgSolidColor,
        bgGradientColors,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setMessage({ type: 'success', text: `Sfondo "${backgroundPresets[preset].name}" applicato!` });
    } catch (error) {
      console.error('Error saving background:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio' });
    } finally {
      setSavingBackground(false);
    }
  };

  // Cambia colore sfondo solido
  const handleSolidColorChange = async (color) => {
    const user = auth.currentUser;
    if (!user) return;
    
    setBgSolidColor(color);
    applyBackgroundPreset('solid', color, bgGradientColors);
    setBgPreset('solid');
    
    setSavingBackground(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        bgPreset: 'solid',
        bgSolidColor: color,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving solid color:', error);
    } finally {
      setSavingBackground(false);
    }
  };

  // Cambia trasparenza card
  const handleTransparencyChange = async (value) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const transparency = parseFloat(value);
    setCardTransparency(transparency);
    applyCardTransparency(transparency);
    
    // Debounce il salvataggio
    if (window.transparencyTimeout) clearTimeout(window.transparencyTimeout);
    window.transparencyTimeout = setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          cardTransparency: transparency,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (error) {
        console.error('Error saving transparency:', error);
      }
    }, 500);
  };

  // Reset colori a default blu
  const handleResetColors = async () => {
    setShowCustomPicker(false);
    await handleColorPresetSelect('blue');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6">
      {/* PREVIEW IMMERSIVO */}
      <ImmersivePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        bgPreset={bgPreset}
        bgSolidColor={bgSolidColor}
        cardTransparency={cardTransparency}
        userColors={userColors}
        userDensity={userDensity}
      />

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-purple-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 shadow-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Personalizzazione Branding
            </h1>
          </div>
          
          {/* Bottone Preview */}
          <motion.button
            onClick={() => setShowPreview(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Anteprima Live</span>
          </motion.button>
        </div>
        <p className="text-slate-300 text-sm sm:text-base ml-13">
          Personalizza i nomi delle aree della tua piattaforma
        </p>
      </motion.div>

      {/* HERO BOX - THEME PREVIEW PAGE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl border border-purple-500/30"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-blue-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        
        {/* Decorative stars */}
        <div className="absolute top-4 right-8 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        <div className="absolute top-8 right-20 w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse delay-300" />
        <div className="absolute bottom-6 right-16 w-1 h-1 rounded-full bg-blue-400 animate-pulse delay-700" />
        
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-purple-500/40">
                <Stars className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                🎨 Editor Tema Immersivo
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mb-4">
                Personalizza <span className="text-purple-300 font-medium">colori</span>, 
                <span className="text-pink-300 font-medium"> sfondi animati</span>, 
                <span className="text-blue-300 font-medium"> trasparenza</span> e 
                <span className="text-cyan-300 font-medium"> densità UI</span> in tempo reale 
                con un'anteprima completa della tua dashboard.
              </p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: '5 sfondi stellati', icon: Stars },
                  { label: 'Colori personalizzati', icon: Palette },
                  { label: 'Trasparenza card', icon: Layers },
                  { label: 'Preview real-time', icon: Eye },
                ].map((feature, i) => (
                  <span 
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-600/50 text-xs text-slate-300"
                  >
                    <feature.icon className="w-3 h-3 text-purple-400" />
                    {feature.label}
                  </span>
                ))}
              </div>
            </div>
            
            {/* CTA Button */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <motion.button
                onClick={() => navigate('/admin/theme-preview')}
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-bold rounded-xl shadow-xl shadow-purple-500/30 transition-all"
              >
                <span>Apri Editor Tema</span>
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MESSAGGIO */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : message.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm">{message.text}</p>
        </motion.div>
      )}

      {/* FORM */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-xl space-y-6"
      >
        {/* Nome App */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Nome Applicazione
          </label>
          <input
            type="text"
            value={formData.appName}
            onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="es. FitFlow Pro"
          />
          <p className="text-xs text-slate-500">Apparirà nell'header mobile e nei titoli</p>
        </div>

        {/* Area Admin */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <User className="w-4 h-4 text-purple-400" />
            Nome Area Admin/CEO
          </label>
          <input
            type="text"
            value={formData.adminAreaName}
            onChange={(e) => setFormData({ ...formData, adminAreaName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="es. Area Personale, Dashboard Admin, Pannello di Controllo"
          />
          <p className="text-xs text-slate-500">Visibile solo agli amministratori</p>
        </div>

        {/* Area Coach */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            Nome Area Coach
          </label>
          <input
            type="text"
            value={formData.coachAreaName}
            onChange={(e) => setFormData({ ...formData, coachAreaName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder="es. Area Coach, Dashboard Trainer"
          />
          <p className="text-xs text-slate-500">Visibile ai coach/personal trainer</p>
        </div>

        {/* Area Collaboratore */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <UserCheck className="w-4 h-4 text-green-400" />
            Nome Area Collaboratore
          </label>
          <input
            type="text"
            value={formData.collaboratoreAreaName}
            onChange={(e) => setFormData({ ...formData, collaboratoreAreaName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="es. Area Collaboratore, Dashboard Setter"
          />
          <p className="text-xs text-slate-500">Visibile ai collaboratori/setter</p>
        </div>

        {/* Area Cliente */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Users className="w-4 h-4 text-yellow-400" />
            Nome Area Cliente
          </label>
          <input
            type="text"
            value={formData.clientAreaName}
            onChange={(e) => setFormData({ ...formData, clientAreaName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            placeholder="es. Area Cliente, Il Mio Spazio, Dashboard Personale"
          />
          <p className="text-xs text-slate-500">Visibile ai clienti finali</p>
        </div>

        {/* PALETTE COLORI - Personale per ogni utente */}
        <div className="space-y-3 pt-4 border-t border-slate-700">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Pipette className="w-4 h-4 text-blue-400" />
            Tema Colori Personale
            {savingColors && (
              <span className="ml-2 text-xs text-blue-400 animate-pulse">Salvataggio...</span>
            )}
          </label>
          <p className="text-xs text-slate-500">
            Seleziona una palette colori per personalizzare l'aspetto dell'app (solo per te)
          </p>
          
          {/* Color Preset Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            {Object.entries(colorPresets).filter(([key]) => key !== 'custom').map(([key, preset]) => {
              const isSelected = userColorPreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={savingColors}
                  onClick={() => handleColorPresetSelect(key)}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${isSelected 
                      ? 'border-white bg-slate-700/50 shadow-lg' 
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-700/50'
                    }
                    ${savingColors ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {/* Color Preview Circles */}
                  <div className="flex gap-2">
                    <div 
                      className="w-6 h-6 rounded-full shadow-lg"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full shadow-lg"
                      style={{ backgroundColor: preset.accent }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full shadow-lg"
                      style={{ backgroundColor: preset.stars }}
                    />
                  </div>
                  
                  {/* Preset Name */}
                  <span className="text-sm font-medium text-white">{preset.name}</span>
                  
                  {/* Selected Check */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-3 h-3 text-slate-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Color Toggle */}
          <button
            type="button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className={`
              w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
              ${showCustomPicker || userColorPreset === 'custom'
                ? 'border-white bg-slate-700/50' 
                : 'border-slate-600 border-dashed hover:border-slate-500 bg-slate-800/30'
              }
            `}
          >
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">Colori Personalizzati</span>
          </button>

          {/* Custom Color Picker */}
          {showCustomPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-600 space-y-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Primario</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.primary}
                      onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-600"
                    />
                    <input
                      type="text"
                      value={customColors.primary}
                      onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                      className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-600 rounded text-xs text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Accento</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.accent}
                      onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-600"
                    />
                    <input
                      type="text"
                      value={customColors.accent}
                      onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                      className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-600 rounded text-xs text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Stelle</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.stars}
                      onChange={(e) => setCustomColors({ ...customColors, stars: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-600"
                    />
                    <input
                      type="text"
                      value={customColors.stars}
                      onChange={(e) => setCustomColors({ ...customColors, stars: e.target.value })}
                      className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-600 rounded text-xs text-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Preview Custom */}
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <button 
                  type="button"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-lg"
                  style={{ 
                    background: `linear-gradient(to right, ${customColors.primary}, ${customColors.accent})`,
                    boxShadow: `0 4px 14px ${customColors.primary}40`
                  }}
                >
                  Anteprima
                </button>
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div 
                      key={i}
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: customColors.stars }}
                    />
                  ))}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleCustomColorSave}
                disabled={savingColors}
                className="w-full py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-medium rounded-lg transition-all disabled:opacity-50"
              >
                {savingColors ? 'Salvataggio...' : 'Applica Colori Personalizzati'}
              </button>
            </motion.div>
          )}

          {/* Live Preview */}
          {userColors && (
            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-600">
              <p className="text-xs text-slate-400 mb-3">Anteprima tema attivo</p>
              <div className="flex items-center gap-3">
                {/* Primary Button Preview */}
                <button 
                  type="button"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-lg transition-all hover:opacity-90"
                  style={{ 
                    background: `linear-gradient(to right, ${userColors.primary}, ${userColors.accent})`,
                    boxShadow: `0 4px 14px ${userColors.primary}40`
                  }}
                >
                  Bottone
                </button>
                {/* Badge Preview */}
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ 
                    backgroundColor: `${userColors.primary}20`,
                    color: userColors.primaryLight,
                    border: `1px solid ${userColors.primary}40`
                  }}
                >
                  Badge
                </span>
                {/* Star Preview */}
                <div className="flex gap-1">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: userColors.stars }}
                  />
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse delay-100"
                    style={{ backgroundColor: userColors.starsSecondary }}
                  />
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse delay-200"
                    style={{ backgroundColor: userColors.stars }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LOGO PERSONALIZZATO */}
        <div className="space-y-3 pt-4 border-t border-slate-700">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <ImageIcon className="w-4 h-4 text-pink-400" />
            Logo Personalizzato
          </label>
          
          {/* Preview Logo */}
          {logoPreview && (
            <div className="relative w-full max-w-xs mx-auto">
              <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 flex items-center justify-center">
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
              <div className={`
                flex items-center justify-center gap-2 px-4 py-3 
                bg-slate-900/50 border-2 border-dashed border-slate-600 
                rounded-lg text-slate-300 hover:border-pink-500 hover:text-pink-400 
                transition-all
                ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-900/70'}
              `}>
                {uploadingLogo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-400"></div>
                    <span className="text-sm">Caricamento...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">
                      {logoPreview ? 'Cambia Logo' : 'Carica Logo'}
                    </span>
                  </>
                )}
              </div>
            </label>
          </div>
          
          <p className="text-xs text-slate-500">
            Formati supportati: JPG, PNG, WebP • Max 5MB • Consigliato: 200x50px
          </p>
          <p className="text-xs text-slate-400 italic">
            Il logo apparirà nell'header mobile al posto del nome dell'app
          </p>
        </div>

        {/* UI DENSITY */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Layout className="w-4 h-4 text-cyan-400" />
            Densità Interfaccia
          </label>
          
          <p className="text-xs text-slate-400">
            Regola la spaziatura dell'interfaccia per adattarla alle tue preferenze
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(uiDensityOptions).map(([key, option]) => {
              const DensityIcon = key === 'compact' ? Minimize2 : key === 'spacious' ? Maximize2 : Layout;
              const isSelected = userDensity === key;
              
              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => handleDensityChange(key)}
                  disabled={savingDensity}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${isSelected 
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20' 
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }
                    ${savingDensity ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  
                  <DensityIcon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {option.name}
                  </span>
                  
                  {/* Visual Preview */}
                  <div className="w-full mt-2">
                    <div className="flex flex-col bg-slate-900/50 rounded-lg overflow-hidden">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 border-b border-slate-700 last:border-0"
                          style={{ 
                            padding: key === 'compact' ? '4px 6px' : key === 'spacious' ? '8px 12px' : '6px 8px'
                          }}
                        >
                          <div className="w-2 h-2 rounded-full bg-slate-600" />
                          <div 
                            className="flex-1 rounded bg-slate-600"
                            style={{ height: key === 'compact' ? '4px' : key === 'spacious' ? '8px' : '6px' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
          
          {savingDensity && (
            <p className="text-xs text-cyan-400 text-center animate-pulse">
              Applicando nuova densità...
            </p>
          )}
        </div>

        {/* SFONDO STELLATO */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Stars className="w-4 h-4 text-purple-400" />
            Sfondo Stellato
          </label>
          
          <p className="text-xs text-slate-400">
            Scegli l'animazione dello sfondo o disattivala completamente
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(backgroundPresets).map(([key, preset]) => {
              const isSelected = bgPreset === key;
              
              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => handleBackgroundPresetChange(key)}
                  disabled={savingBackground}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                    ${isSelected 
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' 
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }
                    ${savingBackground ? 'opacity-50' : ''}
                  `}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  
                  {/* Preview */}
                  <div 
                    className="w-full h-12 rounded-lg overflow-hidden relative"
                    style={{ background: preset.preview }}
                  >
                    {preset.type === 'stars' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                            style={{
                              top: `${20 + Math.random() * 60}%`,
                              left: `${10 + Math.random() * 80}%`,
                              animationDelay: `${i * 0.3}s`,
                              opacity: 0.6 + Math.random() * 0.4
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {preset.type === 'aurora' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-purple-500/20 to-transparent animate-pulse" />
                    )}
                  </div>
                  
                  <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {preset.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
          
          {/* Colore solido personalizzato */}
          {bgPreset === 'solid' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-600"
            >
              <label className="text-xs text-slate-400 mb-3 block">Scegli colore sfondo:</label>
              <div className="flex flex-wrap gap-2">
                {solidBackgroundColors.map((colorOption) => (
                  <button
                    key={colorOption.id}
                    type="button"
                    onClick={() => handleSolidColorChange(colorOption.color)}
                    className={`
                      w-10 h-10 rounded-lg border-2 transition-all
                      ${bgSolidColor === colorOption.color 
                        ? 'border-white scale-110' 
                        : 'border-transparent hover:border-slate-500'
                      }
                    `}
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
                <div className="flex items-center gap-2 ml-2">
                  <input
                    type="color"
                    value={bgSolidColor}
                    onChange={(e) => handleSolidColorChange(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-600"
                  />
                  <span className="text-xs text-slate-500">Custom</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* TRASPARENZA CARD */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            Trasparenza Card
          </label>
          
          <p className="text-xs text-slate-400">
            Regola quanto le card sono trasparenti per vedere lo sfondo
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Square className="w-4 h-4 text-slate-500" />
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={cardTransparency}
                onChange={(e) => handleTransparencyChange(e.target.value)}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-emerald-500
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow-lg"
              />
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            
            <div className="flex justify-between text-xs text-slate-500">
              <span>Trasparente</span>
              <span className="text-emerald-400 font-medium">{Math.round(cardTransparency * 100)}% opacità</span>
              <span>Opaco</span>
            </div>
            
            {/* Preview card trasparenza */}
            <div className="relative p-4 rounded-xl border border-slate-600 overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30"
                style={{ opacity: 1 - cardTransparency + 0.2 }}
              />
              <div 
                className="relative p-4 rounded-lg border border-slate-500"
                style={{ 
                  backgroundColor: `rgba(30, 41, 59, ${cardTransparency})`,
                  backdropFilter: cardTransparency < 0.95 ? `blur(${Math.round((1 - cardTransparency) * 20)}px)` : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/50" />
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-slate-400/50 rounded mb-2" />
                    <div className="h-2 w-32 bg-slate-500/50 rounded" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Preset rapidi */}
            <div className="flex gap-2">
              {[
                { value: 1, label: 'Opaco' },
                { value: 0.7, label: 'Medio' },
                { value: 0.5, label: 'Glass' },
                { value: 0.3, label: 'Ultra' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleTransparencyChange(preset.value)}
                  className={`
                    flex-1 py-2 text-xs font-medium rounded-lg transition-all
                    ${Math.abs(cardTransparency - preset.value) < 0.1
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-600 hover:border-slate-500'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTONI */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salva Modifiche</span>
              </>
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={handleReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ripristina Default</span>
          </motion.button>
        </div>
      </motion.form>

      {/* INFO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20"
      >
        <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Note Importanti
        </h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Le modifiche saranno visibili dopo aver ricaricato la pagina</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Questi nomi sono visibili solo agli utenti del tuo tenant</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Le funzionalità dell'app rimangono invariate, cambia solo la nomenclatura</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Puoi ripristinare i valori predefiniti in qualsiasi momento</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
