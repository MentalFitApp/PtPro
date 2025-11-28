import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc } from '../../config/tenant';
import { Responsive, WidthProvider } from 'react-grid-layout';
import DashboardWidget from '../../components/dashboard/DashboardWidget';
import LeadStatusConfig from '../../components/dashboard/LeadStatusConfig';
import CustomFieldsWidget from '../../components/dashboard/CustomFieldsWidget';
import WidgetContentConfig from '../../components/dashboard/WidgetContentConfig';
import CustomWidgetCreator from '../../components/dashboard/CustomWidgetCreator';
import { 
  TrendingUp, Calendar, Phone, MessageSquare, Target, DollarSign, 
  BarChart3, UserCheck, Users, Plus, Settings, Layout, Save, RotateCcw, Sliders
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget types disponibili
const WIDGET_TYPES = {
  LEAD_TOTALS: 'lead_totals',
  LEAD_BY_SETTER: 'lead_by_setter',
  SALES_STATS: 'sales_stats',
  SETTING_STATS: 'setting_stats',
  DMS_TRACKER: 'dms_tracker',
  SALES_CHART: 'sales_chart',
  SETTER_PERFORMANCE: 'setter_performance',
  CUSTOM_FIELDS: 'custom_fields',
};

// Dimensioni ottimali per ogni widget (minW, minH, maxW, maxH)
const WIDGET_CONSTRAINTS = {
  [WIDGET_TYPES.LEAD_TOTALS]: { minW: 3, minH: 2, maxW: 6, maxH: 3 },
  [WIDGET_TYPES.SALES_STATS]: { minW: 3, minH: 2, maxW: 6, maxH: 3 },
  [WIDGET_TYPES.SETTING_STATS]: { minW: 3, minH: 2, maxW: 6, maxH: 3 },
  [WIDGET_TYPES.SALES_CHART]: { minW: 4, minH: 4, maxW: 8, maxH: 6 },
  [WIDGET_TYPES.DMS_TRACKER]: { minW: 4, minH: 4, maxW: 12, maxH: 6 },
  [WIDGET_TYPES.LEAD_BY_SETTER]: { minW: 4, minH: 4, maxW: 12, maxH: 6 },
  [WIDGET_TYPES.SETTER_PERFORMANCE]: { minW: 4, minH: 3, maxW: 12, maxH: 5 },
};

// Layout di default ottimizzati - dimensioni fisse per visualizzazione ottimale
const DEFAULT_LAYOUTS = {
  lg: [
    // Riga 1: Cards compatte (h=2 per info essenziali senza scroll)
    { i: WIDGET_TYPES.LEAD_TOTALS, x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2, maxW: 6, maxH: 3 },
    { i: WIDGET_TYPES.SALES_STATS, x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2, maxW: 6, maxH: 3 },
    { i: WIDGET_TYPES.SETTING_STATS, x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2, maxW: 6, maxH: 3 },
    
    // Riga 2: Grafici medi (h=5 per 4-5 items visibili senza scroll)
    { i: WIDGET_TYPES.SALES_CHART, x: 0, y: 2, w: 6, h: 5, minW: 4, minH: 4, maxW: 8, maxH: 6 },
    { i: WIDGET_TYPES.DMS_TRACKER, x: 6, y: 2, w: 6, h: 5, minW: 4, minH: 4, maxW: 12, maxH: 6 },
    
    // Riga 3: Tabelle complete (h=5 per 5-6 righe visibili)
    { i: WIDGET_TYPES.LEAD_BY_SETTER, x: 0, y: 7, w: 6, h: 5, minW: 4, minH: 4, maxW: 12, maxH: 6 },
    { i: WIDGET_TYPES.SETTER_PERFORMANCE, x: 6, y: 7, w: 6, h: 5, minW: 4, minH: 3, maxW: 12, maxH: 5 },
  ],
  md: [
    // Tablet: 2 colonne
    { i: WIDGET_TYPES.LEAD_TOTALS, x: 0, y: 0, w: 6, h: 2, minW: 3, minH: 2, maxW: 6, maxH: 3 },
    { i: WIDGET_TYPES.SALES_STATS, x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2, maxW: 6, maxH: 3 },
    { i: WIDGET_TYPES.SETTING_STATS, x: 0, y: 2, w: 6, h: 2, minW: 3, minH: 2, maxW: 6, maxH: 3 },
    { i: WIDGET_TYPES.SALES_CHART, x: 6, y: 2, w: 6, h: 5, minW: 4, minH: 4, maxW: 8, maxH: 6 },
    
    // Full width per liste
    { i: WIDGET_TYPES.DMS_TRACKER, x: 0, y: 4, w: 12, h: 5, minW: 4, minH: 4, maxW: 12, maxH: 6 },
    { i: WIDGET_TYPES.LEAD_BY_SETTER, x: 0, y: 9, w: 12, h: 5, minW: 4, minH: 4, maxW: 12, maxH: 6 },
    { i: WIDGET_TYPES.SETTER_PERFORMANCE, x: 0, y: 14, w: 12, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 5 },
  ],
  sm: [
    // Mobile: Stack verticale, altezze ottimizzate per touch
    { i: WIDGET_TYPES.LEAD_TOTALS, x: 0, y: 0, w: 12, h: 3, minW: 12, minH: 3, maxW: 12, maxH: 4 },
    { i: WIDGET_TYPES.SALES_STATS, x: 0, y: 3, w: 12, h: 3, minW: 12, minH: 3, maxW: 12, maxH: 4 },
    { i: WIDGET_TYPES.SETTING_STATS, x: 0, y: 6, w: 12, h: 3, minW: 12, minH: 3, maxW: 12, maxH: 4 },
    { i: WIDGET_TYPES.SALES_CHART, x: 0, y: 9, w: 12, h: 5, minW: 12, minH: 5, maxW: 12, maxH: 6 },
    { i: WIDGET_TYPES.DMS_TRACKER, x: 0, y: 14, w: 12, h: 5, minW: 12, minH: 5, maxW: 12, maxH: 6 },
    { i: WIDGET_TYPES.LEAD_BY_SETTER, x: 0, y: 19, w: 12, h: 5, minW: 12, minH: 5, maxW: 12, maxH: 6 },
    { i: WIDGET_TYPES.SETTER_PERFORMANCE, x: 0, y: 24, w: 12, h: 4, minW: 12, minH: 4, maxW: 12, maxH: 5 },
  ],
};

export default function StatisticheDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [salesReports, setSalesReports] = useState([]);
  const [settingReports, setSettingReports] = useState([]);
  const [leads, setLeads] = useState([]);
  const [setters, setSetters] = useState([]);
  const [setterMap, setSetterMap] = useState({});
  const [leadStatuses, setLeadStatuses] = useState([]);

  // Layout personalizzato
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  const [visibleWidgets, setVisibleWidgets] = useState(Object.values(WIDGET_TYPES));
  const [showLayoutConfig, setShowLayoutConfig] = useState(false);
  const [showStatusConfig, setShowStatusConfig] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetConfigModal, setWidgetConfigModal] = useState({ show: false, widgetId: '', widgetName: '' });
  const [showCustomWidgetCreator, setShowCustomWidgetCreator] = useState(false);
  const [customWidgets, setCustomWidgets] = useState([]);

  // --- ADMIN CHECK ---
  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.currentUser) { navigate('/login'); return; }
      const adminDoc = await getDoc(getTenantDoc(db, 'roles', 'admins'));
      const uids = adminDoc.exists() ? adminDoc.data().uids || [] : [];
      setIsAdmin(uids.includes(auth.currentUser.uid));
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  // --- CARICA LEAD STATUSES ---
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const configDoc = await getDoc(getTenantDoc(db, 'settings', 'leadStatuses'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.statuses) {
            setLeadStatuses(data.statuses.filter(s => s.enabled));
          } else {
            // Default statuses
            setLeadStatuses([
              { id: 'showUp', label: 'Show Up', color: 'green', enabled: true },
              { id: 'chiuso', label: 'Chiuso', color: 'rose', enabled: true },
            ]);
          }
        } else {
          setLeadStatuses([
            { id: 'showUp', label: 'Show Up', color: 'green', enabled: true },
            { id: 'chiuso', label: 'Chiuso', color: 'rose', enabled: true },
          ]);
        }
      } catch (error) {
        console.error('Errore caricamento lead statuses:', error);
      }
    };
    if (isAdmin) loadStatuses();
  }, [isAdmin]);

  // --- CARICA LAYOUT PERSONALIZZATO ---
  useEffect(() => {
    const loadLayout = async () => {
      if (!auth.currentUser || !isAdmin) return;
      
      try {
        const layoutDoc = await getDoc(getTenantDoc(db, 'settings', `dashboardLayout_${auth.currentUser.uid}`));
        if (layoutDoc.exists()) {
          const data = layoutDoc.data();
          if (data.layouts) setLayouts(data.layouts);
          if (data.visibleWidgets) setVisibleWidgets(data.visibleWidgets);
        }
      } catch (error) {
        console.error('Errore caricamento layout:', error);
      }
    };
    loadLayout();
  }, [isAdmin]);
  
  // --- CARICA WIDGET CUSTOM ---
  useEffect(() => {
    const loadCustomWidgets = async () => {
      if (!isAdmin) return;
      try {
        const doc = await getDoc(getTenantDoc(db, 'settings', 'customWidgets'));
        if (doc.exists()) {
          setCustomWidgets(doc.data().widgets || []);
        }
      } catch (error) {
        console.error('Errore caricamento widget custom:', error);
      }
    };
    loadCustomWidgets();
  }, [isAdmin]);

  // --- LISTENER AGGIORNAMENTI COLONNE ---
  useEffect(() => {
    if (!isAdmin) return;
    
    const unsubColumns = onSnapshot(
      getTenantDoc(db, 'settings', 'leadColumns'),
      (doc) => {
        if (doc.exists()) {
          console.log('📊 Configurazione colonne aggiornata');
          // Forza re-render dei widget
          setVisibleWidgets(prev => [...prev]);
        }
      },
      (error) => {
        console.error('Errore listener colonne:', error);
      }
    );
    
    return () => unsubColumns();
  }, [isAdmin]);

  // --- SALVA LAYOUT ---
  const saveLayout = async () => {
    if (!auth.currentUser) return;
    
    try {
      // Filtra layouts per rimuovere valori undefined
      const cleanLayouts = {};
      Object.keys(layouts).forEach(breakpoint => {
        if (layouts[breakpoint]) {
          cleanLayouts[breakpoint] = layouts[breakpoint]
            .filter(item => item && item.i !== undefined && item.x !== undefined && item.y !== undefined)
            .map(item => {
              // Rimuovi proprietà undefined da ogni item
              const cleanItem = {};
              Object.keys(item).forEach(key => {
                if (item[key] !== undefined) {
                  cleanItem[key] = item[key];
                }
              });
              return cleanItem;
            });
        }
      });
      
      await setDoc(getTenantDoc(db, 'settings', `dashboardLayout_${auth.currentUser.uid}`), {
        layouts: cleanLayouts,
        visibleWidgets: visibleWidgets || [],
        updatedAt: new Date().toISOString(),
      });
      alert('Layout salvato con successo!');
      setIsEditMode(false);
    } catch (error) {
      console.error('Errore salvataggio layout:', error);
      alert('Errore nel salvataggio del layout');
    }
  };

  // --- RESET LAYOUT ---
  const resetLayout = () => {
    if (confirm('Ripristinare il layout predefinito?')) {
      setLayouts(DEFAULT_LAYOUTS);
      setVisibleWidgets(Object.values(WIDGET_TYPES));
    }
  };

  // --- CARICA SETTERS ---
  useEffect(() => {
    if (!isAdmin) return;

    const qSetters = query(getTenantCollection(db, 'collaboratori'));
    const unsub = onSnapshot(qSetters, snap => {
      const map = {};
      const list = snap.docs
        .map(d => {
          const data = d.data();
          const isSetter = data.ruolo === 'Setter' || data.role === 'Setter';
          if (!isSetter) return null;

          const uid = d.id;
          const name = data.nome || data.name || data.email?.split('@')[0] || uid;
          map[uid] = name;

          return {
            uid,
            name,
            photoURL: data.photoURL || '/default-avatar.png',
            dailyReports: Array.isArray(data.dailyReports) ? data.dailyReports : []
          };
        })
        .filter(Boolean);

      setSetters(list);
      setSetterMap(map);
    });

    return () => unsub();
  }, [isAdmin]);

  // --- CARICA REPORTS E LEADS ---
  useEffect(() => {
    if (!isAdmin) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const qSales = query(getTenantCollection(db, 'salesReports'), where('date', '>=', startDate), where('date', '<=', endDate));
    const qSetting = query(getTenantCollection(db, 'settingReports'), where('date', '>=', startDate), where('date', '<=', endDate));
    const qLeads = query(getTenantCollection(db, 'leads'));

    const unsubs = [
      onSnapshot(qSales, snap => setSalesReports(snap.docs.map(d => d.data()))),
      onSnapshot(qSetting, snap => setSettingReports(snap.docs.map(d => d.data()))),
      onSnapshot(qLeads, snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = data.filter(l => {
          const ts = l.timestamp?.toDate();
          return ts && ts >= start && ts <= end;
        });
        setLeads(filtered);
      })
    ];

    return () => unsubs.forEach(u => u());
  }, [isAdmin, startDate, endDate]);

  // --- CALCOLI STATISTICHE ---
  const leadsBySetter = useMemo(() => {
    const agg = {};
    leads.forEach(l => {
      const uid = l.collaboratoreId || 'unknown';
      const name = setterMap[uid] || l.collaboratoreNome || 'Sconosciuto';

      if (!agg[uid]) {
        agg[uid] = { uid, name, total: 0 };
        // Aggiungi contatori per ogni status personalizzato
        leadStatuses.forEach(status => {
          agg[uid][status.id] = 0;
        });
      }
      agg[uid].total++;
      
      // Conta per ogni status
      leadStatuses.forEach(status => {
        if (l[status.id]) agg[uid][status.id]++;
      });
    });
    return Object.values(agg).sort((a, b) => b.total - a.total);
  }, [leads, setterMap, leadStatuses]);

  const filteredSetterReports = useMemo(() => {
    if (setters.length === 0) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const reports = [];

    setters.forEach(setter => {
      const dailyReports = Array.isArray(setter.dailyReports) ? setter.dailyReports : [];

      dailyReports.forEach(report => {
        if (!report?.date || !report.tracker) return;

        const rDate = new Date(report.date);
        if (rDate < start || rDate > end) return;

        const t = report.tracker;

        reports.push({
          uid: setter.uid,
          name: setter.name,
          outreachTotale: parseInt(t.outreachTotale) || 0,
          followUpsTotali: parseInt(t.followUpsTotali) || 0,
          risposte: parseInt(t.risposte) || 0,
          callPrenotate: parseInt(t.callPrenotate) || 0,
        });
      });
    });

    return reports;
  }, [setters, startDate, endDate]);

  const aggregatedBySetter = useMemo(() => {
    const agg = {};
    filteredSetterReports.forEach(r => {
      if (!agg[r.uid]) {
        agg[r.uid] = {
          name: r.name,
          outreachTotale: 0,
          followUpsTotali: 0,
          risposte: 0,
          callPrenotate: 0,
        };
      }
      agg[r.uid].outreachTotale += r.outreachTotale;
      agg[r.uid].followUpsTotali += r.followUpsTotali;
      agg[r.uid].risposte += r.risposte;
      agg[r.uid].callPrenotate += r.callPrenotate;
    });
    return Object.values(agg);
  }, [filteredSetterReports]);

  const salesStats = useMemo(() => {
    const fissate = salesReports.reduce((a, r) => a + (parseInt(r.chiamateFissate) || 0), 0);
    const fatte = salesReports.reduce((a, r) => a + (parseInt(r.chiamateFatte) || 0), 0);
    const offers = salesReports.reduce((a, r) => a + (parseInt(r.offersFatte) || 0), 0);
    const chiuse = salesReports.reduce((a, r) => a + (parseInt(r.chiuse) || 0), 0);

    return {
      fissate, fatte, offers, chiuse,
      showUpRate: fissate > 0 ? ((fatte / fissate) * 100).toFixed(1) : '0.0',
      warmRate: fatte > 0 ? ((offers / fatte) * 100).toFixed(1) : '0.0',
      closeRate: offers > 0 ? ((chiuse / offers) * 100).toFixed(1) : '0.0',
    };
  }, [salesReports]);

  const settingStats = useMemo(() => {
    const dialed = settingReports.reduce((a, r) => a + (parseInt(r.dialedFatti) || 0), 0);
    const risposte = settingReports.reduce((a, r) => a + (parseInt(r.dialedRisposte) || 0), 0);
    const followUps = settingReports.reduce((a, r) => a + (parseInt(r.followUpsFatti) || 0), 0);
    const prenotate = settingReports.reduce((a, r) => a + (parseInt(r.chiamatePrenotate) || 0), 0);

    return {
      dialed, risposte, followUps, prenotate,
      risposteRate: dialed > 0 ? ((risposte / dialed) * 100).toFixed(1) : '0.0',
      prenotateRate: risposte > 0 ? ((prenotate / risposte) * 100).toFixed(1) : '0.0',
    };
  }, [settingReports]);

  const totalLeads = leads.length;

  // Calcola totali per ogni status
  const statusTotals = useMemo(() => {
    const totals = {};
    leadStatuses.forEach(status => {
      totals[status.id] = leads.filter(l => l[status.id]).length;
    });
    return totals;
  }, [leads, leadStatuses]);

  // --- WIDGET RENDERERS ---
  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case WIDGET_TYPES.LEAD_TOTALS:
        return (
          <DashboardWidget
            id={widgetId}
            title="Lead Totali"
            icon={Target}
            onRemove={isEditMode ? () => handleRemoveWidget(widgetId) : null}
            onConfig={isEditMode ? () => handleConfigWidget(widgetId) : null}
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{totalLeads}</p>
                <p className="text-xs text-slate-400 mt-1">Totale Lead</p>
                <p className="text-[9px] text-slate-500 italic mt-1">Contatti generati dalle setter</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {leadStatuses.map(status => {
                  const count = statusTotals[status.id] || 0;
                  const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0;
                  return (
                    <div key={status.id} className={`p-2 rounded-lg bg-${status.color}-500/10 border border-${status.color}-500/30`}>
                      <p className={`text-lg font-bold text-${status.color}-400`}>{count}</p>
                      <p className="text-[10px] text-slate-400">{status.label} ({percentage}%)</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </DashboardWidget>
        );

      case WIDGET_TYPES.SALES_STATS:
        return (
          <DashboardWidget
            id={widgetId}
            title="Vendita"
            icon={DollarSign}
            onRemove={isEditMode ? () => handleRemoveWidget(widgetId) : null}
            onConfig={isEditMode ? () => handleConfigWidget(widgetId) : null}
          >
            <div className="mb-2 text-[9px] text-slate-500 italic">
              Chiamate calendario venditori (include follow-up e re-booking)
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-blue-400">{salesStats.fissate}</p>
                <p className="text-[10px] text-slate-400">Fissate</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-400">{salesStats.fatte}</p>
                <p className="text-[10px] text-slate-400">Fatte</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400">{salesStats.showUpRate}%</p>
                <p className="text-[10px] text-slate-400">Show-Up</p>
              </div>
              <div>
                <p className="text-xl font-bold text-rose-400">{salesStats.closeRate}%</p>
                <p className="text-[10px] text-slate-400">Close Rate</p>
              </div>
            </div>
          </DashboardWidget>
        );

      case WIDGET_TYPES.SETTING_STATS:
        return (
          <DashboardWidget
            id={widgetId}
            title="Setting"
            icon={Phone}
            onRemove={isEditMode ? () => handleRemoveWidget(widgetId) : null}
            onConfig={isEditMode ? () => handleConfigWidget(widgetId) : null}
          >
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-blue-400">{settingStats.dialed}</p>
                <p className="text-[10px] text-slate-400">Dialed</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-400">{settingStats.risposte}</p>
                <p className="text-[10px] text-slate-400">Risposte</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-400">{settingStats.followUps}</p>
                <p className="text-[10px] text-slate-400">Follow-Ups</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400">{settingStats.prenotate}</p>
                <p className="text-[10px] text-slate-400">Prenotate</p>
              </div>
            </div>
          </DashboardWidget>
        );

      case WIDGET_TYPES.DMS_TRACKER:
        // Mostra solo top 5 setter per evitare scroll
        const topSetters = aggregatedBySetter.slice(0, 5);
        return (
          <DashboardWidget
            id={widgetId}
            title="DMS Tracker (Top 5)"
            icon={MessageSquare}
            onRemove={isEditMode ? () => handleRemoveWidget(widgetId) : null}
            onConfig={isEditMode ? () => handleConfigWidget(widgetId) : null}
          >
            <div className="space-y-2">
              {topSetters.map(s => (
                <div key={s.name} className="p-2 bg-slate-900/40 rounded-lg border border-slate-700">
                  <p className="font-semibold text-slate-100 text-sm mb-1">{s.name}</p>
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    <div>
                      <span className="text-blue-400">{s.outreachTotale}</span>
                      <span className="text-slate-500"> Outreach</span>
                    </div>
                    <div>
                      <span className="text-purple-400">{s.followUpsTotali}</span>
                      <span className="text-slate-500"> Follow</span>
                    </div>
                    <div>
                      <span className="text-green-400">{s.risposte}</span>
                      <span className="text-slate-500"> Risp</span>
                    </div>
                    <div>
                      <span className="text-emerald-400">{s.callPrenotate}</span>
                      <span className="text-slate-500"> Call</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardWidget>
        );

      case WIDGET_TYPES.LEAD_BY_SETTER:
        // Mostra solo top 5 setter per lead count
        const topLeadSetters = leadsBySetter.slice(0, 5);
        return (
          <DashboardWidget
            id={widgetId}
            title="Lead per Setter (Top 5)"
            icon={Users}
            onRemove={isEditMode ? () => handleRemoveWidget(widgetId) : null}
            onConfig={isEditMode ? () => handleConfigWidget(widgetId) : null}
          >
            <div className="space-y-2">
              {topLeadSetters.map(s => (
                <div key={s.uid} className="p-2 bg-slate-900/40 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-100 text-sm">{s.name}</p>
                    <span className="text-blue-400 font-bold">{s.total}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {leadStatuses.map(status => {
                      const count = s[status.id] || 0;
                      const percentage = s.total > 0 ? ((count / s.total) * 100).toFixed(0) : 0;
                      return (
                        <div key={status.id} className="text-[10px]">
                          <span className={`text-${status.color}-400 font-bold`}>{count}</span>
                          <span className="text-slate-500"> {status.label} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </DashboardWidget>
        );

      case WIDGET_TYPES.SALES_CHART:
        const chartData = {
          labels: ['Fissate', 'Fatte', 'Offers', 'Chiuse'],
          datasets: [{
            label: 'Vendita',
            data: [salesStats.fissate, salesStats.fatte, salesStats.offers, salesStats.chiuse],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
          }],
        };
        return (
          <DashboardWidget
            id={widgetId}
            title="Grafico Vendita"
            icon={BarChart3}
            onRemove={isEditMode ? () => handleRemoveWidget(widgetId) : null}
            onConfig={isEditMode ? () => handleConfigWidget(widgetId) : null}
          >
            <Bar 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                  x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                }
              }} 
            />
          </DashboardWidget>
        );

      case WIDGET_TYPES.SETTER_PERFORMANCE:
        // Mostra top 6 setter per conversion rate
        const topPerformers = leadsBySetter
          .map(s => ({
            ...s,
            conversionRate: s.total > 0 ? (s.chiuso / s.total) * 100 : 0
          }))
          .sort((a, b) => b.conversionRate - a.conversionRate)
          .slice(0, 6);
        
        return (
          <DashboardWidget
            id={widgetId}
            title="Performance Setter (Top 6)"
            icon={TrendingUp}
            onRemove={isEditMode ? () => handleRemoveWidget(widgetId) : null}
            onConfig={isEditMode ? () => handleConfigWidget(widgetId) : null}
          >
            <div className="space-y-2">
              {topPerformers.map(s => {
                const conversionRate = s.total > 0 ? ((s.chiuso / s.total) * 100).toFixed(1) : 0;
                return (
                  <div key={s.uid} className="flex items-center justify-between p-2 bg-slate-900/40 rounded-lg border border-slate-700">
                    <span className="text-slate-100 text-sm">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 font-bold">{s.total} lead</span>
                      <span className="text-emerald-400 text-sm">{conversionRate}% conv</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardWidget>
        );
      
      case WIDGET_TYPES.CUSTOM_FIELDS:
        return (
          <DashboardWidget
            id={widgetId}
            title="Campi Personalizzati"
            icon={Layout}
            onRemove={isEditMode ? () => handleRemoveWidget(widgetId) : null}
            onConfig={isEditMode ? () => handleConfigWidget(widgetId) : null}
          >
            <CustomFieldsWidget leads={leads} />
          </DashboardWidget>
        );

      default:
        // Controlla se è un widget personalizzato
        const customWidget = customWidgets.find(w => w.id === widgetId);
        if (customWidget) {
          return renderCustomWidget(customWidget);
        }
        return null;
    }
  };

  // Rendering widget personalizzato
  const renderCustomWidget = (widget) => {
    const metricsMap = {
      total_leads: { label: 'Lead Totali', value: leads.length, color: 'blue' },
      leads_today: { 
        label: 'Lead Oggi', 
        value: leads.filter(l => l.createdAt?.startsWith(new Date().toISOString().split('T')[0])).length,
        color: 'green'
      },
      leads_week: { 
        label: 'Lead Settimana', 
        value: leads.filter(l => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(l.createdAt) >= weekAgo;
        }).length,
        color: 'cyan'
      },
      show_up: { label: 'Show Up', value: leads.filter(l => l.showUp).length, color: 'emerald' },
      chiuso: { label: 'Chiusi', value: leads.filter(l => l.chiuso).length, color: 'rose' },
      conversion_rate: { 
        label: 'Conversione', 
        value: leads.length > 0 ? `${((leads.filter(l => l.chiuso).length / leads.length) * 100).toFixed(1)}%` : '0%',
        color: 'purple'
      },
      avg_response_time: { 
        label: 'Tempo Medio Risposta', 
        value: '2.4h', // Placeholder
        color: 'amber'
      },
    };

    return (
      <DashboardWidget
        id={widget.id}
        title={widget.name}
        icon={Target}
        onRemove={isEditMode ? () => handleRemoveWidget(widget.id) : null}
        onConfig={isEditMode ? () => handleConfigWidget(widget.id) : null}
      >
        <div className="grid grid-cols-1 gap-3">
          {widget.metrics.map(metricId => {
            const metric = metricsMap[metricId];
            if (!metric) return null;
            return (
              <div key={metricId} className={`p-3 rounded-lg bg-${metric.color}-500/10 border border-${metric.color}-500/30`}>
                <p className={`text-2xl font-bold text-${metric.color}-400`}>{metric.value}</p>
                <p className="text-xs text-slate-400 mt-1">{metric.label}</p>
              </div>
            );
          })}
        </div>
      </DashboardWidget>
    );
  };

  const handleRemoveWidget = (widgetId) => {
    if (confirm('Rimuovere questo widget dalla dashboard?')) {
      setVisibleWidgets(visibleWidgets.filter(w => w !== widgetId));
    }
  };
  
  const handleConfigWidget = (widgetId) => {
    const widgetName = Object.entries(WIDGET_TYPES)
      .find(([_, id]) => id === widgetId)?.[0]
      ?.replace(/_/g, ' ') || widgetId;
    setWidgetConfigModal({ show: true, widgetId, widgetName });
  };

  const handleAddWidget = (widgetId) => {
    if (!visibleWidgets.includes(widgetId)) {
      setVisibleWidgets([...visibleWidgets, widgetId]);
    }
  };

  const handleLayoutChange = (newLayout, allLayouts) => {
    setLayouts(allLayouts);
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Caricamento...</div>;
  if (!isAdmin) return null;

  // Widget predefiniti + custom disponibili
  const standardWidgets = Object.entries(WIDGET_TYPES)
    .filter(([_, id]) => !visibleWidgets.includes(id))
    .map(([name, id]) => ({ name: name.replace(/_/g, ' '), id }));
  
  const customWidgetsAvailable = customWidgets
    .filter(w => !visibleWidgets.includes(w.id))
    .map(w => ({ name: w.name, id: w.id }));
  
  const availableWidgets = [...standardWidgets, ...customWidgetsAvailable];

  return (
    <div className="p-2 sm:p-3 max-w-[1800px] mx-auto space-y-2 sm:space-y-3 mobile-safe-bottom">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Layout size={20} /> Dashboard Statistiche
        </h1>
        
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {/* Date filters */}
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="px-2 py-1.5 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
          />
          <span className="text-slate-400 text-xs">→</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="px-2 py-1.5 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
          />
          
          <button 
            onClick={() => {
              const d = new Date(); d.setDate(d.getDate() - 6);
              setStartDate(d.toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }}
            className="px-2 py-1.5 bg-blue-600 text-white preserve-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm whitespace-nowrap"
          >
            Ultimi 7 giorni
          </button>
          
          <div className="w-px h-8 bg-slate-700 hidden sm:block" />
          
          {/* Layout controls */}
          <button
            onClick={() => setShowStatusConfig(true)}
            className="px-2 py-1.5 bg-purple-600 text-white preserve-white rounded-lg hover:bg-purple-700 text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Config Status</span>
          </button>
          
          <button
            onClick={() => setShowCustomWidgetCreator(true)}
            className="px-2 py-1.5 bg-cyan-600 text-white preserve-white rounded-lg hover:bg-cyan-700 text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Crea Widget</span>
          </button>
          
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-2 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 ${
              isEditMode 
                ? 'bg-emerald-600 text-white preserve-white hover:bg-emerald-700' 
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }`}
          >
            <Layout size={14} />
            {isEditMode ? 'Fine Modifica' : 'Modifica Layout'}
          </button>
          
          {isEditMode && (
            <>
              <button
                onClick={saveLayout}
                className="px-2 py-1.5 bg-blue-600 text-white preserve-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm flex items-center gap-1.5"
              >
                <Save size={14} />
                Salva
              </button>
              <button
                onClick={resetLayout}
                className="px-2 py-1.5 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 text-xs sm:text-sm flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit mode info */}
      {isEditMode && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
          <p className="text-xs sm:text-sm text-blue-300">
            🎨 <strong>Modalità modifica attiva:</strong> Trascina i widget per riorganizzarli, ridimensionali dagli angoli, o rimuovili con la X.
          </p>
        </div>
      )}

      {/* Add widget buttons */}
      {isEditMode && availableWidgets.length > 0 && (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-2 sm:p-3">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Plus size={14} />
            Aggiungi Widget
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {availableWidgets.map(widget => (
              <button
                key={widget.id}
                onClick={() => handleAddWidget(widget.id)}
                className="px-2 py-1.5 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 text-xs sm:text-sm flex items-center gap-1.5"
              >
                <Plus size={12} />
                {widget.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 12, sm: 12 }}
        rowHeight={60}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".drag-handle"
      >
        {visibleWidgets.map(widgetId => (
          <div key={widgetId}>
            {renderWidget(widgetId)}
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Status Config Modal */}
      {showStatusConfig && (
        <LeadStatusConfig
          onClose={() => setShowStatusConfig(false)}
          onSave={(newStatuses) => {
            setLeadStatuses(newStatuses.filter(s => s.enabled));
            setShowStatusConfig(false);
          }}
        />
      )}
      
      {/* Widget Content Config Modal */}
      {widgetConfigModal.show && (
        <WidgetContentConfig
          widgetId={widgetConfigModal.widgetId}
          widgetName={widgetConfigModal.widgetName}
          onClose={() => setWidgetConfigModal({ show: false, widgetId: '', widgetName: '' })}
          onSave={() => {
            setWidgetConfigModal({ show: false, widgetId: '', widgetName: '' });
            // Trigger re-render per applicare nuove configurazioni
            setVisibleWidgets([...visibleWidgets]);
          }}
        />
      )}
      
      {/* Custom Widget Creator Modal */}
      {showCustomWidgetCreator && (
        <CustomWidgetCreator
          onClose={() => setShowCustomWidgetCreator(false)}
          onSave={(newWidget) => {
            // Aggiungi il nuovo widget alla lista
            setCustomWidgets(prev => [...prev, newWidget]);
            // Aggiungi alla visibleWidgets se non già presente
            if (!visibleWidgets.includes(newWidget.id)) {
              setVisibleWidgets(prev => [...prev, newWidget.id]);
            }
            setShowCustomWidgetCreator(false);
          }}
        />
      )}
    </div>
  );
}
