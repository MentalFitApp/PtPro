import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { getTenantSubcollection } from '../../config/tenant';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, History } from 'lucide-react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

// Funzione helper per formattare le date
const formatDate = (timestamp) => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleDateString('it-IT', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  return 'N/D';
};

const ClientPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const paymentsCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'payments');
    const q = query(paymentsCollectionRef, orderBy('paymentDate', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setPayments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Errore nel caricare i pagamenti:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, navigate]);

  if (loading) return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mb-8 h-12 w-64 bg-slate-700/50 rounded-lg animate-pulse" />
      <SkeletonList count={4} />
    </div>
  );

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-8 relative">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">Storico Pagamenti</h1>
          <button
            onClick={() => navigate('/client/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Dashboard</span>
          </button>
        </header>

        <main className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="p-4 text-sm font-semibold text-slate-400 flex items-center gap-2"><Calendar size={16} />Data</th>
                  <th className="p-4 text-sm font-semibold text-slate-400"><DollarSign size={16} className="inline mr-2" />Importo</th>
                  <th className="p-4 text-sm font-semibold text-slate-400"><History size={16} className="inline mr-2" />Durata</th>
                  <th className="p-4 text-sm font-semibold text-slate-400 hidden sm:table-cell">Metodo</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? (
                  payments.map(payment => (
                    <tr key={payment.id} className="border-b border-white/5 last:border-b-0">
                      <td className="p-4 text-slate-300">{formatDate(payment.paymentDate)}</td>
                      <td className="p-4 font-semibold text-cyan-300">€ {payment.amount?.toFixed(2)}</td>
                      <td className="p-4 text-slate-300">{payment.duration}</td>
                      <td className="p-4 text-slate-400 hidden sm:table-cell">{payment.paymentMethod || 'Non specificato'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-slate-500 p-8">
                      Non è stato registrato ancora nessun pagamento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default ClientPayments;