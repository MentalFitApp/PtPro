import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Bell, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_PRESETS = {
  benvenuto: { icon: '👋', title: 'Benvenuto!', body: 'Ciao {name}, benvenuto in MentalFit!' },
  check: { icon: '📊', title: 'Tempo di Check', body: 'Ciao {name}, è ora di fare il check settimanale!' },
  motivazione: { icon: '💪', title: 'Continua Così!', body: 'Ciao {name}, stai facendo un ottimo lavoro!' },
  appuntamento: { icon: '📅', title: 'Promemoria', body: 'Ciao {name}, ti ricordo il nostro appuntamento!' },
  scadenza: { icon: '⏰', title: 'Scadenza Imminente', body: 'Ciao {name}, il tuo abbonamento sta per scadere. Contattaci!' },
};

export default function QuickNotifyButton({ userId, userName, userType = 'client' }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const sendNotification = async () => {
    let title = customTitle;
    let body = customBody;

    if (selectedPreset && QUICK_PRESETS[selectedPreset]) {
      title = QUICK_PRESETS[selectedPreset].title;
      body = QUICK_PRESETS[selectedPreset].body;
    }

    if (!title || !body) {
      setMessage('Inserisci titolo e messaggio o seleziona un preset');
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        userType,
        title: title.replace('{name}', userName),
        body: body.replace('{name}', userName),
        read: false,
        sentAt: serverTimestamp(),
        sentBy: auth.currentUser.uid,
        preset: selectedPreset || null,
      });

      setMessage('✅ Notifica inviata!');
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
        setSelectedPreset('');
        setCustomTitle('');
        setCustomBody('');
      }, 1500);
    } catch (error) {
      console.error('Errore invio notifica:', error);
      setMessage('❌ Errore durante l\'invio');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
        title="Invia notifica"
      >
        <Bell size={20} />
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                  <Bell className="text-rose-400" size={24} />
                  Invia Notifica
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">Destinatario:</p>
                <p className="font-medium text-slate-200">{userName}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Preset Rapidi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(QUICK_PRESETS).map(key => (
                      <button
                        key={key}
                        onClick={() => setSelectedPreset(key)}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedPreset === key
                            ? 'bg-rose-600/20 border-rose-500'
                            : 'bg-slate-700/50 border-slate-600 hover:border-rose-500/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{QUICK_PRESETS[key].icon}</div>
                        <div className="text-xs text-slate-300 truncate">{key}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Messaggio Personalizzato</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => { setCustomTitle(e.target.value); setSelectedPreset(''); }}
                    placeholder="Titolo"
                    className="w-full p-2 mb-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <textarea
                    value={customBody}
                    onChange={(e) => { setCustomBody(e.target.value); setSelectedPreset(''); }}
                    placeholder="Messaggio..."
                    rows={3}
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                {message && (
                  <div className={`p-3 rounded-lg text-center text-sm ${
                    message.includes('✅') ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
                  }`}>
                    {message}
                  </div>
                )}

                <button
                  onClick={sendNotification}
                  disabled={isSending}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {isSending ? 'Invio...' : 'Invia Notifica'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
