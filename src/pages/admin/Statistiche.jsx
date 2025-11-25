import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
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
import { 
  TrendingUp, Calendar, Phone, MessageSquare, 
  Target, DollarSign, BarChart3, UserCheck, Users
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Statistiche() {
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
  const [setterMap, setSetterMap] = useState({}); // uid → name

  // --- ADMIN ---
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

  // --- CARICA SETTER + MAPPA ---
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

  // --- CARICA REPORT E LEADS ---
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

  // --- LEAD PER SETTER ---
  const leadsBySetter = useMemo(() => {
    const agg = {};
    leads.forEach(l => {
      const uid = l.collaboratoreId || 'unknown';
      const name = setterMap[uid] || l.collaboratoreNome || 'Sconosciuto';

      if (!agg[uid]) {
        agg[uid] = { uid, name, total: 0, showUp: 0, chiuso: 0 };
      }
      agg[uid].total++;
      if (l.showUp) agg[uid].showUp++;
      if (l.chiuso) agg[uid].chiuso++;
    });
    return Object.values(agg).sort((a, b) => b.total - a.total);
  }, [leads, setterMap]);

  // --- DMS TRACKER ---
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

  // Total setter statistics (currently not displayed, reserved for future use)
  // const setterTotal = useMemo(() => {
  //   return aggregatedBySetter.reduce((acc, s) => ({
  //     outreach: acc.outreach + s.outreachTotale,
  //     followUps: acc.followUps + s.followUpsTotali,
  //     risposte: acc.risposte + s.risposte,
  //     callPrenotate: acc.callPrenotate + s.callPrenotate,
  //   }), { outreach: 0, followUps: 0, risposte: 0, callPrenotate: 0 });
  // }, [aggregatedBySetter]);

  // --- VENDITA & SETTING ---
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

  // --- LEAD TOTALI (aggregati da tutte le fonti) ---
  const totalLeads = useMemo(() => {
    // Leads dalla collezione leads
    const leadsFromCollection = leads.length;
    
    // Leads dai report setter (callPrenotate)
    const leadsFromSetters = settingReports.reduce((acc, r) => 
      acc + (parseInt(r.chiamatePrenotate) || 0), 0
    );
    
    // Leads dai report venditori (callFissate)
    const leadsFromSales = salesReports.reduce((acc, r) => 
      acc + (parseInt(r.callFissate) || 0), 0
    );
    
    return leadsFromCollection + leadsFromSetters + leadsFromSales;
  }, [leads, settingReports, salesReports]);
  
  const showUpTotal = leads.filter(l => l.showUp).length;
  const chiusoTotal = leads.filter(l => l.chiuso).length;

  if (loading) return <div className="p-6 text-center text-slate-400">Caricamento...</div>;
  if (!isAdmin) return null;

  return (
    <div className="p-2 sm:p-3 max-w-7xl mx-auto space-y-2 sm:space-y-3 mobile-safe-bottom">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 size={20} /> Statistiche Complete
        </h1>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="px-2 py-1.5 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-xs flex-1 sm:flex-none" />
          <span className="text-slate-400 text-xs">→</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="px-2 py-1.5 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-xs flex-1 sm:flex-none" />
          <button onClick={() => {
            const d = new Date(); d.setDate(d.getDate() - 6);
            setStartDate(d.toISOString().split('T')[0]);
            setEndDate(new Date().toISOString().split('T')[0]);
          }} className="px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs whitespace-nowrap">
            Ultimi 7 giorni
          </button>
        </div>
      </div>

      {/* LEAD TOTALI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400">Lead Totali</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-300">{totalLeads}</p>
            </div>
            <Users size={24} className="sm:w-7 sm:h-7 text-amber-400" />
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400">Show-Up</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-300">{showUpTotal}</p>
            </div>
            <UserCheck size={24} className="sm:w-7 sm:h-7 text-emerald-400" />
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-400">Chiusi</p>
              <p className="text-2xl sm:text-3xl font-bold text-rose-300">{chiusoTotal}</p>
            </div>
            <DollarSign size={24} className="sm:w-7 sm:h-7 text-rose-400" />
          </div>
        </div>
      </div>

      {/* VENDITA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6">
        {[
          { label: 'Call Fissate', value: salesStats.fissate, color: 'text-amber-300' },
          { label: 'Call Fatte', value: salesStats.fatte, color: 'text-green-300' },
          { label: 'Show-Up', value: `${salesStats.showUpRate}%`, color: 'text-emerald-300' },
          { label: 'Warm', value: `${salesStats.warmRate}%`, color: 'text-yellow-300' },
          { label: 'Close', value: `${salesStats.closeRate}%`, color: 'text-rose-300' },
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-slate-700">
            <p className="text-xs sm:text-sm text-slate-400 truncate">{kpi.label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${kpi.color} truncate`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* SETTING */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {[
          { label: 'Dialed', value: settingStats.dialed, color: 'text-blue-300' },
          { label: 'Risposte', value: `${settingStats.risposteRate}%`, color: 'text-cyan-300' },
          { label: 'Follow-Ups', value: settingStats.followUps, color: 'text-green-300' },
          { label: 'Prenotate', value: `${settingStats.prenotateRate}%`, color: 'text-rose-300' },
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-slate-700">
            <p className="text-xs sm:text-sm text-slate-400 truncate">{kpi.label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${kpi.color} truncate`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* LEAD PER SETTER */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Users size={24} className="sm:w-7 sm:h-7" /> Lead per Setter
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {leadsBySetter.map((s, i) => (
            <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-slate-300">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-100 truncate">{s.name}</h3>
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lead Totali</span>
                  <span className="font-bold text-amber-300">{s.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Show-Up</span>
                  <span className="font-bold text-emerald-300">{s.showUp} ({s.total > 0 ? ((s.showUp / s.total) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chiusi</span>
                  <span className="font-bold text-rose-300">{s.chiuso} ({s.total > 0 ? ((s.chiuso / s.total) * 100).toFixed(1) : 0}%)</span>
                </div>
              </div>
            </div>
          ))}
          {leadsBySetter.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-400 text-sm">Nessun lead nel periodo</div>
          )}
        </div>
      </div>

      {/* DMS TRACKER - 4 TABELLE DI CONFRONTO */}
      <div className="space-y-4 sm:space-y-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Target size={24} className="sm:w-7 sm:h-7" /> DMS Tracker - Confronto
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            { title: 'Outreach Totale', key: 'outreachTotale', color: 'text-amber-300', icon: MessageSquare },
            { title: 'Follow-Ups', key: 'followUpsTotali', color: 'text-green-300', icon: Phone },
            { title: 'Risposte', key: 'risposte', color: 'text-cyan-300', icon: UserCheck },
            { title: 'Call Prenotate', key: 'callPrenotate', color: 'text-rose-300', icon: Target },
          ].map((table, i) => (
            <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-slate-700">
              <h3 className="text-sm sm:text-lg font-semibold text-slate-100 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                <table.icon size={16} className="sm:w-5 sm:h-5" /> <span className="truncate">{table.title}</span>
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {aggregatedBySetter.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center">Nessun dato</p>
                ) : (
                  aggregatedBySetter
                    .sort((a, b) => b[table.key] - a[table.key])
                    .slice(0, 5)
                    .map((s, j) => (
                      <div key={j} className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-300 truncate max-w-[120px] sm:max-w-[150px]">{s.name}</span>
                        <span className={`font-bold ${table.color} whitespace-nowrap ml-2`}>{s[table.key]}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* TABELLA COMPLETA DMS */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-slate-700">
          <h3 className="text-sm sm:text-lg font-semibold text-slate-200 mb-3 sm:mb-4">Tabella Completa DMS</h3>
          <div className="mobile-table-wrapper relative -mx-3 sm:mx-0">
            <table className="w-full text-xs sm:text-sm text-left min-w-[500px]">
              <thead className="text-[10px] sm:text-xs uppercase bg-slate-900/50">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3">Setter</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Out</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center hidden sm:table-cell">Follow-Up</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Risp</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Call</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedBySetter.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">Nessun dato DMS</td></tr>
                ) : (
                  aggregatedBySetter.map((s, i) => (
                    <tr key={i} className="border-t border-slate-700 hover:bg-slate-700/30">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-1 sm:gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-300">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-100 text-xs sm:text-sm truncate">{s.name}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-amber-300 font-bold text-xs sm:text-sm">{s.outreachTotale}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-green-300 font-bold text-xs sm:text-sm hidden sm:table-cell">{s.followUpsTotali}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-cyan-300 font-bold text-xs sm:text-sm">{s.risposte}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-rose-300 font-bold text-xs sm:text-sm">{s.callPrenotate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}