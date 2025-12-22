// src/pages/admin/ClientDetail/index.jsx
// Versione refactored - Componente principale ridotto che usa moduli estratti
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, FileText, DollarSign, Trash2, Edit,
  Copy, Check, Plus, ZoomIn, CalendarDays, Eye, EyeOff, AlertTriangle,
  Activity, Image, CreditCard, Info, BarChart3, Clock, Tag, ClipboardList,
  Monitor, NotebookPen, CheckCircle, Link2, Loader2, Camera, Upload, TrendingUp,
  ArrowLeftRight, Heart, Dumbbell, UtensilsCrossed, CalendarClock, XCircle, KeyRound,
  ArrowLeft
} from 'lucide-react';

// Firebase & Config
import { db, toDate } from '../../../firebase';
import { CURRENT_TENANT_ID } from '../../../config/tenant';
import { PAYMENT_METHOD_LABELS } from '../../../constants/payments';
import { formatDeviceInfo } from '../../../utils/deviceInfo';
import { IMAGE_ACCEPT_STRING } from '../../../cloudflareStorage';

// Hooks
import { useUserPreferences } from '../../../hooks/useUserPreferences';
import { useUnreadAnamnesi, useUnreadChecks } from '../../../hooks/useUnreadNotifications';
import { usePageInfo } from '../../../contexts/PageContext';
import { useToast } from '../../../contexts/ToastContext';
import { useClientDetailState } from './hooks';

// UI Components
import QuickNotifyButton from '../../../components/notifications/QuickNotifyButton';
import WhatsAppButton from '../../../components/integrations/WhatsAppButton';
import ProgressCharts from '../../../components/client/ProgressCharts';
import PhotoCompare from '../../../components/client/PhotoCompare';
import WorkoutCalendarModal from '../../../components/client/WorkoutCalendarModal';
import ClientHabitsOverview from '../../../components/admin/ClientHabitsOverview';
import { 
  UnifiedCard, CardHeader, CardHeaderSimple, CardContent,
  InfoField, DataCard, ListItemCard, CardGrid
} from '../../../components/ui/UnifiedCard';
import { Badge } from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { ScheduleCallModal, NextCallCard } from '../../../components/calls/CallScheduler';

// Modals (estratti)
import {
  RenewalModal,
  EditClientModal,
  ExtendExpiryModal,
  EditPaymentModal,
  PhotoZoomModal,
  NewCheckModal,
  CheckDetailModal
} from './modals';

// Components (estratti)
import { PathStatusBadge, RateTable } from './components';

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-center text-red-400 p-8">Errore: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

