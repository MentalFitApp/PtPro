import React, { useState, useEffect, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { getTenantSubcollection } from '../../config/tenant';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, History, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SkeletonList } from '../../components/ui/SkeletonLoader';

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

// Funzione helper per formattare le date
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/D';
  
  // Se è un Firestore Timestamp
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleDateString('it-IT', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  
  // Se è una stringa ISO o Date
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('it-IT', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  
  return 'N/D';
};

// Calcola giorni rimanenti
const getDaysUntil = (dateValue) => {
  if (!dateValue) return null;
  
  let date;
  if (typeof dateValue.toDate === 'function') {
    date = dateValue.toDate();
  } else {
    date = new Date(dateValue);
  }
  
  if (isNaN(date.getTime())) return null;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const ClientPayments = () => {
  const [payments, setPayments] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    let paymentsLoaded = false;
    let ratesLoaded = false;
    
    const checkLoading = () => {
      if (paymentsLoaded && ratesLoaded) {
        setLoading(false);
      }
    };
    
    // Carica pagamenti dalla subcollection payments
    const paymentsCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'payments');
    const paymentsQuery = query(paymentsCollectionRef, orderBy('paymentDate', 'desc'));

    const unsubPayments = onSnapshot(paymentsQuery, (querySnapshot) => {
      setPayments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      paymentsLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Errore nel caricare i pagamenti:", error);
      paymentsLoaded = true;
      checkLoading();
    });
    
    // Carica rate dalla subcollection rates
    const ratesCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'rates');
    const ratesQuery = query(ratesCollectionRef, orderBy('dueDate', 'asc'));

    const unsubRates = onSnapshot(ratesQuery, (querySnapshot) => {
      setRates(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      ratesLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Errore nel caricare le rate:", error);
      ratesLoaded = true;
      checkLoading();
    });
    
    return () => {
      unsubPayments();
      unsubRates();
    };
  }, [user, navigate]);

  // Calcola la prossima rata da pagare
  const nextRate = useMemo(() => {
    const unpaidRates = rates.filter(r => !r.paid);
    if (unpaidRates.length === 0) return null;
    
    // Ordina per data scadenza
    unpaidRates.sort((a, b) => {
      const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
      const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
      return dateA - dateB;
    });
    
    return unpaidRates[0];
  }, [rates]);

  // Separa rate pagate e da pagare
  const paidRates = rates.filter(r => r.paid);
  const unpaidRates = rates.filter(r => !r.paid);

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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">I Miei Pagamenti</h1>
          <button
            onClick={() => navigate('/client/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Dashboard</span>
          </button>
        </header>

        {/* Prossima rata in evidenza */}
        {nextRate && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock size={24} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-300 font-medium">Prossima rata in scadenza</p>
                <p className="text-2xl font-bold text-white">€{nextRate.amount}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Scadenza</p>
                <p className="text-lg font-semibold text-amber-300">{formatDate(nextRate.dueDate)}</p>
                {(() => {
                  const days = getDaysUntil(nextRate.dueDate);
                  if (days === null) return null;
                  if (days < 0) {
                    return <p className="text-xs text-rose-400 font-medium">Scaduta da {Math.abs(days)} giorni</p>;
                  } else if (days === 0) {
                    return <p className="text-xs text-amber-400 font-medium">Scade oggi!</p>;
                  } else {
                    return <p className="text-xs text-slate-400">Tra {days} giorni</p>;
                  }
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Rate da pagare */}
        {unpaidRates.length > 0 && (
          <main className="mb-6 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 shadow-glow">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-400" />
              Rate da pagare ({unpaidRates.length})
            </h2>
            <div className="space-y-3">
              {unpaidRates.map(rate => {
                const days = getDaysUntil(rate.dueDate);
                const isOverdue = days !== null && days < 0;
                const isToday = days === 0;
                
                return (
                  <div 
                    key={rate.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      isOverdue ? 'bg-rose-500/10 border-rose-500/30' : 
                      isToday ? 'bg-amber-500/10 border-amber-500/30' : 
                      'bg-slate-700/30 border-slate-600/50'
                    }`}
                  >
                    <div>
                      <p className="text-lg font-semibold text-white">€{rate.amount}</p>
                      <p className="text-sm text-slate-400">Scadenza: {formatDate(rate.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      {isOverdue ? (
                        <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-sm font-medium rounded-full">
                          Scaduta
                        </span>
                      ) : isToday ? (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full">
                          Oggi
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-600/50 text-slate-300 text-sm font-medium rounded-full">
                          Tra {days} giorni
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* Storico pagamenti */}
        <main className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 shadow-glow mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <History size={20} className="text-cyan-400" />
            Storico Pagamenti
          </h2>
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
                      Nessun pagamento registrato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* Rate pagate */}
        {paidRates.length > 0 && (
          <main className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 shadow-glow">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-400" />
              Rate Pagate ({paidRates.length})
            </h2>
            <div className="space-y-3">
              {paidRates.map(rate => (
                <div 
                  key={rate.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div>
                    <p className="text-lg font-semibold text-white">€{rate.amount}</p>
                    <p className="text-sm text-slate-400">Pagata il: {formatDate(rate.paidDate)}</p>
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full flex items-center gap-1">
                      <CheckCircle size={14} /> Pagata
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}
      </motion.div>
    </div>
  );
};

export default ClientPayments;