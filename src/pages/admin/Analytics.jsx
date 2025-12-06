// src/pages/Analytics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth, toDate } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { signOut } from 'firebase/auth';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, UserCheck, UserX, 
  Clock, Target, BarChart3, Activity, Calendar, ArrowLeft, 
  BookOpen, GraduationCap, Trophy, Video, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import RevenueChart from '../../components/business/RevenueChart';
import RetentionChart from '../../components/business/RetentionChart';

// Stat Card Component
const StatCard = ({ title, value, icon, trend, trendValue, isCurrency = false, isPercentage = false, subtitle }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/40 backdrop-blur-sm p-5 rounded-xl border border-slate-700/50"
    >
      <div className="flex items-center gap-3 text-slate-400 mb-3">
        <div className="p-2 rounded-lg bg-slate-800/50">
          {React.cloneElement(icon, { size: 18 })}
        </div>
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-3xl font-bold text-white mb-2">
        {isCurrency 
          ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value) 
          : isPercentage ? `${value}%` : value
        }
      </p>
      {subtitle && <p className="text-xs text-slate-400 mb-2">{subtitle}</p>}
      {trendValue && TrendIcon && (
        <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
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
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activeTab, setActiveTab] = useState('business'); // business, courses

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
    const unsub = onSnapshot(getTenantCollection(db, 'clients'), (snap) => {
      const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);
    });
    return () => unsub();
  }, []);

  // Fetch all payments dal tenant corrente
  useEffect(() => {
    const loadPayments = async () => {
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        const paymentsList = [];
        
        for (const clientDoc of clientsSnap.docs) {
          const clientData = clientDoc.data();
          if (!clientData.isOldClient) {
            const paymentsSnap = await getDocs(
              query(getTenantSubcollection(db, 'clients', clientDoc.id, 'payments'), orderBy('paymentDate', 'desc'))
            );
            
            paymentsSnap.docs.forEach(paymentDoc => {
              const paymentData = paymentDoc.data();
              if (!paymentData.isPast) {
                paymentsList.push({
                  id: paymentDoc.id,
                  clientId: clientDoc.id,
                  clientName: clientData.name || 'Cliente',
                  ...paymentData
                });
              }
            });
          }
        }
        
        setPayments(paymentsList);
      } catch (err) {
        console.error('Errore caricamento payments:', err);
      }
    };
    loadPayments();
  }, []);

  // Fetch all checks dal tenant corrente
  useEffect(() => {
    const loadChecks = async () => {
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        const checksList = [];
        
        for (const clientDoc of clientsSnap.docs) {
          const checksSnap = await getDocs(
            query(getTenantSubcollection(db, 'clients', clientDoc.id, 'checks'), orderBy('createdAt', 'desc'))
          );
          
          checksSnap.docs.forEach(checkDoc => {
            checksList.push({
              id: checkDoc.id,
              clientId: clientDoc.id,
              createdAt: checkDoc.data().createdAt
            });
          });
        }
        
        setChecks(checksList);
        setLoading(false);
      } catch (err) {
        console.error('Errore caricamento checks:', err);
        setLoading(false);
      }
    };
    loadChecks();
  }, []);

  // Fetch messages for response time
  useEffect(() => {
    const unsub = onSnapshot(getTenantCollection(db, 'chats'), async (snap) => {
      const messagesList = [];
      for (const chatDoc of snap.docs) {
        const messagesSnap = await getDocs(
          query(getTenantSubcollection(db, 'chats', chatDoc.id, 'messages'), orderBy('timestamp', 'desc'))
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

  // Fetch courses
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'courses'), orderBy('createdAt', 'desc')), 
      (snap) => {
        const coursesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(coursesList);
      }
    );
    return () => unsub();
  }, []);

  // Fetch enrollments
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'course_enrollments'), 
      (snap) => {
        const enrollmentsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEnrollments(enrollmentsList);
      }
    );
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700/50"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Analytics</p>
                <h1 className="text-2xl font-bold text-white">Dashboard Metriche</h1>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex gap-1 bg-slate-800/30 p-1 rounded-lg">
              {['month', 'quarter', 'year'].map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {period === 'month' ? 'Mese' : period === 'quarter' ? 'Trimestre' : 'Anno'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Tabs */}
        <div className="flex gap-1 bg-slate-900/40 p-1.5 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'business'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <DollarSign size={16} />
            Business
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <GraduationCap size={16} />
            Corsi
          </button>
        </div>

        {/* Business Analytics */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            {/* Revenue Metrics */}
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-400" />
                Revenue Tracking
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Revenue Totale"
                  value={revenueMetrics.currentRevenue}
                  icon={<DollarSign className="text-emerald-400" />}
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
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-400" />
                Client Retention
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Clienti Attivi"
                  value={retentionMetrics.activeClients}
                  icon={<UserCheck className="text-emerald-400" />}
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
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={20} className="text-amber-400" />
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
                  icon={<Activity className="text-emerald-400" />}
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
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <UserX size={20} />
                  Clienti a Rischio ({retentionMetrics.atRiskCount})
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  Questi clienti hanno abbonamenti in scadenza nei prossimi 15 giorni
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {retentionMetrics.atRiskClients.map(client => {
                    const daysLeft = Math.ceil((toDate(client.scadenza) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <button
                        key={client.id}
                        onClick={() => navigate(`/client/${client.id}?tab=payments`)}
                        className="bg-slate-800/40 p-4 rounded-lg text-left hover:bg-slate-800/60 transition-colors border border-slate-700/50"
                      >
                        <p className="font-medium text-white">{client.name}</p>
                        <p className="text-sm text-red-400 mt-1">Scade tra {daysLeft} giorni</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Courses Analytics */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-cyan-400" />
                Statistiche Corsi
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Corsi Totali"
                  value={courses.length}
                  icon={<BookOpen className="text-cyan-400" />}
                  subtitle={`${courses.filter(c => c.isPublic).length} pubblici`}
                />
                <StatCard
                  title="Iscrizioni Totali"
                  value={enrollments.length}
                  icon={<Users className="text-green-400" />}
                  subtitle="Tutti i corsi"
                />
                <StatCard
                  title="Tasso di Completamento"
                  value={(() => {
                    const completedCount = enrollments.filter(e => e.completed).length;
                    const totalCount = enrollments.length || 1;
                    return Math.round((completedCount / totalCount) * 100);
                  })()}
                  icon={<CheckCircle className="text-blue-400" />}
                  isPercentage
                />
                <StatCard
                  title="Media Iscrizioni/Corso"
                  value={(enrollments.length / (courses.length || 1)).toFixed(1)}
                  icon={<Trophy className="text-yellow-400" />}
                />
              </div>
            </div>

            {/* Top Courses */}
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Corsi Più Popolari</h3>
              <div className="space-y-3">
                {courses
                  .map(course => ({
                    ...course,
                    enrollmentCount: enrollments.filter(e => e.courseId === course.id).length
                  }))
                  .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
                  .slice(0, 5)
                  .map((course, index) => (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-500">#{index + 1}</span>
                        <div>
                          <h4 className="font-medium text-white">{course.title}</h4>
                          <p className="text-sm text-slate-400">{course.enrollmentCount} iscritti</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/admin/course/${course.id}/manage`)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Gestisci
                      </button>
                    </div>
                  ))}
                {courses.length === 0 && (
                  <p className="text-center text-slate-400 py-4">Nessun corso disponibile</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
