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

// Client Row (come DashboardPro)
const ClientRow = ({ name, email, status, subtitle, onClick }) => {
  const statusMap = {
    active: { label: 'Attivo', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    expiring: { label: 'In scadenza', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    expired: { label: 'Scaduto', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
    new: { label: 'Nuovo', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  };

  const s = statusMap[status] || statusMap.active;

  return (
    <motion.div
      whileHover={{ x: 4, backgroundColor: 'rgba(51, 65, 85, 0.3)' }}
      onClick={onClick}
      className="flex items-center gap-4 p-3 sm:p-4 transition-colors cursor-pointer group"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
          {name.charAt(0)}
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
    <div className="min-h-screen">
      {/* NebulaBackground gestito da ProLayout */}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24 lg:pb-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-white"
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

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Hero Card - Revenue con toggle Incasso/Rinnovi */}
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

            {/* Tabbed Content - Dati Reali */}
            <GlowCard className="overflow-hidden" hover={false}>
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
                    className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-medium transition-all whitespace-nowrap min-w-fit ${
                      activeTab === tab.key 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <tab.icon size={15} className="flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
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
              
              {/* Tab Content - Dynamic */}
              <div className="divide-y divide-slate-700/30">
                {activeTab === TAB_TYPES.CLIENTS && (
                  <>
                    {sortedClients.length > 0 ? (
                      sortedClients.map(client => {
                        const exp = toDate(client.scadenza);
                        const isExpired = exp && exp < new Date();
                        const isExpiring = exp && (exp - new Date()) / (1000*60*60*24) < 7 && !isExpired;
                        const createdDate = toDate(client.createdAt);
                        return (
                          <ClientRow 
                            key={client.id} 
                            name={client.name || 'Cliente'} 
                            email={client.email}
                            status={isExpired ? 'expired' : isExpiring ? 'expiring' : 'active'}
                            subtitle={createdDate ? `Aggiunto ${createdDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}` : null}
                            onClick={() => navigate(`/client/${client.id}`)}
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
                        return (
                          <ClientRow 
                            key={client.id} 
                            name={client.name} 
                            email={client.email}
                            status={isExpired ? 'expired' : 'expiring'}
                            subtitle={isExpired ? `Scaduto ${Math.abs(daysLeft)} giorni fa` : `Scade tra ${daysLeft} giorni`}
                            onClick={() => navigate(`/client/${client.id}`)}
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
                            onClick={() => navigate(`/client/${call.clientId}`)}
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
                          onClick={() => navigate(`/client/${check.clientId}?tab=check`)}
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
                          onClick={() => navigate(`/chat/${chat.clientId}`)}
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
                          onClick={() => navigate(`/client/${item.clientId}?tab=anamnesi`)}
                        />
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">Nessuna anamnesi recente</div>
                    )}
                  </>
                )}
              </div>
            </GlowCard>

          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-5">
            
            {/* Quick Actions - Personalizzabili */}
            <div>
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

            {/* Activity Feed */}
            <GlowCard className="p-5" hover={false}>
              <SectionHeader 
                title="Attività Recente" 
                action={() => navigate('/clients')}
              />
              <div className="space-y-1 -mx-2">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity) => (
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

            {/* Gamification Card - Obiettivo basato su revenue */}
            <GlowCard glowColor="purple" className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Trophy size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Obiettivo Mensile</p>
                  <p className="text-xs text-slate-500">€ {(metrics.periodRevenue + metrics.renewalsRevenue).toLocaleString()} / € 10,000</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((metrics.periodRevenue + metrics.renewalsRevenue) / 10000) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{Math.round(((metrics.periodRevenue + metrics.renewalsRevenue) / 10000) * 100)}% raggiunto</span>
                {((metrics.periodRevenue + metrics.renewalsRevenue) / 10000) >= 0.7 && (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Flame size={14} /> In trend!
                  </span>
                )}
              </div>
            </GlowCard>

            {/* Revenue Chart - Collapsible */}
            <RevenueSection 
              isExpanded={revenueExpanded} 
              onToggle={() => setRevenueExpanded(!revenueExpanded)} 
            />
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
