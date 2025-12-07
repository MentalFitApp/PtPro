// src/pages/coach/CoachClientDetail.jsx
// Versione Coach del dettaglio cliente - SENZA PAGAMENTI
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot, orderBy, query, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Trash2,
  Edit,
  ArrowLeft,
  Copy,
  Check,
  X,
  ZoomIn,
  CalendarDays,
  AlertTriangle,
  Activity,
  Image,
  Info,
  BarChart3,
  Clock,
  Tag,
  ClipboardList,
  NotebookPen,
  CheckCircle,
  Link2,
  Loader2
} from 'lucide-react';
import QuickNotifyButton from '../../components/notifications/QuickNotifyButton';
import { CLIENT_STATUS_STYLES, CLIENT_STATUS_LABELS, CLIENT_STATUS } from '../../constants/payments';
import { db, toDate, updateStatoPercorso, auth } from '../../firebase';
import { getTenantDoc, getTenantSubcollection, CURRENT_TENANT_ID } from '../../config/tenant';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import normalizePhotoURLs from '../../utils/normalizePhotoURLs';
import { 
  UnifiedCard, 
  CardHeader, 
  CardHeaderSimple,
  CardContent, 
  InfoField,
  DataCard,
  Badge,
  ListItemCard,
  EmptyState,
  CardGrid
} from '../../components/ui/UnifiedCard';
import { ScheduleCallModal, NextCallCard } from '../../components/calls/CallScheduler';

// Error boundary
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

