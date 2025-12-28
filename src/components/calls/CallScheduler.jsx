// src/components/calls/CallScheduler.jsx
// Sistema di prenotazione chiamate Admin -> Cliente
import React, { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, toDate } from '../../firebase';
import { getTenantSubcollection } from '../../config/tenant';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Calendar, Clock, X, Check, Trash2, Video, ChevronDown } from 'lucide-react';
import { notifyCallRequest } from '../../services/notificationService';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

// Modal per schedulare una chiamata (usato da Admin in ClientDetail)
export const ScheduleCallModal = ({ isOpen, onClose, clientId, clientName, existingCall, onSave }) => {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('30');
  const [callType, setCallType] = useState('video');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingCall) {
      const callDate = toDate(existingCall.scheduledAt);
      if (callDate) {
        setDate(callDate.toISOString().split('T')[0]);
        setTime(callDate.toTimeString().slice(0, 5));
      }
      setDuration(existingCall.duration || '30');
      setCallType(existingCall.callType || 'video');
      setNotes(existingCall.notes || '');
    } else {
      // Default: domani alle 10:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
      setTime('10:00');
      setDuration('30');
      setCallType('video');
      setNotes('');
    }
  }, [existingCall, isOpen]);

  const handleSave = async () => {
    if (!date || !time) return;
    
    setSaving(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`);
      const callData = {
        scheduledAt,
        duration: parseInt(duration),
        callType,
        notes,
        status: 'scheduled',
        createdAt: existingCall?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Salva nella subcollection calls del cliente
      const callRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'next');
      await setDoc(callRef, callData);
      
      onSave?.();
      onClose();
    } catch (err) {
      console.error('Errore salvataggio chiamata:', err);
      toast.error('Errore nel salvataggio della chiamata');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete('questa chiamata programmata');
    if (!confirmed) return;
    
    try {
      const callRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'next');
      await deleteDoc(callRef);
      onClose();
    } catch (err) {
      console.error('Errore eliminazione chiamata:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[90] p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }} 
            className="bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Phone size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Programma Chiamata</h3>
                  <p className="text-sm text-slate-400">{clientName}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Ora</label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={e => setTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Durata</label>
                  <select 
                    value={duration} 
                    onChange={e => setDuration(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="15">15 minuti</option>
                    <option value="30">30 minuti</option>
                    <option value="45">45 minuti</option>
                    <option value="60">1 ora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Tipo</label>
                  <select 
                    value={callType} 
                    onChange={e => setCallType(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="video">Video chiamata</option>
                    <option value="phone">Telefonata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Note (opzionale)</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Es: Revisione scheda, check mensile..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {existingCall && (
                  <button 
                    onClick={handleDelete}
                    className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg font-medium flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Elimina
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  disabled={saving || !date || !time}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {saving ? 'Salvataggio...' : (
                    <>
                      <Check size={16} /> {existingCall ? 'Aggiorna' : 'Programma'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Card che mostra la prossima chiamata (usato sia da Admin che Cliente)
export const NextCallCard = ({ clientId, isAdmin = false, onSchedule }) => {
  const [nextCall, setNextCall] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    const callRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'next');
    const unsub = onSnapshot(callRef, (snap) => {
      if (snap.exists()) {
        setNextCall({ id: snap.id, ...snap.data() });
      } else {
        setNextCall(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Errore caricamento chiamata:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [clientId]);

  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 animate-pulse">
        <div className="h-16 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  const callDate = nextCall ? toDate(nextCall.scheduledAt) : null;
  const isPast = callDate && callDate < new Date();

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${nextCall ? 'bg-cyan-500/20' : 'bg-slate-700/50'}`}>
            {nextCall?.callType === 'video' ? (
              <Video size={18} className={nextCall ? 'text-cyan-400' : 'text-slate-500'} />
            ) : (
              <Phone size={18} className={nextCall ? 'text-cyan-400' : 'text-slate-500'} />
            )}
          </div>
          <h3 className="font-semibold text-white text-sm">Prossima Chiamata</h3>
        </div>
        {isAdmin && (
          <button 
            onClick={onSchedule}
            className="text-xs px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg font-medium"
          >
            {nextCall ? 'Modifica' : 'Programma'}
          </button>
        )}
      </div>

      {nextCall && callDate ? (
        <div className={`space-y-2 ${isPast ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-2 text-white">
            <Calendar size={14} className="text-slate-400" />
            <span className="font-medium">
              {callDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            {isPast && <span className="text-xs text-amber-400 ml-2">(Passata)</span>}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-slate-400" />
              <span>{callDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span>•</span>
            <span>{nextCall.duration} min</span>
            <span>•</span>
            <span className="capitalize">{nextCall.callType === 'video' ? 'Video' : 'Telefono'}</span>
          </div>
          {nextCall.notes && (
            <p className="text-xs text-slate-400 mt-2 italic">"{nextCall.notes}"</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Nessuna chiamata programmata</p>
      )}
    </div>
  );
};

// Card richiesta chiamata per il cliente
export const RequestCallCard = ({ clientId, clientName }) => {
  const [hasRequest, setHasRequest] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestData, setRequestData] = useState(null);

  useEffect(() => {
    if (!clientId) return;

    const requestRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'request');
    const unsub = onSnapshot(requestRef, (snap) => {
      if (snap.exists()) {
        setHasRequest(true);
        setRequestData(snap.data());
      } else {
        setHasRequest(false);
        setRequestData(null);
      }
    });

    return () => unsub();
  }, [clientId]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const requestRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'request');
      await setDoc(requestRef, {
        requestedAt: serverTimestamp(),
        clientName: clientName || 'Cliente',
        status: 'pending'
      });
      
      // Invia notifica al coach
      try {
        await notifyCallRequest(clientName || 'Cliente', clientId);
      } catch (notifError) {
        // Notifica non inviata - non critico
      }
    } catch (err) {
      console.error('Errore richiesta chiamata:', err);
      toast.error('Errore nell\'invio della richiesta');
    } finally {
      setRequesting(false);
    }
  };

  const handleCancel = async () => {
    try {
      const requestRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'request');
      await deleteDoc(requestRef);
    } catch (err) {
      console.error('Errore cancellazione richiesta:', err);
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <Phone size={18} className="text-emerald-400" />
        </div>
        <h3 className="font-semibold text-white text-sm">Richiedi Chiamata</h3>
      </div>

      {hasRequest ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Check size={16} />
            <span className="text-sm font-medium">Richiesta inviata!</span>
          </div>
          <p className="text-xs text-slate-400">
            Il tuo coach ti contatterà per fissare un appuntamento.
          </p>
          <button 
            onClick={handleCancel}
            className="text-xs text-rose-400 hover:text-rose-300"
          >
            Annulla richiesta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Hai bisogno di parlare con il tuo coach? Richiedi una chiamata.
          </p>
          <button 
            onClick={handleRequest}
            disabled={requesting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            {requesting ? 'Invio...' : (
              <>
                <Phone size={16} /> Richiedi Chiamata
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// Badge per mostrare richieste pendenti (usato nella dashboard admin)
export const CallRequestsBadge = ({ clientId }) => {
  const [hasRequest, setHasRequest] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    const requestRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'request');
    const unsub = onSnapshot(requestRef, (snap) => {
      setHasRequest(snap.exists() && snap.data()?.status === 'pending');
    });

    return () => unsub();
  }, [clientId]);

  if (!hasRequest) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
      <Phone size={10} /> Chiamata richiesta
    </span>
  );
};

// Componente COMPATTO che combina NextCall + RequestCall in una sola riga
export const CallsCompactCard = ({ clientId, clientName }) => {
  const toast = useToast();
  const [nextCall, setNextCall] = useState(null);
  const [hasRequest, setHasRequest] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    // Listener prossima chiamata
    const callRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'next');
    const unsubCall = onSnapshot(callRef, (snap) => {
      setNextCall(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });

    // Listener richiesta
    const requestRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'request');
    const unsubRequest = onSnapshot(requestRef, (snap) => {
      setHasRequest(snap.exists() && snap.data()?.status === 'pending');
    });

    return () => { unsubCall(); unsubRequest(); };
  }, [clientId]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const requestRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'request');
      await setDoc(requestRef, {
        requestedAt: serverTimestamp(),
        clientName: clientName || 'Cliente',
        status: 'pending'
      });
      try {
        await notifyCallRequest(clientName || 'Cliente', clientId);
      } catch (e) {
        // Notifica fallita, ma la richiesta è stata salvata
      }
    } catch (err) {
      toast.error('Errore nell\'invio');
    } finally {
      setRequesting(false);
    }
  };

  const handleCancel = async () => {
    try {
      const requestRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'request');
      await deleteDoc(requestRef);
    } catch (err) {
      // Silently fail - la richiesta potrebbe essere già stata cancellata
    }
  };

  const callDate = nextCall ? toDate(nextCall.scheduledAt) : null;
  const isPast = callDate && callDate < new Date();

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700/50">
      {/* Header compatto cliccabile */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${nextCall ? 'bg-cyan-500/20' : 'bg-slate-700/50'}`}>
            <Phone size={14} className={nextCall ? 'text-cyan-400' : 'text-slate-500'} />
          </div>
          <div className="text-left">
            <span className="text-xs font-medium text-slate-200">
              {nextCall && callDate ? (
                <>
                  Chiamata: {callDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  {' '}<span className="text-slate-400">{callDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                  {isPast && <span className="text-amber-400 ml-1">(passata)</span>}
                </>
              ) : (
                <span className="text-slate-400">Nessuna chiamata programmata</span>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasRequest && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Richiesta ✓</span>
          )}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Contenuto espanso */}
      {expanded && (
        <div className="px-2 pb-2 border-t border-slate-700/50 pt-2 space-y-2">
          {/* Dettagli chiamata */}
          {nextCall && callDate && (
            <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span>{nextCall.duration} min</span>
              <span>•</span>
              <span>{nextCall.callType === 'video' ? 'Video' : 'Telefono'}</span>
              {nextCall.notes && <span className="italic">"{nextCall.notes}"</span>}
            </div>
          )}
          
          {/* Azione richiesta */}
          {hasRequest ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400">Il coach ti contatterà presto</span>
              <button onClick={handleCancel} className="text-[10px] text-rose-400 hover:text-rose-300">
                Annulla
              </button>
            </div>
          ) : (
            <button 
              onClick={handleRequest}
              disabled={requesting}
              className="w-full py-1.5 bg-emerald-600/80 hover:bg-emerald-600 disabled:bg-slate-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1"
            >
              {requesting ? 'Invio...' : <><Phone size={12} /> Richiedi chiamata</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default { ScheduleCallModal, NextCallCard, RequestCallCard, CallRequestsBadge, CallsCompactCard };
