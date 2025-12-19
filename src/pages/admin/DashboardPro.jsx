// src/pages/admin/DashboardPro.jsx
// Dashboard Pro - Design moderno ispirato a ClientDashboard v2.0
// Layout ottimizzato per mobile con focus su metriche e azioni rapide
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, onSnapshot, getDocs, doc, getDoc, query, orderBy, limit, updateDoc, setDoc } from "firebase/firestore";
import { auth, db, toDate } from "../../firebase";
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantBranding } from '../../hooks/useTenantBranding';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { SkeletonCard, SkeletonList } from '../../components/ui/SkeletonLoader';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePageInfo } from '../../contexts/PageContext';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Calendar, 
  ChevronRight, LogOut, User, Bell, Search, Plus,
  Clock, AlertCircle, CheckCircle, Phone, ArrowUpRight,
  BarChart2, Activity, Target, Zap, Eye, EyeOff,
  Settings, CreditCard, Palette, FileText, ClipboardList,
  X, ChevronDown, Edit3, ChevronLeft, RefreshCw, MessageCircle,
  Sparkles, UserPlus, Dumbbell, Utensils, Home, LayoutDashboard,
  Globe, BookOpen, Video, Image, Mail, Link as LinkIcon, Database, Shield,
  Pencil, Check, GripVertical
} from "lucide-react";

// ============ AVAILABLE QUICK ACTIONS ============
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

const DEFAULT_QUICK_ACTIONS = ['analytics', 'settings', 'branding'];

// ============ COMPONENTI UI ============

// Loading Skeleton migliorato stile ClientDashboard
const LoadingSpinner = () => (
  <div className="min-h-screen px-4 py-4 space-y-4">
    <div className="h-12 w-48 bg-slate-700/50 rounded-lg animate-pulse" />
    <div className="h-32 bg-slate-700/50 rounded-2xl animate-pulse" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-24 bg-slate-700/50 rounded-xl animate-pulse" />
      <div className="h-24 bg-slate-700/50 rounded-xl animate-pulse" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div className="h-20 bg-slate-700/50 rounded-xl animate-pulse" />
      <div className="h-20 bg-slate-700/50 rounded-xl animate-pulse" />
      <div className="h-20 bg-slate-700/50 rounded-xl animate-pulse" />
    </div>
    <div className="h-40 bg-slate-700/50 rounded-xl animate-pulse" />
  </div>
);

