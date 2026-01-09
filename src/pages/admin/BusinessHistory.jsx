import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, toDate } from "../../firebase";
import { getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { useFirestoreSnapshot } from '../../hooks/useFirestoreOptimized';
import { useCachedQuery } from '../../hooks/useDataCache';
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePageInfo } from '../../contexts/PageContext';
import {
  ArrowLeft, BarChart3, Users, DollarSign, RefreshCw, UserPlus,
  UserMinus, Archive, ClipboardCheck, FileText, TrendingUp, TrendingDown,
  Calendar, ChevronRight, ChevronDown, Eye, EyeOff, Filter,
  XCircle
} from 'lucide-react';

// ============ COMPONENTI UI ============

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="min-h-screen px-4 py-4 space-y-4">
    <div className="h-12 w-48 bg-slate-700/50 rounded-lg animate-pulse" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-700/50 rounded-xl animate-pulse" />
      ))}
    </div>
    <div className="h-64 bg-slate-700/50 rounded-2xl animate-pulse" />
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-20 bg-slate-700/50 rounded-xl animate-pulse" />
      ))}
    </div>
  </div>
);

// Stat Card Hero - Card grande per metriche principali
const StatCardHero = ({ 
  title, value, icon: Icon, color = 'blue', showValue = true, prefix = '' 
}) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20 text-rose-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
  };

  const iconBgClasses = {
    blue: 'bg-blue-500/20',
    green: 'bg-emerald-500/20',
    amber: 'bg-amber-500/20',
    rose: 'bg-rose-500/20',
    purple: 'bg-purple-500/20',
    cyan: 'bg-cyan-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm p-4`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
          <Icon size={18} className={colorClasses[color].split(' ').pop()} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
        {showValue ? `${prefix}${typeof value === 'number' ? value.toLocaleString('it-IT') : value}` : '•••'}
      </p>
      <p className="text-xs text-slate-400">{title}</p>
    </motion.div>
  );
};

