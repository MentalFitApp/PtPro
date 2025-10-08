import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, orderBy } from "firebase/firestore";
import { db, toDate, calcolaStatoPercorso, updateStatoPercorso } from "../firebase";
import { User, Mail, Phone, Calendar, FileText, DollarSign, Trash2, Edit, ArrowLeft, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-red-400 p-8">
          Si è verificato un errore: {this.state.error.message}. Riprova o contatta il supporto.
        </div>
      );
    }
    return this.props.children;
  }
}

// Componente PathStatusBadge
const PathStatusBadge = ({ status }) => {
  const styles = {
    attivo: "bg-emerald-900/80 text-emerald-300 border border-emerald-500/30",
    rinnovato: "bg-amber-900/80 text-amber-300 border border-amber-500/30",
    non_rinnovato: "bg-red-900/80 text-red-400 border border-red-500/30",
    na: "bg-zinc-700/80 text-zinc-300 border border-zinc-500/30",
  };
  const labels = { attivo: 'Attivo', rinnovato: 'In Scadenza', non_rinnovato: 'Scaduto', na: 'N/D' };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || styles.na}`}>{labels[status] || 'N/D'}</span>;
};

export default function ClientDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [checks, setChecks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [anamnesi, setAnamnesi] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Estrai id con fallback per HashRouter e debug
  const id = params.clientId || (() => {
    const pathname = location.pathname;
    console.log('URL completo:', window.location.href);
    console.log('Pathname:', pathname);
    const match = pathname.match(/\/client\/([a-zA-Z0-9_-]+)/);
    const fallbackId = match ? match[1] : null;
    console.log('ID estratto da params o URL:', params.clientId || fallbackId);
    if (!fallbackId && !params.clientId) {
      setError("ID cliente non trovato. Reindirizzamento alla lista dei clienti...");
      setTimeout(() => navigate('/clients'), 3000);
      return null;
    }
    return fallbackId || params.clientId;
  })();

  // Fetch client data in real-time
  useEffect(() => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      setError("ID cliente non valido. Reindirizzamento alla lista dei clienti...");
      setTimeout(() => navigate('/clients'), 3000);
      setLoading(false);
      return;
    }

    const clientRef = doc(db, 'clients', id);
    const unsubClient = onSnapshot(clientRef, (docSnap) => {
      if (docSnap.exists()) {
        const clientData = { id: docSnap.id, ...docSnap.data() };
        setClient(clientData);
        console.log('Dati cliente caricati:', clientData);
        updateStatoPercorso(id);
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

    // Fetch checks
    const checksQuery = query(collection(db, 'clients', id, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, (snap) => {
      setChecks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Errore nel recupero dei checks:", error);
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
      unsubChecks();
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

  // Handle update scadenza
  const handleUpdateScadenza = async () => {
    const newScadenza = prompt("Inserisci la nuova data di scadenza (YYYY-MM-DD):");
    if (newScadenza) {
      try {
        const date = new Date(newScadenza);
        if (isNaN(date)) throw new Error("Data non valida");
        await updateDoc(doc(db, 'clients', id), { scadenza: date });
        updateStatoPercorso(id);
      } catch (err) {
        console.error("Errore nell'aggiornamento della scadenza:", err);
        alert("Data non valida o errore nell'aggiornamento");
      }
    }
  };

  // Handle copy credentials to clipboard
  const copyCredentialsToClipboard = () => {
    const loginLink = "https://MentalFitApp.github.io/PtPro/#/client-login";
    const tempPassword = client.tempPassword || "Password non disponibile (contatta l’amministratore per reimpostarla)";
    const text = `Ciao ${client.name || 'Cliente'},\n\nBenvenuto in PT Manager, la tua area personale per monitorare i progressi e comunicare con il tuo coach!\n\nEcco le credenziali per il tuo accesso:\n\nLink: ${loginLink}\nEmail: ${client.email || 'N/D'}\nPassword Temporanea: ${tempPassword}\n\nAl primo accesso ti verrà chiesto di impostare una password personale.\nA presto!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl mx-auto p-4 sm:p-6"
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center flex-wrap gap-4 mb-6">
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
          <div className="flex flex-wrap gap-2 mb-6 bg-zinc-900/70 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'info' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Informazioni
            </button>
            <button
              onClick={() => setActiveTab('check')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'check' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Check
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
                <div className="flex items-center gap-2">
                  <p className="text-slate-200">Email: <span className="font-semibold">{client.email || 'N/D'}</span></p>
                  <button
                    onClick={copyCredentialsToClipboard}
                    className="p-1 text-slate-400 hover:text-emerald-400 rounded-md transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {client.tempPassword
                    ? "Al primo accesso ti verrà chiesto di impostare una password personale."
                    : "Password non disponibile. Contatta l’amministratore per reimpostarla."}
                </p>
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
                <p className="text-slate-200">Stato Percorso: <PathStatusBadge status={client.statoPercorso || calcolaStatoPercorso(client.scadenza)} /></p>
              </div>
            </div>
          )}

          {activeTab === 'check' && (
            <div className="space-y-4">
              {checks.length > 0 ? (
                checks.map(check => (
                  <div key={check.id} className="p-4 bg-zinc-900/70 rounded-lg border border-white/10">
                    <p className="text-sm text-slate-400">Data: {toDate(check.createdAt)?.toLocaleDateString('it-IT') || 'N/D'}</p>
                    <p className="text-sm text-slate-200">Peso: {check.weight || 'N/D'} kg</p>
                    <p className="text-sm text-slate-200">Note: {check.notes || 'Nessuna nota'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center">Nessun check disponibile.</p>
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
                <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-4">
                  <h4 className="font-bold text-lg text-cyan-300 border-b border-cyan-400/20 pb-2 flex items-center gap-2"><FileText size={16} /> Dettagli Anamnesi</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div><span className="text-sm font-semibold text-slate-400">Nome:</span> <span className="text-slate-200">{anamnesi.firstName || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Cognome:</span> <span className="text-slate-200">{anamnesi.lastName || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Data di Nascita:</span> <span className="text-slate-200">{anamnesi.birthDate || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Lavoro:</span> <span className="text-slate-200">{anamnesi.job || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Peso (kg):</span> <span className="text-slate-200">{anamnesi.weight || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Altezza (cm):</span> <span className="text-slate-200">{anamnesi.height || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Pasti al Giorno:</span> <span className="text-slate-200">{anamnesi.mealsPerDay || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Tipo Colazione:</span> <span className="text-slate-200">{anamnesi.breakfastType || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Alimenti Preferiti:</span> <span className="text-slate-200">{anamnesi.desiredFoods || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Alimenti da Evitare:</span> <span className="text-slate-200">{anamnesi.dislikedFoods || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Allergie/Intolleranze:</span> <span className="text-slate-200">{anamnesi.intolerances || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Problemi di Digestione:</span> <span className="text-slate-200">{anamnesi.digestionIssues || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Allenamenti a Settimana:</span> <span className="text-slate-200">{anamnesi.workoutsPerWeek || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Dettagli Allenamento:</span> <span className="text-slate-200">{anamnesi.trainingDetails || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Orario e Durata:</span> <span className="text-slate-200">{anamnesi.trainingTime || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Infortuni:</span> <span className="text-slate-200">{anamnesi.injuries || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Farmaci:</span> <span className="text-slate-200">{anamnesi.medications || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Integratori:</span> <span className="text-slate-200">{anamnesi.supplements || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Obiettivo Principale:</span> <span className="text-slate-200">{anamnesi.mainGoal || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Durata Percorso:</span> <span className="text-slate-200">{anamnesi.programDuration || '-'}</span></div>
                    <div><span className="text-sm font-semibold text-slate-400">Data Invio:</span> <span className="text-slate-200">{toDate(anamnesi.submittedAt)?.toLocaleDateString('it-IT') || '-'}</span></div>
                    {anamnesi.notes && (
                      <div className="col-span-2"><span className="text-sm font-semibold text-slate-400">Note:</span> <span className="text-slate-200">{anamnesi.notes}</span></div>
                    )}
                  </div>
                  {anamnesi.photoURLs && (
                    <div className="mt-4 col-span-2">
                      <h5 className="font-semibold text-slate-400">Foto:</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        {['front', 'back', 'left', 'right'].map(type => (
                          anamnesi.photoURLs[type] ? (
                            <img key={type} src={anamnesi.photoURLs[type]} alt={`${type} view`} className="w-full h-24 object-cover rounded-lg hover:scale-105 transition-transform" />
                          ) : <div key={type} className="w-full h-24 bg-zinc-900 rounded-lg flex items-center justify-center text-slate-500">Nessuna foto</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center">Nessuna anamnesi disponibile.</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}