const PathStatusBadge = ({ status }) => {
  const normalizeStatus = (value) => {
    if (!value) return CLIENT_STATUS.NA;
    if (CLIENT_STATUS_STYLES[value]) return value;
    const lowered = String(value).toLowerCase();
    if (lowered.includes('scad') && !lowered.includes('in ')) return CLIENT_STATUS.NOT_RENEWED;
    if (lowered.includes('scaden')) return CLIENT_STATUS.RENEWED;
    if (lowered.includes('attiv')) return CLIENT_STATUS.ACTIVE;
    return CLIENT_STATUS.NA;
  };
  const key = normalizeStatus(status);
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${CLIENT_STATUS_STYLES[key] || CLIENT_STATUS_STYLES.na}`}>
      {CLIENT_STATUS_LABELS[key] || 'N/D'}
    </span>
  );
};

const EditClientModal = ({ isOpen, onClose, client, onSave }) => {
  const initialDate = client?.scadenza ? toDate(client.scadenza) : null;
  const [form, setForm] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    statoPercorso: client?.statoPercorso || CLIENT_STATUS.NA,
    scadenza: initialDate ? initialDate.toISOString().slice(0, 10) : '',
    isOldClient: !!client?.isOldClient,
  });

  useEffect(() => {
    const nextDate = client?.scadenza ? toDate(client.scadenza) : null;
    setForm({
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      statoPercorso: client?.statoPercorso || CLIENT_STATUS.NA,
      scadenza: nextDate ? nextDate.toISOString().slice(0, 10) : '',
      isOldClient: !!client?.isOldClient,
    });
  }, [client]);

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        statoPercorso: form.statoPercorso,
        isOldClient: form.isOldClient,
      };
      if (form.scadenza) payload.scadenza = new Date(form.scadenza);
      const clientRef = getTenantDoc(db, 'clients', client.id);
      await updateDoc(clientRef, payload);
      updateStatoPercorso(client.id);
      onSave?.();
      onClose();
    } catch (err) {
      console.error('Errore modifica:', err);
      alert('Errore durante il salvataggio.');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-[90] p-0 md:p-4">
      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="bg-slate-900/90 rounded-t-3xl md:rounded-2xl border border-slate-800 p-6 w-full max-w-2xl shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Modifica cliente</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-rose-300"><X size={22} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefono" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Stato percorso</label>
              <select value={form.statoPercorso} onChange={e => setForm({ ...form, statoPercorso: e.target.value })} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                {Object.keys(CLIENT_STATUS_LABELS).map(key => (<option key={key} value={key}>{CLIENT_STATUS_LABELS[key]}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Scadenza</label>
              <input type="date" value={form.scadenza} onChange={e => setForm({ ...form, scadenza: e.target.value })} className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white w-full" />
            </div>
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm text-white">Archivia cliente</p>
                <p className="text-xs text-slate-400">Escludi da liste attive</p>
              </div>
              <input type="checkbox" checked={form.isOldClient} onChange={e => setForm({ ...form, isOldClient: e.target.checked })} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1" />
          <button onClick={handleSave} className="w-full md:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm">Salva</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ExtendExpiryModal = ({ isOpen, onClose, client, onSave }) => {
  const [days, setDays] = useState(7);
  const [manualDate, setManualDate] = useState('');
  const [useManual, setUseManual] = useState(false);

  const handleSave = async () => {
    try {
      const current = toDate(client.scadenza) || new Date();
      const newExpiry = useManual && manualDate ? new Date(manualDate) : new Date(current);
      if (!useManual) newExpiry.setDate(newExpiry.getDate() + days);
      const clientRef = getTenantDoc(db, 'clients', client.id);
      await updateDoc(clientRef, { scadenza: newExpiry });
      updateStatoPercorso(client.id);
      onSave?.();
      onClose();
    } catch (err) {
      console.error('Errore prolungamento:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[90] p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900">Prolunga Scadenza</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-rose-500"><X size={22} /></button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={useManual} onChange={e => setUseManual(e.target.checked)} className="w-4 h-4" />
            <label className="text-sm text-slate-700">Scegli data manuale</label>
          </div>
          {useManual ? (
            <div>
              <label className="block text-sm text-slate-600 mb-1">Nuova scadenza</label>
              <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800" />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-slate-600 mb-1">Aggiungi giorni</label>
              <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800">
                {[1,3,7,15,30,60].map(d => (<option key={d} value={d}>+{d} giorni</option>))}
              </select>
            </div>
          )}
          <div className="text-xs text-slate-600 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p>Scadenza attuale: <strong className="text-slate-900">{toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}</strong></p>
            <p>Nuova scadenza: <strong className="text-slate-900">{
              useManual && manualDate ? new Date(manualDate).toLocaleDateString('it-IT') :
              toDate(client.scadenza) ? new Date(toDate(client.scadenza).getTime() + days * 86400000).toLocaleDateString('it-IT') : 'N/D'
            }</strong></p>
          </div>
          <button onClick={handleSave} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm">
            <CalendarDays size={18} /> Prolunga Scadenza
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PhotoZoomModal = ({ isOpen, onClose, imageUrl, alt }) => {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="relative max-w-4xl max-h-full">
        <img src={imageUrl} alt={alt} className="w-full h-auto max-h-screen object-contain rounded-lg shadow-2xl" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><X size={24} /></button>
        <div className="absolute bottom-4 left-4 text-white bg-black/60 px-3 py-1 rounded text-sm">{alt}</div>
      </motion.div>
    </motion.div>
  );
};

export default function CoachClientDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatWeight, formatLength, weightLabel, lengthLabel } = useUserPreferences();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState([]);
  const [anamnesi, setAnamnesi] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [zoomPhoto, setZoomPhoto] = useState({ open: false, url: '', alt: '' });
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [nextCall, setNextCall] = useState(null);
  const [magicLink, setMagicLink] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Estrai clientId con fallback per HashRouter
  const clientId = params.clientId || (() => {
    const match = location.pathname.match(/\/coach\/client\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  })();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    if (!clientId) {
      setError('ID cliente non valido.');
      setTimeout(() => navigate('/coach/clients'), 3000);
      return;
    }

    const clientRef = getTenantDoc(db, 'clients', clientId);
    const unsubClient = onSnapshot(clientRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setClient(data);
        updateStatoPercorso(clientId);
      } else {
        setError('Cliente non trovato.');
        setTimeout(() => navigate('/coach/clients'), 3000);
      }
      setLoading(false);
    }, () => {
      setError('Errore caricamento.');
      setTimeout(() => navigate('/coach/clients'), 3000);
      setLoading(false);
    });

    const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', clientId, 'anamnesi');
    const anamnesiRef = doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial');
    const unsubAnamnesi = onSnapshot(anamnesiRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.photoURLs) data.photoURLs = normalizePhotoURLs(data.photoURLs);
        setAnamnesi(data);
      } else {
        setAnamnesi(null);
      }
    });

    const checksQuery = query(getTenantSubcollection(db, 'clients', clientId, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, (snap) => {
      const checksData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const resolvedChecks = checksData.map((check) => {
        if (check.photoURLs) check.photoURLs = normalizePhotoURLs(check.photoURLs);
        return check;
      });
      setChecks(resolvedChecks);
    }, (err) => console.error('Errore caricamento checks:', err));

    return () => { unsubClient(); unsubAnamnesi(); unsubChecks(); };
  }, [clientId, navigate]);

  const latestCheck = checks?.[0];
  const previousCheck = checks?.[1];
  const toNumber = (val) => { const num = parseFloat(val); return Number.isFinite(num) ? num : null; };
  const weightValue = toNumber(latestCheck?.weight);
  const prevWeight = toNumber(previousCheck?.weight);
  const weightDelta = weightValue !== null && prevWeight !== null ? weightValue - prevWeight : null;
  const weightDeltaPct = weightDelta !== null && prevWeight ? ((weightDelta / prevWeight) * 100) : null;
  const bodyFatValue = toNumber(latestCheck?.bodyFat);
  const prevBodyFat = toNumber(previousCheck?.bodyFat);
  const bodyFatDelta = bodyFatValue !== null && prevBodyFat !== null ? bodyFatValue - prevBodyFat : null;
  const bodyFatDeltaPct = bodyFatDelta !== null && prevBodyFat ? ((bodyFatDelta / prevBodyFat) * 100) : null;
  const lastCheckAt = latestCheck?.createdAt ? toDate(latestCheck.createdAt) : null;

  const photoGallery = useMemo(() => {
    const list = [];
    checks.forEach((check) => {
      if (check.photoURLs) {
        Object.entries(check.photoURLs).forEach(([type, url]) => { if (url) list.push({ url, label: type, date: toDate(check.createdAt) }); });
      }
    });
    if (anamnesi?.photoURLs) {
      Object.entries(anamnesi.photoURLs).forEach(([type, url]) => { if (url) list.push({ url, label: `Anamnesi ${type}`, date: null }); });
    }
    return list.slice(0, 10);
  }, [checks, anamnesi]);

  const activityFeed = useMemo(() => {
    const items = [];
    
    // Aggiungi checks
    checks.forEach((c) => {
      const note = c.notes || '';
      const checkDate = toDate(c.createdAt) || toDate(c.lastUpdatedAt);
      if (checkDate) {
        items.push({ label: 'Check inviato', detail: note ? `Note: ${note.slice(0, 40)}${note.length > 40 ? '…' : ''}` : 'Aggiornato peso/metriche', date: checkDate, icon: 'check' });
      }
    });
    
    // Aggiungi anamnesi se compilata
    if (anamnesi?.createdAt || anamnesi?.submittedAt) {
      const anamnesiDate = toDate(anamnesi.submittedAt) || toDate(anamnesi.createdAt);
      if (anamnesiDate) {
        items.push({ label: 'Anamnesi compilata', detail: 'Questionario iniziale completato', date: anamnesiDate, icon: 'anamnesi' });
      }
    }
    
    // Aggiungi creazione cliente
    if (client?.createdAt) {
      const createdDate = toDate(client.createdAt);
      if (createdDate) {
        items.push({ label: 'Cliente registrato', detail: 'Account creato sulla piattaforma', date: createdDate, icon: 'created' });
      }
    }
    
    return items.sort((a, b) => b.date - a.date).slice(0, 8);
  }, [checks, anamnesi, client]);

  const formatDelta = (delta) => {
    if (delta === null || delta === undefined) return 'N/D';
    const fixed = Math.abs(delta).toFixed(1);
    return `${delta > 0 ? '+' : '-'}${fixed}`;
  };
  const formatDeltaPct = (deltaPct) => {
    if (deltaPct === null || deltaPct === undefined || !Number.isFinite(deltaPct)) return '';
    const fixed = Math.abs(deltaPct).toFixed(1);
    return `${deltaPct > 0 ? '+' : '-'}${fixed}%`;
  };

  const renderAnamnesiField = (label, value) => (
    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-white mt-1 whitespace-pre-wrap leading-snug">{value || 'N/D'}</p>
    </div>
  );

  const handleDelete = async () => {
    if (window.confirm(`Eliminare ${client?.name}?`)) {
      try { await deleteDoc(getTenantDoc(db, 'clients', clientId)); navigate('/coach/clients'); } catch { alert('Errore eliminazione.'); }
    }
  };

  const copyCredentialsToClipboard = async () => {
    if (!client) return;
    
    // Se non c'è magic link, generalo automaticamente
    if (!magicLink) {
      setGeneratingLink(true);
      try {
        const functions = getFunctions(undefined, 'europe-west1');
        const generateMagicLinkFn = httpsCallable(functions, 'generateMagicLink');
        
        const result = await generateMagicLinkFn({
          clientId: client.id,
          tenantId: CURRENT_TENANT_ID,
          email: client.email,
          name: client.name
        });
        
        if (result.data.success) {
          const newMagicLink = result.data.magicLink;
          setMagicLink(newMagicLink);
          
          // Copia messaggio con magic link
          const text = `Ciao ${client.name}, ti invio il link per entrare nel tuo profilo personale dove inizialmente potrai iniziare a caricare i check settimanalmente, vedere i pagamenti e scadenza abbonamento. A breve ci saranno altre novità che potrai vedere su questa piattaforma: Alimentazione, community, videocorsi, e altro ancora 💪\nTu come stai?\n\n🔗 LINK ACCESSO RAPIDO (valido 48h):\n${newMagicLink}\n\n⚠️ Clicca il link sopra per impostare la tua password e accedere direttamente!`;
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } else {
          alert('Errore nella generazione del Magic Link');
        }
      } catch (error) {
        console.error('Errore generazione Magic Link:', error);
        alert('Errore: ' + (error.message || 'Riprova più tardi'));
      } finally {
        setGeneratingLink(false);
      }
      return;
    }
    
    // Usa il Magic Link già generato
    const text = `Ciao ${client.name}, ti invio il link per entrare nel tuo profilo personale dove inizialmente potrai iniziare a caricare i check settimanalmente, vedere i pagamenti e scadenza abbonamento. A breve ci saranno altre novità che potrai vedere su questa piattaforma: Alimentazione, community, videocorsi, e altro ancora 💪\nTu come stai?\n\n🔗 LINK ACCESSO RAPIDO (valido 48h):\n${magicLink}\n\n⚠️ Clicca il link sopra per impostare la tua password e accedere direttamente!`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const generateMagicLinkForClient = async () => {
    if (!client || generatingLink) return;
    
    setGeneratingLink(true);
    try {
      const functions = getFunctions(undefined, 'europe-west1');
      const generateMagicLink = httpsCallable(functions, 'generateMagicLink');
      
      const result = await generateMagicLink({
        clientId: client.id,
        tenantId: CURRENT_TENANT_ID,
        email: client.email,
        name: client.name
      });
      
      if (result.data.success) {
        setMagicLink(result.data.magicLink);
        // Copia automaticamente negli appunti
        navigator.clipboard.writeText(result.data.magicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        alert('Errore nella generazione del Magic Link');
      }
    } catch (error) {
      console.error('Errore generazione Magic Link:', error);
      alert('Errore: ' + (error.message || 'Riprova più tardi'));
    } finally {
      setGeneratingLink(false);
    }
  };

  if (loading) return <div className="text-center text-slate-400 p-8">Caricamento...</div>;
  if (error) return <div className="text-center text-red-400 p-8">{error}</div>;
  if (!client) return null;

  // Tabs senza "Pagamenti"
  const tabs = [
    { key: 'overview', label: 'Overview', icon: <FileText size={16} /> },
    { key: 'check', label: 'Check & Foto', icon: <Calendar size={16} /> },
    { key: 'metrics', label: 'Metriche', icon: <BarChart3 size={16} /> },
    { key: 'anamnesi', label: 'Anamnesi', icon: <NotebookPen size={16} /> },
  ];

  const infoCard = (
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
              onClick={generateMagicLinkForClient} 
              disabled={generatingLink}
              className="p-1.5 rounded-md border border-slate-700 text-slate-200 hover:text-blue-300 hover:border-blue-400 bg-slate-800 disabled:opacity-50"
              title="Genera Magic Link"
            >
              {generatingLink ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            </button>
            <button onClick={copyCredentialsToClipboard} className="p-1.5 rounded-md border border-slate-700 text-slate-200 hover:text-emerald-300 hover:border-emerald-400 bg-slate-800" title="Copia credenziali">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <InfoField icon={Phone} value={client.phone || 'N/D'} />
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
          <InfoField icon={FileText} value={`Anamnesi: ${anamnesi ? 'Compilata ✓' : 'Non inviata'}`} />
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-slate-400" />
            <span className="inline-flex items-center gap-2 flex-wrap">
              <Badge variant="danger" size="sm">{client.tags?.[0] || 'Client'}</Badge>
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
  );

  const metricsCard = (
    <UnifiedCard>
      <CardHeaderSimple 
        title="Metrics Avg"
        subtitle="Ultimi check"
      />
      <CardContent>
        <CardGrid cols={3}>
          <DataCard 
            label="Peso"
            value={weightValue !== null ? formatWeight(weightValue) : 'N/D'}
            delta={weightDelta !== null ? `${formatDelta(weightDelta)} ${formatDeltaPct(weightDeltaPct)}` : undefined}
            deltaType="negative"
          />
          <DataCard 
            label="Body Fat"
            value={bodyFatValue !== null ? `${bodyFatValue}%` : 'N/D'}
            delta={bodyFatDelta !== null ? `${formatDelta(bodyFatDelta)} ${formatDeltaPct(bodyFatDeltaPct)}` : undefined}
            deltaType="negative"
          />
          <DataCard 
            label="Check"
            value={checks.length || 0}
          />
        </CardGrid>
      </CardContent>
    </UnifiedCard>
  );

  const checkCard = (
    <UnifiedCard>
      <CardHeaderSimple 
        title="Check recenti"
        subtitle="Ultimi 5"
      />
      <CardContent>
        {checks.length > 0 ? (
          <div className="space-y-3">
            {checks.slice(0, 5).map((check) => (
              <ListItemCard key={check.id}>
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span className="font-semibold">{toDate(check.createdAt)?.toLocaleDateString('it-IT') || 'N/D'}</span>
                  <span className="text-slate-400">{toDate(check.createdAt)?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) || ''}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {check.weight && <Badge variant="default" size="sm">Peso {formatWeight(check.weight)}</Badge>}
                  {check.bodyFat && <Badge variant="default" size="sm">BF {check.bodyFat}%</Badge>}
                  {check.notes && <Badge variant="default" size="sm">Note: {check.notes.slice(0, 30)}{check.notes.length > 30 ? '…' : ''}</Badge>}
                </div>
              </ListItemCard>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            description="Nessun check disponibile."
          />
        )}
      </CardContent>
    </UnifiedCard>
  );

  const photosCard = (
    <UnifiedCard>
      <CardHeaderSimple 
        title="Foto recenti"
        subtitle="max 10"
      />
      <CardContent>
        {photoGallery.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {photoGallery.map((photo, idx) => (
              <button 
                key={idx} 
                onClick={() => setZoomPhoto({ open: true, url: photo.url, alt: photo.label })} 
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
          <EmptyState
            icon={Image}
            description="Nessuna foto caricata."
          />
        )}
      </CardContent>
    </UnifiedCard>
  );

  const activityCard = (
    <UnifiedCard>
      <CardHeader icon={Activity} title="Activity Log" />
      <CardContent>
        {activityFeed.length > 0 ? (
          <div className="space-y-3">
            {activityFeed.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-100">
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  item.icon === 'anamnesi' ? 'bg-blue-900/30 border-blue-700/50 text-blue-400' :
                  item.icon === 'created' ? 'bg-purple-900/30 border-purple-700/50 text-purple-400' :
                  'bg-slate-900 border-slate-800 text-slate-200'
                }`}>
                  {item.icon === 'anamnesi' ? <FileText size={16} /> :
                   item.icon === 'created' ? <User size={16} /> :
                   <CheckCircle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="text-slate-400 text-xs">{item.date?.toLocaleString('it-IT')}</p>
                  <p className="text-slate-200 text-sm mt-0.5 truncate">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            description="Nessuna attività recente."
          />
        )}
      </CardContent>
    </UnifiedCard>
  );

  const anamnesiCard = (
    <UnifiedCard>
      <CardHeader icon={FileText} title="Anamnesi completa" />
      <CardContent>
        {anamnesi ? (
          <div className="space-y-3">
            <CardGrid cols={3}>
              {renderAnamnesiField('Nome', anamnesi.firstName || client.name)}
              {renderAnamnesiField('Cognome', anamnesi.lastName)}
              {renderAnamnesiField('Data di nascita', anamnesi.birthDate)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Lavoro', anamnesi.job)}
              {renderAnamnesiField(`Peso (${weightLabel})`, anamnesi.weight ? formatWeight(anamnesi.weight) : null)}
              {renderAnamnesiField(`Altezza (${lengthLabel})`, anamnesi.height ? formatLength(anamnesi.height) : null)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Pasti al giorno', anamnesi.mealsPerDay)}
              {renderAnamnesiField('Tipo colazione', anamnesi.breakfastType)}
              {renderAnamnesiField('Durata percorso', anamnesi.programDuration)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Alimenti preferiti', anamnesi.desiredFoods)}
              {renderAnamnesiField('Alimenti da evitare', anamnesi.dislikedFoods)}
              {renderAnamnesiField('Allergie / intolleranze', anamnesi.intolerances)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Problemi digestione', anamnesi.digestionIssues)}
              {renderAnamnesiField('Qualità del sonno', anamnesi.sleepQuality)}
              {renderAnamnesiField('Note generali', anamnesi.note)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Allenamenti a settimana', anamnesi.workoutsPerWeek)}
              {renderAnamnesiField('Dettagli allenamento', anamnesi.trainingDetails)}
              {renderAnamnesiField('Orario e durata', anamnesi.trainingTime)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Infortuni / problematiche', anamnesi.injuries)}
              {renderAnamnesiField('Farmaci', anamnesi.medications)}
              {renderAnamnesiField('Integratori', anamnesi.supplements)}
            </CardGrid>
            <CardGrid cols={2}>
              {renderAnamnesiField('Obiettivo principale', anamnesi.mainGoal)}
              {renderAnamnesiField('Motivazione / dettagli', anamnesi.trainingDetails || anamnesi.programDuration)}
            </CardGrid>
            {anamnesi.photoURLs && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {['front', 'right', 'left', 'back'].map((pos) => (
                  <div key={pos} className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden text-xs text-slate-300">
                    <div className="px-3 py-2 border-b border-slate-800 capitalize">
                      {pos === 'front' ? 'Frontale' : pos === 'back' ? 'Posteriore' : `Laterale ${pos === 'left' ? 'Sinistra' : 'Destra'}`}
                    </div>
                    {anamnesi.photoURLs?.[pos] ? (
                      <img src={anamnesi.photoURLs[pos]} alt={pos} className="w-full h-28 object-cover cursor-pointer" onClick={() => setZoomPhoto({ open: true, url: anamnesi.photoURLs[pos], alt: pos })} />
                    ) : (
                      <div className="w-full h-28 bg-slate-800 flex items-center justify-center text-slate-500">Nessuna foto</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Nessuna anamnesi"
            description="Nessuna anamnesi disponibile per questo cliente."
          />
        )}
      </CardContent>
    </UnifiedCard>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-transparent">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full px-0 sm:px-0 py-0">

          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              {/* Breadcrumb / Back button */}
              <button onClick={() => navigate('/coach/clients')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm transition-colors">
                <ArrowLeft size={16} /> Torna ai Clienti
              </button>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Profilo Cliente</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{client.name}</h1>
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">{client.tags?.[0] || 'Client'}</span>
                    {client.isOldClient && (
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
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
                  <QuickNotifyButton userId={clientId} userName={client.name} userType="client" />
                  {!isMobile && (
                    <>
                      <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm transition-colors"><Edit size={16} /> Modifica</button>
                      <button onClick={() => setShowExtend(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors"><CalendarDays size={16} /> Prolunga</button>
                      <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm transition-colors"><Trash2 size={16} /> Elimina</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-1 bg-slate-900/40 p-1.5 rounded-xl border border-slate-700/50 scrollbar-thin scrollbar-thumb-slate-700">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* CTA Banner */}
            {!isMobile && (
              <div className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 text-blue-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Info size={20} /></div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-white">Vista cliente</p>
                    <p className="text-xs text-slate-400">Visualizza i dati del cliente come li vede lui.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.35fr,1fr] gap-4 lg:gap-6">
                <div className="space-y-4">
                  {infoCard}
                  {/* Card Prossima Chiamata */}
                  <NextCallCard clientId={clientId} isAdmin={false} onSchedule={() => setShowScheduleCall(true)} />
                  {checkCard}
                  {activityCard}
                </div>
                <div className="space-y-4">
                  {metricsCard}
                  {photosCard}
                </div>
              </div>
            )}

            {activeTab === 'check' && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,1fr] gap-4 lg:gap-6">
                {checkCard}
                {photosCard}
              </div>
            )}

            {activeTab === 'metrics' && metricsCard}

            {activeTab === 'anamnesi' && anamnesiCard}

            {isMobile && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                <button onClick={() => setShowEdit(true)} className="px-3 py-2 border border-slate-700 bg-slate-900 text-slate-200 rounded-lg text-sm flex items-center justify-center gap-2"><Edit size={14} /> Modifica</button>
                <button onClick={() => setShowExtend(true)} className="px-3 py-2 bg-cyan-600/80 text-white border border-cyan-500/60 rounded-lg text-sm flex items-center justify-center gap-2"><CalendarDays size={14} /> Prolunga</button>
                <button onClick={handleDelete} className="px-3 py-2 bg-rose-600/80 text-white border border-rose-500/60 rounded-lg text-sm flex items-center justify-center gap-2"><Trash2 size={14} /> Elimina</button>
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {showEdit && <EditClientModal key="edit" isOpen={showEdit} onClose={() => setShowEdit(false)} client={client} onSave={() => {}} />}
          {showExtend && <ExtendExpiryModal key="extend" isOpen={showExtend} onClose={() => setShowExtend(false)} client={client} onSave={() => {}} />}
          {zoomPhoto?.open && <PhotoZoomModal key="zoom" isOpen={!!zoomPhoto?.open} onClose={() => setZoomPhoto({ open: false, url: '', alt: '' })} imageUrl={zoomPhoto?.url} alt={zoomPhoto?.alt} />}
          {showScheduleCall && <ScheduleCallModal 
            key="scheduleCall"
            isOpen={showScheduleCall} 
            onClose={() => setShowScheduleCall(false)} 
            clientId={clientId}
            clientName={client?.name}
            existingCall={nextCall}
            onSave={() => {}}
          />}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
