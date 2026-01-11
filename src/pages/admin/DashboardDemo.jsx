// src/pages/admin/DashboardDemo.jsx
// Dashboard 2.0 - Dashboard principale con design Nebula
// Logica completa da DashboardPro

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, onSnapshot, getDocs, doc, getDoc, query, orderBy, limit, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db, toDate } from '../../firebase';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantBranding } from '../../hooks/useTenantBranding';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePageInfo } from '../../contexts/PageContext';
import {
  Users, DollarSign, TrendingUp, TrendingDown, Calendar,
  ChevronRight, ChevronLeft, Bell, Search, Plus, Settings, BarChart2,
  Activity, Target, Zap, Eye, EyeOff, Clock, AlertCircle,
  CheckCircle, Phone, ArrowUpRight, MessageCircle, Sparkles,
  UserPlus, Dumbbell, Utensils, CreditCard, RefreshCw,
  MoreHorizontal, Filter, Download, ArrowUp, ArrowDown,
  Star, Trophy, Flame, Heart, FileText, ClipboardList,
  X, Edit3, Pencil, Check, ChevronDown, ChevronUp,
  Palette, Globe, Mail, Link as LinkIcon, Image, User, LogOut
} from 'lucide-react';
import NebulaBackground, { NEBULA_PRESETS, PRESET_INFO } from '../../components/ui/NebulaBackground';

// ============================================
// AVAILABLE QUICK ACTIONS (Personalizzabili)
// ============================================
const AVAILABLE_ACTIONS = [
  { id: 'analytics', label: 'Analytics', path: '/analytics', icon: BarChart2, color: 'purple' },
  { id: 'settings', label: 'Impostazioni', path: '/admin/settings', icon: Settings, color: 'slate' },
  { id: 'branding', label: 'Branding', path: '/admin/branding', icon: Palette, color: 'pink' },
  { id: 'clients', label: 'Clienti', path: '/clients', icon: Users, color: 'blue' },
  { id: 'new-client', label: 'Nuovo Cliente', path: '/new-client', icon: UserPlus, color: 'emerald' },
  { id: 'calendar', label: 'Calendario', path: '/calendar', icon: Calendar, color: 'cyan' },
  { id: 'calls', label: 'Chiamate', path: '/calls-calendar', icon: Phone, color: 'cyan' },
  { id: 'chat', label: 'Chat', path: '/chat', icon: MessageCircle, color: 'purple' },
  { id: 'exercises', label: 'Esercizi', path: '/exercises', icon: Dumbbell, color: 'blue' },
  { id: 'foods', label: 'Alimenti', path: '/foods', icon: Utensils, color: 'green' },
  { id: 'templates', label: 'Template', path: '/templates', icon: FileText, color: 'amber' },
  { id: 'landing', label: 'Landing Pages', path: '/admin/landing-pages', icon: Globe, color: 'indigo' },
  { id: 'community', label: 'Community', path: '/community', icon: Users, color: 'violet' },
  { id: 'payments', label: 'Pagamenti', path: '/payments', icon: CreditCard, color: 'emerald' },
  { id: 'media', label: 'Media', path: '/admin/media', icon: Image, color: 'rose' },
  { id: 'invites', label: 'Inviti', path: '/admin/invites', icon: Mail, color: 'sky' },
  { id: 'links', label: 'Link Utili', path: '/admin/links', icon: LinkIcon, color: 'teal' },
];

const DEFAULT_QUICK_ACTIONS = ['new-client', 'calendar', 'chat', 'analytics', 'exercises', 'settings'];

// Tab Types (come DashboardPro)
const TAB_TYPES = {
  CLIENTS: 'clients',
  SCADENZE: 'scadenze',
  CHIAMATE: 'chiamate',
  CHECKS: 'checks',
  CHAT: 'chat',
  ANAMNESI: 'anamnesi'
};

// Time Ranges
const TIME_RANGES = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year'
};

// ============================================
// DESIGN TOKENS
// ============================================
const CARD_BG = 'bg-slate-800/50';
const CARD_BORDER = 'border-slate-700/50';
const colors = {
  bgPrimary: 'bg-[#0a0f1a]',
  bgCard: CARD_BG,
  borderSubtle: CARD_BORDER,
  textPrimary: 'text-slate-100',
  textSecondary: 'text-slate-400',
  textMuted: 'text-slate-500',
};

// ============================================
// COMPONENTI UI 2.0
// ============================================

