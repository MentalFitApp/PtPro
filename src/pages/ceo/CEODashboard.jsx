// src/pages/ceo/CEODashboard.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  collection, query, getDocs, where, doc, getDoc, orderBy, limit 
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { 
  BarChart3, Users, DollarSign, Building2, TrendingUp, 
  Activity, Calendar, Shield, AlertCircle, CheckCircle,
  Clock, UserCheck, MessageSquare, Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CEODashboard() {
  const [loading, setLoading] = useState(true);
  const [isCEO, setIsCEO] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClients: 0,
    totalCoaches: 0,
    totalAdmins: 0,
    communityUsers: 0,
    totalPosts: 0,
    totalChecks: 0,
    totalAnamnesi: 0,
    totalPayments: 0,
    totalRevenue: 0,
    avgPaymentAmount: 0,
    activeToday: 0,
    activeWeek: 0,
    newThisMonth: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkCEOAccess();
  }, []);

  const checkCEOAccess = async () => {
    try {
      if (!auth.currentUser) {
        navigate('/ceo-login');
        return;
      }

      // Verifica se l'utente ha il ruolo CEO
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (!userData?.roles?.includes('ceo')) {
        alert('Accesso negato. Solo CEO può accedere a questa sezione.');
        navigate('/ceo-login');
        return;
      }

      setIsCEO(true);
      loadAllStats();
    } catch (error) {
      console.error('Errore verifica accesso CEO:', error);
      navigate('/');
    }
  };

  const loadAllStats = async () => {
    setLoading(true);
    try {
      // Carica tutte le statistiche in parallelo
      const [
        usersSnap,
        clientsSnap,
        coachesSnap,
        adminsSnap,
        communityPostsSnap,
        checksSnap,
        anamnesiSnap,
        paymentsSnap
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'clients')),
        getDoc(doc(db, 'roles', 'coaches')),
        getDoc(doc(db, 'roles', 'admins')),
        getDocs(query(collection(db, 'community_posts'), where('deleted', '!=', true))),
        getDocs(query(collection(db, 'clients'), limit(100))),
        getDocs(query(collection(db, 'clients'), limit(100))),
        getDocs(query(collection(db, 'clients'), limit(100)))
      ]);

      // Calcola checks totali (subcollection)
      let totalChecks = 0;
      let totalAnamnesi = 0;
      for (const clientDoc of checksSnap.docs.slice(0, 20)) { // Limita per performance
        const checksSubSnap = await getDocs(collection(db, 'clients', clientDoc.id, 'checks'));
        totalChecks += checksSubSnap.size;
        
        const anamnesiSubSnap = await getDocs(collection(db, 'clients', clientDoc.id, 'anamnesi'));
        totalAnamnesi += anamnesiSubSnap.size;
      }

      // Calcola pagamenti e revenue
      let totalPayments = 0;
      let totalRevenue = 0;
      for (const clientDoc of paymentsSnap.docs.slice(0, 50)) {
        const paymentsSubSnap = await getDocs(collection(db, 'clients', clientDoc.id, 'payments'));
        totalPayments += paymentsSubSnap.size;
        paymentsSubSnap.docs.forEach(payDoc => {
          totalRevenue += payDoc.data().amount || 0;
        });
      }

      // Calcola utenti attivi (semplificato - basato su timestamp recenti)
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

      let activeToday = 0;
      let activeWeek = 0;
      let newThisMonth = 0;

      usersSnap.docs.forEach(userDoc => {
        const userData = userDoc.data();
        const updatedAt = userData.updatedAt?.toMillis() || 0;
        const createdAt = userData.createdAt?.toMillis() || 0;

        if (updatedAt > oneDayAgo) activeToday++;
        if (updatedAt > oneWeekAgo) activeWeek++;
        if (createdAt > oneMonthAgo) newThisMonth++;
      });

      setStats({
        totalUsers: usersSnap.size,
        totalClients: clientsSnap.size,
        totalCoaches: coachesSnap.data()?.uids?.length || 0,
        totalAdmins: adminsSnap.data()?.uids?.length || 0,
        communityUsers: usersSnap.size,
        totalPosts: communityPostsSnap.size,
        totalChecks: totalChecks,
        totalAnamnesi: totalAnamnesi,
        totalPayments: totalPayments,
        totalRevenue: totalRevenue,
        avgPaymentAmount: totalPayments > 0 ? totalRevenue / totalPayments : 0,
        activeToday: activeToday,
        activeWeek: activeWeek,
        newThisMonth: newThisMonth
      });

      // Carica attività recente (ultimi post community)
      const recentPostsSnap = await getDocs(
        query(
          collection(db, 'community_posts'),
          where('deleted', '!=', true),
          orderBy('deleted'),
          orderBy('timestamp', 'desc'),
          limit(10)
        )
      );

      setRecentActivity(recentPostsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

    } catch (error) {
      console.error('Errore caricamento stats CEO:', error);
      alert('Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Caricamento Dashboard CEO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <div className="bg-slate-950/50 backdrop-blur-xl border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              CEO Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Panoramica completa della piattaforma</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">CEO Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            icon={Users}
            title="Utenti Totali"
            value={stats.totalUsers}
            subtitle={`${stats.newThisMonth} nuovi questo mese`}
            color="blue"
            trend="+12%"
          />
          <KPICard
            icon={UserCheck}
            title="Clienti Attivi"
            value={stats.totalClients}
            subtitle={`${stats.totalCoaches} coach`}
            color="green"
            trend="+8%"
          />
          <KPICard
            icon={DollarSign}
            title="Revenue Totale"
            value={`€${stats.totalRevenue.toFixed(0)}`}
            subtitle={`${stats.totalPayments} pagamenti`}
            color="yellow"
            trend="+15%"
          />
          <KPICard
            icon={Activity}
            title="Utenti Attivi"
            value={stats.activeWeek}
            subtitle={`${stats.activeToday} oggi`}
            color="purple"
            trend="+5%"
          />
        </div>

        {/* Stats Dettagliate */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Community Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <MessageSquare size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Community</h3>
                <p className="text-sm text-slate-400">Statistiche social</p>
              </div>
            </div>

            <div className="space-y-4">
              <StatRow label="Post Pubblicati" value={stats.totalPosts} />
              <StatRow label="Utenti Community" value={stats.communityUsers} />
              <StatRow label="Media Post/Utente" value={(stats.totalPosts / stats.communityUsers || 0).toFixed(1)} />
            </div>
          </motion.div>

          {/* Health Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Salute & Check</h3>
                <p className="text-sm text-slate-400">Monitoraggio clienti</p>
              </div>
            </div>

            <div className="space-y-4">
              <StatRow label="Check Totali" value={stats.totalChecks} />
              <StatRow label="Anamnesi Complete" value={stats.totalAnamnesi} />
              <StatRow label="Media Check/Cliente" value={(stats.totalChecks / stats.totalClients || 0).toFixed(1)} />
            </div>
          </motion.div>

          {/* Financial Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Finanziario</h3>
                <p className="text-sm text-slate-400">Revenue & pagamenti</p>
              </div>
            </div>

            <div className="space-y-4">
              <StatRow label="Ticket Medio" value={`€${stats.avgPaymentAmount.toFixed(2)}`} />
              <StatRow label="Totale Pagamenti" value={stats.totalPayments} />
              <StatRow label="Revenue/Cliente" value={`€${(stats.totalRevenue / stats.totalClients || 0).toFixed(0)}`} />
            </div>
          </motion.div>
        </div>

        {/* Attività Recente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6">Attività Recente (Community)</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                >
                  <img
                    src={activity.author?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.author?.name || 'User')}`}
                    alt={activity.author?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{activity.author?.name || 'Utente'}</span>
                      <span className="text-slate-500 text-sm">
                        {activity.timestamp && new Date(activity.timestamp.toDate()).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm line-clamp-2">
                      {activity.content || 'Media condiviso'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
                      <span>❤️ {activity.likes || 0}</span>
                      <span>💬 {activity.replies?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-8">Nessuna attività recente</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, title, value, subtitle, color, trend }) {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    yellow: 'from-yellow-500 to-orange-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
            <TrendingUp size={14} />
            {trend}
          </div>
        )}
      </div>
      <div className="text-slate-400 text-sm mb-1">{title}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-slate-500 text-xs">{subtitle}</div>
    </motion.div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
