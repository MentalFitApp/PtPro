// src/pages/admin/ThemePreview.jsx
// Pagina preview immersiva per personalizzazione tema
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, ChevronLeft, ChevronRight, Users, TrendingUp, Calendar, 
  MessageSquare, Dumbbell, Star, Check, Sliders, Layers, Stars,
  Layout, Minimize2, Maximize2, Eye, Save, RotateCcw, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { colorPresets, uiDensityOptions } from '../../config/tenantBranding';
import { backgroundPresets, solidBackgroundColors } from '../../config/backgroundPresets';
import { applyThemeColors, applyUiDensity, applyBackgroundPreset, applyCardTransparency } from '../../hooks/useTenantBranding';

export default function ThemePreview() {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('colors');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Stati personalizzazione
  const [colorPreset, setColorPreset] = useState('blue');
  const [customColors, setCustomColors] = useState({
    primary: '#3b82f6',
    accent: '#0ea5e9',
    stars: '#38bdf8',
  });
  const [showCustomColors, setShowCustomColors] = useState(false);
  const [bgPreset, setBgPreset] = useState('classic');
  const [bgSolidColor, setBgSolidColor] = useState('#0f172a');
  const [cardTransparency, setCardTransparency] = useState(0.6);
  const [uiDensity, setUiDensity] = useState('normal');

  // Carica impostazioni utente
  useEffect(() => {
    const loadSettings = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.colorPreset) setColorPreset(data.colorPreset);
          if (data.customColors) setCustomColors(data.customColors);
          if (data.bgPreset) setBgPreset(data.bgPreset);
          if (data.bgSolidColor) setBgSolidColor(data.bgSolidColor);
          if (data.cardTransparency !== undefined) setCardTransparency(data.cardTransparency);
          if (data.uiDensity) setUiDensity(data.uiDensity);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Applica colore preset
  const handleColorChange = (preset) => {
    setColorPreset(preset);
    setShowCustomColors(false);
    if (colorPresets[preset]) {
      applyThemeColors(colorPresets[preset]);
    }
  };

  // Applica colori custom
  const handleCustomColorChange = (field, value) => {
    const newColors = { ...customColors, [field]: value };
    setCustomColors(newColors);
    
    // Genera colori completi
    const fullColors = {
      primary: newColors.primary,
      primaryLight: newColors.primary + 'cc',
      primaryDark: newColors.primary,
      accent: newColors.accent,
      accentLight: newColors.accent + 'cc',
      stars: newColors.stars,
      starsSecondary: newColors.accent,
    };
    applyThemeColors(fullColors);
  };

  // Applica sfondo
  const handleBgChange = (preset) => {
    setBgPreset(preset);
    applyBackgroundPreset(preset, bgSolidColor, ['#0f172a', '#1e1b4b']);
  };

  // Applica colore solido
  const handleSolidColorChange = (color) => {
    setBgSolidColor(color);
    setBgPreset('solid');
    applyBackgroundPreset('solid', color, null);
  };

  // Applica trasparenza
  const handleTransparencyChange = (value) => {
    setCardTransparency(value);
    applyCardTransparency(value);
  };

  // Applica densità
  const handleDensityChange = (density) => {
    setUiDensity(density);
    applyUiDensity(density);
  };

  // Salva tutte le impostazioni
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const colors = showCustomColors ? customColors : colorPresets[colorPreset];
      await setDoc(doc(db, 'users', user.uid), {
        colorPreset: showCustomColors ? 'custom' : colorPreset,
        colors,
        customColors: showCustomColors ? customColors : null,
        bgPreset,
        bgSolidColor,
        cardTransparency,
        uiDensity,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      setMessage('✓ Salvato!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Error saving:', error);
      setMessage('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // Reset
  const handleReset = () => {
    handleColorChange('blue');
    handleBgChange('classic');
    handleTransparencyChange(0.6);
    handleDensityChange('normal');
  };

  const tabs = [
    { id: 'colors', label: 'Colori', icon: Palette },
    { id: 'background', label: 'Sfondo', icon: Stars },
    { id: 'cards', label: 'Card', icon: Layers },
    { id: 'density', label: 'Densità', icon: Layout },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Preview Area - Simulazione Dashboard */}
      <div className="flex-1 overflow-auto bg-slate-900 p-6">
        {/* Header Preview */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/admin/branding')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Torna al Branding</span>
          </button>
          
          <div className="flex items-center gap-3">
            {message && (
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-400 text-sm"
              >
                {message}
              </motion.span>
            )}
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvataggio...' : 'Salva Tema'}
            </button>
          </div>
        </div>

        {/* Simulated Dashboard */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Welcome Banner */}
          <motion.div 
            className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-700"
            style={{ 
              backgroundColor: `rgba(30, 41, 59, ${cardTransparency})`,
              backdropFilter: cardTransparency < 0.95 ? `blur(${Math.round((1 - cardTransparency) * 20)}px)` : 'none'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Bentornato, <span className="text-blue-400">Marco</span>! 👋
                </h1>
                <p className="text-slate-400">Ecco come appare la tua dashboard con il tema attuale</p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-400 fill-blue-400" />
                <Star className="w-5 h-5 text-blue-400 fill-blue-400" />
                <Star className="w-5 h-5 text-blue-400 fill-blue-400" />
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Clienti Attivi', value: '24', icon: Users, color: 'blue' },
              { label: 'Sessioni Mese', value: '156', icon: Calendar, color: 'emerald' },
              { label: 'Messaggi', value: '12', icon: MessageSquare, color: 'purple' },
              { label: 'Crescita', value: '+18%', icon: TrendingUp, color: 'amber' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-4 border border-slate-700"
                style={{ 
                  backgroundColor: `rgba(30, 41, 59, ${cardTransparency})`,
                  backdropFilter: cardTransparency < 0.95 ? `blur(${Math.round((1 - cardTransparency) * 20)}px)` : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Content Cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Client List Preview */}
            <motion.div
              className="rounded-xl border border-slate-700 overflow-hidden"
              style={{ 
                backgroundColor: `rgba(30, 41, 59, ${cardTransparency})`,
                backdropFilter: cardTransparency < 0.95 ? `blur(${Math.round((1 - cardTransparency) * 20)}px)` : 'none'
              }}
            >
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Clienti Recenti
                </h3>
              </div>
              <div className="divide-y divide-slate-700">
                {['Anna Rossi', 'Marco Bianchi', 'Giulia Verdi'].map((name, i) => (
                  <div key={name} className="p-4 flex items-center gap-3 hover:bg-slate-700/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{name}</p>
                      <p className="text-xs text-slate-400">Ultimo accesso: oggi</p>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3].map(s => (
                        <div key={s} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${s * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Activity Preview */}
            <motion.div
              className="rounded-xl border border-slate-700 overflow-hidden"
              style={{ 
                backgroundColor: `rgba(30, 41, 59, ${cardTransparency})`,
                backdropFilter: cardTransparency < 0.95 ? `blur(${Math.round((1 - cardTransparency) * 20)}px)` : 'none'
              }}
            >
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  Attività Recenti
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { text: 'Nuovo piano assegnato a Marco', time: '2 min fa', color: 'blue' },
                  { text: 'Check-in completato da Anna', time: '15 min fa', color: 'emerald' },
                  { text: 'Messaggio da Giulia', time: '1 ora fa', color: 'purple' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${activity.color}-400 mt-2`} />
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.text}</p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Buttons Preview */}
          <motion.div
            className="rounded-xl p-6 border border-slate-700"
            style={{ 
              backgroundColor: `rgba(30, 41, 59, ${cardTransparency})`,
              backdropFilter: cardTransparency < 0.95 ? `blur(${Math.round((1 - cardTransparency) * 20)}px)` : 'none'
            }}
          >
            <h3 className="font-semibold text-white mb-4">Preview Bottoni e Badge</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium shadow-lg shadow-blue-500/30">
                Primario
              </button>
              <button className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium">
                Secondario
              </button>
              <button className="px-4 py-2 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500/10 font-medium">
                Outline
              </button>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                Badge
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                Attivo
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Control Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                Personalizza
              </h2>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 p-3 text-xs font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mx-auto mb-1" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* COLORI TAB */}
              {activeTab === 'colors' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">Scegli la palette colori</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(colorPresets).filter(([k]) => k !== 'custom').map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => handleColorChange(key)}
                        className={`relative p-3 rounded-lg border-2 transition-all ${
                          colorPreset === key && !showCustomColors
                            ? 'border-white bg-slate-800' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {colorPreset === key && !showCustomColors && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-slate-900" />
                          </div>
                        )}
                        <div 
                          className="w-full h-6 rounded-md mb-1"
                          style={{ background: `linear-gradient(to right, ${preset.primary}, ${preset.accent})` }}
                        />
                        <span className="text-xs text-slate-400">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Colors Toggle */}
                  <button
                    onClick={() => setShowCustomColors(!showCustomColors)}
                    className={`w-full p-3 rounded-lg border-2 border-dashed transition-all ${
                      showCustomColors 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-sm text-slate-400">✨ Colori Personalizzati</span>
                  </button>

                  {showCustomColors && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 p-3 bg-slate-800/50 rounded-lg"
                    >
                      {[
                        { key: 'primary', label: 'Primario' },
                        { key: 'accent', label: 'Accento' },
                        { key: 'stars', label: 'Stelle' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColors[key]}
                            onChange={(e) => handleCustomColorChange(key, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <span className="text-xs text-slate-400 flex-1">{label}</span>
                          <input
                            type="text"
                            value={customColors[key]}
                            onChange={(e) => handleCustomColorChange(key, e.target.value)}
                            className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {/* SFONDO TAB */}
              {activeTab === 'background' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">Scegli lo sfondo animato</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(backgroundPresets).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => handleBgChange(key)}
                        className={`relative p-2 rounded-lg border-2 transition-all ${
                          bgPreset === key 
                            ? 'border-purple-500 bg-purple-500/10' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {bgPreset === key && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div 
                          className="w-full h-10 rounded mb-1 relative overflow-hidden"
                          style={{ background: preset.preview }}
                        >
                          {preset.type === 'stars' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              {[...Array(3)].map((_, i) => (
                                <div 
                                  key={i}
                                  className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                                  style={{
                                    top: `${20 + i * 25}%`,
                                    left: `${20 + i * 30}%`,
                                    animationDelay: `${i * 0.3}s`
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Solid Color Picker */}
                  {bgPreset === 'solid' && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">Colore sfondo:</p>
                      <div className="flex flex-wrap gap-2">
                        {solidBackgroundColors.slice(0, 8).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleSolidColorChange(c.color)}
                            className={`w-8 h-8 rounded-lg border-2 ${
                              bgSolidColor === c.color ? 'border-white' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c.color }}
                            title={c.name}
                          />
                        ))}
                        <input
                          type="color"
                          value={bgSolidColor}
                          onChange={(e) => handleSolidColorChange(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CARD TAB */}
              {activeTab === 'cards' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">Regola la trasparenza delle card</p>
                  
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.05"
                      value={cardTransparency}
                      onChange={(e) => handleTransparencyChange(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Glass</span>
                      <span className="text-blue-400">{Math.round(cardTransparency * 100)}%</span>
                      <span>Opaco</span>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 0.3, label: 'Ultra' },
                      { value: 0.5, label: 'Glass' },
                      { value: 0.7, label: 'Medio' },
                      { value: 1, label: 'Opaco' },
                    ].map((p) => (
                      <button
                        key={p.value}
                        onClick={() => handleTransparencyChange(p.value)}
                        className={`py-2 text-xs rounded-lg border transition-all ${
                          Math.abs(cardTransparency - p.value) < 0.1
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-700 text-slate-500 hover:border-slate-600'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Preview Box */}
                  <div className="relative p-4 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                    <div 
                      className="relative p-3 rounded-lg border border-slate-600"
                      style={{ 
                        backgroundColor: `rgba(30, 41, 59, ${cardTransparency})`,
                        backdropFilter: cardTransparency < 0.95 ? `blur(12px)` : 'none'
                      }}
                    >
                      <p className="text-xs text-white">Preview Card</p>
                      <p className="text-xs text-slate-400 mt-1">Guarda lo sfondo</p>
                    </div>
                  </div>
                </div>
              )}

              {/* DENSITY TAB */}
              {activeTab === 'density' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">Regola la spaziatura</p>
                  
                  <div className="space-y-2">
                    {Object.entries(uiDensityOptions).map(([key, option]) => {
                      const Icon = key === 'compact' ? Minimize2 : key === 'spacious' ? Maximize2 : Layout;
                      return (
                        <button
                          key={key}
                          onClick={() => handleDensityChange(key)}
                          className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                            uiDensity === key 
                              ? 'border-cyan-500 bg-cyan-500/10' 
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${uiDensity === key ? 'text-cyan-400' : 'text-slate-500'}`} />
                          <div className="flex-1 text-left">
                            <p className={`text-sm font-medium ${uiDensity === key ? 'text-white' : 'text-slate-400'}`}>
                              {option.name}
                            </p>
                            <p className="text-xs text-slate-500">{option.description}</p>
                          </div>
                          {uiDensity === key && (
                            <Check className="w-4 h-4 text-cyan-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Panel Button */}
      {!panelOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setPanelOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 p-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30 text-white"
        >
          <Sliders className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}
