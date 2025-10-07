import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot, collection, query, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, deleteObject } from 'firebase/storage';
import { ArrowLeft, User, FileText, CheckSquare, ChevronDown, FilePenLine, DollarSign, Trash2, Copy, Check, KeyRound, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import PaymentManager from '../components/PaymentManager';

// Stili per il calendario
const calendarStyles = `
.react-calendar { width: 100%; background: transparent; border: none; font-family: inherit; }
.react-calendar__navigation button { color: #f472b6; font-weight: bold; font-size: 1.1em; }
.react-calendar__navigation button:hover, .react-calendar__navigation button:focus { background: rgba(255, 255, 255, 0.1); border-radius: 0.5rem; }
.react-calendar__month-view__weekdays__weekday { color: #9ca3af; text-transform: uppercase; font-size: 0.75rem; font-weight: 600; }
.react-calendar__tile { color: #d1d5db; border-radius: 0.5rem; height: 50px; }
.react-calendar__tile:disabled { color: #6b7280; }
.react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background: rgba(255, 255, 255, 0.1); }
.react-calendar__tile--now { background: rgba(63, 63, 70, 0.7); font-weight: bold; }
.react-calendar__tile--active { background: #db2777; color: white; }
.check-day-highlight { position: relative; background-color: rgba(16, 185, 129, 0.2); }
.check-day-highlight::after { content: ''; position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; }
`;

function toDate(x) {
    if (!x) return null;
    if (typeof x?.toDate === 'function') return x.toDate();
    const d = new Date(x);
    return isNaN(d) ? null : d;
}

// --- COMPONENTI INTERNI RESTILIZZATI ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-zinc-950/80 rounded-2xl gradient-border p-6 text-center shadow-2xl shadow-black/40">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4"><AlertTriangle className="h-6 w-6 text-red-400" /></div>
                    <h3 className="text-lg font-bold text-slate-50">{title}</h3>
                    <div className="text-sm text-slate-400 mt-2">{children}</div>
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={onClose} className="px-6 py-2 text-sm font-semibold text-slate-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Annulla</button>
                        <button onClick={onConfirm} className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Elimina</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const AnamnesiContent = ({ clientId }) => {
  const [anamnesiData, setAnamnesiData] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'clients', clientId, 'anamnesi', 'initial'), (docSnap) => setAnamnesiData(docSnap.exists() ? docSnap.data() : null));
    return () => unsub();
  }, [clientId]);

  if (anamnesiData === null) return <p className="text-slate-400 text-center p-4">Caricamento...</p>;
  if (anamnesiData) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6">
        <h3 className="text-xl font-semibold text-rose-300 mb-4">Anamnesi Compilata</h3>
        {Object.entries(anamnesiData).map(([key, value]) => {
          if (['createdAt', 'submittedAt', 'tempPassword'].includes(key)) return null;
          return (
            <div key={key} className="pb-2 border-b border-white/10 last:border-b-0">
              <h4 className="font-semibold text-slate-400 capitalize text-sm">{key.replace(/([A-Z])/g, ' $1')}</h4>
              <p className="text-slate-200 whitespace-pre-wrap">{String(value) || 'N/D'}</p>
            </div>
          )
        })}
      </motion.div>
    );
  }
  return <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6"><p className="text-center text-slate-400">Il cliente non ha ancora compilato l'anamnesi.</p></div>;
};