// Hero Stats Card - Card principale con metriche chiave (ispirato a HeroStreakCard)
const HeroStatsCard = ({ revenue, totalClients, newClients, showRevenue, onToggleRevenue, periodLabel, isRenewals, onToggleType, renewalsRevenue, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm"
  >
    {/* Glow effect */}
    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
    
    <div className="relative p-4 sm:p-5">
      {/* Header con toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isRenewals ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`}>
            {isRenewals ? <RefreshCw size={18} className="text-cyan-400" /> : <DollarSign size={18} className="text-emerald-400" />}
          </div>
          <span className="text-xs text-slate-400 font-medium">{periodLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleRevenue}
            className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white transition-colors"
          >
            {showRevenue ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      </div>
      
      {/* Main Revenue Display con swipe indicator */}
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={onClick}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleType(); }}
          className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex-1 text-center">
          <motion.p 
            key={isRenewals ? 'renewals' : 'revenue'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl sm:text-4xl font-bold mb-1 ${isRenewals ? 'text-cyan-400' : 'text-white'}`}
          >
            {showRevenue 
              ? `€${(isRenewals ? renewalsRevenue : revenue).toLocaleString()}`
              : '€ •••'
            }
          </motion.p>
          <p className={`text-sm ${isRenewals ? 'text-cyan-400/70' : 'text-slate-400'}`}>
            {isRenewals ? 'Rinnovi' : 'Incasso'}
          </p>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleType(); }}
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
      
      {/* Bottom stats row */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700/50">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{totalClients}</p>
          <p className="text-[10px] text-slate-500">Clienti Attivi</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="text-xl font-bold text-emerald-400">+{newClients}</p>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <p className="text-[10px] text-slate-500">Questo Mese</p>
        </div>
      </div>
    </div>
  </motion.div>
);

// Bottone azione primaria grande (stile ClientDashboard)
const PrimaryActionButton = ({ to, onClick, icon: Icon, label, color, badge }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/25',
    green: 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25',
    purple: 'from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-500/25',
    cyan: 'from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-cyan-500/25',
    amber: 'from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-500/25',
  };

  const Wrapper = to ? Link : 'button';
  const wrapperProps = to ? { to } : { onClick };

  return (
    <Wrapper {...wrapperProps}>
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={`relative bg-gradient-to-br ${colorClasses[color]} rounded-xl p-3 sm:p-4 shadow-lg transition-all`}
      >
        {badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {badge}
          </span>
        )}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
          <Icon size={24} className="text-white" />
          <span className="text-[10px] sm:text-xs font-semibold text-white text-center leading-tight">{label}</span>
        </div>
      </motion.div>
    </Wrapper>
  );
};

// Alert compatto con pill badges (stile migliorato)
const AlertPills = ({ metrics, callRequests, unreadChats, navigate, setActiveTab }) => {
  const hasAlerts = metrics.expiredCount > 0 || metrics.expiringCount > 0 || callRequests.length > 0 || unreadChats.length > 0;
  if (!hasAlerts) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 p-3 bg-slate-800/20 backdrop-blur-sm rounded-xl border border-slate-700/30"
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
          onClick={() => navigate(`/admin/client/${callRequests[0]?.clientId}`)}
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

// Mini Stat Card per metriche secondarie
const MiniStatCard = ({ value, label, icon: Icon, color = 'blue', onClick, trend }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-xl bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 p-3 ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent`} />
    <div className="relative flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-${color}-500/20 flex-shrink-0`}>
        <Icon size={16} className={`text-${color}-400`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className={`text-lg font-bold text-${color === 'amber' ? 'amber' : 'white'}-${color === 'amber' ? '400' : ''}`}>
            {value}
          </p>
          {trend && (
            <span className="text-[10px] text-emerald-400">+{trend}</span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 truncate">{label}</p>
      </div>
      {onClick && <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />}
    </div>
  </motion.div>
);

// Big Number - Per metriche principali
const BigNumber = ({ value, label, icon: Icon, trend, trendValue, onClick, toggleIcon }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent" />
    <div className="relative p-4 sm:p-5">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-xl bg-blue-500/20">
          <Icon size={18} className="text-blue-400" />
        </div>
        {toggleIcon && (
          <button className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
            {toggleIcon}
          </button>
        )}
        {trend && !toggleIcon && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            trendValue?.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {trendValue?.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs sm:text-sm text-slate-400">{label}</p>
    </div>
  </motion.div>
);

// Quick Action Button
const QuickAction = ({ icon: Icon, label, onClick, color = 'blue' }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-${color}-500/10 hover:bg-${color}-500/20 border border-${color}-500/20 transition-colors`}
  >
    <Icon size={20} className={`text-${color}-400`} />
    <span className="text-xs text-slate-300 font-medium">{label}</span>
  </motion.button>
);

// Quick Actions Editor Modal
const QuickActionsEditor = ({ isOpen, onClose, selectedActions, onSave }) => {
  const [tempSelected, setTempSelected] = useState(selectedActions);

  useEffect(() => {
    setTempSelected(selectedActions);
  }, [selectedActions, isOpen]);

  const toggleAction = (actionId) => {
    if (tempSelected.includes(actionId)) {
      setTempSelected(tempSelected.filter(id => id !== actionId));
    } else if (tempSelected.length < 3) {
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
          className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Zap size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Personalizza Azioni</h3>
                <p className="text-xs text-slate-400">Seleziona fino a 3 azioni rapide</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Selected Actions Preview */}
          <div className="p-4 bg-slate-800/30 border-b border-slate-700/30">
            <p className="text-xs text-slate-400 mb-2">Selezionate ({tempSelected.length}/3):</p>
            <div className="flex gap-2">
              {tempSelected.length > 0 ? (
                tempSelected.map(actionId => {
                  const action = AVAILABLE_ACTIONS.find(a => a.id === actionId);
                  if (!action) return null;
                  return (
                    <div
                      key={action.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-${action.color}-500/20 border border-${action.color}-500/30`}
                    >
                      <action.icon size={14} className={`text-${action.color}-400`} />
                      <span className="text-xs text-white">{action.label}</span>
                      <button
                        onClick={() => toggleAction(action.id)}
                        className="ml-1 p-0.5 rounded hover:bg-slate-700/50"
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
                const isDisabled = !isSelected && tempSelected.length >= 3;
                
                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                    whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                    onClick={() => !isDisabled && toggleAction(action.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? `bg-${action.color}-500/20 border-${action.color}-500/50`
                        : isDisabled
                          ? 'bg-slate-800/20 border-slate-700/20 opacity-40 cursor-not-allowed'
                          : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-700/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? `bg-${action.color}-500/30` : 'bg-slate-700/50'}`}>
                      <action.icon size={16} className={isSelected ? `text-${action.color}-400` : 'text-slate-400'} />
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {action.label}
                    </span>
                    {isSelected && (
                      <Check size={16} className={`ml-auto text-${action.color}-400`} />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50 flex gap-3">
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

// Timeline Item
const TimelineItem = ({ icon: Icon, title, subtitle, time, color = 'slate', isLast, onClick }) => (
  <div className={`flex gap-3 ${onClick ? 'cursor-pointer hover:bg-slate-800/30 -mx-2 px-2 py-1 rounded-lg' : ''}`} onClick={onClick}>
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
        <Icon size={14} className={`text-${color}-400`} />
      </div>
      {!isLast && <div className="w-px h-full bg-slate-700/50 my-1" />}
    </div>
    <div className="pb-4 min-w-0">
      <p className="text-sm text-white font-medium truncate">{title}</p>
      <p className="text-xs text-slate-400 truncate">{subtitle}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{time}</p>
    </div>
  </div>
);

// Client Row
const ClientRow = ({ client, onClick, subtitle }) => {
  const scadenza = toDate(client.scadenza);
  const isExpiring = scadenza && (scadenza - new Date()) / (1000 * 60 * 60 * 24) < 7 && scadenza > new Date();
  const isExpired = scadenza && scadenza < new Date();
  
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {client.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{client.name}</p>
        <p className="text-xs text-slate-400 truncate">{subtitle || client.email}</p>
      </div>
      {isExpired && (
        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-medium">
          Scaduto
        </span>
      )}
      {isExpiring && !isExpired && (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium">
          Scade presto
        </span>
      )}
      <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
    </motion.div>
  );
};

// Alert Banner
const AlertBanner = ({ icon: Icon, title, subtitle, color = 'amber', action, actionLabel }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
    <div className={`p-2 rounded-lg bg-${color}-500/20 flex-shrink-0`}>
      <Icon size={16} className={`text-${color}-400`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium text-${color}-300`}>{title}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
    {action && (
      <button onClick={action} className={`text-xs text-${color}-400 hover:underline flex-shrink-0`}>
        {actionLabel} →
      </button>
    )}
  </div>
);

// ============ TABS CONTENT TYPE ============
const TAB_TYPES = {
  CLIENTS: 'clients',
  SCADENZE: 'scadenze',
  CHIAMATE: 'chiamate',
  ANAMNESI: 'anamnesi',
  CHECKS: 'checks',
  CHAT: 'chat'
};

// ============ MINI TREND BAR ============
const TrendBar = ({ label, value, max, color = 'blue' }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 w-12 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-[10px] text-${color}-400 w-8 text-right font-medium`}>{value}</span>
    </div>
  );
};

// ============ TODAY EVENT ITEM ============
const TodayEvent = ({ icon: Icon, title, time, type, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
      type === 'call' ? 'hover:bg-cyan-500/10' : 
      type === 'expiry' ? 'hover:bg-amber-500/10' : 
      'hover:bg-slate-700/30'
    }`}
  >
    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
      type === 'call' ? 'bg-cyan-500/20 text-cyan-400' : 
      type === 'expiry' ? 'bg-amber-500/20 text-amber-400' : 
      'bg-slate-700 text-slate-400'
    }`}>
      <Icon size={12} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-white truncate">{title}</p>
    </div>
    <span className="text-[10px] text-slate-500">{time}</span>
  </div>
);

// ============ TIME RANGE FILTER ============
const TIME_RANGES = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year'
};

// ============ DASHBOARD PRINCIPALE ============

export default function DashboardPro() {
  const navigate = useNavigate();
  const { branding } = useTenantBranding();
  const { formatWeight } = useUserPreferences();
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
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
  const [showRenewalsOnly, setShowRenewalsOnly] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueModalType, setRevenueModalType] = useState('incasso'); // 'incasso' | 'rinnovi'
  const [unreadChats, setUnreadChats] = useState([]);
  const [weeklyChecks, setWeeklyChecks] = useState(0);
  
  // Quick Actions personalizzabili (salvate per utente in Firestore)
  const [quickActions, setQuickActions] = useState(DEFAULT_QUICK_ACTIONS);
  const [showQuickActionsEditor, setShowQuickActionsEditor] = useState(false);
  
  // Carica quick actions dell'utente da Firestore
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
  
  // Salva quick actions in Firestore per l'utente
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
  
  // Document title dinamico
  useDocumentTitle('Dashboard');
  
  // Imposta titolo nell'header
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
        setUserEmail(user.email || '');
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

  // Load clients
  useEffect(() => {
    const unsub = onSnapshot(getTenantCollection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // OPTIMIZED: Load all dashboard data in parallel
  useEffect(() => {
    let isMounted = true;
    
    const loadAllDashboardData = async () => {
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        
        // Prepare all promises for parallel execution
        const allPromises = clientsSnap.docs.map(async (clientDoc) => {
          const clientId = clientDoc.id;
          const data = clientDoc.data();
          const clientName = data.name || 'Cliente';
          const isOldClient = data.isOldClient === true;
          
          const result = {
            payments: [],
            callRequests: [],
            upcomingCalls: [],
            anamnesi: [],
            checks: []
          };
          
          try {
            // Load payments, rates, calls, anamnesi, checks in parallel for each client
            const [paymentsSnap, ratesSnap, callsSnap, anamnesiSnap, checksSnap] = await Promise.all([
              getDocs(getTenantSubcollection(db, 'clients', clientId, 'payments')).catch(() => ({ docs: [] })),
              getDocs(getTenantSubcollection(db, 'clients', clientId, 'rates')).catch(() => ({ docs: [] })),
              getDocs(getTenantSubcollection(db, 'clients', clientId, 'calls')).catch(() => ({ docs: [] })),
              getDocs(query(getTenantSubcollection(db, 'clients', clientId, 'anamnesi'), orderBy('createdAt', 'desc'), limit(1))).catch(() => ({ docs: [] })),
              getDocs(query(getTenantSubcollection(db, 'clients', clientId, 'checks'), orderBy('createdAt', 'desc'), limit(2))).catch(() => ({ docs: [] }))
            ]);
            
            // Process payments from subcollection
            paymentsSnap.docs.forEach(payDoc => {
              const payData = payDoc.data();
              const isRenewal = payData.isRenewal === true;
              if (isOldClient && !isRenewal) return;
              
              const payDate = toDate(payData.paymentDate || payData.date || payData.createdAt);
              if (payDate) {
                result.payments.push({
                  id: payDoc.id,
                  clientId,
                  clientName,
                  amount: parseFloat(payData.amount) || 0,
                  date: payDate.toISOString(),
                  source: 'subcollection',
                  isRenewal
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
                  id: `subcol-rate-${clientId}-${rateDoc.id}`,
                  clientId,
                  clientName,
                  amount: parseFloat(rateData.amount) || 0,
                  date: paidDate.toISOString(),
                  source: 'rates-subcollection',
                  isRenewal: rateData.isRenewal === true,
                  isRate: true
                });
              }
            });
            
            // Process legacy rates from client doc
            if (!isOldClient) {
              (data.rate || []).forEach(rate => {
                if (rate.paid && rate.paidDate) {
                  const rateDate = toDate(rate.paidDate);
                  if (rateDate) {
                    result.payments.push({
                      id: `rate-${clientId}-${rate.paidDate}`,
                      clientId,
                      clientName,
                      amount: parseFloat(rate.amount) || 0,
                      date: rateDate.toISOString(),
                      source: 'rate',
                      isRenewal: false
                    });
                  }
                }
              });
            }
            
            // Process calls
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            callsSnap.docs.forEach(callDoc => {
              const callData = callDoc.data();
              if (callDoc.id === 'request' && callData?.status === 'pending') {
                result.callRequests.push({
                  clientId,
                  clientName,
                  ...callData
                });
              }
              if (callDoc.id === 'next' && callData?.scheduledAt) {
                const scheduledDate = toDate(callData.scheduledAt);
                if (scheduledDate && scheduledDate >= now && scheduledDate <= nextWeek) {
                  result.upcomingCalls.push({
                    clientId,
                    clientName,
                    scheduledAt: scheduledDate,
                    ...callData
                  });
                }
              }
            });
            
            // Process anamnesi
            anamnesiSnap.docs.forEach(doc => {
              result.anamnesi.push({
                id: doc.id,
                clientId,
                clientName,
                ...doc.data()
              });
            });
            
            // Process checks
            checksSnap.docs.forEach(doc => {
              result.checks.push({
                id: doc.id,
                clientId,
                clientName,
                ...doc.data()
              });
            });
          } catch (e) {
            // Silently fail for individual clients
          }
          
          return result;
        });
        
        // Wait for all clients to be processed
        const results = await Promise.all(allPromises);
        
        if (!isMounted) return;
        
        // Aggregate results
        const allPayments = [];
        const allCallRequests = [];
        const allUpcomingCalls = [];
        const allAnamnesi = [];
        const allChecks = [];
        
        results.forEach(r => {
          allPayments.push(...r.payments);
          allCallRequests.push(...r.callRequests);
          allUpcomingCalls.push(...r.upcomingCalls);
          allAnamnesi.push(...r.anamnesi);
          allChecks.push(...r.checks);
        });
        
        // Update states
        setPayments(allPayments);
        setCallRequests(allCallRequests);
        setUpcomingCalls(allUpcomingCalls.sort((a, b) => a.scheduledAt - b.scheduledAt));
        setRecentAnamnesi(
          allAnamnesi
            .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0))
            .slice(0, 10)
        );
        setRecentChecks(
          allChecks
            .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0))
            .slice(0, 10)
        );
        
        // Calculate weekly checks
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);
        const checksThisWeek = allChecks.filter(c => {
          const checkDate = toDate(c.createdAt);
          return checkDate && checkDate >= weekStart;
        }).length;
        setWeeklyChecks(checksThisWeek);
      } catch (error) {
        console.error('Dashboard data load error:', error);
      }
    };
    
    loadAllDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadAllDashboardData, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [clients.length]); // Re-run when clients change

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
              chatId: doc.id,
              clientId: otherParticipantId,
              clientName: client?.name || 'Cliente',
              unreadCount,
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
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentYearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const activeClients = clients.filter(c => !c.isOldClient && !c.archiviato);
    
    // Scadenze: prossimi 15 giorni
    const expiringClients = activeClients.filter(c => {
      const exp = toDate(c.scadenza);
      if (!exp) return false;
      const daysToExp = (exp - now) / (1000 * 60 * 60 * 24);
      return daysToExp <= 15 && daysToExp > -7; // Include anche scaduti da max 7 giorni
    }).sort((a, b) => toDate(a.scadenza) - toDate(b.scadenza));
    
    // Calcola periodo per incasso basato su revenueTimeRange
    let periodStart, periodEnd, periodLabel;
    switch (revenueTimeRange) {
      case TIME_RANGES.WEEK:
        // Settimana corrente: da lunedì a oggi
        periodStart = currentWeekStart;
        periodEnd = new Date(currentWeekStart);
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        periodLabel = 'Settimana';
        break;
      case TIME_RANGES.YEAR:
        // Anno corrente: dal 1 gennaio al 31 dicembre
        periodStart = currentYearStart;
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        periodLabel = 'Anno';
        break;
      case TIME_RANGES.MONTH:
      default:
        // Mese corrente: dal 1 all'ultimo giorno del mese
        periodStart = currentMonthStart;
        periodEnd = currentMonthEnd;
        periodLabel = 'Mese';
        break;
    }
    
    // Incasso nel periodo selezionato
    const periodPayments = payments.filter(p => {
      const d = new Date(p.date);
      return d >= periodStart && d <= periodEnd;
    });
    const periodRevenue = periodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Calcola rinnovi
    // PRIORITÀ: usa il flag isRenewal se presente
    // Le rate (isRate: true) NON sono rinnovi a meno che non abbiano isRenewal: true
    // Altrimenti: se non è una rata e il cliente ha più di un pagamento "principale", conta come rinnovo
    const paymentsByClient = {};
    payments.forEach(p => {
      if (!paymentsByClient[p.clientId]) paymentsByClient[p.clientId] = [];
      paymentsByClient[p.clientId].push(p);
    });
    
    let renewalsRevenue = 0;
    periodPayments.forEach(p => {
      // PRIORITÀ: usa il flag isRenewal se esplicitamente presente
      if (p.isRenewal === true) {
        renewalsRevenue += p.amount || 0;
        return;
      }
      
      // Le rate NON sono rinnovi a meno che non abbiano isRenewal: true (già gestito sopra)
      // Le rate fanno parte del primo abbonamento rateizzato
      if (p.isRate === true || p.source === 'rate' || p.source === 'rates-subcollection') {
        // È una rata, non conta come rinnovo se non ha isRenewal
        return;
      }
      
      // Fallback per pagamenti "principali" (non rate): controlla se non è il primo pagamento
      const clientPayments = paymentsByClient[p.clientId] || [];
      // Considera solo i pagamenti principali (non rate) per determinare se è il primo
      const mainPayments = clientPayments.filter(pay => 
        !pay.isRate && pay.source !== 'rate' && pay.source !== 'rates-subcollection'
      );
      const sortedPayments = mainPayments.sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstPaymentDate = sortedPayments[0]?.date;
      const currentPaymentDate = new Date(p.date).toISOString();
      
      // Se non è il primo pagamento principale del cliente, è un rinnovo
      if (firstPaymentDate && currentPaymentDate !== new Date(firstPaymentDate).toISOString()) {
        renewalsRevenue += p.amount || 0;
      }
    });
    
    const newClientsThisMonth = clients.filter(c => {
      const start = toDate(c.startDate) || toDate(c.createdAt);
      return start && start >= currentMonthStart;
    });

    const retention = activeClients.length > 0 ? Math.round((activeClients.filter(c => {
      const start = toDate(c.startDate);
      return start && start < thirtyDaysAgo;
    }).length / activeClients.length) * 100) : 0;

    return {
      totalClients: activeClients.length,
      expiringCount: expiringClients.filter(c => (toDate(c.scadenza) - now) / (1000 * 60 * 60 * 24) > 0).length,
      expiredCount: expiringClients.filter(c => toDate(c.scadenza) < now).length,
      expiringClients,
      periodRevenue: periodRevenue - renewalsRevenue, // Incasso ESCLUSI i rinnovi
      renewalsRevenue,
      periodLabel,
      newClients: newClientsThisMonth.length,
      retention,
      // Aggiungi liste dettagliate per il modal
      renewalPaymentsList: periodPayments.filter(p => p.isRenewal === true),
      regularPaymentsList: periodPayments.filter(p => p.isRenewal !== true),
      // Clienti inattivi (no check da 7+ giorni)
      inactiveClients: activeClients.filter(c => {
        if (!c.lastCheckDate) return true; // Mai fatto check
        const lastCheck = toDate(c.lastCheckDate);
        if (!lastCheck) return true;
        const daysSinceCheck = (now - lastCheck) / (1000 * 60 * 60 * 24);
        return daysSinceCheck >= 7;
      })
    };
  }, [clients, payments, revenueTimeRange]);

  // Today's events
  const todayEvents = useMemo(() => {
    const events = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Calls today
    upcomingCalls.forEach(call => {
      const callDate = toDate(call.scheduledAt);
      if (callDate && callDate >= today && callDate < tomorrow) {
        events.push({
          type: 'call',
          icon: Phone,
          title: `Chiamata ${call.clientName}`,
          time: callDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
          sortTime: callDate,
          onClick: () => navigate(`/admin/client/${call.clientId}`)
        });
      }
    });
    
    // Expiries today
    metrics.expiringClients?.forEach(client => {
      const exp = toDate(client.scadenza);
      if (exp && exp >= today && exp < tomorrow) {
        events.push({
          type: 'expiry',
          icon: Clock,
          title: `Scade ${client.name}`,
          time: 'Oggi',
          sortTime: exp,
          onClick: () => navigate(`/admin/client/${client.id}`)
        });
      }
    });
    
    return events.sort((a, b) => a.sortTime - b.sortTime);
  }, [upcomingCalls, metrics.expiringClients, navigate]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities = [];
    
    // New clients - ordina per createdAt e prendi i più recenti
    const sortedClients = [...clients]
      .filter(c => toDate(c.createdAt))
      .sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
      .slice(0, 10);
    
    sortedClients.forEach(c => {
      const date = toDate(c.createdAt);
      if (date) {
        activities.push({
          type: 'client',
          icon: User,
          title: `${c.name} registrato`,
          subtitle: 'Nuovo cliente',
          time: date,
          color: 'blue',
          onClick: () => navigate(`/admin/client/${c.id}`)
        });
      }
    });
    
    // Payments - ordina per data e prendi i più recenti
    const sortedPayments = [...payments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    
    sortedPayments.forEach(p => {
      const date = new Date(p.date);
      
      // Determina il tipo di attività
      let subtitle = 'Pagamento';
      let color = 'emerald';
      
      if (p.isRenewal) {
        if (p.isRate) {
          subtitle = 'Rata rinnovo pagata';
          color = 'cyan';
        } else {
          subtitle = 'Rinnovo';
          color = 'cyan';
        }
      } else if (p.source === 'rate' || p.source === 'rates-subcollection' || p.isRate) {
        subtitle = 'Rata pagata';
        color = 'purple';
      }
      
      activities.push({
        type: 'payment',
        icon: DollarSign,
        title: `€${p.amount} da ${p.clientName}`,
        subtitle: subtitle,
        time: date,
        color: color
      });
    });
    
    return activities
      .sort((a, b) => b.time - a.time)
      .slice(0, 20)
      .map((a, idx) => ({
        ...a,
        id: `${a.type}-${a.timeRaw?.getTime() || idx}-${idx}`, // ID univoco per evitare warning chiavi duplicate
        timeRaw: a.time,
        time: a.time.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      }));
  }, [clients, payments, navigate]);

  // Filtered clients for search
  const filteredClients = useMemo(() => {
    if (!debouncedSearch) return clients.filter(c => !c.isOldClient).slice(0, 5);
    const q = debouncedSearch.toLowerCase();
    return clients.filter(c => 
      c.name?.toLowerCase().includes(q) || 
      c.email?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [clients, debouncedSearch]);

  const handleLogout = () => signOut(auth).then(() => navigate('/login'));

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="w-full px-3 sm:px-4 lg:px-6 py-4 space-y-4"
      >
        {/* ============ SEARCH BAR MIGLIORATA ============ */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca clienti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ============ ALERTS COMPATTO ============ */}
        <AlertPills 
          metrics={metrics} 
          callRequests={callRequests} 
          unreadChats={unreadChats} 
          navigate={navigate} 
          setActiveTab={setActiveTab}
        />

        {/* ============ HERO STATS CARD (MOBILE) ============ */}
        <div className="lg:hidden">
          <HeroStatsCard
            revenue={metrics.periodRevenue}
            renewalsRevenue={metrics.renewalsRevenue}
            totalClients={metrics.totalClients}
            newClients={metrics.newClients}
            showRevenue={showRevenue}
            onToggleRevenue={() => setShowRevenue(!showRevenue)}
            periodLabel={metrics.periodLabel}
            isRenewals={showRenewalsOnly}
            onToggleType={() => setShowRenewalsOnly(!showRenewalsOnly)}
            onClick={() => {
              setRevenueModalType(showRenewalsOnly ? 'rinnovi' : 'incasso');
              setShowRevenueModal(true);
            }}
          />
        </div>

        {/* ============ QUICK ACTIONS - 4 AZIONI PRIMARIE ============ */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <PrimaryActionButton 
            to="/new-client" 
            icon={UserPlus} 
            label="Nuovo Cliente" 
            color="green" 
          />
          <PrimaryActionButton 
            to="/clients" 
            icon={Users} 
            label="Clienti" 
            color="blue"
            badge={metrics.expiredCount > 0 ? metrics.expiredCount : null}
          />
          <PrimaryActionButton 
            to="/chat" 
            icon={MessageCircle} 
            label="Chat" 
            color="purple"
            badge={unreadChats.length > 0 ? unreadChats.length : null}
          />
          <PrimaryActionButton 
            to="/calendar" 
            icon={Calendar} 
            label="Calendario" 
            color="cyan" 
          />
        </div>

        {/* ============ MINI STATS ROW (MOBILE) ============ */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:hidden">
          <MiniStatCard
            value={metrics.expiringCount}
            label="In Scadenza"
            icon={Clock}
            color="amber"
            onClick={() => navigate('/clients?filter=expiring')}
          />
          <MiniStatCard
            value={upcomingCalls.length}
            label="Chiamate Settimana"
            icon={Phone}
            color="cyan"
            onClick={() => navigate('/calls-calendar')}
          />
        </div>

        {/* ============ MAIN GRID ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* LEFT COLUMN - Metrics & Content */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* BIG METRICS - SOLO DESKTOP */}
            <div className="hidden lg:grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 overflow-hidden">
                <div className="relative">
                  {/* Time Range Filter + Hide Toggle */}
                  <div className="absolute top-3 right-3 z-10 flex gap-1">
                    {[
                      { key: TIME_RANGES.WEEK, label: 'S' },
                      { key: TIME_RANGES.MONTH, label: 'M' },
                      { key: TIME_RANGES.YEAR, label: 'A' },
                    ].map(r => (
                      <button
                        key={r.key}
                        onClick={(e) => { e.stopPropagation(); setRevenueTimeRange(r.key); }}
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
                      onClick={(e) => { e.stopPropagation(); setShowRevenue(!showRevenue); }}
                      className="w-7 h-7 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 flex items-center justify-center transition-colors"
                    >
                      {showRevenue ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                  </div>
                  
                  {/* Revenue Card with Toggle */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${showRenewalsOnly ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`}>
                        {showRenewalsOnly ? <RefreshCw size={20} className="text-cyan-400" /> : <DollarSign size={20} className="text-emerald-400" />}
                      </div>
                    </div>
                    
                    {/* Value with arrows */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowRenewalsOnly(!showRenewalsOnly)}
                        className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-white transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      
                      <div 
                        className="flex-1 text-center cursor-pointer hover:bg-slate-700/30 rounded-xl py-2 transition-colors"
                        onClick={() => {
                          setRevenueModalType(showRenewalsOnly ? 'rinnovi' : 'incasso');
                          setShowRevenueModal(true);
                        }}
                      >
                        <p className="text-3xl font-bold text-white mb-1">
                          {showRevenue 
                            ? `€${(showRenewalsOnly ? metrics.renewalsRevenue : metrics.periodRevenue).toLocaleString()}` 
                            : '€ •••'
                          }
                        </p>
                        <p className={`text-sm ${showRenewalsOnly ? 'text-cyan-400' : 'text-slate-400'}`}>
                          {showRenewalsOnly ? `Rinnovi ${metrics.periodLabel}` : `Incasso ${metrics.periodLabel}`}
                          <span className="ml-1 opacity-60 text-xs">• Dettagli</span>
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => setShowRenewalsOnly(!showRenewalsOnly)}
                        className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-white transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    
                    {/* Indicator dots */}
                    <div className="flex justify-center gap-1.5 mt-3">
                      <div className={`w-2 h-2 rounded-full transition-colors ${!showRenewalsOnly ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <div className={`w-2 h-2 rounded-full transition-colors ${showRenewalsOnly ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Clienti Attivi Card - stesso stile di Incasso */}
              <div 
                onClick={() => navigate('/clients')}
                className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 overflow-hidden cursor-pointer hover:bg-slate-700/30 transition-colors"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20">
                      <Users size={20} className="text-blue-400" />
                    </div>
                    {metrics.newClients > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                        <TrendingUp size={12} />
                        +{metrics.newClients}
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{metrics.totalClients}</p>
                  <p className="text-sm text-slate-400">Clienti Attivi</p>
                </div>
              </div>
            </div>

            {/* SECONDARY METRICS - SOLO DESKTOP */}
            <div className="hidden lg:grid grid-cols-3 gap-3">
              <MiniStatCard
                value={metrics.newClients}
                label="Nuovi questo mese"
                icon={UserPlus}
                color="emerald"
              />
              <MiniStatCard
                value={metrics.expiringCount}
                label="In Scadenza"
                icon={Clock}
                color="amber"
                onClick={() => navigate('/clients?filter=expiring')}
              />
              <MiniStatCard
                value={weeklyChecks}
                label="Check Settimana"
                icon={ClipboardList}
                color="purple"
              />
            </div>

            {/* TABBED CONTENT - Layout migliorato */}
            <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 overflow-hidden">
              {/* Tabs Header - Scroll orizzontale su mobile */}
              <div className="flex items-center border-b border-slate-700/30 overflow-x-auto scrollbar-hide bg-slate-900/20">
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
                    {/* Active indicator */}
                    {activeTab === tab.key && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                      />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Tab Content */}
              <div className="divide-y divide-slate-700/30">
                {activeTab === TAB_TYPES.CLIENTS && (
                  <>
                    {filteredClients.length > 0 ? (
                      filteredClients.map(client => (
                        <ClientRow 
                          key={client.id} 
                          client={client} 
                          onClick={() => navigate(`/admin/client/${client.id}`)}
                        />
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        {searchQuery ? 'Nessun cliente trovato' : 'Nessun cliente'}
                      </div>
                    )}
                    <div className="p-3 bg-slate-900/30">
                      <button 
                        onClick={() => navigate('/clients')}
                        className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1"
                      >
                        Vedi tutti i clienti <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </>
                )}
                
                {activeTab === TAB_TYPES.SCADENZE && (
                  <>
                    {metrics.expiringClients.length > 0 ? (
                      metrics.expiringClients.slice(0, 8).map(client => {
                        const exp = toDate(client.scadenza);
                        const isExpired = exp && exp < new Date();
                        const daysLeft = exp ? Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                        return (
                          <ClientRow 
                            key={client.id} 
                            client={client}
                            subtitle={isExpired 
                              ? `Scaduto ${Math.abs(daysLeft)} giorni fa` 
                              : `Scade tra ${daysLeft} giorni - ${exp?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}`
                            }
                            onClick={() => navigate(`/admin/client/${client.id}`)}
                          />
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Nessuna scadenza imminente 🎉
                      </div>
                    )}
                    {metrics.expiringClients.length > 0 && (
                      <div className="p-3 bg-slate-900/30">
                        <button 
                          onClick={() => navigate('/clients?filter=expiring')}
                          className="w-full py-2 text-sm text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1"
                        >
                          Gestisci scadenze <ArrowUpRight size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === TAB_TYPES.CHIAMATE && (
                  <>
                    {upcomingCalls.length > 0 ? (
                      upcomingCalls.map((call, idx) => {
                        const scheduledDate = toDate(call.scheduledAt) || new Date();
                        const isToday = scheduledDate.toDateString() === new Date().toDateString();
                        const isTomorrow = scheduledDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                        const timeLabel = isToday ? 'Oggi' : isTomorrow ? 'Domani' : scheduledDate.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
                        
                        return (
                          <div 
                            key={idx}
                            onClick={() => navigate(`/admin/client/${call.clientId}`)}
                            className="flex items-center gap-3 p-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isToday ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              <Phone size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{call.clientName}</p>
                              <p className="text-xs text-slate-400">
                                {timeLabel} alle {scheduledDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                call.callType === 'video' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                              }`}>
                                {call.callType === 'video' ? 'Video' : 'Tel'}
                              </span>
                              {isToday && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
                                  OGGI
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        <Phone size={24} className="mx-auto mb-2 text-slate-600" />
                        Nessuna chiamata programmata
                      </div>
                    )}
                    <div className="p-3 bg-slate-900/30">
                      <button 
                        onClick={() => navigate('/calls-calendar')}
                        className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1"
                      >
                        Apri Calendario Chiamate <ArrowUpRight size={14} />
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
                          client={{ name: item.clientName, id: item.clientId }}
                          subtitle={`${toDate(item.createdAt)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) || ''} - ${item.type || 'Anamnesi'}`}
                          onClick={() => navigate(`/admin/client/${item.clientId}?tab=anamnesi`)}
                        />
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Nessuna anamnesi recente
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === TAB_TYPES.CHECKS && (
                  <>
                    {recentChecks.length > 0 ? (
                      recentChecks.slice(0, 5).map(item => (
                        <ClientRow 
                          key={item.id}
                          client={{ name: item.clientName, id: item.clientId }}
                          subtitle={`${toDate(item.createdAt)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) || ''} - ${item.weight ? formatWeight(item.weight) : 'Check-in'}`}
                          onClick={() => navigate(`/admin/client/${item.clientId}?tab=checks`)}
                        />
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Nessun check-in recente
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === TAB_TYPES.CHAT && (
                  <>
                    {unreadChats.length > 0 ? (
                      unreadChats.slice(0, 5).map(chat => (
                        <div 
                          key={chat.chatId}
                          onClick={() => navigate(`/chat/${chat.clientId}`)}
                          className="flex items-center gap-3 p-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {chat.clientName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{chat.clientName}</p>
                            <p className="text-xs text-slate-400 truncate">{chat.lastMessage || 'Nuovo messaggio'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">
                              {chat.unreadCount}
                            </span>
                            {chat.lastMessageTime && (
                              <span className="text-[10px] text-slate-500">
                                {chat.lastMessageTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        <MessageCircle size={24} className="mx-auto mb-2 text-slate-600" />
                        Nessun messaggio non letto 🎉
                      </div>
                    )}
                    <div className="p-3 bg-slate-900/30">
                      <button 
                        onClick={() => navigate('/chat')}
                        className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1"
                      >
                        Vai alla Chat <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Actions & Activity */}
          <div className="space-y-4">

            {/* TODAY WIDGET - Compatto */}
            <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <Calendar size={14} className="text-blue-400" />
                </div>
                <span>Oggi, {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
              </h2>
              {todayEvents.length > 0 ? (
                <div className="space-y-1">
                  {todayEvents.slice(0, 4).map((event, idx) => (
                    <TodayEvent key={idx} {...event} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-3">✨ Nessun evento oggi</p>
              )}
            </div>

            {/* MINI TREND - Solo Desktop */}
            <div className="hidden lg:block bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg bg-purple-500/20">
                  <BarChart2 size={14} className="text-purple-400" />
                </div>
                <span>Questa Settimana</span>
              </h2>
              <div className="space-y-2.5">
                <TrendBar label="Check" value={weeklyChecks} max={Math.max(weeklyChecks, 20)} color="purple" />
                <TrendBar label="Chat" value={unreadChats.length} max={10} color="pink" />
                <TrendBar label="Nuovi" value={metrics.newClients} max={5} color="blue" />
              </div>
            </div>

            {/* UPCOMING CALLS - Solo se ci sono */}
            {upcomingCalls.length > 0 && (
              <div className="bg-cyan-500/5 backdrop-blur-sm rounded-2xl border border-cyan-500/20 p-4">
                <h2 className="font-semibold text-cyan-300 mb-3 flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20">
                    <Phone size={14} className="text-cyan-400" />
                  </div>
                  <span>Chiamate in arrivo</span>
                  <span className="ml-auto text-xs bg-cyan-500/20 px-2 py-0.5 rounded-full">{upcomingCalls.length}</span>
                </h2>
                <div className="space-y-2">
                  {upcomingCalls.slice(0, 3).map((call, idx) => {
                    const scheduledDate = toDate(call.scheduledAt) || new Date();
                    const isToday = scheduledDate.toDateString() === new Date().toDateString();
                    return (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate(`/admin/client/${call.clientId}`)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/50 cursor-pointer hover:bg-slate-800/50 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isToday ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          <Phone size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{call.clientName}</p>
                          <p className="text-[11px] text-slate-400">
                            {isToday ? '🔴 Oggi' : scheduledDate.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit' })}
                            {' '}{scheduledDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {upcomingCalls.length > 3 && (
                  <button 
                    onClick={() => navigate('/calls-calendar')}
                    className="w-full mt-2 py-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1"
                  >
                    Vedi tutte <ArrowUpRight size={12} />
                  </button>
                )}
              </div>
            )}

            {/* QUICK ACTIONS - Azioni secondarie compatte e personalizzabili */}
            <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg bg-amber-500/20">
                  <Zap size={14} className="text-amber-400" />
                </div>
                <span>Azioni rapide</span>
                <button
                  onClick={() => setShowQuickActionsEditor(true)}
                  className="ml-auto p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-white transition-colors"
                  title="Personalizza"
                >
                  <Pencil size={12} />
                </button>
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map(actionId => {
                  const action = AVAILABLE_ACTIONS.find(a => a.id === actionId);
                  if (!action) return null;
                  return (
                    <QuickAction 
                      key={action.id}
                      icon={action.icon} 
                      label={action.label} 
                      onClick={() => navigate(action.path)} 
                      color={action.color} 
                    />
                  );
                })}
                {quickActions.length === 0 && (
                  <button
                    onClick={() => setShowQuickActionsEditor(true)}
                    className="col-span-3 py-4 text-center text-slate-500 hover:text-slate-300 border border-dashed border-slate-700 rounded-xl transition-colors"
                  >
                    <Plus size={20} className="mx-auto mb-1" />
                    <span className="text-xs">Aggiungi azioni</span>
                  </button>
                )}
              </div>
            </div>

            {/* ACTIVITY TIMELINE - Scrollabile con altezza limitata */}
            <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg bg-slate-600/50">
                  <Activity size={14} className="text-slate-400" />
                </div>
                <span>Attività recenti</span>
                <span className="ml-auto text-[10px] text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">{recentActivity.length}</span>
              </h2>
              <div className="max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                <div className="space-y-0">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 10).map((item, idx) => (
                      <TimelineItem
                        key={item.id || `activity-${idx}`}
                        icon={item.icon}
                        title={item.title}
                        subtitle={item.subtitle}
                        time={item.time}
                        color={item.color}
                        isLast={idx === Math.min(recentActivity.length - 1, 9)}
                        onClick={item.onClick}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">Nessuna attività recente</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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
              className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className={`p-4 border-b border-slate-700/50 flex items-center justify-between ${revenueModalType === 'rinnovi' ? 'bg-cyan-900/30' : 'bg-emerald-900/30'}`}>
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
                  // Lista Rinnovi
                  <div className="space-y-2">
                    {metrics.renewalPaymentsList?.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-sm text-slate-400 px-2 pb-2 border-b border-slate-700/50">
                          <span>Totale Rinnovi</span>
                          <span className="text-cyan-400 font-bold">€{metrics.renewalsRevenue?.toLocaleString()}</span>
                        </div>
                        {metrics.renewalPaymentsList.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            onClick={() => { setShowRevenueModal(false); navigate(`/admin/client/${p.clientId}`); }}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors"
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
                  // Lista Incassi Normali
                  <div className="space-y-2">
                    {metrics.regularPaymentsList?.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-sm text-slate-400 px-2 pb-2 border-b border-slate-700/50">
                          <span>Totale Incassi (esclusi rinnovi)</span>
                          <span className="text-emerald-400 font-bold">€{metrics.periodRevenue?.toLocaleString()}</span>
                        </div>
                        {metrics.regularPaymentsList.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            onClick={() => { setShowRevenueModal(false); navigate(`/admin/client/${p.clientId}`); }}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors"
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
              <div className="p-4 border-t border-slate-700/50 flex justify-center gap-2">
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

      {/* Quick Actions Editor Modal */}
      <QuickActionsEditor
        isOpen={showQuickActionsEditor}
        onClose={() => setShowQuickActionsEditor(false)}
        selectedActions={quickActions}
        onSave={handleSaveQuickActions}
      />
    </div>
  );
}