// Stat Card Mini
const StatCardMini = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/20',
    green: 'text-emerald-400 bg-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/20',
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm p-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]} flex-shrink-0`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white">{typeof value === 'number' ? value.toLocaleString('it-IT') : value}</p>
          <p className="text-[10px] text-slate-500 truncate">{title}</p>
        </div>
      </div>
    </div>
  );
};

// Month Card
const MonthCard = ({ monthKey, stats, isSelected, onClick, isExpanded }) => {
  const monthDate = new Date(monthKey.split('-')[0], parseInt(monthKey.split('-')[1]) - 1);
  const monthName = monthDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-xl border transition-all ${
        isSelected 
          ? 'bg-slate-800/50 border-blue-500/30' 
          : 'bg-slate-800/20 border-slate-700/30 hover:border-slate-600/50'
      }`}
    >
      <div 
        onClick={onClick}
        className="flex items-center justify-between p-4 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500/20' : 'bg-slate-700/50'}`}>
            <Calendar size={18} className={isSelected ? 'text-blue-400' : 'text-slate-400'} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white capitalize">{monthName}</h3>
            {stats && (
              <p className="text-xs text-slate-400">
                {stats.newClients} nuovi • €{stats.income.toLocaleString('it-IT')} incassati
              </p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-slate-400" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && stats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-700/30">
              {/* Incassi Separati */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus size={14} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium">NUOVI CLIENTI</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">€{(stats.newClientsRevenue || 0).toLocaleString('it-IT')}</p>
                </div>
                <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw size={14} className="text-cyan-400" />
                    <span className="text-[10px] text-cyan-400 font-medium">RINNOVI</span>
                  </div>
                  <p className="text-xl font-bold text-cyan-400">€{(stats.renewalsRevenue || 0).toLocaleString('it-IT')}</p>
                </div>
              </div>

              {/* Totale Entrate e Uscite */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-500/10 rounded-lg p-2.5 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-blue-400">Totale Entrate</span>
                    <span className="text-sm font-bold text-blue-400">€{stats.income.toLocaleString('it-IT')}</span>
                  </div>
                </div>
                <div className="bg-rose-500/10 rounded-lg p-2.5 border border-rose-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-rose-400">Uscite</span>
                    <span className="text-sm font-bold text-rose-400">€{(stats.expenses || 0).toLocaleString('it-IT')}</span>
                  </div>
                </div>
              </div>

              {/* Net Revenue */}
              <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Profitto Netto</span>
                  <span className={`text-lg font-bold ${(stats.income - (stats.expenses || 0)) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    €{(stats.income - (stats.expenses || 0)).toLocaleString('it-IT')}
                  </span>
                </div>
              </div>

              {/* Client Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="bg-slate-900/30 rounded-lg p-2.5 text-center">
                  <UserPlus size={16} className="text-emerald-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{stats.newClients}</p>
                  <p className="text-[9px] text-slate-500">Nuovi Clienti</p>
                </div>
                <div className="bg-slate-900/30 rounded-lg p-2.5 text-center">
                  <RefreshCw size={16} className="text-cyan-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{stats.renewals}</p>
                  <p className="text-[9px] text-slate-500">Rinnovati</p>
                </div>
                <div className="bg-slate-900/30 rounded-lg p-2.5 text-center">
                  <XCircle size={16} className="text-rose-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{stats.expired || 0}</p>
                  <p className="text-[9px] text-slate-500">Scaduti</p>
                </div>
                <div className="bg-slate-900/30 rounded-lg p-2.5 text-center">
                  <Archive size={16} className="text-slate-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{stats.archived || 0}</p>
                  <p className="text-[9px] text-slate-500">Archiviati</p>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-slate-900/30 rounded-lg p-2.5">
                  <ClipboardCheck size={14} className="text-purple-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">{stats.checksSent || 0}</p>
                    <p className="text-[9px] text-slate-500">Check Inviati</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/30 rounded-lg p-2.5">
                  <FileText size={14} className="text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">{stats.anamnesiSent || 0}</p>
                    <p className="text-[9px] text-slate-500">Anamnesi Inviate</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Year Summary Card
const YearSummaryCard = ({ year, stats, showRevenue }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm"
  >
    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
    
    <div className="relative p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20">
            <BarChart3 size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Riepilogo {year}</h3>
            <p className="text-xs text-slate-400">Dati annuali aggregati</p>
          </div>
        </div>
      </div>

      <div className="text-center py-4 mb-4">
        <p className="text-4xl sm:text-5xl font-bold text-white mb-1">
          {showRevenue ? `€${stats.totalIncome.toLocaleString('it-IT')}` : '€ •••'}
        </p>
        <p className="text-sm text-slate-400">Revenue Totale</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/40 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{stats.totalNewClients}</p>
          <p className="text-[10px] text-slate-500">Nuovi Clienti</p>
        </div>
        <div className="bg-slate-900/40 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-cyan-400">{stats.totalRenewals}</p>
          <p className="text-[10px] text-slate-500">Rinnovi</p>
        </div>
        <div className="bg-slate-900/40 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-purple-400">{stats.totalChecks}</p>
          <p className="text-[10px] text-slate-500">Check Inviati</p>
        </div>
        <div className="bg-slate-900/40 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-amber-400">{stats.totalAnamnesi}</p>
          <p className="text-[10px] text-slate-500">Anamnesi</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Profitto Netto</span>
          <span className={`text-xl font-bold ${
            showRevenue 
              ? (stats.totalIncome - stats.totalExpenses) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              : 'text-slate-400'
          }`}>
            {showRevenue ? `€${(stats.totalIncome - stats.totalExpenses).toLocaleString('it-IT')}` : '•••'}
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

// Filter Pills
const FilterPills = ({ selectedYear, years, onYearChange }) => (
  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
    <button
      onClick={() => onYearChange(null)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        selectedYear === null
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:bg-slate-700/50'
      }`}
    >
      Tutti
    </button>
    {years.map(year => (
      <button
        key={year}
        onClick={() => onYearChange(year)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
          selectedYear === year
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:bg-slate-700/50'
        }`}
      >
        {year}
      </button>
    ))}
  </div>
);

// ============ MAIN COMPONENT ============

export default function BusinessHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [monthsData, setMonthsData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showRevenue, setShowRevenue] = useState(true);
  const [selectedYear, setSelectedYear] = useState(null);

  useDocumentTitle('Storico Business');
  usePageInfo({ pageTitle: 'Storico Business', pageSubtitle: 'Analisi storica del tuo business' });

  // Load clients and calculate monthly data
  useEffect(() => {
    const unsubClients = onSnapshot(getTenantCollection(db, 'clients'), async (snap) => {
      const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const monthData = {};

      const initMonth = (date) => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthData[key]) {
          monthData[key] = {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            income: 0,
            newClientsRevenue: 0,
            renewalsRevenue: 0,
            newClients: 0,
            renewals: 0,
            expired: 0,
            archived: 0,
            checksSent: 0,
            anamnesiSent: 0,
            expenses: 0
          };
        }
        return key;
      };

      clientList.forEach(client => {
        const startDate = toDate(client.startDate) || toDate(client.createdAt);
        if (startDate) {
          const key = initMonth(startDate);
          if (!client.isOldClient) {
            monthData[key].newClients++;
          }
        }

        const scadenza = toDate(client.scadenza) || toDate(client.endDate);
        if (scadenza && scadenza < new Date() && !client.archived && !client.isArchived) {
          const expKey = initMonth(scadenza);
          monthData[expKey].expired++;
        }

        if (client.archived || client.isArchived) {
          const archiveDate = toDate(client.archivedAt) || toDate(client.scadenza) || toDate(client.endDate);
          if (archiveDate) {
            const archKey = initMonth(archiveDate);
            monthData[archKey].archived++;
          }
        }
      });

      // OTTIMIZZATO: Batch processing per evitare troppi query simultanei
      const BATCH_SIZE = 10;
      const clientDataResults = [];
      
      for (let i = 0; i < clientList.length; i += BATCH_SIZE) {
        const batch = clientList.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(client => 
            Promise.all([
              getDocs(query(getTenantSubcollection(db, 'clients', client.id, 'payments'), limit(100))).catch(() => ({ docs: [] })),
              getDocs(query(getTenantSubcollection(db, 'clients', client.id, 'rates'), limit(50))).catch(() => ({ docs: [] })),
              getDocs(query(getTenantSubcollection(db, 'clients', client.id, 'checks'), limit(50))).catch(() => ({ docs: [] })),
              getDocs(query(getTenantSubcollection(db, 'clients', client.id, 'anamnesi'), limit(20))).catch(() => ({ docs: [] })),
              Promise.resolve(client)
            ])
          )
        );
        
        clientDataResults.push(...batchResults);
        
        // Pausa breve tra batch
        if (i + BATCH_SIZE < clientList.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const pagamentiDipendentiSnap = await getDocs(query(getTenantCollection(db, 'pagamenti_dipendenti'), limit(200))).catch(() => ({ docs: [] }));

      clientDataResults.forEach(([paymentsSnap, ratesSnap, checksSnap, anamnesiSnap, client]) => {
        const isOldClient = client.isOldClient === true;

        paymentsSnap.docs.forEach(paymentDoc => {
          const payment = paymentDoc.data();
          const isRenewal = payment.isRenewal === true;
          
          if (isOldClient && !isRenewal) return;

          const paymentDate = toDate(payment.paymentDate || payment.date || payment.createdAt);
          if (!paymentDate) return;

          const key = initMonth(paymentDate);
          const amount = parseFloat(payment.amount) || 0;

          monthData[key].income += amount;

          if (isRenewal) {
            monthData[key].renewalsRevenue += amount;
            monthData[key].renewals++;
          } else {
            monthData[key].newClientsRevenue += amount;
          }
        });

        ratesSnap.docs.forEach(rateDoc => {
          const rateData = rateDoc.data();
          if (!rateData.paid || !rateData.paidDate) return;

          const paidDate = toDate(rateData.paidDate);
          if (!paidDate) return;

          const key = initMonth(paidDate);
          const amount = parseFloat(rateData.amount) || 0;

          monthData[key].income += amount;

          if (rateData.isRenewal === true) {
            monthData[key].renewalsRevenue += amount;
          } else {
            monthData[key].newClientsRevenue += amount;
          }
        });

        (client.rate || []).forEach(rate => {
          if (rate.paid && rate.paidDate) {
            const rateDate = toDate(rate.paidDate);
            if (!rateDate) return;

            const key = initMonth(rateDate);
            const amount = parseFloat(rate.amount) || 0;

            monthData[key].income += amount;
            monthData[key].newClientsRevenue += amount;
          }
        });

        checksSnap.docs.forEach(checkDoc => {
          const check = checkDoc.data();
          const checkDate = toDate(check.createdAt || check.date);
          if (!checkDate) return;

          const key = initMonth(checkDate);
          monthData[key].checksSent++;
        });

        anamnesiSnap.docs.forEach(anamnesiDoc => {
          const anamnesi = anamnesiDoc.data();
          const anamnesiDate = toDate(anamnesi.submittedAt || anamnesi.createdAt || anamnesi.timestamp);
          if (!anamnesiDate) return;

          const key = initMonth(anamnesiDate);
          monthData[key].anamnesiSent++;
        });
      });

      pagamentiDipendentiSnap.docs.forEach(doc => {
        const pagamento = doc.data();
        const pagDate = pagamento.data?.toDate ? pagamento.data.toDate() : toDate(pagamento.data);
        if (!pagDate) return;

        const key = initMonth(pagDate);
        const importo = parseFloat(pagamento.importo) || 0;
        monthData[key].expenses += importo;
      });

      setMonthsData(monthData);
      setLoading(false);
    });

    return () => unsubClients();
  }, []);

  const { years, sortedMonths, yearStats } = useMemo(() => {
    const monthKeys = Object.keys(monthsData);
    const yearsSet = new Set(monthKeys.map(k => parseInt(k.split('-')[0])));
    const years = Array.from(yearsSet).sort((a, b) => b - a);

    const sortedMonths = monthKeys.sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      return yearB - yearA || monthB - monthA;
    });

    const yearStats = {};
    years.forEach(year => {
      yearStats[year] = {
        totalIncome: 0,
        totalExpenses: 0,
        totalNewClients: 0,
        totalRenewals: 0,
        totalChecks: 0,
        totalAnamnesi: 0,
        totalExpired: 0,
        totalArchived: 0
      };

      sortedMonths.forEach(monthKey => {
        if (monthKey.startsWith(String(year))) {
          const data = monthsData[monthKey];
          yearStats[year].totalIncome += data.income || 0;
          yearStats[year].totalExpenses += data.expenses || 0;
          yearStats[year].totalNewClients += data.newClients || 0;
          yearStats[year].totalRenewals += data.renewals || 0;
          yearStats[year].totalChecks += data.checksSent || 0;
          yearStats[year].totalAnamnesi += data.anamnesiSent || 0;
          yearStats[year].totalExpired += data.expired || 0;
          yearStats[year].totalArchived += data.archived || 0;
        }
      });
    });

    return { years, sortedMonths, yearStats };
  }, [monthsData]);

  const filteredMonths = useMemo(() => {
    if (!selectedYear) return sortedMonths;
    return sortedMonths.filter(m => m.startsWith(String(selectedYear)));
  }, [sortedMonths, selectedYear]);

  const globalStats = useMemo(() => {
    const stats = {
      totalIncome: 0,
      totalExpenses: 0,
      totalNewClients: 0,
      totalRenewals: 0,
      totalChecks: 0,
      totalAnamnesi: 0
    };

    Object.values(monthsData).forEach(data => {
      stats.totalIncome += data.income || 0;
      stats.totalExpenses += data.expenses || 0;
      stats.totalNewClients += data.newClients || 0;
      stats.totalRenewals += data.renewals || 0;
      stats.totalChecks += data.checksSent || 0;
      stats.totalAnamnesi += data.anamnesiSent || 0;
    });

    return stats;
  }, [monthsData]);

  const handleMonthClick = (monthKey) => {
    setSelectedMonth(selectedMonth === monthKey ? null : monthKey);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen px-4 py-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Dashboard</span>
        </button>
        <button
          onClick={() => setShowRevenue(!showRevenue)}
          className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 text-slate-400 hover:text-white transition-colors"
        >
          {showRevenue ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Storico Business</h1>
        <p className="text-sm text-slate-400 mt-1">Analisi completa delle performance del tuo business</p>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCardHero
          title="Revenue Totale"
          value={globalStats.totalIncome}
          prefix="€"
          icon={DollarSign}
          color="green"
          showValue={showRevenue}
        />
        <StatCardHero
          title="Nuovi Clienti"
          value={globalStats.totalNewClients}
          icon={UserPlus}
          color="blue"
        />
        <StatCardHero
          title="Rinnovi"
          value={globalStats.totalRenewals}
          icon={RefreshCw}
          color="cyan"
        />
        <StatCardHero
          title="Profitto Netto"
          value={globalStats.totalIncome - globalStats.totalExpenses}
          prefix="€"
          icon={TrendingUp}
          color={globalStats.totalIncome - globalStats.totalExpenses >= 0 ? 'green' : 'rose'}
          showValue={showRevenue}
        />
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCardMini title="Check Inviati" value={globalStats.totalChecks} icon={ClipboardCheck} color="purple" />
        <StatCardMini title="Anamnesi Inviate" value={globalStats.totalAnamnesi} icon={FileText} color="amber" />
      </div>

      {/* Year Filter */}
      {years.length > 1 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Filtra per anno</span>
          </div>
          <FilterPills years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} />
        </div>
      )}

      {/* Year Summary (if year selected) */}
      {selectedYear && yearStats[selectedYear] && (
        <YearSummaryCard year={selectedYear} stats={yearStats[selectedYear]} showRevenue={showRevenue} />
      )}

      {/* Monthly Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Dettaglio Mensile</h2>
          <span className="text-xs text-slate-500">({filteredMonths.length} mesi)</span>
        </div>

        <div className="space-y-3">
          {filteredMonths.length > 0 ? (
            filteredMonths.map(monthKey => (
              <MonthCard
                key={monthKey}
                monthKey={monthKey}
                stats={monthsData[monthKey]}
                isSelected={selectedMonth === monthKey}
                isExpanded={selectedMonth === monthKey}
                onClick={() => handleMonthClick(monthKey)}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-slate-700/30">
              <Calendar size={48} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nessun dato disponibile</p>
              <p className="text-xs text-slate-500 mt-1">I dati appariranno quando ci saranno pagamenti registrati</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}