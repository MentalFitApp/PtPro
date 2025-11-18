import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, collectionGroup, query, where, getDocs } from "firebase/firestore";
import { db, toDate } from "../firebase";
import { ArrowLeft, BarChart3, Users, DollarSign, RefreshCw, Plus } from 'lucide-react'; // Aggiunto Plus
import { motion } from "framer-motion";

export default function BusinessHistory() {
  const navigate = useNavigate();
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), (snap) => {
      const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const monthData = {};
      clientList.forEach(client => {
        const start = toDate(client.startDate);
        if (start) {
          const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
          if (!monthData[key]) monthData[key] = { year: start.getFullYear(), month: start.getMonth() + 1 };
        }
      });
      const monthList = Object.keys(monthData).sort((a, b) => new Date(b.split('-')[0], b.split('-')[1] - 1) - new Date(a.split('-')[0], a.split('-')[1] - 1));
      setMonths(monthList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchMonthStats = async (monthKey) => {
    setSelectedMonth(monthKey);
    setMonthStats(null);
    const [year, month] = monthKey.split('-');
    const startMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endMonth = new Date(parseInt(year), parseInt(month), 1);

    try {
      const clientsQuery = query(collection(db, 'clients'), where('startDate', '>=', startMonth), where('startDate', '<', endMonth));
      const clientsSnap = await getDocs(clientsQuery);
      const clientsList = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const renewals = clientsList.filter(c => c.isOldClient).length;
      const newClients = clientsList.length - renewals;
      
      const paymentsQuery = query(collectionGroup(db, 'payments'), where('paymentDate', '>=', startMonth), where('paymentDate', '<', endMonth));
      const paymentsSnap = await getDocs(paymentsQuery);
      const income = paymentsSnap.docs
        .filter(doc => {
          const clientDocRef = doc.ref.parent.parent;
          const clientDoc = clientDocRef.data();
          return !clientDoc.isOldClient || !doc.data().isPast;
        })
        .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

      setMonthStats({
        clients: clientsList.length,
        renewals,
        newClients,
        income
      });
    } catch (error) {
      console.error('Errore nel recupero stats mese:', error);
      setMonthStats({ clients: 0, renewals: 0, newClients: 0, income: 0 }); // Imposta valori di default in caso di errore
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Caricamento...</div>;

  return (
    <div className="overflow-x-hidden w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-6 text-slate-400 hover:text-rose-500">
        <ArrowLeft size={16} /> Torna alla Dashboard
      </button>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mb-6">Storico Business</h1>
      <div className="space-y-4">
        {months.map(month => (
          <motion.div
            key={month}
            className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg cursor-pointer hover:bg-slate-700/70 border border-slate-700"
            onClick={() => fetchMonthStats(month)}
            whileHover={{ scale: 1.02 }}
          >
            <h2 className="text-lg font-semibold text-slate-200">{new Date(month.split('-')[0], month.split('-')[1] - 1).toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h2>
          </motion.div>
        ))}
      </div>
      {selectedMonth && monthStats && (
        <motion.div className="mt-8 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-bold text-slate-50">{new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1] - 1).toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              <p>Clienti del mese: {monthStats.clients}</p>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={20} className="text-green-500" />
              <p>Clienti rinnovati: {monthStats.renewals}</p>
            </div>
            <div className="flex items-center gap-2">
              <Plus size={20} className="text-amber-500" />
              <p>Nuovi clienti: {monthStats.newClients}</p>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-green-500" />
              <p>Incasso: €{monthStats.income.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}