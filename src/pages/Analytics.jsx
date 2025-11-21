// src/pages/Analytics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, collectionGroup, onSnapshot, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth, toDate } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, UserCheck, UserX, 
  Clock, Target, BarChart3, Activity, Calendar, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import RevenueChart from '../components/RevenueChart';
import RetentionChart from '../components/RetentionChart';

// Stat Card Component
const StatCard = ({ title, value, icon, trend, trendValue, isCurrency = false, isPercentage = false, subtitle }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/60 backdrop-blur-sm p-5 rounded-xl border border-slate-700 shadow-xl"
    >
      <div className="flex items-center gap-3 text-slate-400 mb-3">
        {React.cloneElement(icon, { size: 20 })}
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-3xl font-bold text-slate-100 mb-2">
        {isCurrency 
          ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value) 
          : isPercentage ? `${value}%` : value
        }
      </p>
      {subtitle && <p className="text-xs text-slate-400 mb-2">{subtitle}</p>}
      {trendValue && TrendIcon && (
        <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          <TrendIcon size={16} />
          <span>{trendValue}</span>
        </div>
      )}
    </motion.div>
  );
};

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [checks, setChecks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // month, quarter, year

  // Check role
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin' && role !== 'superadmin') {
      signOut(auth).then(() => navigate('/login')).catch(console.error);
      return;
    }
  }, [navigate]);

  // Fetch clients
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), (snap) => {
      const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);
    });
    return () => unsub();
  }, []);

  // Fetch all payments
  useEffect(() => {
    const unsub = onSnapshot(query(collectionGroup(db, 'payments'), orderBy('paymentDate', 'desc')), 
      async (snap) => {
        const paymentsList = [];
        for (const docSnap of snap.docs) {
          const paymentData = docSnap.data();
          const clientId = docSnap.ref.parent.parent.id;
          const clientDoc = await getDoc(doc(db, 'clients', clientId));
          
          if (clientDoc.exists() && !clientDoc.data().isOldClient && !paymentData.isPast) {
            paymentsList.push({
              id: docSnap.id,
              clientId,
              clientName: clientDoc.data().name || 'Cliente',
              ...paymentData
            });
          }
        }
        setPayments(paymentsList);
      }
    );
    return () => unsub();
  }, []);

  // Fetch all checks
  useEffect(() => {
    const unsub = onSnapshot(query(collectionGroup(db, 'checks'), orderBy('createdAt', 'desc')),
      async (snap) => {
        const checksList = [];
        for (const docSnap of snap.docs) {
          const checkData = docSnap.data();
          const clientId = docSnap.ref.parent.parent.id;
          checksList.push({
            id: docSnap.id,
            clientId,
            createdAt: checkData.createdAt
          });
        }
        setChecks(checksList);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Fetch messages for response time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'chats'), async (snap) => {
      const messagesList = [];
      for (const chatDoc of snap.docs) {
        const messagesSnap = await getDocs(
          query(collection(db, 'chats', chatDoc.id, 'messages'), orderBy('timestamp', 'desc'))
        );
        messagesSnap.docs.forEach(msgDoc => {
          messagesList.push({
            chatId: chatDoc.id,
            ...msgDoc.data()
          });
        });
      }
      setMessages(messagesList);
    });
    return () => unsub();
  }, []);

  // Calculate date ranges based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    let start, previousStart;
    
    if (selectedPeriod === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (selectedPeriod === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      previousStart = new Date(now.getFullYear(), quarter * 3 - 3, 1);
    } else { // year
      start = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
    }
    
    return { start, previousStart, now };
  }, [selectedPeriod]);

  // Revenue Metrics
  const revenueMetrics = useMemo(() => {
    const currentRevenue = payments
      .filter(p => {
        const date = toDate(p.paymentDate);
        return date >= dateRange.start && date <= dateRange.now;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const previousRevenue = payments
      .filter(p => {
        const date = toDate(p.paymentDate);
        return date >= dateRange.previousStart && date < dateRange.start;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const activeClients = clients.filter(c => {
      const expiry = toDate(c.scadenza);
      return expiry && expiry > dateRange.now;
    }).length;

    const mrr = payments
      .filter(p => {
        const date = toDate(p.paymentDate);
        const monthAgo = new Date(dateRange.now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo && date <= dateRange.now;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const arpu = activeClients > 0 ? currentRevenue / activeClients : 0;

    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    return {
      currentRevenue,
      previousRevenue,
      mrr,
      arpu,
      revenueChange,
      trend: currentRevenue >= previousRevenue ? 'up' : 'down'
    };
  }, [payments, clients, dateRange]);

  // Retention Metrics
  const retentionMetrics = useMemo(() => {
    const now = dateRange.now;
    const activeClients = clients.filter(c => {
      const expiry = toDate(c.scadenza);
      return expiry && expiry > now;
    });

    const expiredClients = clients.filter(c => {
      const expiry = toDate(c.scadenza);
      return expiry && expiry <= now;
    });

    const retentionRate = clients.length > 0 
      ? Math.round((activeClients.length / clients.length) * 100)
      : 0;

    const churnRate = clients.length > 0
      ? Math.round((expiredClients.length / clients.length) * 100)
      : 0;

    // Clients expiring in next 15 days
    const atRiskClients = clients.filter(c => {
      const expiry = toDate(c.scadenza);
      if (!expiry) return false;
      const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
      return daysLeft <= 15 && daysLeft > 0;
    });

    // Calculate LTV (simplified: average total payments per client)
    const clientPaymentTotals = {};
    payments.forEach(p => {
      if (!clientPaymentTotals[p.clientId]) {
        clientPaymentTotals[p.clientId] = 0;
      }
      clientPaymentTotals[p.clientId] += p.amount || 0;
    });

    const ltv = Object.keys(clientPaymentTotals).length > 0
      ? Object.values(clientPaymentTotals).reduce((sum, total) => sum + total, 0) / 
        Object.keys(clientPaymentTotals).length
      : 0;

    return {
      activeClients: activeClients.length,
      expiredClients: expiredClients.length,
      retentionRate,
      churnRate,
      atRiskCount: atRiskClients.length,
      atRiskClients,
      ltv
    };
  }, [clients, payments, dateRange]);

  // Engagement Metrics
  const engagementMetrics = useMemo(() => {
    const thirtyDaysAgo = new Date(dateRange.now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Check-in frequency
    const recentChecks = checks.filter(check => {
      const date = toDate(check.createdAt);
      return date >= thirtyDaysAgo;
    });

    const clientCheckCounts = {};
    recentChecks.forEach(check => {
      clientCheckCounts[check.clientId] = (clientCheckCounts[check.clientId] || 0) + 1;
    });

    const avgChecksPerClient = Object.keys(clientCheckCounts).length > 0
      ? Object.values(clientCheckCounts).reduce((sum, count) => sum + count, 0) / 
        Object.keys(clientCheckCounts).length
      : 0;

    // Response time (simplified: time between client message and admin response)
    const adminMessages = messages.filter(m => m.senderId && !m.clientMessage);
    const clientMessages = messages.filter(m => m.clientMessage);
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    clientMessages.forEach(clientMsg => {
      const clientTime = toDate(clientMsg.timestamp);
      const laterAdminMsg = adminMessages.find(adminMsg => {
        const adminTime = toDate(adminMsg.timestamp);
        return adminMsg.chatId === clientMsg.chatId && 
               adminTime > clientTime &&
               (adminTime - clientTime) < 24 * 60 * 60 * 1000; // within 24 hours
      });
      
      if (laterAdminMsg) {
        const responseTime = toDate(laterAdminMsg.timestamp) - clientTime;
        totalResponseTime += responseTime;
        responseCount++;
      }
    });

    const avgResponseTimeHours = responseCount > 0
      ? Math.round(totalResponseTime / responseCount / (1000 * 60 * 60) * 10) / 10
      : 0;

    return {
      avgChecksPerClient: Math.round(avgChecksPerClient * 10) / 10,
      totalChecks: recentChecks.length,
      avgResponseTimeHours
    };
  }, [checks, messages, dateRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Analytics Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">Panoramica metriche business e performance</p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {['month', 'quarter', 'year'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {period === 'month' ? 'Mese' : period === 'quarter' ? 'Trimestre' : 'Anno'}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <DollarSign size={24} className="text-green-400" />
            Revenue Tracking
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Revenue Totale"
              value={revenueMetrics.currentRevenue}
              icon={<DollarSign className="text-green-400" />}
              trend={revenueMetrics.trend}
              trendValue={`${revenueMetrics.revenueChange}% vs periodo precedente`}
              isCurrency
            />
            <StatCard
              title="MRR (Monthly Recurring)"
              value={revenueMetrics.mrr}
              icon={<TrendingUp className="text-blue-400" />}
              subtitle="Ultimi 30 giorni"
              isCurrency
            />
            <StatCard
              title="ARPU"
              value={revenueMetrics.arpu}
              icon={<Target className="text-purple-400" />}
              subtitle="Average Revenue Per User"
              isCurrency
            />
            <StatCard
              title="Crescita Revenue"
              value={revenueMetrics.revenueChange}
              icon={<BarChart3 className="text-cyan-400" />}
              isPercentage
              subtitle="vs periodo precedente"
            />
          </div>
          <RevenueChart payments={payments} selectedPeriod={selectedPeriod} />
        </div>

        {/* Retention Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Users size={24} className="text-blue-400" />
            Client Retention
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Clienti Attivi"
              value={retentionMetrics.activeClients}
              icon={<UserCheck className="text-green-400" />}
              subtitle={`${retentionMetrics.expiredClients} scaduti`}
            />
            <StatCard
              title="Retention Rate"
              value={retentionMetrics.retentionRate}
              icon={<Target className="text-blue-400" />}
              isPercentage
            />
            <StatCard
              title="Churn Rate"
              value={retentionMetrics.churnRate}
              icon={<UserX className="text-red-400" />}
              isPercentage
            />
            <StatCard
              title="Lifetime Value"
              value={retentionMetrics.ltv}
              icon={<DollarSign className="text-purple-400" />}
              subtitle="Media per cliente"
              isCurrency
            />
          </div>
          <RetentionChart clients={clients} />
        </div>

        {/* Engagement Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity size={24} className="text-yellow-400" />
            Engagement Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Check-in per Cliente"
              value={engagementMetrics.avgChecksPerClient}
              icon={<Calendar className="text-cyan-400" />}
              subtitle="Media ultimi 30 giorni"
            />
            <StatCard
              title="Total Check-ins"
              value={engagementMetrics.totalChecks}
              icon={<Activity className="text-green-400" />}
              subtitle="Ultimi 30 giorni"
            />
            <StatCard
              title="Tempo Risposta Medio"
              value={engagementMetrics.avgResponseTimeHours}
              icon={<Clock className="text-orange-400" />}
              subtitle="Ore per rispondere"
            />
          </div>
        </div>

        {/* At Risk Clients */}
        {retentionMetrics.atRiskCount > 0 && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <UserX size={24} />
              Clienti a Rischio ({retentionMetrics.atRiskCount})
            </h2>
            <p className="text-slate-300 mb-4">
              Questi clienti hanno abbonamenti in scadenza nei prossimi 15 giorni
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {retentionMetrics.atRiskClients.map(client => {
                const daysLeft = Math.ceil((toDate(client.scadenza) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <button
                    key={client.id}
                    onClick={() => navigate(`/client/${client.id}?tab=payments`)}
                    className="bg-slate-800/60 p-4 rounded-lg text-left hover:bg-slate-800 transition-colors"
                  >
                    <p className="font-semibold text-slate-200">{client.name}</p>
                    <p className="text-sm text-red-400 mt-1">Scade tra {daysLeft} giorni</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
