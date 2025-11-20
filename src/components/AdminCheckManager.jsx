import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
// --- 1. NUOVE ICONE DA LUCIDE-REACT ---
import { Save, MessageSquare, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 2. STILI DEL CALENDARIO AGGIORNATI ---
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
.check-submitted-by-client { position: relative; background-color: rgba(16, 185, 129, 0.2); }
.check-submitted-by-client::after { content: ''; position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; }
`;

// --- 3. COMPONENTE NOTIFICHE ---
const Notification = ({ message, type, onDismiss }) => (
    <AnimatePresence>
        {message && (
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${
                    type === 'success' ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30' : 'bg-red-900/80 text-red-300 border-red-500/30'
                } backdrop-blur-md shadow-lg`}
            >
                {type === 'success' ? <CheckCircle2 /> : <AlertTriangle />}
                <p>{message}</p>
                <button onClick={onDismiss} className="p-2 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <X size={16} />
                </button>
            </motion.div>
        )}
    </AnimatePresence>
);


const AdminCheckManager = ({ clientId }) => {
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCheck, setSelectedCheck] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    useEffect(() => {
        const checksCollectionRef = collection(db, `clients/${clientId}/checks`);
        const q = query(checksCollectionRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const checksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChecks(checksData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [clientId]);

    const showNotification = (message, type = 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        const checkOnDate = checks.find(c => c.createdAt && c.createdAt.toDate().toDateString() === date.toDateString());
        setSelectedCheck(checkOnDate || null);
        setFeedbackText(checkOnDate?.coachFeedback || '');
    };
    
    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const hasCheck = checks.some(c => c.createdAt && c.createdAt.toDate().toDateString() === date.toDateString());
            if (hasCheck) return 'check-submitted-by-client';
        }
    };
    
    const handleSaveFeedback = async () => {
        if (!selectedCheck) return;
        setIsSaving(true);
        try {
            const checkDocRef = doc(db, 'clients', clientId, 'checks', selectedCheck.id);
            await updateDoc(checkDocRef, {
                coachFeedback: feedbackText,
                feedbackUpdatedAt: serverTimestamp()
            });
            showNotification('Feedback salvato con successo!', 'success');
        } catch (error) {
            console.error("Errore salvataggio feedback:", error);
            showNotification('Errore nel salvataggio del feedback.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <p className="text-center p-8 text-slate-400">Caricamento check...</p>;

    return (
        <>
            <style>{calendarStyles}</style>
            <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700 p-4">
                     <Calendar onChange={handleDateChange} value={selectedDate} tileClassName={tileClassName} />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {selectedCheck ? (
                        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
                            <h3 className="text-xl font-semibold text-rose-300">Dettagli Check del {selectedCheck.createdAt.toDate().toLocaleDateString('it-IT')}</h3>
                             <div className="mt-4 space-y-4">
                                <div><h4 className="font-semibold text-slate-400">Peso Registrato:</h4><p className="text-slate-50 text-xl font-bold">{selectedCheck.weight} kg</p></div>
                                <div><h4 className="font-semibold text-slate-400">Note del Cliente:</h4><p className="text-slate-300 p-3 bg-slate-800 rounded-lg whitespace-pre-wrap">{selectedCheck.notes || 'Nessuna nota.'}</p></div>
                                <div><h4 className="font-semibold text-slate-400">Foto Caricate:</h4><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">{selectedCheck.photoURLs && Object.values(selectedCheck.photoURLs).map((url, i) => <a href={url} target="_blank" rel="noopener noreferrer"><img key={i} src={url} alt={`foto ${i}`} className="rounded-lg w-full h-auto"/></a>)}</div></div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <h4 className="font-semibold text-slate-400 flex items-center gap-2"><MessageSquare size={16}/> Lascia un Feedback</h4>
                                <textarea 
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    rows="4"
                                    className="w-full mt-2 p-2.5 bg-slate-800/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-slate-200"
                                    placeholder="Scrivi qui le tue note, che saranno visibili al cliente..."
                                ></textarea>
                                <div className="flex justify-end mt-2">
                                    <button onClick={handleSaveFeedback} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-semibold disabled:opacity-50">
                                        <Save size={16}/> {isSaving ? 'Salvataggio...' : 'Salva Feedback'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 text-slate-500">
                            <p>Seleziona un giorno dal calendario per vedere i dettagli del check.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminCheckManager;