export default function ClientDetail({ role: propRole }) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { formatWeight, formatLength, weightLabel, lengthLabel } = useUserPreferences();
  const { markAsRead: markAnamnesiAsRead } = useUnreadAnamnesi();
  const { markClientChecksAsRead } = useUnreadChecks();

  // Determina ruolo
  let userRole = propRole;
  if (!userRole) {
    try { 
      userRole = sessionStorage.getItem('app_role') || JSON.parse(localStorage.getItem('user'))?.role || null; 
    } catch {}
  }
  const isAdmin = userRole === 'admin';
  const isCoach = userRole === 'coach';
  const canManagePayments = isAdmin;
  const canDeleteClient = isAdmin;
  const canEditClient = isAdmin || isCoach;
  const backPath = isCoach ? '/coach/clients' : '/clients';

  // Custom Hook per stato centralizzato
  const {
    client, loading, error, checks, payments, anamnesi, rates,
    schedaAllenamento, schedaAlimentazione, schedeLoading,
    latestCheck, previousCheck,
    showAmounts, setShowAmounts, activeTab, setActiveTab, copied,
    selectedCheck, setSelectedCheck,
    modals, openModal, closeModal, editingPaymentIndex, setEditingPaymentIndex,
    loadingStates, magicLink, nextCall,
    handleDelete, handleResetPassword, generateMagicLink, copyCredentials,
    handleAddRate, handleUpdateRate, handleDeleteRate, handleAnamnesiPhotoUpload,
  } = useClientDetailState(clientId, backPath, navigate);

  // State locale per UI mobile
  const [isMobile, setIsMobile] = useState(false);

  // Handler per tornare indietro (stabile)
  const handleGoBack = useCallback(() => {
    navigate(backPath);
  }, [navigate, backPath]);

  // Page info memoizzata per evitare loop infiniti
  const pageInfo = useMemo(() => ({
    pageTitle: client?.name || 'Dettaglio Cliente',
    breadcrumbs: [
      { label: 'Dashboard', to: isCoach ? '/coach' : '/' },
      { label: 'Clienti', to: backPath },
      { label: client?.name || 'Cliente' }
    ],
    backButton: { label: 'Torna ai clienti', onClick: handleGoBack }
  }), [client?.name, backPath, isCoach, handleGoBack]);

  // Imposta titolo nell'header
  usePageInfo(pageInfo, [pageInfo]);

  // Marca anamnesi e checks come letti (una volta sola)
  useEffect(() => {
    if (clientId) {
      markAnamnesiAsRead(clientId);
      markClientChecksAsRead(clientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]); // Solo clientId - le funzioni mark non sono stabili

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set tab from URL - legge direttamente searchParams per reagire ai cambiamenti
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, setActiveTab]);

  // === COMPUTED VALUES (memoizzati) ===
  const toNumber = useCallback((val) => { 
    const num = parseFloat(val); 
    return Number.isFinite(num) ? num : null; 
  }, []);

  // Metrics memoizzati
  const { weightValue, prevWeight, weightDelta, weightDeltaPct, bodyFatValue, prevBodyFat, bodyFatDelta, bodyFatDeltaPct, lastCheckAt } = useMemo(() => {
    const _toNumber = (val) => { const num = parseFloat(val); return Number.isFinite(num) ? num : null; };
    
    const _weightValue = _toNumber(latestCheck?.weight);
    const _prevWeight = _toNumber(previousCheck?.weight);
    const _weightDelta = _weightValue !== null && _prevWeight !== null ? _weightValue - _prevWeight : null;
    const _weightDeltaPct = _weightDelta !== null && _prevWeight ? ((_weightDelta / _prevWeight) * 100) : null;
    
    const _bodyFatValue = _toNumber(latestCheck?.bodyFat);
    const _prevBodyFat = _toNumber(previousCheck?.bodyFat);
    const _bodyFatDelta = _bodyFatValue !== null && _prevBodyFat !== null ? _bodyFatValue - _prevBodyFat : null;
    const _bodyFatDeltaPct = _bodyFatDelta !== null && _prevBodyFat ? ((_bodyFatDelta / _prevBodyFat) * 100) : null;
    
    const _lastCheckAt = latestCheck?.createdAt ? toDate(latestCheck.createdAt) : null;
    
    return {
      weightValue: _weightValue,
      prevWeight: _prevWeight,
      weightDelta: _weightDelta,
      weightDeltaPct: _weightDeltaPct,
      bodyFatValue: _bodyFatValue,
      prevBodyFat: _prevBodyFat,
      bodyFatDelta: _bodyFatDelta,
      bodyFatDeltaPct: _bodyFatDeltaPct,
      lastCheckAt: _lastCheckAt
    };
  }, [latestCheck, previousCheck]);

  // Calcolo Body Fat stimato
  const estimatedBodyFat = useMemo(() => {
    const _toNumber = (val) => { const num = parseFloat(val); return Number.isFinite(num) ? num : null; };
    const weight = weightValue || _toNumber(anamnesi?.weight);
    const height = _toNumber(anamnesi?.height);
    const gender = anamnesi?.gender;
    
    let age = null;
    if (anamnesi?.birthDate) {
      const birth = new Date(anamnesi.birthDate);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
      }
    }
    
    if (!weight || !height || !age || !gender) return null;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const genderFactor = gender === 'male' ? 1 : 0;
    const bf = (1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4;
    return Math.max(3, Math.min(50, Math.round(bf * 10) / 10));
  }, [weightValue, anamnesi]);

  // Calcoli pagamenti (memoizzati)
  const { paymentsPaid, paymentsTotal } = useMemo(() => {
    const paymentsFromSubcollection = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const paidFromRates = rates.filter(r => r.paid).reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const _paymentsPaid = paymentsFromSubcollection + paidFromRates;
    const ratesTotalAmount = rates.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const clientPrice = client?.price ? Number(client.price) : 0;
    const sumOfAll = ratesTotalAmount + paymentsFromSubcollection;
    const _paymentsTotal = sumOfAll > 0 ? sumOfAll : clientPrice;
    return { paymentsPaid: _paymentsPaid, paymentsTotal: _paymentsTotal };
  }, [payments, rates, client?.price]);

  // Photo gallery
  const photoGallery = useMemo(() => {
    const list = [];
    checks.forEach((check) => {
      if (check.photoURLs) {
        Object.entries(check.photoURLs).forEach(([type, url]) => { 
          if (url) list.push({ url, label: type, date: toDate(check.createdAt) }); 
        });
      }
    });
    if (anamnesi?.photoURLs) {
      Object.entries(anamnesi.photoURLs).forEach(([type, url]) => { 
        if (url) list.push({ url, label: `Anamnesi ${type}`, date: null }); 
      });
    }
    return list.slice(0, 10);
  }, [checks, anamnesi]);

  // Activity feed
  const activityFeed = useMemo(() => {
    const items = [];
    checks.forEach((c) => {
      const checkDate = toDate(c.createdAt) || toDate(c.lastUpdatedAt);
      if (checkDate) {
        const note = c.notes || '';
        items.push({ 
          label: 'Check inviato', 
          detail: note ? `Note: ${note.slice(0, 40)}${note.length > 40 ? '…' : ''}` : 'Aggiornato peso/metriche', 
          date: checkDate, 
          icon: 'check' 
        });
      }
    });
    rates.filter(r => r.paid).forEach((r) => {
      const paymentDate = toDate(r.paidDate) || toDate(r.dueDate);
      if (paymentDate) {
        items.push({ label: 'Pagamento registrato', detail: `€${r.amount || 0}`, date: paymentDate, icon: 'payment' });
      }
    });
    if (anamnesi?.createdAt || anamnesi?.submittedAt) {
      const anamnesiDate = toDate(anamnesi.submittedAt) || toDate(anamnesi.createdAt);
      if (anamnesiDate) {
        items.push({ label: 'Anamnesi compilata', detail: 'Questionario iniziale completato', date: anamnesiDate, icon: 'anamnesi' });
      }
    }
    if (client?.createdAt) {
      const createdDate = toDate(client.createdAt);
      if (createdDate) {
        items.push({ label: 'Cliente registrato', detail: 'Account creato sulla piattaforma', date: createdDate, icon: 'created' });
      }
    }
    return items.sort((a, b) => b.date - a.date).slice(0, 8);
  }, [checks, rates, anamnesi, client]);

  // Helper functions (memoizzate per evitare re-render)
  const formatDelta = useCallback((delta) => {
    if (delta === null || delta === undefined) return 'N/D';
    const fixed = Math.abs(delta).toFixed(1);
    return `${delta > 0 ? '+' : '-'}${fixed}`;
  }, []);
  
  const formatDeltaPct = useCallback((deltaPct) => {
    if (deltaPct === null || deltaPct === undefined || !Number.isFinite(deltaPct)) return '';
    const fixed = Math.abs(deltaPct).toFixed(1);
    return `${deltaPct > 0 ? '+' : '-'}${fixed}%`;
  }, []);

  const renderAnamnesiField = useCallback((label, value) => (
    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-white mt-1 whitespace-pre-wrap leading-snug">{value || 'N/D'}</p>
    </div>
  ), []);

  // Tabs configuration (memoizzato per evitare ricreazione ad ogni render)
  const tabs = useMemo(() => {
    const allTabs = [
      { key: 'overview', label: 'Overview', icon: <FileText size={16} /> },
      { key: 'habits', label: 'Abitudini', icon: <Heart size={16} /> },
      { key: 'check', label: 'Check & Foto', icon: <Calendar size={16} /> },
      { key: 'schede', label: 'Schede', icon: <Dumbbell size={16} /> },
      { key: 'payments', label: 'Pagamenti', icon: <CreditCard size={16} />, adminOnly: true },
      { key: 'metrics', label: 'Metriche', icon: <BarChart3 size={16} /> },
      { key: 'anamnesi', label: 'Anamnesi', icon: <NotebookPen size={16} /> },
    ];
    return allTabs.filter(tab => !tab.adminOnly || canManagePayments);
  }, [canManagePayments]);

  // Loading / Error states (DOPO tutti gli hooks!)
  if (loading) return <div className="text-center text-slate-400 p-8">Caricamento...</div>;
  if (error) return <div className="text-center text-red-400 p-8">{error}</div>;
  if (!client) return null;

  // === RENDER CARDS ===
  // (Card components sono estratti come render functions per leggibilità)
  
  return (
    <ErrorBoundary>
      <div className="bg-transparent">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full px-0 sm:px-0 py-0">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              {/* Back Button - Visibile sempre */}
              <motion.button
                onClick={handleGoBack}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white transition-colors group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Torna ai clienti</span>
              </motion.button>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Profilo Cliente</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{client.name}</h1>
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">
                      {client.tags?.[0] || 'Client'}
                    </span>
                    {client.rateizzato && (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        Rateizzato
                      </span>
                    )}
                    {client.isArchived && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium">
                        <AlertTriangle size={12} /> Archiviato
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400 pt-1">
                    <PathStatusBadge status={client.statoPercorso} />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 text-slate-300 text-xs">
                      <Activity size={12} /> Check: {checks.length || 0}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 text-slate-300 text-xs">
                      <Calendar size={12} /> Ultimo: {lastCheckAt ? lastCheckAt.toLocaleDateString('it-IT') : 'N/D'}
                    </span>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
                  <QuickNotifyButton userId={clientId} userName={client.name} userType="client" />
                  {!isMobile && (
                    <>
                      {client?.email && (
                        <button 
                          onClick={handleResetPassword} 
                          disabled={loadingStates.resettingPassword}
                          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-amber-300 hover:bg-amber-900/20 border border-slate-700/50 hover:border-amber-500/50 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {loadingStates.resettingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} 
                          Reset Password
                        </button>
                      )}
                      {canEditClient && (
                        <button onClick={() => openModal('edit')} className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm transition-colors">
                          <Edit size={16} /> Modifica
                        </button>
                      )}
                      {canManagePayments && (
                        <button onClick={() => openModal('renewal')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors">
                          <Plus size={16} /> Rinnovo
                        </button>
                      )}
                      <button onClick={() => openModal('extend')} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors">
                        <CalendarDays size={16} /> Prolunga
                      </button>
                      {canDeleteClient && (
                        <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm transition-colors">
                          <Trash2 size={16} /> Elimina
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-1 bg-slate-900/40 p-1.5 rounded-xl border border-slate-700/50 scrollbar-thin scrollbar-thumb-slate-700">
              {tabs.map((tab) => (
                <button 
                  key={tab.key} 
                  onClick={() => setActiveTab(tab.key)} 
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.key 
                      ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content - Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.35fr,1fr] gap-4 lg:gap-6">
                <div className="space-y-4">
                  {/* Info Card */}
                  <UnifiedCard>
                    <CardHeader 
                      icon={FileText}
                      title="Dettagli cliente"
                      subtitle="Client Details"
                      action={<PathStatusBadge status={client.statoPercorso} />}
                    />
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        <InfoField icon={User} value={client.name} />
                        <div className="flex items-center gap-2">
                          <InfoField icon={Mail} value={client.email} />
                          <button 
                            onClick={generateMagicLink} 
                            disabled={loadingStates.generatingLink}
                            className="p-1.5 rounded-md border border-slate-700 text-slate-200 hover:text-blue-300 hover:border-blue-400 bg-slate-800 disabled:opacity-50"
                          >
                            {loadingStates.generatingLink ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                          </button>
                          <button onClick={copyCredentials} className="p-1.5 rounded-md border border-slate-700 text-slate-200 hover:text-emerald-300 hover:border-emerald-400 bg-slate-800">
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <InfoField icon={Phone} value={client.phone || 'N/D'} />
                          {client.phone && (
                            <WhatsAppButton client={{ ...client, id: clientId }} tenantId={CURRENT_TENANT_ID} variant="icon" />
                          )}
                        </div>
                        <InfoField icon={Calendar} value={`Scadenza: ${toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}`} />
                        <InfoField icon={Clock} value={`Ultimo check: ${lastCheckAt ? lastCheckAt.toLocaleString('it-IT') : 'N/D'}`} />
                        <InfoField icon={Activity} value={`Ultimo accesso: ${(() => {
                          const lastActiveDate = client.lastActive ? toDate(client.lastActive) : null;
                          if (lastActiveDate) return lastActiveDate.toLocaleString('it-IT');
                          if (lastCheckAt) return lastCheckAt.toLocaleString('it-IT');
                          const createdDate = client.createdAt ? toDate(client.createdAt) : null;
                          if (createdDate) return createdDate.toLocaleString('it-IT');
                          return 'N/D';
                        })()}`} />
                        {client.lastDevice && (
                          <InfoField icon={Monitor} value={`Dispositivo: ${formatDeviceInfo(client.lastDevice)}`} />
                        )}
                        {canManagePayments && <InfoField icon={DollarSign} value={`Prezzo: ${client.price ? `€${client.price}` : 'N/D'}`} />}
                        <InfoField icon={FileText} value={`Anamnesi: ${anamnesi ? 'Compilata ✓' : 'Non inviata'}`} />
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-slate-400" />
                          <span className="inline-flex items-center gap-2 flex-wrap">
                            <Badge variant="danger" size="sm">{client.tags?.[0] || 'Client'}</Badge>
                            {client.rateizzato && <Badge variant="success" size="sm">Rateizzato</Badge>}
                          </span>
                        </div>
                      </div>
                      
                      <CardGrid cols={2}>
                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                          <div className="flex items-center gap-2 mb-1 text-slate-300">
                            <ClipboardList size={15} />
                            <span className="font-semibold text-white">Goal</span>
                          </div>
                          <p className="text-slate-200 leading-snug min-h-[48px]">{anamnesi?.mainGoal || 'Non impostato'}</p>
                        </div>
                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                          <div className="flex items-center gap-2 mb-1 text-slate-300">
                            <AlertTriangle size={15} />
                            <span className="font-semibold text-white">Infortuni</span>
                          </div>
                          <p className="text-slate-200 leading-snug min-h-[48px]">{anamnesi?.injuries || 'Non specificato'}</p>
                        </div>
                      </CardGrid>
                    </CardContent>
                  </UnifiedCard>
                  
                  <NextCallCard clientId={clientId} isAdmin={isAdmin} onSchedule={() => openModal('scheduleCall')} />
                  
                  {/* Checks Card */}
                  <UnifiedCard>
                    <CardHeaderSimple 
                      title="Check recenti"
                      subtitle="Ultimi 5"
                      action={
                        <button 
                          onClick={() => openModal('newCheck')}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                          <Plus size={14} /> Aggiungi Check
                        </button>
                      }
                    />
                    <CardContent>
                      {checks.length > 0 ? (
                        <div className="space-y-3">
                          {checks.slice(0, 5).map((check) => (
                            <ListItemCard 
                              key={check.id}
                              onClick={() => { setSelectedCheck(check); openModal('checkDetail'); }}
                              className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                            >
                              <div className="flex items-center justify-between text-sm text-slate-200">
                                <span className="font-semibold">{toDate(check.createdAt)?.toLocaleDateString('it-IT') || 'N/D'}</span>
                                <Eye size={14} className="text-slate-500" />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {check.weight && <Badge variant="default" size="sm">Peso {formatWeight(check.weight)}</Badge>}
                                {check.bodyFat && <Badge variant="default" size="sm">BF {check.bodyFat}%</Badge>}
                                {check.photoURLs && Object.values(check.photoURLs).some(url => url) && (
                                  <Badge variant="success" size="sm"><Image size={10} className="mr-1" /> Foto</Badge>
                                )}
                              </div>
                            </ListItemCard>
                          ))}
                        </div>
                      ) : (
                        <EmptyState icon={Calendar} description="Nessun check disponibile." />
                      )}
                    </CardContent>
                  </UnifiedCard>
                  
                  {/* Progress Card */}
                  <UnifiedCard>
                    <CardHeaderSimple title="Progressione" subtitle="Andamento peso e BF" />
                    <CardContent>
                      <ProgressCharts checks={checks} />
                    </CardContent>
                  </UnifiedCard>
                </div>
                
                <div className="space-y-4">
                  {/* Metrics Card */}
                  <UnifiedCard>
                    <CardHeaderSimple title="Metrics Avg" subtitle="Ultimi check" />
                    <CardContent>
                      <CardGrid cols={3}>
                        <DataCard 
                          label="Peso"
                          value={weightValue !== null ? formatWeight(weightValue) : 'N/D'}
                          delta={weightDelta !== null ? `${formatDelta(weightDelta)} ${formatDeltaPct(weightDeltaPct)}` : undefined}
                          deltaType="negative"
                        />
                        <DataCard 
                          label={bodyFatValue !== null ? "Body Fat" : "Body Fat (stima)"}
                          value={bodyFatValue !== null ? `${bodyFatValue}%` : (estimatedBodyFat !== null ? `~${estimatedBodyFat}%` : 'N/D')}
                          delta={bodyFatDelta !== null ? `${formatDelta(bodyFatDelta)} ${formatDeltaPct(bodyFatDeltaPct)}` : undefined}
                          deltaType="negative"
                        />
                        <DataCard label="Check" value={checks.length || 0} />
                      </CardGrid>
                    </CardContent>
                  </UnifiedCard>
                  
                  {/* Photos Card */}
                  <UnifiedCard>
                    <CardHeaderSimple 
                      title="Foto recenti"
                      subtitle="max 10"
                      action={
                        <button 
                          onClick={() => openModal('photoCompare')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
                        >
                          <ArrowLeftRight size={14} /> Confronta
                        </button>
                      }
                    />
                    <CardContent>
                      {photoGallery.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                          {photoGallery.map((photo, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => openModal('photoZoom', { open: true, url: photo.url, alt: photo.label })} 
                              className="relative overflow-hidden rounded-lg group border border-slate-800 bg-slate-900/60"
                            >
                              <img src={photo.url} alt={photo.label} className="w-full h-24 object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                                <ZoomIn className="text-white opacity-0 group-hover:opacity-100" size={18} />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <EmptyState icon={Image} description="Nessuna foto caricata." />
                      )}
                    </CardContent>
                  </UnifiedCard>
                  
                  {/* Payments Card (admin only) */}
                  {canManagePayments && (
                    <UnifiedCard>
                      <CardHeaderSimple 
                        title="Pagamenti"
                        action={
                          <button 
                            onClick={() => setShowAmounts(!showAmounts)} 
                            className="flex items-center gap-2 px-3 py-1.5 border border-slate-700 text-slate-200 bg-slate-800 rounded-lg text-xs hover:bg-slate-700"
                          >
                            {showAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showAmounts ? 'Nascondi' : 'Mostra'}
                          </button>
                        }
                      />
                      <CardContent>
                        <CardGrid cols={2} className="mb-3">
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-xs text-slate-400">Pagato</p>
                            <p className="text-lg font-semibold text-white">{showAmounts ? `€${paymentsPaid.toFixed(0)}` : '€ •••'}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <p className="text-xs text-slate-400">Totale</p>
                            <p className="text-lg font-semibold text-white">{showAmounts ? `€${paymentsTotal.toFixed(0)}` : '€ •••'}</p>
                          </div>
                        </CardGrid>
                        
                        {payments.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-slate-400 mb-2 font-medium">Storico pagamenti</p>
                            <div className="space-y-2">
                              {payments.map((payment, idx) => {
                                const pDate = toDate(payment.paymentDate);
                                return (
                                  <div key={payment.id || idx} className="flex items-center justify-between p-3 bg-slate-900/70 rounded-lg border border-slate-800">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">
                                          {showAmounts ? `€${payment.amount || 0}` : '€ •••'}
                                        </span>
                                        {payment.isRenewal && (
                                          <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-400 rounded">Rinnovo</span>
                                        )}
                                      </div>
                                      <span className="text-xs text-slate-400">
                                        {pDate ? pDate.toLocaleDateString('it-IT') : 'N/D'}
                                        {payment.paymentMethod && ` • ${PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}`}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => { setEditingPaymentIndex(idx); openModal('editPayment'); }}
                                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"
                                    >
                                      <Edit size={16} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </UnifiedCard>
                  )}
                </div>
              </div>
            )}

            {/* Tab Content - Habits */}
            {activeTab === 'habits' && (
              <ClientHabitsOverview client={client} onOpenCalendar={() => openModal('workoutCalendar')} />
            )}

            {/* Tab Content - Check & Foto */}
            {activeTab === 'check' && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,1fr] gap-4 lg:gap-6">
                <div className="space-y-4">
                  <UnifiedCard>
                    <CardHeaderSimple 
                      title="Check recenti"
                      action={
                        <button onClick={() => openModal('newCheck')} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                          <Plus size={14} /> Aggiungi
                        </button>
                      }
                    />
                    <CardContent>
                      {checks.length > 0 ? (
                        <div className="space-y-3">
                          {checks.slice(0, 10).map((check) => (
                            <ListItemCard 
                              key={check.id}
                              onClick={() => { setSelectedCheck(check); openModal('checkDetail'); }}
                              className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                            >
                              <div className="flex items-center justify-between text-sm text-slate-200">
                                <span className="font-semibold">{toDate(check.createdAt)?.toLocaleDateString('it-IT') || 'N/D'}</span>
                                <Eye size={14} className="text-slate-500" />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {check.weight && <Badge variant="default" size="sm">Peso {formatWeight(check.weight)}</Badge>}
                                {check.bodyFat && <Badge variant="default" size="sm">BF {check.bodyFat}%</Badge>}
                                {check.notes && <Badge variant="default" size="sm">Note: {check.notes.slice(0, 30)}...</Badge>}
                                {check.photoURLs && Object.values(check.photoURLs).some(url => url) && (
                                  <Badge variant="success" size="sm"><Image size={10} className="mr-1" /> Foto</Badge>
                                )}
                              </div>
                            </ListItemCard>
                          ))}
                        </div>
                      ) : (
                        <EmptyState icon={Calendar} description="Nessun check." />
                      )}
                    </CardContent>
                  </UnifiedCard>
                  
                  <UnifiedCard>
                    <CardHeaderSimple title="Progressione" />
                    <CardContent>
                      <ProgressCharts checks={checks} />
                    </CardContent>
                  </UnifiedCard>
                </div>
                
                <UnifiedCard>
                  <CardHeaderSimple 
                    title="Foto recenti"
                    action={
                      <button onClick={() => openModal('photoCompare')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 text-slate-200 rounded-lg border border-slate-700">
                        <ArrowLeftRight size={14} /> Confronta
                      </button>
                    }
                  />
                  <CardContent>
                    {photoGallery.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {photoGallery.map((photo, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => openModal('photoZoom', { open: true, url: photo.url, alt: photo.label })} 
                            className="relative overflow-hidden rounded-lg group border border-slate-800"
                          >
                            <img src={photo.url} alt={photo.label} className="w-full h-28 object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Image} description="Nessuna foto." />
                    )}
                  </CardContent>
                </UnifiedCard>
              </div>
            )}

            {/* Tab Content - Payments */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <UnifiedCard>
                  <CardHeaderSimple title="Pagamenti" />
                  <CardContent>
                    <CardGrid cols={2} className="mb-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <p className="text-xs text-slate-400">Pagato</p>
                        <p className="text-lg font-semibold text-white">{showAmounts ? `€${paymentsPaid.toFixed(0)}` : '€ •••'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <p className="text-xs text-slate-400">Totale</p>
                        <p className="text-lg font-semibold text-white">{showAmounts ? `€${paymentsTotal.toFixed(0)}` : '€ •••'}</p>
                      </div>
                    </CardGrid>
                  </CardContent>
                </UnifiedCard>
                
                <RateTable 
                  rates={rates} 
                  canEdit={isAdmin} 
                  onAdd={handleAddRate} 
                  onUpdate={handleUpdateRate} 
                  onDelete={handleDeleteRate} 
                  showAmounts={showAmounts}
                  onRatePaymentToggled={(isPaid, amount) => {
                    toast[isPaid ? 'success' : 'info'](`Rata di €${amount} ${isPaid ? 'pagata ✓' : 'da pagare'}`);
                  }}
                />
              </div>
            )}

            {/* Tab Content - Metrics */}
            {activeTab === 'metrics' && (
              <UnifiedCard>
                <CardHeaderSimple title="Metrics Avg" subtitle="Ultimi check" />
                <CardContent>
                  <CardGrid cols={3}>
                    <DataCard label="Peso" value={weightValue !== null ? formatWeight(weightValue) : 'N/D'} />
                    <DataCard label="Body Fat" value={bodyFatValue !== null ? `${bodyFatValue}%` : (estimatedBodyFat !== null ? `~${estimatedBodyFat}%` : 'N/D')} />
                    <DataCard label="Check" value={checks.length || 0} />
                  </CardGrid>
                </CardContent>
              </UnifiedCard>
            )}

            {/* Tab Content - Schede */}
            {activeTab === 'schede' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scheda Allenamento */}
                <div 
                  onClick={() => navigate(isCoach ? `/coach/scheda-allenamento/${clientId}` : `/scheda-allenamento/${clientId}`)}
                  className="bg-gradient-to-br from-blue-900/40 to-slate-800/40 border border-blue-600/30 rounded-2xl p-6 cursor-pointer hover:border-blue-500/50 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center">
                      <Dumbbell className="text-blue-400" size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Scheda Allenamento</h3>
                      <p className={`text-sm ${schedaAllenamento ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {schedeLoading ? 'Caricamento...' : schedaAllenamento ? 'Scheda attiva' : 'Nessuna scheda'}
                      </p>
                    </div>
                  </div>
                  <span className="text-blue-400 text-sm group-hover:text-blue-300">
                    {schedaAllenamento ? 'Modifica scheda →' : 'Crea scheda →'}
                  </span>
                </div>

                {/* Scheda Alimentazione */}
                <div 
                  onClick={() => navigate(isCoach ? `/coach/scheda-alimentazione/${clientId}` : `/scheda-alimentazione/${clientId}`)}
                  className="bg-gradient-to-br from-emerald-900/40 to-slate-800/40 border border-emerald-600/30 rounded-2xl p-6 cursor-pointer hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                      <UtensilsCrossed className="text-emerald-400" size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Scheda Alimentazione</h3>
                      <p className={`text-sm ${schedaAlimentazione ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {schedeLoading ? 'Caricamento...' : schedaAlimentazione ? 'Scheda attiva' : 'Nessuna scheda'}
                      </p>
                    </div>
                  </div>
                  <span className="text-emerald-400 text-sm group-hover:text-emerald-300">
                    {schedaAlimentazione ? 'Modifica scheda →' : 'Crea scheda →'}
                  </span>
                </div>
              </div>
            )}

            {/* Tab Content - Anamnesi */}
            {activeTab === 'anamnesi' && (
              <UnifiedCard>
                <CardHeader icon={FileText} title="Anamnesi completa" />
                <CardContent>
                  {anamnesi ? (
                    <div className="space-y-4">
                      {/* Dati personali */}
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">Dati Personali</p>
                        <CardGrid cols={4}>
                          {renderAnamnesiField('Nome', anamnesi.firstName || client.name)}
                          {renderAnamnesiField('Cognome', anamnesi.lastName)}
                          {renderAnamnesiField('Data di nascita', anamnesi.birthDate)}
                          {renderAnamnesiField('Sesso', anamnesi.gender === 'M' ? 'Maschio' : anamnesi.gender === 'F' ? 'Femmina' : anamnesi.gender === 'male' ? 'Maschio' : anamnesi.gender === 'female' ? 'Femmina' : 'Non specificato')}
                        </CardGrid>
                      </div>
                      
                      <div>
                        <CardGrid cols={3}>
                          {renderAnamnesiField('Lavoro', anamnesi.job)}
                          {renderAnamnesiField(`Peso (${weightLabel})`, anamnesi.weight ? formatWeight(anamnesi.weight) : null)}
                          {renderAnamnesiField(`Altezza (${lengthLabel})`, anamnesi.height ? formatLength(anamnesi.height) : null)}
                        </CardGrid>
                      </div>

                      {/* Alimentazione */}
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">Alimentazione</p>
                        <CardGrid cols={3}>
                          {renderAnamnesiField('Pasti al giorno', anamnesi.mealsPerDay)}
                          {renderAnamnesiField('Tipo colazione', anamnesi.breakfastType)}
                          {renderAnamnesiField('Durata percorso', anamnesi.programDuration)}
                        </CardGrid>
                        <CardGrid cols={3} className="mt-3">
                          {renderAnamnesiField('Alimenti preferiti', anamnesi.desiredFoods)}
                          {renderAnamnesiField('Alimenti da evitare', anamnesi.dislikedFoods)}
                          {renderAnamnesiField('Allergie / intolleranze', anamnesi.intolerances)}
                        </CardGrid>
                        <CardGrid cols={3} className="mt-3">
                          {renderAnamnesiField('Problemi digestione', anamnesi.digestionIssues)}
                          {renderAnamnesiField('Qualità del sonno', anamnesi.sleepQuality)}
                          {renderAnamnesiField('Note generali', anamnesi.note)}
                        </CardGrid>
                      </div>

                      {/* Allenamento */}
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">Allenamento</p>
                        <CardGrid cols={3}>
                          {renderAnamnesiField('Allenamenti a settimana', anamnesi.workoutsPerWeek)}
                          {renderAnamnesiField('Dettagli allenamento', anamnesi.trainingDetails)}
                          {renderAnamnesiField('Orario e durata', anamnesi.trainingTime)}
                        </CardGrid>
                      </div>

                      {/* Salute */}
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">Salute</p>
                        <CardGrid cols={3}>
                          {renderAnamnesiField('Infortuni / problematiche', anamnesi.injuries)}
                          {renderAnamnesiField('Farmaci', anamnesi.medications)}
                          {renderAnamnesiField('Integratori', anamnesi.supplements)}
                        </CardGrid>
                      </div>

                      {/* Obiettivi */}
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">Obiettivi</p>
                        <CardGrid cols={2}>
                          {renderAnamnesiField('Obiettivo principale', anamnesi.mainGoal)}
                          {renderAnamnesiField('Motivazione / dettagli', anamnesi.trainingDetails || anamnesi.programDuration)}
                        </CardGrid>
                      </div>
                      
                      {/* Foto Anamnesi */}
                      <div className="pt-4">
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-3">Foto Anamnesi</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {['front', 'right', 'left', 'back'].map((pos) => (
                            <div key={pos} className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden text-xs text-slate-300">
                              <div className="px-3 py-2 border-b border-slate-800 capitalize flex items-center justify-between">
                                <span>{pos === 'front' ? 'Frontale' : pos === 'back' ? 'Posteriore' : `Laterale ${pos === 'left' ? 'Sx' : 'Dx'}`}</span>
                                <label className="cursor-pointer p-1 hover:bg-slate-700 rounded">
                                  {loadingStates.uploadingPhoto === pos ? (
                                    <Loader2 size={14} className="animate-spin text-blue-400" />
                                  ) : (
                                    <Upload size={14} className="text-slate-400 hover:text-blue-400" />
                                  )}
                                  <input 
                                    type="file" 
                                    accept={IMAGE_ACCEPT_STRING} 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleAnamnesiPhotoUpload(pos, file);
                                      e.target.value = '';
                                    }}
                                    disabled={loadingStates.uploadingPhoto !== null}
                                  />
                                </label>
                              </div>
                              {anamnesi?.photoURLs?.[pos] ? (
                                <img 
                                  src={anamnesi.photoURLs[pos]} 
                                  alt={pos} 
                                  className="w-full h-28 object-cover cursor-pointer hover:opacity-80" 
                                  onClick={() => openModal('photoZoom', { open: true, url: anamnesi.photoURLs[pos], alt: pos })}
                                />
                              ) : (
                                <div className="w-full h-28 bg-slate-800 flex items-center justify-center text-slate-500">
                                  <Camera size={20} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={FileText} title="Nessuna anamnesi" description="Il cliente non ha compilato l'anamnesi." />
                  )}
                </CardContent>
              </UnifiedCard>
            )}

            {/* Mobile Actions */}
            {isMobile && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                {canEditClient && (
                  <button onClick={() => openModal('edit')} className="px-3 py-2 border border-slate-700 bg-slate-900 text-slate-200 rounded-lg text-sm flex items-center justify-center gap-2">
                    <Edit size={14} /> Modifica
                  </button>
                )}
                {canManagePayments && (
                  <button onClick={() => openModal('renewal')} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                    <Plus size={14} /> Rinnovo
                  </button>
                )}
                <button onClick={() => openModal('extend')} className="px-3 py-2 bg-cyan-600/80 text-white border border-cyan-500/60 rounded-lg text-sm flex items-center justify-center gap-2">
                  <CalendarDays size={14} /> Prolunga
                </button>
                {canDeleteClient && (
                  <button onClick={handleDelete} className="px-3 py-2 bg-rose-600/80 text-white border border-rose-500/60 rounded-lg text-sm flex items-center justify-center gap-2">
                    <Trash2 size={14} /> Elimina
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* MODALS */}
        {modals.renewal && (
          <RenewalModal 
            isOpen={modals.renewal} 
            onClose={() => closeModal('renewal')} 
            client={client} 
            onSave={() => {}} 
          />
        )}
        {modals.edit && (
          <EditClientModal 
            isOpen={modals.edit} 
            onClose={() => closeModal('edit')} 
            client={client} 
            onSave={() => {}} 
          />
        )}
        {modals.extend && (
          <ExtendExpiryModal 
            isOpen={modals.extend} 
            onClose={() => closeModal('extend')} 
            client={client} 
            onSave={() => {}} 
          />
        )}
        {modals.editPayment && (
          <EditPaymentModal
            isOpen={modals.editPayment}
            onClose={() => { closeModal('editPayment'); setEditingPaymentIndex(null); }}
            payment={editingPaymentIndex !== null ? payments[editingPaymentIndex] : null}
            client={client}
            db={db}
            onSave={() => setEditingPaymentIndex(null)}
            onDelete={() => setEditingPaymentIndex(null)}
          />
        )}
        {modals.photoZoom?.open && (
          <PhotoZoomModal 
            isOpen={modals.photoZoom.open} 
            onClose={() => closeModal('photoZoom')} 
            imageUrl={modals.photoZoom.url} 
            alt={modals.photoZoom.alt} 
          />
        )}
        {modals.photoCompare && (
          <PhotoCompare 
            checks={checks} 
            anamnesi={anamnesi} 
            onClose={() => closeModal('photoCompare')} 
          />
        )}
        {modals.scheduleCall && (
          <ScheduleCallModal 
            isOpen={modals.scheduleCall} 
            onClose={() => closeModal('scheduleCall')} 
            clientId={clientId}
            clientName={client?.name}
            existingCall={nextCall}
            onSave={() => {}}
          />
        )}
        {modals.workoutCalendar && (
          <WorkoutCalendarModal 
            isOpen={modals.workoutCalendar}
            onClose={() => closeModal('workoutCalendar')}
            clientId={clientId}
          />
        )}
        {modals.newCheck && (
          <NewCheckModal 
            isOpen={modals.newCheck}
            onClose={() => closeModal('newCheck')}
            clientId={clientId}
            db={db}
          />
        )}
        {modals.checkDetail && selectedCheck && (
          <CheckDetailModal 
            isOpen={modals.checkDetail}
            onClose={() => { closeModal('checkDetail'); setSelectedCheck(null); }}
            check={selectedCheck}
            onPhotoZoom={(url, alt) => openModal('photoZoom', { open: true, url, alt })}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