const CheckItem = ({ check, clientId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coachNotes, setCoachNotes] = useState(check.coachNotes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try { await updateDoc(doc(db, 'clients', clientId, 'checks', check.id), { coachNotes }); }
        finally { setIsSaving(false); }
    };

    const handleDeleteCheck = async () => {
        setShowDeleteModal(false);
        try {
            if (check.photoURLs) {
                const photoPaths = Object.values(check.photoURLs);
                await Promise.all(photoPaths.map(url => {
                    try {
                        const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
                        return deleteObject(ref(storage, path));
                    } catch (e) { console.warn("Could not delete photo from storage:", e); return Promise.resolve(); }
                }));
            }
            await deleteDoc(doc(db, 'clients', clientId, 'checks', check.id));
        } catch (error) { console.error("Errore eliminazione:", error); }
    };

    return (
        <>
            <ConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteCheck} title="Elimina Check">
                <p>Sei sicuro di voler eliminare questo check? Le foto associate verranno rimosse permanentemente.</p>
            </ConfirmationModal>
            <div className="bg-zinc-900/70 rounded-lg border border-white/10 overflow-hidden">
                <div className="flex justify-between items-center p-4">
                    <button onClick={() => setIsOpen(!isOpen)} className="flex-1 flex justify-between items-center text-left">
                        <span className="font-semibold text-slate-200">Check del {toDate(check.createdAt)?.toLocaleDateString('it-IT')}</span>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown className="text-slate-400"/></motion.div>
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="ml-4 p-1.5 text-slate-500 hover:text-red-400 rounded-md" title="Elimina Check"><Trash2 size={14}/></button>
                </div>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4">
                            <div className="pt-4 border-t border-white/20 space-y-4">
                                <div><h4 className="text-sm font-semibold text-slate-400 mb-2">Note del cliente:</h4><p className="text-slate-300 whitespace-pre-wrap">{check.notes || '-'}</p></div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{check.photoURLs && Object.values(check.photoURLs).map((url, index) => <a key={index} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Foto ${index + 1}`} className="rounded-md aspect-square object-cover" /></a>)}</div>
                                <div className="pt-4 border-t border-white/20"><h4 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2"><FilePenLine size={14}/> Feedback:</h4><textarea value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)} rows="3" className="w-full p-2 bg-zinc-950 rounded-lg border border-white/10" placeholder="Scrivi qui il tuo feedback..."/>
                                    <div className="flex justify-end mt-2"><button onClick={handleSaveNotes} disabled={isSaving} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg">{isSaving ? 'Salvo...' : 'Salva'}</button></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

const ChecksContent = ({ clientId }) => {
  const [checks, setChecks] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'clients', clientId, 'checks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => setChecks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [clientId]);
  const tileClassName = ({ date, view }) => {
    if (view === 'month' && checks.some(c => toDate(c.createdAt)?.toDateString() === date.toDateString())) return 'check-day-highlight';
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-4"><Calendar tileClassName={tileClassName} /></div>
        <div className="lg:col-span-2 space-y-2 max-h-[600px] overflow-y-auto pr-2">{checks.length > 0 ? checks.map(check => <CheckItem key={check.id} check={check} clientId={clientId} />) : <p className="text-center text-slate-500 p-8">Nessun check ancora registrato.</p>}</div>
    </div>
  );
};

// --- COMPONENTE PRINCIPALE ---
export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState('anamnesi');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
      const tab = new URLSearchParams(location.search).get('tab');
      if (tab) setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'clients', clientId), (docSnap) => {
        if (docSnap.exists()) setClient({ id: docSnap.id, ...docSnap.data() });
        else navigate('/clients');
    });
    return () => unsub();
  }, [clientId, navigate]);
  
  const copyCredentialsToClipboard = () => {
      if (!client || !client.tempPassword) return;
      const loginLink = "https://mentalfitmanager.github.io/#/client-login";
      const text = `Ciao ${client.name},\n\nBenvenuto in PT Manager, la tua area personale per monitorare i progressi e comunicare con il tuo coach!\n\nEcco le credenziali per il tuo primo accesso:\n\nLink: ${loginLink}\nEmail: ${client.email}\nPassword Temporanea: ${client.tempPassword}\n\nAl primo accesso ti verrà chiesto di impostare una password personale.\nA presto!`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
  };

  if (!client) return <div className="text-center text-slate-400 p-8">Caricamento...</div>;
  
  const formattedDate = toDate(client.createdAt)?.toLocaleDateString('it-IT') || 'N/A';

  const TabButton = ({ tabName, label, icon }) => (
    <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${activeTab === tabName ? 'border-b-2 border-rose-500 text-slate-50' : 'text-slate-400 hover:text-slate-200'}`}>
        {icon} {label}
    </button>
  );

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="w-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <header className="flex items-center justify-between mb-6">
                <div><h1 className="text-3xl font-bold text-slate-50">{client.name}</h1><p className="text-slate-400">Cliente dal: {formattedDate}</p></div>
                <button onClick={() => navigate('/clients')} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-sm rounded-lg transition-colors"><ArrowLeft size={16} /> Torna</button>
            </header>
            
            <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-500/20 text-rose-300 p-3 rounded-full"><User size={24} /></div>
                    <div><h2 className="text-xl font-semibold text-slate-100">Profilo</h2><p className="text-slate-400">{client.email}</p>{client.phone && <p className="text-slate-400">{client.phone}</p>}</div>
                </div>

                {/* --- SEZIONE CREDENZIALI AGGIORNATA --- */}
                {client.firstLogin && client.tempPassword && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-semibold text-slate-400 mb-3">Credenziali di Accesso Temporanee</h4>
                        <div className="space-y-3 mb-4">
                             <div className="bg-zinc-900 p-3 rounded-lg border border-white/10">
                                <p className="text-xs text-slate-400">Email (Username)</p>
                                <p className="font-mono text-slate-200">{client.email}</p>
                            </div>
                            <div className="bg-zinc-900 p-3 rounded-lg border border-white/10">
                                <p className="text-xs text-slate-400">Password Temporanea</p>
                                <p className="font-mono text-slate-200">{client.tempPassword}</p>
                            </div>
                        </div>
                        <button onClick={copyCredentialsToClipboard} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors">
                            {copied ? <><Check size={18}/> Copiato!</> : <><Copy size={16}/> Copia Messaggio di Benvenuto</>}
                        </button>
                         <p className="text-xs text-slate-500 mt-2 text-center">Copia il messaggio completo con link, email e password da inviare al cliente.</p>
                    </div>
                )}
            </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex border-b border-white/10 mb-6">
                <TabButton tabName="anamnesi" label="Anamnesi" icon={<FileText size={16}/>}/>
                <TabButton tabName="checks" label="Checks" icon={<CheckSquare size={16}/>}/>
                <TabButton tabName="payments" label="Pagamenti" icon={<DollarSign size={16}/>}/>
            </div>
            <div>
                {activeTab === 'anamnesi' && <AnamnesiContent clientId={clientId} />}
                {activeTab === 'checks' && <ChecksContent clientId={clientId} />}
                {activeTab === 'payments' && (
                    <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6">
                        <PaymentManager clientId={clientId} />
                    </div>
                )}
            </div>
        </motion.div>
      </div>
    </>
  );
}

