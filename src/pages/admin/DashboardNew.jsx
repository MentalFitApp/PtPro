// src/pages/admin/DashboardNew.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, onSnapshot, query, where, orderBy, getDocs, getDoc, doc, setDoc, serverTimestamp 
} from "firebase/firestore";
import { auth, db, toDate } from "../../firebase";
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { signOut, updateProfile } from "firebase/auth";
import { uploadPhoto } from "../../cloudflareStorage";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantBranding } from '../../hooks/useTenantBranding';
import {
  TrendingUp, Users, DollarSign, Calendar, Target, Eye, EyeOff,
  ChevronDown, Settings, BarChart3, Clock, CheckCircle, AlertCircle,
  Plus, LogOut, User, X, FileText, RefreshCw, Bell
} from "lucide-react";

export default function DashboardNew() {
  const navigate = useNavigate();
  const { branding } = useTenantBranding();
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [lastViewed, setLastViewed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // giorni
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentPhotoURL, setCurrentPhotoURL] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [visibleMetrics, setVisibleMetrics] = useState({
    revenue: true,
    clients: true,
    renewals: true,
    leads: true,
    retention: true,
    avgValue: true
  });

  // Carica dati
  useEffect(() => {
    const unsubClients = onSnapshot(getTenantCollection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubLeads = onSnapshot(getTenantCollection(db, 'leads'), (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Carica tutti i pagamenti dalle subcollection
    const loadPayments = async () => {
      const allPayments = [];
      const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
      
      for (const clientDoc of clientsSnap.docs) {
        const paymentsSnap = await getDocs(
          collection(db, getTenantCollection(db, 'clients').path, clientDoc.id, 'payments')
        );
        paymentsSnap.docs.forEach(payDoc => {
          allPayments.push({
            id: payDoc.id,
            clientId: clientDoc.id,
            clientName: clientDoc.data().name,
            ...payDoc.data()
          });
        });
      }
      setPayments(allPayments);
      setLoading(false);
    };

    loadPayments();

    return () => {
      unsubClients();
      unsubLeads();
    };
  }, []);

  // Calcoli metriche
  const metrics = useMemo(() => {
    const now = new Date();
    const rangeDate = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

    // Filtra per range temporale
    const recentPayments = payments.filter(p => {
      const pDate = toDate(p.paymentDate);
      return pDate && pDate >= rangeDate;
    });

    const recentClients = clients.filter(c => {
      const cDate = toDate(c.startDate);
      return cDate && cDate >= rangeDate;
    });

    const recentLeads = leads.filter(l => {
      const lDate = toDate(l.timestamp);
      return lDate && lDate >= rangeDate;
    });

    // Calcola metriche
    const revenue = recentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const activeClients = clients.filter(c => {
      const exp = toDate(c.scadenza);
      return exp && exp > now;
    }).length;
    
    const renewals = recentPayments.filter(p => p.duration && !p.duration.includes('Manuale')).length;
    
    const totalClients = clients.length;
    const retention = totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : 0;
    
    const avgValue = recentPayments.length > 0 
      ? (revenue / recentPayments.length).toFixed(0) 
      : 0;

    return {
      revenue,
      newClients: recentClients.length,
      renewals,
      leads: recentLeads.length,
      activeClients,
      totalClients,
      retention,
      avgValue,
      expiringClients: clients.filter(c => {
        const exp = toDate(c.scadenza);
        if (!exp) return false;
        const daysToExpiry = (exp - now) / (1000 * 60 * 60 * 24);
        return daysToExpiry > 0 && daysToExpiry <= 7;
      }).length
    };
  }, [clients, payments, leads, timeRange]);

  // Toggle visibilità metrica
  const toggleMetric = (key) => {
    setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key] }));
    localStorage.setItem('dashboard_metrics', JSON.stringify({ ...visibleMetrics, [key]: !visibleMetrics[key] }));
  };

  // Carica preferenze salvate
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_metrics');
    if (saved) setVisibleMetrics(JSON.parse(saved));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen p-2 sm:p-3">
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3">
        
        {/* HEADER CON FILTRI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} /> Dashboard
          </h1>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              value={timeRange} 
              onChange={e => setTimeRange(e.target.value)}
              className="px-2 py-1.5 bg-slate-800 text-white rounded-lg border border-slate-700 text-xs"
            >
              <option value="7">Ultimi 7 giorni</option>
              <option value="30">Ultimi 30 giorni</option>
              <option value="90">Ultimi 3 mesi</option>
              <option value="365">Ultimo anno</option>
            </select>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* PANNELLO IMPOSTAZIONI */}
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700 p-2"
          >
            <p className="text-xs text-slate-400 mb-2">Mostra/Nascondi Metriche:</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(visibleMetrics).map(key => (
                <button
                  key={key}
                  onClick={() => toggleMetric(key)}
                  className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
                    visibleMetrics[key]
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {visibleMetrics[key] ? <Eye size={12} /> : <EyeOff size={12} />}
                  {key}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* METRICHE COMPATTE - INLINE */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {visibleMetrics.revenue && (
            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 backdrop-blur-sm border border-emerald-500/30 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <DollarSign className="text-emerald-400" size={14} />
                <TrendingUp className="text-emerald-400" size={10} />
              </div>
              <p className="text-lg font-bold text-white">{metrics.revenue.toFixed(0)}€</p>
              <p className="text-[9px] text-emerald-300">Incassi</p>
            </div>
          )}

          {visibleMetrics.clients && (
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <Users className="text-blue-400" size={14} />
                <span className="text-[9px] text-blue-300">{metrics.activeClients}/{metrics.totalClients}</span>
              </div>
              <p className="text-lg font-bold text-white">{metrics.newClients}</p>
              <p className="text-[9px] text-blue-300">Nuovi Clienti</p>
            </div>
          )}

          {visibleMetrics.renewals && (
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle className="text-purple-400" size={14} />
              </div>
              <p className="text-lg font-bold text-white">{metrics.renewals}</p>
              <p className="text-[9px] text-purple-300">Rinnovi</p>
            </div>
          )}

          {visibleMetrics.leads && (
            <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 backdrop-blur-sm border border-amber-500/30 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <Target className="text-amber-400" size={14} />
              </div>
              <p className="text-lg font-bold text-white">{metrics.leads}</p>
              <p className="text-[9px] text-amber-300">Lead</p>
            </div>
          )}

          {visibleMetrics.retention && (
            <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="text-cyan-400" size={14} />
              </div>
              <p className="text-lg font-bold text-white">{metrics.retention}%</p>
              <p className="text-[9px] text-cyan-300">Retention</p>
            </div>
          )}

          {visibleMetrics.avgValue && (
            <div className="bg-gradient-to-br from-rose-900/40 to-rose-800/20 backdrop-blur-sm border border-rose-500/30 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <DollarSign className="text-rose-400" size={14} />
              </div>
              <p className="text-lg font-bold text-white">{metrics.avgValue}€</p>
              <p className="text-[9px] text-rose-300">Valore Medio</p>
            </div>
          )}
        </div>

        {/* TABS PER VISTE DETTAGLIATE */}
        <div className="flex gap-1 overflow-x-auto bg-slate-900/50 p-1 rounded-lg border border-slate-700">
          {['overview', 'clienti', 'pagamenti', 'lead', 'scadenze'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {tab === 'overview' ? '📊 Panoramica' :
               tab === 'clienti' ? '👥 Clienti' :
               tab === 'pagamenti' ? '💰 Pagamenti' :
               tab === 'lead' ? '🎯 Lead' :
               '⏰ Scadenze'}
            </button>
          ))}
        </div>

        {/* CONTENUTO TAB */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700 p-2 sm:p-3">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 size={16} /> Panoramica Rapida
              </h3>
              
              {/* Alert Scadenze */}
              {metrics.expiringClients > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 flex items-start gap-2">
                  <AlertCircle className="text-amber-400 flex-shrink-0" size={16} />
                  <div>
                    <p className="text-xs font-semibold text-amber-300">
                      {metrics.expiringClients} clienti in scadenza nei prossimi 7 giorni
                    </p>
                    <button 
                      onClick={() => setActiveTab('scadenze')}
                      className="text-[10px] text-amber-400 hover:underline mt-1"
                    >
                      Vedi dettagli →
                    </button>
                  </div>
                </div>
              )}

              {/* Ultimi Clienti */}
              <div>
                <p className="text-xs text-slate-400 mb-2">Ultimi Clienti Aggiunti</p>
                <div className="space-y-1.5">
                  {clients.slice(0, 5).map(client => (
                    <div 
                      key={client.id}
                      onClick={() => navigate(`/client/${client.id}`)}
                      className="flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {client.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-xs text-white truncate">{client.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {toDate(client.startDate)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clienti' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users size={16} /> Tutti i Clienti ({clients.length})
                </h3>
                <button
                  onClick={() => navigate('/clients')}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Vedi tutti →
                </button>
              </div>
              
              <div className="space-y-1">
                {clients.slice(0, 10).map(client => {
                  const exp = toDate(client.scadenza);
                  const isActive = exp && exp > new Date();
                  const daysLeft = exp ? Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  
                  return (
                    <div 
                      key={client.id}
                      onClick={() => navigate(`/client/${client.id}`)}
                      className="flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-white truncate">{client.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {daysLeft !== null && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            daysLeft <= 7 ? 'bg-amber-500/20 text-amber-300' :
                            daysLeft <= 30 ? 'bg-blue-500/20 text-blue-300' :
                            'bg-slate-600/50 text-slate-400'
                          }`}>
                            {daysLeft > 0 ? `${daysLeft}gg` : 'Scaduto'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'pagamenti' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign size={16} /> Pagamenti Recenti
              </h3>
              
              <div className="space-y-1">
                {payments
                  .sort((a, b) => toDate(b.paymentDate) - toDate(a.paymentDate))
                  .slice(0, 15)
                  .map((payment, idx) => (
                    <div 
                      key={payment.id || idx}
                      className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{payment.clientName}</p>
                        <p className="text-[10px] text-slate-400">
                          {toDate(payment.paymentDate)?.toLocaleDateString('it-IT')} • {payment.paymentMethod}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 flex-shrink-0">
                        +{payment.amount?.toFixed(0)}€
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'lead' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Target size={16} /> Lead ({leads.length})
                </h3>
                <button
                  onClick={() => navigate('/admin/collaboratori')}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Gestisci →
                </button>
              </div>
              
              <div className="space-y-1">
                {leads.slice(0, 10).map(lead => (
                  <div 
                    key={lead.id}
                    className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{lead.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {lead.source} • {lead.collaboratoreNome}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {lead.showUp && <CheckCircle className="text-emerald-400" size={12} />}
                      {lead.chiuso && <DollarSign className="text-blue-400" size={12} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'scadenze' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock size={16} /> Clienti in Scadenza
              </h3>
              
              <div className="space-y-1">
                {clients
                  .filter(c => {
                    const exp = toDate(c.scadenza);
                    if (!exp) return false;
                    const daysToExpiry = (exp - new Date()) / (1000 * 60 * 60 * 24);
                    return daysToExpiry <= 30 && daysToExpiry >= 0;
                  })
                  .sort((a, b) => toDate(a.scadenza) - toDate(b.scadenza))
                  .map(client => {
                    const exp = toDate(client.scadenza);
                    const daysLeft = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div 
                        key={client.id}
                        onClick={() => navigate(`/client/${client.id}`)}
                        className="flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Clock 
                            className={`flex-shrink-0 ${
                              daysLeft <= 7 ? 'text-red-400' : 
                              daysLeft <= 14 ? 'text-amber-400' : 
                              'text-blue-400'
                            }`} 
                            size={14} 
                          />
                          <span className="text-xs text-white truncate">{client.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold ${
                            daysLeft <= 7 ? 'text-red-400' : 
                            daysLeft <= 14 ? 'text-amber-400' : 
                            'text-blue-400'
                          }`}>
                            {daysLeft} giorni
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {exp.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