// Glow Card
const GlowCard = ({ children, className = '', glowColor = 'blue', onClick, hover = true }) => {
  const glowColors = {
    blue: 'hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
    cyan: 'hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]',
    purple: 'hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]',
    emerald: 'hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]',
    amber: 'hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl 
        bg-slate-800/40
        backdrop-blur-sm border border-slate-700/30
        transition-all duration-300
        ${hover ? glowColors[glowColor] : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </motion.div>
  );
};

// Hero Card 2.0 con Toggle Incasso/Rinnovi (dati reali)
const HeroCard = ({ 
  showRevenue, onToggleRevenue, isRenewals, onToggleType, 
  revenueTimeRange, onTimeRangeChange,
  periodRevenue, renewalsRevenue, totalClients, newClients, expiringCount,
  onRevenueClick
}) => {
  const periodLabels = {
    [TIME_RANGES.WEEK]: 'Settimana',
    [TIME_RANGES.MONTH]: 'Mese',
    [TIME_RANGES.YEAR]: 'Anno'
  };

  return (
    <GlowCard glowColor="cyan" className="p-5 sm:p-6" hover={false}>
      {/* Background decorations */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header con toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isRenewals ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`}>
              {isRenewals ? <RefreshCw size={18} className="text-cyan-400" /> : <DollarSign size={18} className="text-emerald-400" />}
            </div>
            <span className="text-xs text-slate-400 font-medium">{periodLabels[revenueTimeRange]}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Time Range Buttons */}
            {[
              { key: TIME_RANGES.WEEK, label: 'S' },
              { key: TIME_RANGES.MONTH, label: 'M' },
              { key: TIME_RANGES.YEAR, label: 'A' },
            ].map(r => (
              <button
                key={r.key}
                onClick={() => onTimeRangeChange(r.key)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                  revenueTimeRange === r.key
                    ? 'bg-emerald-500/30 text-emerald-400'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                }`}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={onToggleRevenue}
              className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white transition-colors ml-1"
            >
              {showRevenue ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>

        {/* Main Revenue Display con swipe - Clickable per dettaglio */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleType}
            className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div 
            className="flex-1 text-center cursor-pointer hover:bg-slate-700/20 rounded-xl py-2 transition-colors"
            onClick={onRevenueClick}
          >
            <motion.p 
              key={isRenewals ? 'renewals' : 'revenue'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-3xl sm:text-4xl font-bold mb-1 ${isRenewals ? 'text-cyan-400' : 'text-white'}`}
            >
              {showRevenue 
                ? `€${(isRenewals ? renewalsRevenue : periodRevenue).toLocaleString()}`
                : '€ •••'
              }
            </motion.p>
            <p className={`text-sm ${isRenewals ? 'text-cyan-400/70' : 'text-slate-400'}`}>
              {isRenewals ? 'Rinnovi' : 'Incasso'} <span className="text-xs opacity-60">• Dettagli</span>
            </p>
          </div>
          
          <button 
            onClick={onToggleType}
            className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${!isRenewals ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isRenewals ? 'bg-cyan-400' : 'bg-slate-600'}`} />
        </div>

        {/* Mini Stats - Dati reali */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/30">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
            <Users size={16} className="text-blue-400 mb-2 mx-auto" />
            <p className="text-lg font-bold text-white">{totalClients}</p>
            <p className="text-[10px] text-slate-500">Clienti Attivi</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
            <UserPlus size={16} className="text-emerald-400 mb-2 mx-auto" />
            <p className="text-lg font-bold text-white">+{newClients}</p>
            <p className="text-[10px] text-slate-500">Nuovi</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
            <Clock size={16} className="text-amber-400 mb-2 mx-auto" />
            <p className="text-lg font-bold text-white">{expiringCount}</p>
            <p className="text-[10px] text-slate-500">Scadenze</p>
          </div>
        </div>
      </div>
    </GlowCard>
  );
};

// Stat Card
const StatCard = ({ icon: Icon, label, value, trend, trendValue, color = 'blue', subtitle }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  };

  const c = colorMap[color];

  return (
    <GlowCard glowColor={color} className="p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${c.bg} ${c.glow} shadow-lg`}>
          <Icon size={18} className={c.text} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
        <p className="text-xs sm:text-sm text-slate-400">{label}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </GlowCard>
  );
};

// Quick Action Button (con personalizzazione colori)
const QuickAction = ({ icon: Icon, label, color = 'blue', badge, onClick }) => {
  const colorMap = {
    blue: 'from-blue-600 to-blue-500 shadow-blue-500/25',
    cyan: 'from-cyan-600 to-cyan-500 shadow-cyan-500/25',
    purple: 'from-purple-600 to-purple-500 shadow-purple-500/25',
    emerald: 'from-emerald-600 to-emerald-500 shadow-emerald-500/25',
    amber: 'from-amber-600 to-amber-500 shadow-amber-500/25',
    rose: 'from-rose-600 to-rose-500 shadow-rose-500/25',
    slate: 'from-slate-600 to-slate-500 shadow-slate-500/25',
    pink: 'from-pink-600 to-pink-500 shadow-pink-500/25',
    green: 'from-green-600 to-green-500 shadow-green-500/25',
    indigo: 'from-indigo-600 to-indigo-500 shadow-indigo-500/25',
    violet: 'from-violet-600 to-violet-500 shadow-violet-500/25',
    sky: 'from-sky-600 to-sky-500 shadow-sky-500/25',
    teal: 'from-teal-600 to-teal-500 shadow-teal-500/25',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${colorMap[color] || colorMap.blue}
        shadow-lg transition-all group
      `}
    >
      {badge && (
        <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
          {badge}
        </span>
      )}
      <Icon size={22} className="text-white mb-2 mx-auto group-hover:scale-110 transition-transform" />
      <p className="text-[10px] sm:text-xs font-medium text-white/90 text-center leading-tight">{label}</p>
    </motion.button>
  );
};

// Quick Actions Editor Modal (Personalizzazione)
// ============================================
// GOAL EDITOR - Obiettivo mensile personalizzabile
// ============================================
const GoalEditor = ({ isOpen, onClose, settings, onSave }) => {
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    onSave(tempSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-slate-900 border border-slate-700/30 rounded-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Trophy size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Obiettivo Mensile</h3>
                <p className="text-xs text-slate-400">Visibile a tutto il team</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Importo Obiettivo (€)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                <input
                  type="number"
                  value={tempSettings.goalAmount}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    goalAmount: Math.max(0, parseInt(e.target.value) || 0)
                  })}
                  className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="10000"
                  min="0"
                  step="100"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Suggerimento: inserisci l'obiettivo di fatturato mensile</p>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Preimpostazioni rapide
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5000, 10000, 15000, 20000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setTempSettings({ ...tempSettings, goalAmount: amount })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      tempSettings.goalAmount === amount
                        ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                    }`}
                  >
                    {(amount / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Include Options */}
            <div className="border-t border-slate-700/50 pt-4">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Cosa includere nel conteggio
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:bg-slate-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={tempSettings.includeRevenue}
                    onChange={(e) => setTempSettings({
                      ...tempSettings,
                      includeRevenue: e.target.checked
                    })}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <DollarSign size={18} className="text-emerald-400" />
                    <div>
                      <span className="text-white font-medium">Incassi</span>
                      <p className="text-xs text-slate-500">Nuovi pagamenti e abbonamenti</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:bg-slate-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={tempSettings.includeRenewals}
                    onChange={(e) => setTempSettings({
                      ...tempSettings,
                      includeRenewals: e.target.checked
                    })}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <RefreshCw size={18} className="text-cyan-400" />
                    <div>
                      <span className="text-white font-medium">Rinnovi</span>
                      <p className="text-xs text-slate-500">Clienti che rinnovano</p>
                    </div>
                  </div>
                </label>
              </div>

              {!tempSettings.includeRevenue && !tempSettings.includeRenewals && (
                <p className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Seleziona almeno una voce da includere
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={!tempSettings.includeRevenue && !tempSettings.includeRenewals}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salva Obiettivo
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const QuickActionsEditor = ({ isOpen, onClose, selectedActions, onSave }) => {
  const [tempSelected, setTempSelected] = useState(selectedActions);

  useEffect(() => {
    setTempSelected(selectedActions);
  }, [selectedActions, isOpen]);

  const toggleAction = (actionId) => {
    if (tempSelected.includes(actionId)) {
      setTempSelected(tempSelected.filter(id => id !== actionId));
    } else if (tempSelected.length < 6) {
      setTempSelected([...tempSelected, actionId]);
    }
  };

  const handleSave = () => {
    onSave(tempSelected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-slate-900 border border-slate-700/30 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Zap size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Personalizza Azioni</h3>
                <p className="text-xs text-slate-400">Seleziona fino a 6 azioni rapide</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Selected Preview */}
          <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">Selezionate ({tempSelected.length}/6):</p>
            <div className="flex flex-wrap gap-2">
              {tempSelected.length > 0 ? (
                tempSelected.map(actionId => {
                  const action = AVAILABLE_ACTIONS.find(a => a.id === actionId);
                  if (!action) return null;
                  return (
                    <div
                      key={action.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/30"
                    >
                      <action.icon size={14} className="text-slate-300" />
                      <span className="text-xs text-white">{action.label}</span>
                      <button
                        onClick={() => toggleAction(action.id)}
                        className="ml-1 p-0.5 rounded hover:bg-slate-600/50"
                      >
                        <X size={12} className="text-slate-400" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <span className="text-xs text-slate-500 italic">Nessuna azione selezionata</span>
              )}
            </div>
          </div>

          {/* Actions Grid */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ACTIONS.map(action => {
                const isSelected = tempSelected.includes(action.id);
                const isDisabled = !isSelected && tempSelected.length >= 6;
                
                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                    whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                    onClick={() => !isDisabled && toggleAction(action.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : isDisabled
                          ? 'bg-slate-800/20 border-slate-700/20 opacity-40 cursor-not-allowed'
                          : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-700/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500/30' : 'bg-slate-700/50'}`}>
                      <action.icon size={16} className={isSelected ? 'text-blue-400' : 'text-slate-400'} />
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {action.label}
                    </span>
                    {isSelected && (
                      <Check size={16} className="ml-auto text-blue-400" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/30 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={tempSelected.length === 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salva
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Client Row (come DashboardPro) - Modificato per supportare selezione e versione compatta
const ClientRow = ({ name, email, status, subtitle, onClick, onSelect, isSelected, clientData, compact = false }) => {
  const statusMap = {
    active: { label: 'Attivo', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    expiring: { label: 'In scadenza', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    expired: { label: 'Scaduto', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
    new: { label: 'Nuovo', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  };

  const s = statusMap[status] || statusMap.active;

  // Versione compatta per mobile
  if (compact) {
    return (
      <div
        onClick={() => onSelect ? onSelect({ name, email, status, subtitle, clientData }) : onClick?.()}
        className={`flex items-center gap-3 p-3 transition-colors cursor-pointer active:bg-slate-700/30 ${
          isSelected ? 'bg-blue-500/10' : ''
        }`}
      >
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
            {name?.charAt(0) || '?'}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
            status === 'active' ? 'bg-emerald-500' : status === 'expiring' ? 'bg-amber-500' : status === 'new' ? 'bg-blue-500' : status === 'expired' ? 'bg-red-500' : 'bg-slate-500'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
        </div>
        <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ x: 4, backgroundColor: 'rgba(51, 65, 85, 0.3)' }}
      onClick={() => onSelect ? onSelect({ name, email, status, subtitle, clientData }) : onClick?.()}
      className={`flex items-center gap-4 p-3 sm:p-4 transition-colors cursor-pointer group ${
        isSelected ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
      }`}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
          {name?.charAt(0) || '?'}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
          status === 'active' ? 'bg-emerald-500' : status === 'expiring' ? 'bg-amber-500' : status === 'new' ? 'bg-blue-500' : 'bg-slate-500'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-slate-500 truncate">{subtitle || email}</p>
      </div>
      {status && (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${s.color} hidden sm:block`}>
          {s.label}
        </span>
      )}
      <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
    </motion.div>
  );
};

// Preview Panel - Mostra dettagli rapidi dell'elemento selezionato
const PreviewPanel = ({ data, type, onNavigate, onClose, formatWeight }) => {
  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6">
        <Eye size={48} className="mb-4 opacity-30" />
        <p className="text-sm text-center">Seleziona un elemento dalla lista per vedere l'anteprima</p>
      </div>
    );
  }

  const statusColors = {
    active: 'from-emerald-500 to-green-500',
    expiring: 'from-amber-500 to-orange-500',
    expired: 'from-red-500 to-rose-500',
    new: 'from-blue-500 to-cyan-500',
  };

  const statusLabels = {
    active: 'Attivo',
    expiring: 'In scadenza',
    expired: 'Scaduto',
    new: 'Nuovo',
  };

  const clientData = data.clientData || {};

  // Funzione helper per formattare date
  const formatDate = (date) => {
    if (!date) return null;
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Render specifico per CHECK
  if (type === 'check') {
    const photoURLs = clientData.photoURLs || {};
    const hasPhotos = photoURLs.front || photoURLs.right || photoURLs.left || photoURLs.back;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="h-full flex flex-col"
      >
        {/* Header Check */}
        <div className="p-5 border-b border-slate-700/30 bg-gradient-to-br from-blue-900/30 to-slate-900/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                <ClipboardList size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{data.name}</h3>
                <p className="text-sm text-slate-400">Check-in</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-slate-500">{formatDate(clientData.createdAt)}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Peso e misure */}
          <div className="grid grid-cols-2 gap-3">
            {clientData.weight && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 text-center">
                <Activity size={20} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-400">{formatWeight ? formatWeight(clientData.weight) : `${clientData.weight} kg`}</p>
                <p className="text-xs text-emerald-400/70">Peso</p>
              </div>
            )}
            {clientData.bodyFat && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center">
                <Target size={20} className="text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-400">{clientData.bodyFat}%</p>
                <p className="text-xs text-amber-400/70">Massa Grassa</p>
              </div>
            )}
          </div>

          {/* Circonferenze */}
          {(clientData.waist || clientData.chest || clientData.hips || clientData.arm || clientData.thigh) && (
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                <Dumbbell size={14} /> Circonferenze (cm)
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {clientData.waist && (
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-lg font-bold text-white">{clientData.waist}</p>
                    <p className="text-[10px] text-slate-500">Vita</p>
                  </div>
                )}
                {clientData.chest && (
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-lg font-bold text-white">{clientData.chest}</p>
                    <p className="text-[10px] text-slate-500">Petto</p>
                  </div>
                )}
                {clientData.hips && (
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-lg font-bold text-white">{clientData.hips}</p>
                    <p className="text-[10px] text-slate-500">Fianchi</p>
                  </div>
                )}
                {clientData.arm && (
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-lg font-bold text-white">{clientData.arm}</p>
                    <p className="text-[10px] text-slate-500">Braccio</p>
                  </div>
                )}
                {clientData.thigh && (
                  <div className="p-2 rounded-lg bg-slate-700/30">
                    <p className="text-lg font-bold text-white">{clientData.thigh}</p>
                    <p className="text-[10px] text-slate-500">Coscia</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Foto Check */}
          {hasPhotos && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Image size={14} /> Foto Progress
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {photoURLs.front && (
                  <div className="aspect-[3/4] max-h-24 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/30">
                    <img src={photoURLs.front} alt="Front" className="w-full h-full object-cover" />
                  </div>
                )}
                {photoURLs.back && (
                  <div className="aspect-[3/4] max-h-24 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/30">
                    <img src={photoURLs.back} alt="Back" className="w-full h-full object-cover" />
                  </div>
                )}
                {photoURLs.right && (
                  <div className="aspect-[3/4] max-h-24 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/30">
                    <img src={photoURLs.right} alt="Right" className="w-full h-full object-cover" />
                  </div>
                )}
                {photoURLs.left && (
                  <div className="aspect-[3/4] max-h-24 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/30">
                    <img src={photoURLs.left} alt="Left" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          {clientData.notes && (
            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-2">Note</p>
              <p className="text-sm text-slate-300">{clientData.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-700/30">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(clientData.clientId, '/client/', '?tab=check')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            Vedi Storico Check
            <ArrowUpRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Render specifico per ANAMNESI
  if (type === 'anamnesi') {
    const photoURLs = clientData.photoURLs || {};
    const hasPhotos = photoURLs.front || photoURLs.right || photoURLs.left || photoURLs.back;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="h-full flex flex-col"
      >
        {/* Header Anamnesi */}
        <div className="p-5 border-b border-slate-700/30 bg-gradient-to-br from-purple-900/30 to-slate-900/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{data.name}</h3>
                <p className="text-sm text-slate-400">{clientData.type || 'Anamnesi'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-slate-500">{formatDate(clientData.createdAt)}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Info base */}
          <div className="grid grid-cols-2 gap-3">
            {clientData.age && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
                <p className="text-xl font-bold text-white">{clientData.age}</p>
                <p className="text-xs text-slate-500">Età</p>
              </div>
            )}
            {clientData.height && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
                <p className="text-xl font-bold text-white">{clientData.height} cm</p>
                <p className="text-xs text-slate-500">Altezza</p>
              </div>
            )}
            {clientData.weight && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
                <p className="text-xl font-bold text-white">{formatWeight ? formatWeight(clientData.weight) : `${clientData.weight} kg`}</p>
                <p className="text-xs text-slate-500">Peso</p>
              </div>
            )}
            {clientData.activityLevel && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
                <p className="text-lg font-bold text-white capitalize">{clientData.activityLevel}</p>
                <p className="text-xs text-slate-500">Attività</p>
              </div>
            )}
          </div>

          {/* Obiettivo */}
          {clientData.goal && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-purple-400" />
                <p className="text-xs text-purple-400">Obiettivo</p>
              </div>
              <p className="text-sm text-white">{clientData.goal}</p>
            </div>
          )}

          {/* Patologie / Allergie */}
          {(clientData.pathologies || clientData.allergies || clientData.injuries) && (
            <div className="space-y-2">
              {clientData.pathologies && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400 mb-1">⚠️ Patologie</p>
                  <p className="text-sm text-red-300">{clientData.pathologies}</p>
                </div>
              )}
              {clientData.allergies && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400 mb-1">🍽️ Allergie/Intolleranze</p>
                  <p className="text-sm text-amber-300">{clientData.allergies}</p>
                </div>
              )}
              {clientData.injuries && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs text-orange-400 mb-1">🩹 Infortuni</p>
                  <p className="text-sm text-orange-300">{clientData.injuries}</p>
                </div>
              )}
            </div>
          )}

          {/* Foto Anamnesi */}
          {hasPhotos && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Image size={14} /> Foto Allegate
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {photoURLs.front && (
                  <div className="aspect-[3/4] max-h-24 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/30">
                    <img src={photoURLs.front} alt="Front" className="w-full h-full object-cover" />
                  </div>
                )}
                {photoURLs.back && (
                  <div className="aspect-[3/4] max-h-24 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/30">
                    <img src={photoURLs.back} alt="Back" className="w-full h-full object-cover" />
                  </div>
                )}
                {photoURLs.right && (
                  <div className="aspect-[3/4] max-h-24 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/30">
                    <img src={photoURLs.right} alt="Right" className="w-full h-full object-cover" />
                  </div>
                )}
                {photoURLs.left && (
                  <div className="aspect-[3/4] max-h-24 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/30">
                    <img src={photoURLs.left} alt="Left" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          {clientData.notes && (
            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-2">Note Aggiuntive</p>
              <p className="text-sm text-slate-300 line-clamp-4">{clientData.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-700/30">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(clientData.clientId, '/client/', '?tab=anamnesi')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            Vedi Anamnesi Completa
            <ArrowUpRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Render DEFAULT (clienti, scadenze, chiamate, chat)
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col"
    >
      {/* Header con avatar grande */}
      <div className="p-5 border-b border-slate-700/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${statusColors[data.status] || statusColors.active} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
            {data.name?.charAt(0) || '?'}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <h3 className="text-xl font-bold text-white mb-1">{data.name}</h3>
        <p className="text-sm text-slate-400">{data.email || data.subtitle}</p>
        {data.status && (
          <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${statusColors[data.status] || statusColors.active} text-white`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            {statusLabels[data.status]}
          </span>
        )}
      </div>

      {/* Info rapide */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {clientData.phone && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <Phone size={16} className="text-cyan-400" />
            <div>
              <p className="text-xs text-slate-500">Telefono</p>
              <p className="text-sm text-white">{clientData.phone}</p>
            </div>
          </div>
        )}
        
        {clientData.scadenza && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <Calendar size={16} className="text-amber-400" />
            <div>
              <p className="text-xs text-slate-500">Scadenza Abbonamento</p>
              <p className="text-sm text-white">{formatDate(clientData.scadenza)}</p>
            </div>
          </div>
        )}

        {clientData.obiettivo && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <Target size={16} className="text-purple-400" />
            <div>
              <p className="text-xs text-slate-500">Obiettivo</p>
              <p className="text-sm text-white">{clientData.obiettivo}</p>
            </div>
          </div>
        )}

        {clientData.note && (
          <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-slate-400" />
              <p className="text-xs text-slate-500">Note</p>
            </div>
            <p className="text-sm text-slate-300 line-clamp-3">{clientData.note}</p>
          </div>
        )}

        {/* Info contestuali in base al tipo */}
        {type === 'chiamata' && clientData.scheduledAt && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Clock size={16} className="text-cyan-400" />
            <div>
              <p className="text-xs text-cyan-400/70">Orario Chiamata</p>
              <p className="text-sm text-cyan-400 font-medium">
                {new Date(clientData.scheduledAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )}

        {type === 'chat' && clientData.lastMessage && (
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={14} className="text-purple-400" />
              <p className="text-xs text-purple-400/70">Ultimo Messaggio</p>
            </div>
            <p className="text-sm text-purple-300 line-clamp-2">{clientData.lastMessage}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-700/30 space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(clientData.id || clientData.clientId)}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          Vai al Profilo Completo
          <ArrowUpRight size={16} />
        </motion.button>
        
        {type === 'chat' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(clientData.clientId, '/chat/')}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-medium text-sm flex items-center justify-center gap-2 border border-purple-500/30"
          >
            <MessageCircle size={16} />
            Apri Chat
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Activity Item
const ActivityItem = ({ icon: Icon, title, subtitle, time, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer group"
    >
      <div className={`p-2 rounded-lg ${colorMap[color]}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{time}</span>
        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </motion.div>
  );
};

// Section Header
const SectionHeader = ({ title, subtitle, action, actionLabel = 'Vedi tutti', rightContent }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {rightContent}
      {action && (
        <button
          onClick={action}
          className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {actionLabel}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  </div>
);

// Search Bar
const SearchBar = ({ value, onChange, placeholder = "Cerca clienti..." }) => (
  <div className="relative">
    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
    />
    {value && (
      <button 
        onClick={() => onChange('')}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

// Revenue Section (Collapsible)
const RevenueSection = ({ isExpanded, onToggle }) => {
  return (
    <GlowCard className="overflow-hidden" hover={false}>
      {/* Header - Always visible */}
      <button 
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20">
            <BarChart2 size={20} className="text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Andamento Revenue</h3>
            <p className="text-xs text-slate-500">Ultimi 12 mesi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-emerald-400 font-medium hidden sm:block">+24% YoY</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={20} className="text-slate-400" />
          </motion.div>
        </div>
      </button>
      
      {/* Content - Collapsible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-700/30">
              {/* Mini stats row */}
              <div className="grid grid-cols-3 gap-3 py-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-400">€149k</p>
                  <p className="text-xs text-slate-500">Anno corrente</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">€120k</p>
                  <p className="text-xs text-slate-500">Anno scorso</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-cyan-400">€12.4k</p>
                  <p className="text-xs text-slate-500">Media mensile</p>
                </div>
              </div>
              
              {/* Chart Placeholder */}
              <div className="h-48 sm:h-64 flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="text-center">
                  <BarChart2 size={48} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">Grafico Revenue</p>
                  <p className="text-xs text-slate-600">Area chart con gradient</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlowCard>
  );
};

// Loading Skeleton
const LoadingSpinner = () => (
  <div className="min-h-screen px-4 py-4 space-y-4">
    <div className="h-12 w-48 bg-slate-700/50 rounded-lg animate-pulse" />
    <div className="h-32 bg-slate-700/50 rounded-2xl animate-pulse" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-24 bg-slate-700/50 rounded-xl animate-pulse" />
      <div className="h-24 bg-slate-700/50 rounded-xl animate-pulse" />
    </div>
    <div className="h-40 bg-slate-700/50 rounded-xl animate-pulse" />
  </div>
);

// Alert Pills
const AlertPills = ({ metrics, callRequests, unreadChats, navigate, setActiveTab }) => {
  const hasAlerts = metrics.expiredCount > 0 || metrics.expiringCount > 0 || callRequests.length > 0 || unreadChats.length > 0;
  if (!hasAlerts) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 p-3 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50"
    >
      <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
      {metrics.expiredCount > 0 && (
        <button 
          onClick={() => navigate('/clients?filter=expired')}
          className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/30 transition-colors"
        >
          {metrics.expiredCount} scaduti
        </button>
      )}
      {metrics.expiringCount > 0 && (
        <button 
          onClick={() => navigate('/clients?filter=expiring')}
          className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
        >
          {metrics.expiringCount} in scadenza
        </button>
      )}
      {callRequests.length > 0 && (
        <button 
          onClick={() => navigate(`/client/${callRequests[0]?.clientId}`)}
          className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
        >
          📞 {callRequests.length} richieste
        </button>
      )}
      {unreadChats.length > 0 && (
        <button 
          onClick={() => setActiveTab(TAB_TYPES.CHAT)}
          className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition-colors"
        >
          💬 {unreadChats.length} messaggi
        </button>
      )}
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DashboardDemo = () => {
  const navigate = useNavigate();
  const { branding } = useTenantBranding();
  const { formatWeight } = useUserPreferences();
  
  // State
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const [showRevenue, setShowRevenue] = useState(true);
  const [callRequests, setCallRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeTab, setActiveTab] = useState(TAB_TYPES.CLIENTS);
  const [recentAnamnesi, setRecentAnamnesi] = useState([]);
  const [recentChecks, setRecentChecks] = useState([]);
  const [revenueTimeRange, setRevenueTimeRange] = useState(TIME_RANGES.MONTH);
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [isRenewals, setIsRenewals] = useState(false);
  const [unreadChats, setUnreadChats] = useState([]);
  const [weeklyChecks, setWeeklyChecks] = useState(0);
  const [revenueExpanded, setRevenueExpanded] = useState(false);
  const [bgPreset, setBgPreset] = useState('aurora');
  
  // Quick Actions personalizzabili
  const [quickActions, setQuickActions] = useState(DEFAULT_QUICK_ACTIONS);
  const [showActionsEditor, setShowActionsEditor] = useState(false);
  
  // Obiettivo mensile personalizzabile per tenant
  const [goalSettings, setGoalSettings] = useState({
    goalAmount: 10000,
    includeRevenue: true,
    includeRenewals: true
  });
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  
  // Preview Panel - per layout master-detail
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  // Scroll indicators per mobile
  const [statsScrollProgress, setStatsScrollProgress] = useState(0);
  const [actionsScrollProgress, setActionsScrollProgress] = useState(0);
  const statsScrollRef = React.useRef(null);
  const actionsScrollRef = React.useRef(null);
  
  // Handler scroll per indicatori
  const handleStatsScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    const maxScroll = scrollWidth - clientWidth;
    setStatsScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
  };
  
  const handleActionsScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    const maxScroll = scrollWidth - clientWidth;
    setActionsScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
  };
  
  // Handler per selezione con supporto mobile
  const handlePreviewSelect = (data) => {
    setSelectedPreview(data);
    // Su mobile (< md breakpoint 768px) apri il modal
    if (window.innerWidth < 768) {
      setShowMobilePreview(true);
    }
  };
  
  // Reset preview quando cambia tab
  useEffect(() => {
    setSelectedPreview(null);
    setShowMobilePreview(false);
  }, [activeTab]);

  // Blocca scroll quando modal mobile è aperto
  useEffect(() => {
    if (showMobilePreview) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showMobilePreview]);
  
  // Document title
  useDocumentTitle('Dashboard');
  usePageInfo({
    pageTitle: 'Dashboard',
    pageSubtitle: `Bentornato, ${userName?.split(' ')[0] || 'Admin'}!`
  }, [userName]);

  // Auth check
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin' && role !== 'coach') {
      signOut(auth).then(() => navigate('/login'));
    }
  }, [navigate]);

  // Load user profile
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        const userDocRef = getTenantDoc(db, 'users', user.uid);
        onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserName(doc.data().displayName || user.displayName || 'Admin');
            setUserPhoto(doc.data().photoURL || user.photoURL);
          } else {
            setUserName(user.displayName || user.email?.split('@')[0] || 'Admin');
            setUserPhoto(user.photoURL);
          }
        });
      }
    });
    return () => unsub();
  }, []);

  // Load quick actions from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    const userDocRef = getTenantDoc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists() && doc.data().dashboardQuickActions) {
        setQuickActions(doc.data().dashboardQuickActions);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Save quick actions to Firestore
  const handleSaveQuickActions = async (actions) => {
    setQuickActions(actions);
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const userDocRef = getTenantDoc(db, 'users', user.uid);
      await setDoc(userDocRef, { dashboardQuickActions: actions }, { merge: true });
    } catch (error) {
      console.error('Errore salvataggio quick actions:', error);
    }
  };

  // Load goal settings from Firestore (tenant-wide)
  useEffect(() => {
    const goalSettingsRef = getTenantDoc(db, 'settings', 'goalSettings');
    const unsubscribe = onSnapshot(goalSettingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGoalSettings({
          goalAmount: data.goalAmount ?? 10000,
          includeRevenue: data.includeRevenue ?? true,
          includeRenewals: data.includeRenewals ?? true
        });
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Save goal settings to Firestore (tenant-wide)
  const handleSaveGoalSettings = async (settings) => {
    setGoalSettings(settings);
    
    try {
      const goalSettingsRef = getTenantDoc(db, 'settings', 'goalSettings');
      await setDoc(goalSettingsRef, {
        goalAmount: settings.goalAmount,
        includeRevenue: settings.includeRevenue,
        includeRenewals: settings.includeRenewals,
        updatedAt: new Date(),
        updatedBy: auth.currentUser?.uid
      }, { merge: true });
    } catch (error) {
      console.error('Errore salvataggio obiettivo:', error);
    }
  };

  // Load clients
  useEffect(() => {
    const unsub = onSnapshot(getTenantCollection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load all dashboard data
  useEffect(() => {
    let isMounted = true;
    
    const loadAllDashboardData = async () => {
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        
        const allPromises = clientsSnap.docs.map(async (clientDoc) => {
          const clientId = clientDoc.id;
          const data = clientDoc.data();
          const clientName = data.name || 'Cliente';
          const isOldClient = data.isOldClient === true;
          
          const result = { payments: [], callRequests: [], upcomingCalls: [], anamnesi: [], checks: [] };
          
          try {
            const [paymentsSnap, ratesSnap, callsSnap, anamnesiSnap, checksSnap] = await Promise.all([
              getDocs(getTenantSubcollection(db, 'clients', clientId, 'payments')).catch(() => ({ docs: [] })),
              getDocs(getTenantSubcollection(db, 'clients', clientId, 'rates')).catch(() => ({ docs: [] })),
              getDocs(getTenantSubcollection(db, 'clients', clientId, 'calls')).catch(() => ({ docs: [] })),
              getDocs(query(getTenantSubcollection(db, 'clients', clientId, 'anamnesi'), orderBy('createdAt', 'desc'), limit(1))).catch(() => ({ docs: [] })),
              getDocs(query(getTenantSubcollection(db, 'clients', clientId, 'checks'), orderBy('createdAt', 'desc'), limit(2))).catch(() => ({ docs: [] }))
            ]);
            
            // Process payments
            paymentsSnap.docs.forEach(payDoc => {
              const payData = payDoc.data();
              const isRenewal = payData.isRenewal === true;
              if (isOldClient && !isRenewal) return;
              
              const payDate = toDate(payData.paymentDate || payData.date || payData.createdAt);
              if (payDate) {
                result.payments.push({
                  id: payDoc.id, clientId, clientName,
                  amount: parseFloat(payData.amount) || 0,
                  date: payDate.toISOString(),
                  source: 'subcollection', isRenewal
                });
              }
            });
            
            // Process rates
            ratesSnap.docs.forEach(rateDoc => {
              const rateData = rateDoc.data();
              if (!rateData.paid || !rateData.paidDate) return;
              
              const paidDate = rateData.paidDate?.toDate ? rateData.paidDate.toDate() : toDate(rateData.paidDate);
              if (paidDate) {
                result.payments.push({
                  id: `rate-${clientId}-${rateDoc.id}`, clientId, clientName,
                  amount: parseFloat(rateData.amount) || 0,
                  date: paidDate.toISOString(),
                  source: 'rates-subcollection',
                  isRenewal: rateData.isRenewal === true, isRate: true
                });
              }
            });
            
            // Process legacy rates
            (data.rate || []).forEach(rate => {
              if (rate.paid && rate.paidDate) {
                const rateDate = toDate(rate.paidDate);
                if (rateDate) {
                  result.payments.push({
                    id: `rate-${clientId}-${rate.paidDate}`, clientId, clientName,
                    amount: parseFloat(rate.amount) || 0,
                    date: rateDate.toISOString(),
                    source: 'rate', isRenewal: false, isRate: true
                  });
                }
              }
            });
            
            // Process calls
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            callsSnap.docs.forEach(callDoc => {
              const callData = callDoc.data();
              if (callDoc.id === 'request' && callData?.status === 'pending') {
                result.callRequests.push({ clientId, clientName, ...callData });
              }
              if (callDoc.id === 'next' && callData?.scheduledAt) {
                const scheduledDate = toDate(callData.scheduledAt);
                if (scheduledDate && scheduledDate >= now && scheduledDate <= nextWeek) {
                  result.upcomingCalls.push({ clientId, clientName, scheduledAt: scheduledDate, ...callData });
                }
              }
            });
            
            // Process anamnesi & checks
            anamnesiSnap.docs.forEach(doc => {
              result.anamnesi.push({ id: doc.id, clientId, clientName, ...doc.data() });
            });
            checksSnap.docs.forEach(doc => {
              result.checks.push({ id: doc.id, clientId, clientName, ...doc.data() });
            });
          } catch (e) { /* silent fail */ }
          
          return result;
        });
        
        const results = await Promise.all(allPromises);
        if (!isMounted) return;
        
        // Aggregate
        const allPayments = [], allCallRequests = [], allUpcomingCalls = [], allAnamnesi = [], allChecks = [];
        results.forEach(r => {
          allPayments.push(...r.payments);
          allCallRequests.push(...r.callRequests);
          allUpcomingCalls.push(...r.upcomingCalls);
          allAnamnesi.push(...r.anamnesi);
          allChecks.push(...r.checks);
        });
        
        setPayments(allPayments);
        setCallRequests(allCallRequests);
        setUpcomingCalls(allUpcomingCalls.sort((a, b) => a.scheduledAt - b.scheduledAt));
        setRecentAnamnesi(allAnamnesi.sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0)).slice(0, 10));
        setRecentChecks(allChecks.sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0)).slice(0, 10));
        
        // Weekly checks
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);
        setWeeklyChecks(allChecks.filter(c => {
          const checkDate = toDate(c.createdAt);
          return checkDate && checkDate >= weekStart;
        }).length);
      } catch (error) {
        console.error('Dashboard data load error:', error);
      }
    };
    
    loadAllDashboardData();
    const interval = setInterval(loadAllDashboardData, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [clients.length]);

  // Load unread chats
  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;
    
    const unsubscribe = onSnapshot(getTenantCollection(db, 'chats'), (snap) => {
      const unread = [];
      snap.docs.forEach(doc => {
        const data = doc.data();
        const participants = data.participants || [];
        if (participants.includes(currentUserId)) {
          const unreadCount = data.unreadCount?.[currentUserId] || 0;
          if (unreadCount > 0) {
            const otherParticipantId = participants.find(p => p !== currentUserId);
            const client = clients.find(c => c.id === otherParticipantId);
            unread.push({
              chatId: doc.id, clientId: otherParticipantId,
              clientName: client?.name || 'Cliente', unreadCount,
              lastMessage: data.lastMessage,
              lastMessageTime: toDate(data.lastMessageAt)
            });
          }
        }
      });
      setUnreadChats(unread.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0)));
    });
    
    return () => unsubscribe();
  }, [clients]);

  // Computed metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentYearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const activeClients = clients.filter(c => !c.isOldClient && !c.archiviato);
    
    // Scadenze
    const expiringClients = activeClients.filter(c => {
      const exp = toDate(c.scadenza);
      if (!exp) return false;
      const daysToExp = (exp - now) / (1000 * 60 * 60 * 24);
      return daysToExp <= 15 && daysToExp > -7;
    }).sort((a, b) => toDate(a.scadenza) - toDate(b.scadenza));
    
    // Periodo
    let periodStart, periodEnd, periodLabel;
    switch (revenueTimeRange) {
      case TIME_RANGES.WEEK:
        periodStart = currentWeekStart;
        periodEnd = new Date(currentWeekStart);
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        periodLabel = 'Settimana';
        break;
      case TIME_RANGES.YEAR:
        periodStart = currentYearStart;
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        periodLabel = 'Anno';
        break;
      default:
        periodStart = currentMonthStart;
        periodEnd = currentMonthEnd;
        periodLabel = 'Mese';
    }
    
    const periodPayments = payments.filter(p => {
      const d = new Date(p.date);
      return d >= periodStart && d <= periodEnd;
    });
    const periodRevenue = periodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Rinnovi
    let renewalsRevenue = 0;
    periodPayments.forEach(p => {
      if (p.isRenewal === true) renewalsRevenue += p.amount || 0;
    });
    
    const newClientsThisMonth = clients.filter(c => {
      const start = toDate(c.startDate) || toDate(c.createdAt);
      return start && start >= currentMonthStart;
    });

    // Separa pagamenti rinnovi vs nuovi incassi
    const renewalPaymentsList = periodPayments.filter(p => p.isRenewal === true).sort((a, b) => new Date(b.date) - new Date(a.date));
    const regularPaymentsList = periodPayments.filter(p => p.isRenewal !== true).sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      totalClients: activeClients.length,
      expiringCount: expiringClients.filter(c => (toDate(c.scadenza) - now) / (1000 * 60 * 60 * 24) > 0).length,
      expiredCount: expiringClients.filter(c => toDate(c.scadenza) < now).length,
      expiringClients,
      periodRevenue: periodRevenue - renewalsRevenue,
      renewalsRevenue, periodLabel,
      newClients: newClientsThisMonth.length,
      renewalPaymentsList,
      regularPaymentsList,
    };
  }, [clients, payments, revenueTimeRange]);

  // Clienti ordinati per data di aggiunta (più recenti prima)
  const sortedClients = useMemo(() => {
    return [...clients]
      .filter(c => !c.isOldClient)
      .sort((a, b) => {
        const dateA = toDate(a.createdAt) || new Date(0);
        const dateB = toDate(b.createdAt) || new Date(0);
        return dateB - dateA;
      })
      .slice(0, 8);
  }, [clients]);
  
  // State per modal dettaglio incassi
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueModalType, setRevenueModalType] = useState('incasso');

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities = [];
    
    const sortedClients = [...clients]
      .filter(c => toDate(c.createdAt))
      .sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
      .slice(0, 5);
    
    sortedClients.forEach(c => {
      const date = toDate(c.createdAt);
      if (date) {
        activities.push({
          type: 'client', icon: User,
          title: `${c.name} registrato`, subtitle: 'Nuovo cliente',
          time: date, color: 'blue',
          onClick: () => navigate(`/client/${c.id}`)
        });
      }
    });
    
    const sortedPayments = [...payments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    
    sortedPayments.forEach(p => {
      activities.push({
        type: 'payment', icon: DollarSign,
        title: `€${p.amount} da ${p.clientName}`,
        subtitle: p.isRenewal ? 'Rinnovo' : p.isRate ? 'Rata' : 'Pagamento',
        time: new Date(p.date), color: p.isRenewal ? 'cyan' : 'emerald'
      });
    });
    
    return activities
      .sort((a, b) => b.time - a.time)
      .slice(0, 10)
      .map((a, idx) => ({
        ...a, id: `${a.type}-${idx}`,
        time: a.time.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      }));
  }, [clients, payments, navigate]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* NebulaBackground gestito da ProLayout */}

      {/* ==================== MOBILE LAYOUT (< md) ==================== */}
      <div className="md:hidden relative w-full px-4 py-4 space-y-4 pb-24 overflow-y-auto flex-1">
        
        {/* Mobile Header - Compatto */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              Ciao, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{userName?.split(' ')[0] || 'Coach'}</span> 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/chat')}
              className="relative p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400"
            >
              <Bell size={18} />
              {unreadChats.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                  {unreadChats.length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Mobile Stats - Scroll orizzontale con blur fade dinamico */}
        <div className="relative -mx-4">
          <div 
            ref={statsScrollRef}
            onScroll={handleStatsScroll}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-3"
            style={{
              maskImage: 'linear-gradient(to right, black 0%, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 0%, black 80%, transparent 100%)'
            }}
          >
            {/* Revenue Card */}
            <div 
              onClick={() => {
                setRevenueModalType(isRenewals ? 'rinnovi' : 'incasso');
                setShowRevenueModal(true);
              }}
              className="flex-shrink-0 w-[140px] p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <DollarSign size={16} className="text-emerald-400" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsRenewals(!isRenewals); }}
                  className="text-[10px] text-slate-400"
                >
                  {isRenewals ? 'Rinnovi' : 'Incasso'}
                </button>
              </div>
              <p className="text-lg font-bold text-white">
                {showRevenue 
                  ? `€${((isRenewals ? metrics.renewalsRevenue : metrics.periodRevenue) / 1000).toFixed(1)}k`
                  : '€•••'
                }
              </p>
              <p className="text-[10px] text-slate-500">{metrics.periodLabel}</p>
            </div>
            
            {/* Clienti */}
            <div 
              onClick={() => navigate('/clients')}
              className="flex-shrink-0 w-[100px] p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
            >
              <Users size={16} className="text-blue-400 mb-2" />
              <p className="text-lg font-bold text-white">{metrics.totalClients}</p>
              <p className="text-[10px] text-slate-500">Clienti</p>
            </div>
            
            {/* Nuovi */}
            <div className="flex-shrink-0 w-[85px] p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <UserPlus size={16} className="text-emerald-400 mb-2" />
              <p className="text-lg font-bold text-white">+{metrics.newClients}</p>
              <p className="text-[10px] text-slate-500">Nuovi</p>
            </div>
            
            {/* Scadenze */}
            <div 
              onClick={() => setActiveTab(TAB_TYPES.SCADENZE)}
              className="flex-shrink-0 w-[85px] p-3 rounded-xl bg-slate-800/50 border border-amber-500/30 backdrop-blur-sm"
            >
              <Clock size={16} className="text-amber-400 mb-2" />
              <p className="text-lg font-bold text-amber-400">{metrics.expiringCount + metrics.expiredCount}</p>
              <p className="text-[10px] text-slate-500">Scadenze</p>
            </div>
            
            {/* Chiamate Oggi */}
            <div 
              onClick={() => setActiveTab(TAB_TYPES.CHIAMATE)}
              className="flex-shrink-0 w-[85px] p-3 rounded-xl bg-slate-800/50 border border-cyan-500/30 backdrop-blur-sm"
            >
              <Phone size={16} className="text-cyan-400 mb-2" />
              <p className="text-lg font-bold text-cyan-400">{upcomingCalls.filter(c => c.scheduledAt?.toDateString() === new Date().toDateString()).length}</p>
              <p className="text-[10px] text-slate-500">Oggi</p>
            </div>
          </div>
          {/* Indicatore scroll dinamico */}
          <div className="flex justify-center gap-1.5 mt-1">
            <div 
              className={`h-1 rounded-full transition-all duration-200 ${
                statsScrollProgress < 0.33 
                  ? 'w-8 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                  : 'w-4 bg-slate-600/50'
              }`} 
            />
            <div 
              className={`h-1 rounded-full transition-all duration-200 ${
                statsScrollProgress >= 0.33 && statsScrollProgress < 0.66 
                  ? 'w-8 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                  : 'w-4 bg-slate-600/50'
              }`} 
            />
            <div 
              className={`h-1 rounded-full transition-all duration-200 ${
                statsScrollProgress >= 0.66 
                  ? 'w-8 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                  : 'w-4 bg-slate-600/50'
              }`} 
            />
          </div>
        </div>

        {/* Mobile Quick Actions - Pill scrollabili con blur fade */}
        <div className="relative -mx-4">
          <div 
            ref={actionsScrollRef}
            onScroll={handleActionsScroll}
            className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3"
            style={{
              maskImage: 'linear-gradient(to right, black 0%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 0%, black 85%, transparent 100%)'
            }}
          >
            {quickActions.slice(0, 8).map(actionId => {
              const action = AVAILABLE_ACTIONS.find(a => a.id === actionId);
              if (!action) return null;
              const colorMap = {
                blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
                green: 'bg-green-500/20 text-green-400 border-green-500/30',
                indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
                violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
                sky: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
                teal: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
              };
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border backdrop-blur-sm text-xs font-medium ${colorMap[action.color] || colorMap.blue}`}
                >
                  <action.icon size={14} />
                  {action.label}
                  {action.id === 'chat' && unreadChats.length > 0 && (
                    <span className="w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                      {unreadChats.length}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setShowActionsEditor(true)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full border border-slate-700/50 bg-slate-800/30 text-slate-400 text-xs"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
          {/* Indicatore scroll dinamico */}
          <div className="flex justify-center gap-1 mt-1">
            <div 
              className={`h-0.5 rounded-full transition-all duration-200 ${
                actionsScrollProgress < 0.33 
                  ? 'w-6 bg-gradient-to-r from-purple-500 to-pink-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]' 
                  : 'w-3 bg-slate-600/50'
              }`} 
            />
            <div 
              className={`h-0.5 rounded-full transition-all duration-200 ${
                actionsScrollProgress >= 0.33 && actionsScrollProgress < 0.66 
                  ? 'w-6 bg-gradient-to-r from-purple-500 to-pink-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]' 
                  : 'w-3 bg-slate-600/50'
              }`} 
            />
            <div 
              className={`h-0.5 rounded-full transition-all duration-200 ${
                actionsScrollProgress >= 0.66 
                  ? 'w-6 bg-gradient-to-r from-purple-500 to-pink-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]' 
                  : 'w-3 bg-slate-600/50'
              }`} 
            />
          </div>
        </div>

        {/* Mobile Tabbed Content */}
        <GlowCard className="overflow-hidden" hover={false}>
          {/* Tabs Header Mobile - Icone con label su tab attivo */}
          <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/30 px-1">
            {[
              { key: TAB_TYPES.CLIENTS, icon: Users, label: 'Clienti', badge: 0 },
              { key: TAB_TYPES.SCADENZE, icon: Clock, label: 'Scadenze', badge: metrics.expiringCount + metrics.expiredCount },
              { key: TAB_TYPES.CHIAMATE, icon: Phone, label: 'Chiamate', badge: upcomingCalls.length },
              { key: TAB_TYPES.CHECKS, icon: ClipboardList, label: 'Check', badge: recentChecks.length },
              { key: TAB_TYPES.CHAT, icon: MessageCircle, label: 'Chat', badge: unreadChats.length },
              { key: TAB_TYPES.ANAMNESI, icon: FileText, label: 'Anamnesi', badge: 0 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 flex flex-col items-center justify-center py-2 transition-all ${
                  activeTab === tab.key 
                    ? 'text-blue-400 bg-blue-500/10' 
                    : 'text-slate-500'
                }`}
              >
                <tab.icon size={18} />
                {/* Label visibile solo per tab attivo */}
                {activeTab === tab.key && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] font-medium mt-0.5 text-blue-400"
                  >
                    {tab.label}
                  </motion.span>
                )}
                {tab.badge > 0 && (
                  <span className={`absolute top-1 right-1/4 min-w-[14px] px-1 rounded-full text-[9px] font-bold ${
                    tab.key === TAB_TYPES.CHAT ? 'bg-purple-500/50 text-purple-200' :
                    tab.key === TAB_TYPES.SCADENZE ? 'bg-amber-500/50 text-amber-200' :
                    'bg-blue-500/50 text-blue-200'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.key && (
                  <motion.div 
                    layoutId="mobileActiveTab"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-400 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
          
          {/* Tab Content Mobile */}
          <div className="divide-y divide-slate-700/30 max-h-[350px] overflow-y-auto">
            {activeTab === TAB_TYPES.CLIENTS && (
              <>
                {sortedClients.length > 0 ? (
                  sortedClients.slice(0, 5).map(client => {
                    const exp = toDate(client.scadenza);
                    const isExpired = exp && exp < new Date();
                    const isExpiring = exp && (exp - new Date()) / (1000*60*60*24) < 7 && !isExpired;
                    const status = isExpired ? 'expired' : isExpiring ? 'expiring' : 'active';
                    return (
                      <ClientRow 
                        key={client.id} 
                        name={client.name || 'Cliente'} 
                        status={status}
                        isSelected={false}
                        onSelect={(data) => handlePreviewSelect({ ...data, clientData: { ...client, id: client.id } })}
                        clientData={client}
                        compact
                      />
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">Nessun cliente</div>
                )}
                <button onClick={() => navigate('/clients')} className="w-full py-3 text-sm text-blue-400 flex items-center justify-center gap-1 bg-slate-900/40">
                  Tutti i clienti <ArrowUpRight size={14} />
                </button>
              </>
            )}
            
            {activeTab === TAB_TYPES.SCADENZE && (
              <>
                {metrics.expiringClients?.length > 0 ? (
                  metrics.expiringClients.slice(0, 5).map(client => {
                    const exp = toDate(client.scadenza);
                    const isExpired = exp && exp < new Date();
                    const daysLeft = exp ? Math.ceil((exp - new Date()) / (1000*60*60*24)) : 0;
                    return (
                      <ClientRow 
                        key={client.id} 
                        name={client.name} 
                        status={isExpired ? 'expired' : 'expiring'}
                        subtitle={isExpired ? `${Math.abs(daysLeft)}g fa` : `${daysLeft}g`}
                        isSelected={false}
                        onSelect={(data) => handlePreviewSelect({ ...data, clientData: { ...client, id: client.id } })}
                        clientData={client}
                        compact
                      />
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">Nessuna scadenza 🎉</div>
                )}
              </>
            )}
            
            {activeTab === TAB_TYPES.CHIAMATE && (
              <>
                {upcomingCalls.length > 0 ? (
                  upcomingCalls.slice(0, 5).map((call, idx) => {
                    const scheduledDate = call.scheduledAt;
                    const isToday = scheduledDate?.toDateString() === new Date().toDateString();
                    return (
                      <ClientRow 
                        key={idx} 
                        name={call.clientName} 
                        subtitle={`${isToday ? 'Oggi' : scheduledDate?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} ${scheduledDate?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`}
                        status={isToday ? 'new' : 'active'}
                        isSelected={false}
                        onSelect={(data) => handlePreviewSelect({ ...data, clientData: call })}
                        clientData={call}
                        compact
                      />
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">Nessuna chiamata</div>
                )}
                <button onClick={() => navigate('/calls-calendar')} className="w-full py-3 text-sm text-cyan-400 flex items-center justify-center gap-1 bg-slate-900/40">
                  Calendario <ArrowUpRight size={14} />
                </button>
              </>
            )}
            
            {activeTab === TAB_TYPES.CHECKS && (
              <>
                {recentChecks.length > 0 ? (
                  recentChecks.slice(0, 5).map(check => (
                    <ClientRow 
                      key={check.id} 
                      name={check.clientName} 
                      subtitle={check.weight ? formatWeight(check.weight) : 'Check'}
                      status="active"
                      isSelected={false}
                      onSelect={(data) => handlePreviewSelect({ ...data, clientData: check })}
                      clientData={check}
                      compact
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">Nessun check</div>
                )}
              </>
            )}
            
            {activeTab === TAB_TYPES.CHAT && (
              <>
                {unreadChats.length > 0 ? (
                  unreadChats.slice(0, 5).map(chat => (
                    <ClientRow 
                      key={chat.chatId} 
                      name={chat.clientName} 
                      subtitle={chat.lastMessage?.substring(0, 30) || 'Nuovo'}
                      status="new"
                      isSelected={false}
                      onSelect={(data) => handlePreviewSelect({ ...data, clientData: chat })}
                      clientData={chat}
                      compact
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">Nessun messaggio 🎉</div>
                )}
                <button onClick={() => navigate('/chat')} className="w-full py-3 text-sm text-purple-400 flex items-center justify-center gap-1 bg-slate-900/40">
                  Tutte le chat <ArrowUpRight size={14} />
                </button>
              </>
            )}
            
            {activeTab === TAB_TYPES.ANAMNESI && (
              <>
                {recentAnamnesi.length > 0 ? (
                  recentAnamnesi.slice(0, 5).map(item => (
                    <ClientRow 
                      key={item.id} 
                      name={item.clientName} 
                      subtitle={item.type || 'Anamnesi'}
                      status="active"
                      isSelected={false}
                      onSelect={(data) => handlePreviewSelect({ ...data, clientData: item })}
                      clientData={item}
                      compact
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">Nessuna anamnesi</div>
                )}
              </>
            )}
          </div>
        </GlowCard>

        {/* Obiettivo Compatto Mobile */}
        <button 
          onClick={() => setShowGoalEditor(true)}
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 w-full text-left hover:bg-slate-800/50 transition-colors active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Trophy size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Obiettivo</span>
              <span className="text-xs font-medium text-white">
                €{(() => {
                  let total = 0;
                  if (goalSettings.includeRevenue) total += metrics.periodRevenue;
                  if (goalSettings.includeRenewals) total += metrics.renewalsRevenue;
                  return total.toLocaleString();
                })()} / €{(goalSettings.goalAmount / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${Math.min((() => {
                  let total = 0;
                  if (goalSettings.includeRevenue) total += metrics.periodRevenue;
                  if (goalSettings.includeRenewals) total += metrics.renewalsRevenue;
                  return (total / goalSettings.goalAmount) * 100;
                })(), 100)}%` }}
              />
            </div>
          </div>
          <Settings size={14} className="text-slate-500" />
        </button>
      </div>

      {/* ==================== DESKTOP LAYOUT (>= md) ==================== */}
      <div className="hidden md:flex md:flex-col relative w-full flex-1 px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-shrink-0 mb-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white"
            >
              Buongiorno, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{userName?.split(' ')[0] || 'Coach'}</span> 👋
            </motion.h1>
            <p className="text-slate-500 mt-1">Ecco cosa succede oggi nel tuo business</p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/chat')}
              className="relative p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <Bell size={20} />
              {unreadChats.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {unreadChats.length}
                </span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/settings')}
              className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <Settings size={20} />
            </motion.button>
          </div>
        </header>

        {/* Main Grid - 3 colonne su lg, 4 su 2xl - occupa tutto lo spazio rimanente */}
        <div className="flex gap-5 2xl:gap-6 flex-1 min-h-0 overflow-hidden">
          
          {/* Left Column - 2/3 su lg, 3/4 su 2xl */}
          <div className="w-full lg:w-2/3 2xl:w-3/4 flex flex-col gap-5 min-h-0 overflow-hidden">
            
            {/* Top Row - Su 2xl affianca HeroCard con Stats extra */}
            <div className="grid 2xl:grid-cols-3 gap-5 flex-shrink-0">
              {/* Hero Card - Revenue con toggle Incasso/Rinnovi */}
              <div className="2xl:col-span-2">
                <HeroCard 
                  showRevenue={showRevenue}
                  onToggleRevenue={() => setShowRevenue(!showRevenue)}
                  isRenewals={isRenewals}
                  onToggleType={() => setIsRenewals(!isRenewals)}
                  revenueTimeRange={revenueTimeRange}
                  onTimeRangeChange={setRevenueTimeRange}
                  periodRevenue={metrics.periodRevenue}
                  renewalsRevenue={metrics.renewalsRevenue}
                  totalClients={metrics.totalClients}
                  newClients={metrics.newClients}
                  expiringCount={metrics.expiringCount + metrics.expiredCount}
                  onRevenueClick={() => {
                    setRevenueModalType(isRenewals ? 'rinnovi' : 'incasso');
                    setShowRevenueModal(true);
                  }}
                />
              </div>
              
              {/* Extra Stats - Solo su 2xl */}
              <div className="hidden 2xl:flex flex-col gap-4 min-w-[200px]">
                <StatCard 
                  icon={Activity}
                  label="Sessioni Oggi"
                  value={upcomingCalls.filter(c => c.scheduledAt?.toDateString() === new Date().toDateString()).length}
                  color="cyan"
                  subtitle="Appuntamenti"
                />
                {/* Obiettivo Card con barra */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <Trophy size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Obiettivo</p>
                        <p className="text-xs text-slate-500">
                          €{(() => {
                            let total = 0;
                            if (goalSettings.includeRevenue) total += metrics.periodRevenue;
                            if (goalSettings.includeRenewals) total += metrics.renewalsRevenue;
                            return total.toLocaleString();
                          })()} / €{goalSettings.goalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowGoalEditor(true)}
                      className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.min((() => {
                          let total = 0;
                          if (goalSettings.includeRevenue) total += metrics.periodRevenue;
                          if (goalSettings.includeRenewals) total += metrics.renewalsRevenue;
                          return (total / goalSettings.goalAmount) * 100;
                        })(), 100)}%` 
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {Math.round((() => {
                        let total = 0;
                        if (goalSettings.includeRevenue) total += metrics.periodRevenue;
                        if (goalSettings.includeRenewals) total += metrics.renewalsRevenue;
                        return (total / goalSettings.goalAmount) * 100;
                      })())}% raggiunto
                    </span>
                    {(() => {
                      let total = 0;
                      if (goalSettings.includeRevenue) total += metrics.periodRevenue;
                      if (goalSettings.includeRenewals) total += metrics.renewalsRevenue;
                      return (total / goalSettings.goalAmount) >= 0.7;
                    })() && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <Flame size={12} /> In trend!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabbed Content - Dati Reali - con scroll interno */}
            <GlowCard className="overflow-hidden flex flex-col flex-1 min-h-0" hover={false}>
              {/* Tabs Header */}
              <div className="flex items-center border-b border-slate-700/50 overflow-x-auto scrollbar-hide bg-slate-900/30">
                {[
                  { key: TAB_TYPES.CLIENTS, label: 'Clienti', icon: Users },
                  { key: TAB_TYPES.SCADENZE, label: 'Scadenze', icon: Clock, badge: metrics.expiringCount + metrics.expiredCount },
                  { key: TAB_TYPES.CHIAMATE, label: 'Chiamate', icon: Phone, badge: upcomingCalls.length },
                  { key: TAB_TYPES.CHECKS, label: 'Check', icon: ClipboardList, badge: recentChecks.length },
                  { key: TAB_TYPES.CHAT, label: 'Chat', icon: MessageCircle, badge: unreadChats.length },
                  { key: TAB_TYPES.ANAMNESI, label: 'Anamnesi', icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-3 text-xs font-medium transition-all whitespace-nowrap min-w-fit ${
                      activeTab === tab.key 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <tab.icon size={16} className="flex-shrink-0" />
                    <span className={`text-[10px] sm:text-xs ${activeTab === tab.key ? 'block' : 'hidden sm:inline'}`}>{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className={`min-w-[18px] px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tab.key === TAB_TYPES.CHAT ? 'bg-purple-500/30 text-purple-400' :
                        tab.key === TAB_TYPES.SCADENZE ? 'bg-amber-500/30 text-amber-400' :
                        'bg-blue-500/30 text-blue-400'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    {activeTab === tab.key && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                      />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Tab Content - Master-Detail Layout */}
              <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                {/* Lista (Master) */}
                <div className={`${selectedPreview ? 'md:w-1/2 2xl:w-2/5' : 'w-full'} divide-y divide-slate-700/30 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/50 transition-all duration-300`}>
                  {activeTab === TAB_TYPES.CLIENTS && (
                    <>
                      {sortedClients.length > 0 ? (
                        sortedClients.map(client => {
                          const exp = toDate(client.scadenza);
                          const isExpired = exp && exp < new Date();
                          const isExpiring = exp && (exp - new Date()) / (1000*60*60*24) < 7 && !isExpired;
                          const createdDate = toDate(client.createdAt);
                          const status = isExpired ? 'expired' : isExpiring ? 'expiring' : 'active';
                          return (
                            <ClientRow 
                              key={client.id} 
                              name={client.name || 'Cliente'} 
                              email={client.email}
                              status={status}
                              subtitle={createdDate ? `Aggiunto ${createdDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}` : null}
                              isSelected={selectedPreview?.clientData?.id === client.id}
                              onSelect={(data) => handlePreviewSelect({ ...data, clientData: { ...client, id: client.id } })}
                              clientData={client}
                            />
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">Nessun cliente</div>
                      )}
                      <div className="p-3 bg-slate-900/40">
                        <button onClick={() => navigate('/clients')} className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1">
                          Vedi tutti <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                  
                  {activeTab === TAB_TYPES.SCADENZE && (
                    <>
                      {metrics.expiringClients?.length > 0 ? (
                        metrics.expiringClients.slice(0, 8).map(client => {
                          const exp = toDate(client.scadenza);
                          const isExpired = exp && exp < new Date();
                          const daysLeft = exp ? Math.ceil((exp - new Date()) / (1000*60*60*24)) : 0;
                          const status = isExpired ? 'expired' : 'expiring';
                          return (
                            <ClientRow 
                              key={client.id} 
                              name={client.name} 
                              email={client.email}
                              status={status}
                              subtitle={isExpired ? `Scaduto ${Math.abs(daysLeft)} giorni fa` : `Scade tra ${daysLeft} giorni`}
                              isSelected={selectedPreview?.clientData?.id === client.id}
                              onSelect={(data) => handlePreviewSelect({ ...data, clientData: { ...client, id: client.id } })}
                              clientData={client}
                            />
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">Nessuna scadenza 🎉</div>
                      )}
                      <div className="p-3 bg-slate-900/40">
                        <button onClick={() => navigate('/clients?filter=expiring')} className="w-full py-2 text-sm text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1">
                          Gestisci scadenze <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                  
                  {activeTab === TAB_TYPES.CHIAMATE && (
                    <>
                      {upcomingCalls.length > 0 ? (
                        upcomingCalls.slice(0, 5).map((call, idx) => {
                          const scheduledDate = call.scheduledAt;
                          const isToday = scheduledDate?.toDateString() === new Date().toDateString();
                          return (
                            <ClientRow 
                              key={idx} 
                              name={call.clientName} 
                              subtitle={`${isToday ? 'Oggi' : scheduledDate?.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit' })} alle ${scheduledDate?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`}
                              status={isToday ? 'new' : 'active'}
                              isSelected={selectedPreview?.clientData?.clientId === call.clientId}
                              onSelect={(data) => handlePreviewSelect({ ...data, clientData: { ...call, clientId: call.clientId, scheduledAt: call.scheduledAt } })}
                              clientData={call}
                            />
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">Nessuna chiamata programmata</div>
                      )}
                      <div className="p-3 bg-slate-900/40">
                        <button onClick={() => navigate('/calls-calendar')} className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1">
                          Calendario Chiamate <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                  
                  {activeTab === TAB_TYPES.CHECKS && (
                    <>
                      {recentChecks.length > 0 ? (
                        recentChecks.slice(0, 5).map(check => (
                          <ClientRow 
                            key={check.id} 
                            name={check.clientName} 
                            subtitle={`${toDate(check.createdAt)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) || ''} - ${check.weight ? formatWeight(check.weight) : 'Check-in'}`}
                            status="active"
                            isSelected={selectedPreview?.clientData?.clientId === check.clientId}
                            onSelect={(data) => handlePreviewSelect({ ...data, clientData: check })}
                            clientData={check}
                          />
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">Nessun check recente</div>
                      )}
                    </>
                  )}
                  
                  {activeTab === TAB_TYPES.CHAT && (
                    <>
                      {unreadChats.length > 0 ? (
                        unreadChats.slice(0, 5).map(chat => (
                          <ClientRow 
                            key={chat.chatId} 
                            name={chat.clientName} 
                            subtitle={chat.lastMessage || 'Nuovo messaggio'}
                            status="new"
                            isSelected={selectedPreview?.clientData?.clientId === chat.clientId}
                            onSelect={(data) => handlePreviewSelect({ ...data, clientData: { ...chat, clientId: chat.clientId, lastMessage: chat.lastMessage } })}
                            clientData={chat}
                          />
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">Nessun messaggio non letto 🎉</div>
                      )}
                      <div className="p-3 bg-slate-900/40">
                        <button onClick={() => navigate('/chat')} className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1">
                          Vai alla Chat <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                  
                  {activeTab === TAB_TYPES.ANAMNESI && (
                    <>
                      {recentAnamnesi.length > 0 ? (
                        recentAnamnesi.slice(0, 5).map(item => (
                          <ClientRow 
                            key={item.id} 
                            name={item.clientName} 
                            subtitle={`${toDate(item.createdAt)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) || ''} - ${item.type || 'Anamnesi'}`}
                            status="active"
                            isSelected={selectedPreview?.clientData?.clientId === item.clientId}
                            onSelect={(data) => handlePreviewSelect({ ...data, clientData: item })}
                            clientData={item}
                          />
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">Nessuna anamnesi recente</div>
                      )}
                    </>
                  )}
                </div>

                {/* Preview Panel (Detail) - Solo su lg+ */}
                <div className={`hidden md:block ${selectedPreview ? 'md:w-1/2 2xl:w-3/5' : 'w-0'} border-l border-slate-700/30 bg-slate-900/20 transition-all duration-300 overflow-hidden`}>
                  <AnimatePresence mode="wait">
                    <PreviewPanel 
                      data={selectedPreview}
                      type={
                        activeTab === TAB_TYPES.CHIAMATE ? 'chiamata' : 
                        activeTab === TAB_TYPES.CHAT ? 'chat' : 
                        activeTab === TAB_TYPES.CHECKS ? 'check' :
                        activeTab === TAB_TYPES.ANAMNESI ? 'anamnesi' :
                        'client'
                      }
                      formatWeight={formatWeight}
                      onNavigate={(id, basePath = '/client/', query = '') => navigate(`${basePath}${id}${query}`)}
                      onClose={() => setSelectedPreview(null)}
                    />
                  </AnimatePresence>
                </div>
              </div>
            </GlowCard>

          </div>

          {/* Right Column - 1/3 su lg, 1/4 su 2xl */}
          <div className="w-full lg:w-1/3 2xl:w-1/4 flex flex-col gap-5 min-h-0 overflow-hidden">
            
            {/* Quick Actions - Personalizzabili */}
            <div className="flex-shrink-0">
              <SectionHeader 
                title="Azioni Rapide" 
                rightContent={
                  <button 
                    onClick={() => setShowActionsEditor(true)}
                    className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                }
              />
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {quickActions.map(actionId => {
                  const action = AVAILABLE_ACTIONS.find(a => a.id === actionId);
                  if (!action) return null;
                  return (
                    <QuickAction 
                      key={action.id}
                      icon={action.icon} 
                      label={action.label} 
                      color={action.color}
                      badge={action.id === 'chat' ? unreadChats.length : null}
                      onClick={() => navigate(action.path)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Activity Feed - Più lungo senza la card obiettivo */}
            <GlowCard className="p-5 flex-1 flex flex-col min-h-0 overflow-hidden" hover={false}>
              <SectionHeader 
                title="Attività Recente" 
                action={() => navigate('/clients')}
              />
              <div className="space-y-1 -mx-2 overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/50">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <ActivityItem 
                      key={activity.id} 
                      icon={activity.icon}
                      title={activity.title}
                      subtitle={activity.subtitle}
                      time={activity.time}
                      color={activity.color}
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">Nessuna attività recente</p>
                )}
              </div>
            </GlowCard>
          </div>
        </div>
      </div>

      {/* Quick Actions Editor Modal */}
      <QuickActionsEditor 
        isOpen={showActionsEditor}
        onClose={() => setShowActionsEditor(false)}
        selectedActions={quickActions}
        onSave={handleSaveQuickActions}
      />

      {/* Goal Editor Modal */}
      <GoalEditor
        isOpen={showGoalEditor}
        onClose={() => setShowGoalEditor(false)}
        settings={goalSettings}
        onSave={handleSaveGoalSettings}
      />

      {/* Modal Dettaglio Incassi/Rinnovi */}
      <AnimatePresence>
        {showRevenueModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRevenueModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700/30 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className={`p-4 border-b border-slate-700/30 flex items-center justify-between ${revenueModalType === 'rinnovi' ? 'bg-cyan-900/30' : 'bg-emerald-900/30'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${revenueModalType === 'rinnovi' ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`}>
                    {revenueModalType === 'rinnovi' ? (
                      <RefreshCw size={20} className="text-cyan-400" />
                    ) : (
                      <DollarSign size={20} className="text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {revenueModalType === 'rinnovi' ? 'Dettaglio Rinnovi' : 'Dettaglio Incassi'}
                    </h3>
                    <p className="text-sm text-slate-400">{metrics.periodLabel} corrente</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRevenueModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {revenueModalType === 'rinnovi' ? (
                  <div className="space-y-2">
                    {metrics.renewalPaymentsList?.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-sm text-slate-400 px-2 pb-2 border-b border-slate-700/30">
                          <span>Totale Rinnovi</span>
                          <span className="text-cyan-400 font-bold">€{metrics.renewalsRevenue?.toLocaleString()}</span>
                        </div>
                        {metrics.renewalPaymentsList.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            onClick={() => { setShowRevenueModal(false); navigate(`/client/${p.clientId}`); }}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                {p.clientName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{p.clientName}</p>
                                <p className="text-xs text-slate-400">
                                  {new Date(p.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                  {p.isRate && ' • Rata'}
                                </p>
                              </div>
                            </div>
                            <span className="text-cyan-400 font-bold">€{p.amount?.toLocaleString()}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <RefreshCw size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Nessun rinnovo in questo periodo</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {metrics.regularPaymentsList?.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-sm text-slate-400 px-2 pb-2 border-b border-slate-700/30">
                          <span>Totale Incassi (esclusi rinnovi)</span>
                          <span className="text-emerald-400 font-bold">€{metrics.periodRevenue?.toLocaleString()}</span>
                        </div>
                        {metrics.regularPaymentsList.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            onClick={() => { setShowRevenueModal(false); navigate(`/client/${p.clientId}`); }}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                                {p.clientName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{p.clientName}</p>
                                <p className="text-xs text-slate-400">
                                  {new Date(p.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                  {p.isRate && ' • Rata'}
                                </p>
                              </div>
                            </div>
                            <span className="text-emerald-400 font-bold">€{p.amount?.toLocaleString()}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Nessun incasso in questo periodo</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer con toggle */}
              <div className="p-4 border-t border-slate-700/30 flex justify-center gap-2">
                <button
                  onClick={() => setRevenueModalType('incasso')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    revenueModalType === 'incasso'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <DollarSign size={14} className="inline mr-1" />
                  Incassi
                </button>
                <button
                  onClick={() => setRevenueModalType('rinnovi')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    revenueModalType === 'rinnovi'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <RefreshCw size={14} className="inline mr-1" />
                  Rinnovi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Preview Modal */}
      <AnimatePresence>
        {showMobilePreview && selectedPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden flex items-end"
            onClick={() => setShowMobilePreview(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[85vh] bg-slate-900 border-t border-slate-700/50 rounded-t-3xl overflow-hidden"
            >
              {/* Drag handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-slate-600 rounded-full" />
              </div>
              
              {/* Content */}
              <div className="max-h-[calc(85vh-24px)] overflow-y-auto">
                <PreviewPanel 
                  data={selectedPreview}
                  type={
                    activeTab === TAB_TYPES.CHIAMATE ? 'chiamata' : 
                    activeTab === TAB_TYPES.CHAT ? 'chat' : 
                    activeTab === TAB_TYPES.CHECKS ? 'check' :
                    activeTab === TAB_TYPES.ANAMNESI ? 'anamnesi' :
                    'client'
                  }
                  formatWeight={formatWeight}
                  onNavigate={(id, basePath = '/client/', query = '') => {
                    setShowMobilePreview(false);
                    navigate(`${basePath}${id}${query}`);
                  }}
                  onClose={() => setShowMobilePreview(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default DashboardDemo;
