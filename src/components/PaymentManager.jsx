import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp, writeBatch, getDoc } from 'firebase/firestore';
// --- 1. NUOVE ICONE DA LUCIDE-REACT ---
import { DollarSign, Plus, Trash2, Calendar, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTI UI RIUTILIZZABILI ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-zinc-950/80 rounded-2xl gradient-border p-6 text-center shadow-2xl shadow-black/40">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4"><AlertTriangle className="h-6 w-6 text-red-400" /></div>
                    <h3 className="text-lg font-bold text-slate-50">Conferma Eliminazione</h3>
                    <p className="text-sm text-slate-400 mt-2">Sei sicuro di voler eliminare questo pagamento? L'operazione non è reversibile.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={onClose} className="px-6 py-2 text-sm font-semibold text-slate-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Annulla</button>
                        <button onClick={onConfirm} className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Elimina</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const toDate = (x) => {
    if (!x) return null;
    if (typeof x?.toDate === 'function') return x.toDate();
    const d = new Date(x);
    return isNaN(d) ? null : d;
};

export default function PaymentManager({ clientId }) {
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
    const [payments, setPayments] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'clients', clientId, 'payments'), orderBy('paymentDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [clientId]);

    const onAddPayment = async (data) => {
        try {
            const durationNum = parseInt(data.duration, 10);
            const batch = writeBatch(db);
            const newPaymentRef = doc(collection(db, 'clients', clientId, 'payments'));
            batch.set(newPaymentRef, {
                amount: parseFloat(data.amount),
                duration: `${durationNum} mes${durationNum > 1 ? 'i' : 'e'}`,
                paymentMethod: data.paymentMethod,
                paymentDate: serverTimestamp(),
            });

            const clientRef = doc(db, 'clients', clientId);
            const clientSnap = await getDoc(clientRef);
            const clientData = clientSnap.data();
            let currentExpiry = toDate(clientData.scadenza);
            if (!currentExpiry || currentExpiry < new Date()) {
                currentExpiry = new Date();
            }
            const newExpiryDate = new Date(currentExpiry);
            newExpiryDate.setMonth(newExpiryDate.getMonth() + durationNum);
            batch.update(clientRef, { scadenza: newExpiryDate });

            await batch.commit();
            reset();
            setShowForm(false);
        } catch (error) {
            console.error("Errore nell'aggiungere il pagamento:", error);
            // In un'app reale, useremmo un sistema di notifiche migliore
        }
    };

    const handleDeletePayment = async () => {
        if (!paymentToDelete) return;
        try {
            const paymentRef = doc(db, 'clients', clientId, 'payments', paymentToDelete.id);
            await deleteDoc(paymentRef);
        } catch (error) {
            console.error("Errore nell'eliminazione del pagamento:", error);
        } finally {
            setPaymentToDelete(null); // Chiude il modal
        }
    };
    
    // --- 3. STILI AGGIORNATI ---
    const inputStyle = "w-full p-2.5 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 placeholder:text-slate-500";
    const labelStyle = "block mb-1 text-sm font-medium text-slate-300";

    return (
        <>
            <ConfirmationModal 
                isOpen={!!paymentToDelete}
                onClose={() => setPaymentToDelete(null)}
                onConfirm={handleDeletePayment}
            />
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-rose-300 flex items-center gap-2"><DollarSign size={20} /> Gestione Pagamenti</h3>
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg text-sm transition-colors">
                      {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Annulla' : 'Aggiungi Rinnovo'}
                    </button>
                </div>
                
                <AnimatePresence>
                    {showForm && (
                      <motion.form 
                        onSubmit={handleSubmit(onAddPayment)} 
                        className="space-y-4 mb-6 pt-4 border-t border-white/10"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className={labelStyle}>Importo Pagato (€)*</label><input type="number" step="0.01" {...register('amount', { required: true })} className={inputStyle} /></div>
                          <div><label className={labelStyle}>Durata Rinnovo (mesi)*</label><select {...register('duration', { required: true })} className={inputStyle}>{[...Array(24).keys()].map(i => <option key={i+1} value={i+1}>{i+1} mes{i > 0 ? 'i' : 'e'}</option>)}</select></div>
                          <div className="md:col-span-2"><label className={labelStyle}>Metodo di Pagamento</label><input {...register('paymentMethod')} className={inputStyle} placeholder="Es. Bonifico" /></div>
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold transition disabled:opacity-50">{isSubmitting ? 'Salvataggio...' : 'Salva Pagamento'}</button>
                        </div>
                      </motion.form>
                    )}
                </AnimatePresence>
                
                <h4 className="font-semibold text-slate-200 mb-3 mt-4">Cronologia Rinnovi</h4>
                <div className="space-y-2">
                    {payments.length > 0 ? payments.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-zinc-900/70 rounded-md border border-white/10">
                        <div className="flex items-center gap-3">
                          <Calendar className="text-slate-400"/>
                          <div>
                            <p className="font-semibold text-slate-100">{p.duration} - €{p.amount.toFixed(2)}</p>
                            <p className="text-xs text-slate-400">Pagato il {toDate(p.paymentDate)?.toLocaleDateString('it-IT')}{p.paymentMethod && ` via ${p.paymentMethod}`}</p>
                          </div>
                        </div>
                        <button onClick={() => setPaymentToDelete(p)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-md transition-colors"><Trash2 size={16}/></button>
                      </div>
                    )) : <p className="text-sm text-slate-500">Nessun pagamento registrato.</p>}
                </div>
            </div>
        </>
    );
}

