import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { isSuperAdmin, getUserRole } from '../utils/superadmin';
import { Users, DollarSign, Calendar, UserCheck, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalCoaches: 0,
    totalCollaboratori: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentClients: [],
    recentPayments: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    const isSuperAdminUser = await isSuperAdmin(user.uid);
    if (!isSuperAdminUser) {
      navigate('/dashboard');
      return;
    }

    setAuthorized(true);
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      // Carica tutti i clienti
      const clientsSnap = await getDocs(collection(db, 'clients'));
      const clients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Clienti attivi (non scaduti)
      const now = new Date();
      const activeClients = clients.filter(c => {
        if (!c.scadenza) return false;
        const scadenza = c.scadenza.toDate ? c.scadenza.toDate() : new Date(c.scadenza);
        return scadenza >= now;
      });

      // Carica coaches
      const coachesSnap = await getDocs(collection(db, 'roles'));
      let totalCoaches = 0;
      coachesSnap.docs.forEach(doc => {
        if ((doc.id === 'coaches' || doc.id === 'admins') && doc.data().uids) {
          totalCoaches += doc.data().uids.length;
        }
      });

      // Carica collaboratori
      const collabSnap = await getDocs(collection(db, 'collaboratori'));
      
      // Calcola revenue (da collection payments sotto ogni cliente)
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const recentPaymentsList = [];

      for (const clientDoc of clientsSnap.docs) {
        const paymentsSnap = await getDocs(
          query(collection(db, 'clients', clientDoc.id, 'payments'), orderBy('paymentDate', 'desc'), limit(5))
        );
        
        paymentsSnap.docs.forEach(payDoc => {
          const payment = payDoc.data();
          const amount = payment.amount || 0;
          totalRevenue += amount;
          
          const payDate = payment.paymentDate?.toDate ? payment.paymentDate.toDate() : new Date(payment.paymentDate);
          if (payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear) {
            monthlyRevenue += amount;
          }

          recentPaymentsList.push({
            id: payDoc.id,
            clientId: clientDoc.id,
            clientName: clientDoc.data().name,
            ...payment
          });
        });
      }

      // Ordina pagamenti recenti
      recentPaymentsList.sort((a, b) => {
        const aDate = a.paymentDate?.toDate ? a.paymentDate.toDate() : new Date(a.paymentDate);
        const bDate = b.paymentDate?.toDate ? b.paymentDate.toDate() : new Date(b.paymentDate);
        return bDate - aDate;
      });

      // Ultimi clienti aggiunti
      const sortedClients = [...clients].sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bDate - aDate;
      });

      setStats({
        totalClients: clients.length,
        activeClients: activeClients.length,
        totalCoaches,
        totalCollaboratori: collabSnap.size,
        totalRevenue,
        monthlyRevenue,
        recentClients: sortedClients.slice(0, 5),
        recentPayments: recentPaymentsList.slice(0, 5)
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Accesso Negato</h2>
          <p className="text-slate-400">Solo i SuperAdmin possono accedere a questa sezione.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, subtext, color = 'cyan' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-500/10`}>
          <Icon className={`text-${color}-400`} size={24} />
        </div>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subtext && <div className="text-sm text-slate-400">{subtext}</div>}
    </motion.div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="text-rose-400" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-white">SuperAdmin Dashboard</h1>
            <p className="text-slate-400">Vista completa di tutta la piattaforma</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Clienti Totali"
            value={stats.totalClients}
            subtext={`${stats.activeClients} attivi`}
            color="cyan"
          />
          <StatCard
            icon={UserCheck}
            label="Coach & Admin"
            value={stats.totalCoaches}
            subtext="Gestori piattaforma"
            color="emerald"
          />
          <StatCard
            icon={Users}
            label="Collaboratori"
            value={stats.totalCollaboratori}
            subtext="Setter, marketing, etc"
            color="purple"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue Totale"
            value={`€${stats.totalRevenue.toLocaleString()}`}
            subtext={`€${stats.monthlyRevenue.toLocaleString()} questo mese`}
            color="rose"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Clients */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users size={20} className="text-cyan-400" />
              Ultimi Clienti Aggiunti
            </h3>
            <div className="space-y-3">
              {stats.recentClients.map(client => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <div>
                    <p className="font-medium text-white">{client.name}</p>
                    <p className="text-sm text-slate-400">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">
                      {client.createdAt?.toDate
                        ? client.createdAt.toDate().toLocaleDateString('it-IT')
                        : 'N/D'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Payments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-400" />
              Ultimi Pagamenti
            </h3>
            <div className="space-y-3">
              {stats.recentPayments.map((payment, idx) => (
                <div
                  key={`${payment.clientId}-${idx}`}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-white">{payment.clientName}</p>
                    <p className="text-sm text-slate-400">{payment.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">€{payment.amount}</p>
                    <p className="text-xs text-slate-400">
                      {payment.paymentDate?.toDate
                        ? payment.paymentDate.toDate().toLocaleDateString('it-IT')
                        : 'N/D'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Azioni Rapide SuperAdmin</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/clients')}
              className="flex items-center gap-3 p-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 transition-colors"
            >
              <Users size={20} />
              <span>Tutti i Clienti</span>
            </button>
            <button
              onClick={() => navigate('/collaboratori')}
              className="flex items-center gap-3 p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 transition-colors"
            >
              <UserCheck size={20} />
              <span>Collaboratori</span>
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="flex items-center gap-3 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 transition-colors"
            >
              <Calendar size={20} />
              <span>Calendario</span>
            </button>
            <button
              onClick={() => navigate('/statistiche')}
              className="flex items-center gap-3 p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 transition-colors"
            >
              <TrendingUp size={20} />
              <span>Statistiche</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
