import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { User, Mail, Phone, Calendar, FileText, DollarSign, Trash2, Edit, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

// Funzione di utilità per convertire timestamp
function toDate(x) {
  if (!x) return null;
  if (typeof x?.toDate === "function") return x.toDate();
  const d = new Date(x);
  return isNaN(d) ? null : d;
}

// Funzione per calcolare lo stato del pagamento (coerente con Clients.jsx)
const getPaymentStatus = (scadenza) => {
  if (!scadenza) return 'na';
  const expiryDate = toDate(scadenza);
  if (!expiryDate) return 'na';
  const now = new Date();
  const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 15) return 'expiring';
  return 'paid';
};

// Componente PaymentStatusBadge (coerente con Clients.jsx)
const PaymentStatusBadge = ({ status }) => {
  const styles = {
    paid: "bg-emerald-900/80 text-emerald-300 border border-emerald-500/30",
    expiring: "bg-amber-900/80 text-amber-300 border border-amber-500/30",
    expired: "bg-red-900/80 text-red-400 border border-red-500/30",
    na: "bg-zinc-700/80 text-zinc-300 border border-zinc-500/30",
  };
  const labels = { paid: 'Pagato', expiring: 'In Scadenza', expired: 'Scaduto', na: 'N/D' };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || styles.na}`}>{labels[status] || 'N/D'}</span>;
};

export default function ClientDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [checkIns, setCheckIns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [anamnesi, setAnamnesi] = useState(null);
  const [error, setError] = useState(null);

  // Estrai id con fallback per HashRouter
  const id = params.clientId || (() => {
    const pathname = location.pathname;
    console.log('URL completo:', window.location.href);
    console.log('Pathname:', pathname);
    const match = pathname.match(/\/client\/([a-zA-Z0-9_-]+)/);
    const fallbackId = match ? match[1] : null;
    console.log('Fallback ID estratto:', fallbackId);
    return fallbackId;
  })();

  // Fetch client data in real-time
  useEffect(() => {
    console.log('ID cliente ricevuto da useParams:', params.clientId);
    console.log('ID finale usato:', id);
    if (!id || typeof id !== 'string' || id.trim() === '') {
      setError("ID cliente non valido. Reindirizzamento alla lista dei clienti...");
      setTimeout(() => navigate('/clients'), 3000);
      setLoading(false);
      return;
    }

    const clientRef = doc(db, 'clients', id);
    const unsubClient = onSnapshot(clientRef, (docSnap) => {
      if (docSnap.exists()) {
        setClient({ id: docSnap.id, ...docSnap.data() });
        console.log('Dati cliente:', { id: docSnap.id, ...docSnap.data() });
      } else {
        setClient(null);
        setError("Cliente non trovato. Reindirizzamento alla lista dei clienti...");
        setTimeout(() => navigate('/clients'), 3000);
      }
      setLoading(false);
    }, (error) => {
      console.error("Errore nel recupero del cliente:", error);
      setError("Errore nel recupero del cliente. Reindirizzamento...");
      setTimeout(() => navigate('/clients'), 3000);
      setLoading(false);
    });

    // Fetch anamnesi
    const anamnesiRef = doc(db, 'clients', id, 'anamnesi', 'initial');
    const unsubAnamnesi = onSnapshot(anamnesiRef, (docSnap) => {
      setAnamnesi(docSnap.exists() ? docSnap.data() : null);
    }, (error) => {
      console.error("Errore nel recupero dell'anamnesi:", error);
    });

    // Fetch check-ins
    const checkInsQuery = query(collection(db, 'clients', id, 'checks'), orderBy('createdAt', 'desc'));
    const unsubCheckIns = onSnapshot(checkInsQuery, (snap) => {
      setCheckIns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Errore nel recupero dei check-ins:", error);
    });

    // Fetch payments
    const paymentsQuery = query(collection(db, 'clients', id, 'payments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(paymentsQuery, (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Errore nel recupero dei pagamenti:", error);
    });

    return () => {
      unsubClient();
      unsubAnamnesi();
      unsubCheckIns();
      unsubPayments();
    };
  }, [id, navigate, location.pathname]);

  // Handle delete client
  const handleDelete = async () => {
    if (window.confirm(`Sei sicuro di voler eliminare ${client?.name || 'il cliente'}?`)) {
      try {
        await deleteDoc(doc(db, 'clients', id));
        navigate('/clients');
      } catch (err) {
        console.error("Errore nell'eliminazione del cliente:", err);
        alert("Errore durante l'eliminazione del cliente.");
      }
    }
  };

  // Handle update scadenza (for testing the status update)
  const handleUpdateScadenza = async () => {
    const newScadenza = prompt("Inserisci la nuova data di scadenza (YYYY-MM-DD):");
    if (newScadenza) {
      try {
        const date = new Date(newScadenza);
        if (isNaN(date)) throw new Error("Data non valida");
        await updateDoc(doc(db, 'clients', id), { scadenza: date });
      } catch (err) {
        console.error("Errore nell'aggiornamento della scadenza:", err);
        alert("Data non valida o errore nell'aggiornamento");
      }
    }
  };

  if (error) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center text-red-400 p-8"
    >
      {error}
    </motion.div>
  );
  if (loading) return <div className="text-center text-slate-400 p-8">Caricamento...</div>;
  if (!client) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center text-slate-400 p-8"
    >
      Cliente non trovato. Reindirizzamento alla lista dei clienti...
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto p-4"
    >
      <div className="mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors"
        >
          <ArrowLeft size={18} /> Torna ai Clienti
        </button>
      </div>

      <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-slate-50">{client.name || 'Cliente'}</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/edit/${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition-colors"
            >
              <Edit size={16} /> Modifica
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              <Trash2 size={16} /> Elimina
            </button>
            <button
              onClick={handleUpdateScadenza}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors"
            >
              <Calendar size={16} /> Aggiorna Scadenza
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-zinc-900/70 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'info' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
          >
            Informazioni
          </button>
          <button
            onClick={() => setActiveTab('checkIns')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'checkIns' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
          >
            Check-Ins
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'payments' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
          >
            Pagamenti
          </button>
          <button
            onClick={() => setActiveTab('anamnesi')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'anamnesi' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
          >
            Anamnesi
          </button>
        </div>

        {/* Content */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="text-slate-400" size={18} />
              <p className="text-slate-200">Nome: <span className="font-semibold">{client.name || 'N/D'}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="text-slate-400" size={18} />
              <p className="text-slate-200">Email: <span className="font-semibold">{client.email || 'N/D'}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-slate-400" size={18} />
              <p className="text-slate-200">Telefono: <span className="font-semibold">{client.phone || 'N/D'}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="text-slate-400" size={18} />
              <p className="text-slate-200">Scadenza: <span className="font-semibold">{client.scadenza ? toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D' : 'N/D'}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="text-slate-400" size={18} />
              <p className="text-slate-200">Stato Pagamento: <PaymentStatusBadge status={getPaymentStatus(client.scadenza)} /></p>
            </div>
          </div>
        )}

        {activeTab === 'checkIns' && (
          <div className="space-y-4">
            {checkIns.length > 0 ? (
              checkIns.map(check => (
                <div key={check.id} className="p-4 bg-zinc-900/70 rounded-lg border border-white/10">
                  <p className="text-sm text-slate-400">Data: {toDate(check.createdAt)?.toLocaleDateString('it-IT') || 'N/D'}</p>
                  <p className="text-sm text-slate-200">Peso: {check.weight || 'N/D'} kg</p>
                  <p className="text-sm text-slate-200">Note: {check.notes || 'Nessuna nota'}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center">Nessun check-in disponibile.</p>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            {payments.length > 0 ? (
              payments.map(payment => (
                <div key={payment.id} className="p-4 bg-zinc-900/70 rounded-lg border border-white/10">
                  <p className="text-sm text-slate-400">Data: {toDate(payment.paymentDate)?.toLocaleDateString('it-IT') || 'N/D'}</p>
                  <p className="text-sm text-slate-200">Importo: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(payment.amount || 0)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center">Nessun pagamento registrato.</p>
            )}
          </div>
        )}

        {activeTab === 'anamnesi' && (
          <div className="space-y-4">
            {anamnesi ? (
              <div className="p-4 bg-zinc-900/70 rounded-lg border border-white/10">
                <p className="text-sm text-slate-400">Inviata il: {toDate(anamnesi.submittedAt)?.toLocaleDateString('it-IT') || 'N/D'}</p>
                <p className="text-sm text-slate-200">Dettagli: {JSON.stringify(anamnesi, null, 2)}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center">Nessuna anamnesi disponibile.</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}