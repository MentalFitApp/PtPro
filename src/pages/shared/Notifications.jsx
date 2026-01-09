import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Bell, Send, Clock, Users, UserPlus, Calendar, AlertTriangle, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_NOTIFICATIONS = {
  scadenza: {
    title: "⏰ Scadenza Imminente",
    body: "Ciao {name}, il tuo abbonamento scade tra pochi giorni. Contattaci per rinnovare!",
    icon: "⏰"
  },
  benvenuto: {
    title: "👋 Benvenuto!",
    body: "Ciao {name}, benvenuto! Inizia compilando la tua anamnesi per personalizzare la tua esperienza.",
    icon: "👋"
  },
  check: {
    title: "📊 Tempo di Check",
    body: "Ciao {name}, è ora di fare il check settimanale! Non dimenticare di inviare foto e misure.",
    icon: "📊"
  },
  motivazione: {
    title: "💪 Continua Così!",
    body: "Ciao {name}, stai facendo un ottimo lavoro! Continua così!",
    icon: "💪"
  },
  reportMancante: {
    title: "⚠️ Report Mancante",
    body: "Ciao {name}, ricordati di inviare il report giornaliero. È importante per monitorare i progressi!",
    icon: "⚠️"
  },
  appuntamento: {
    title: "📅 Promemoria Appuntamento",
    body: "Ciao {name}, ti ricordo l'appuntamento di domani. Ci vediamo!",
    icon: "📅"
  }
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('manual'); // manual, scheduled, auto
  const [clients, setClients] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [recipientType, setRecipientType] = useState('clients'); // clients, collaboratori, all
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sentNotifications, setSentNotifications] = useState([]);

  useEffect(() => {
    loadClientsAndCollaboratori();
    loadSentNotifications();
  }, []);

  const loadClientsAndCollaboratori = async () => {
    try {
      const [clientsSnap, collabSnap] = await Promise.all([
        getDocs(query(getTenantCollection(db, 'clients'), limit(500))),
        getDocs(query(getTenantCollection(db, 'collaboratori'), limit(100)))
      ]);
      
      setClients(clientsSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'client' })));
      setCollaboratori(collabSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'collaboratore' })));
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
    }
  };

  const loadSentNotifications = async () => {
    try {
      const q = query(
        getTenantCollection(db, 'notifications'),
        where('sentBy', '==', auth.currentUser.uid),
        orderBy('sentAt', 'desc'),
        limit(50) // Limita a ultime 50 notifiche
      );
      const snap = await getDocs(q);
      setSentNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Errore caricamento notifiche inviate:', error);
    }
  };

  const applyPreset = (presetKey) => {
    const preset = PRESET_NOTIFICATIONS[presetKey];
    setSelectedPreset(presetKey);
    setNotificationTitle(preset.title);
    setNotificationBody(preset.body);
  };

  const toggleRecipient = (userId) => {
    setSelectedRecipients(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAll = () => {
    const allIds = recipientType === 'clients' 
      ? clients.map(c => c.id)
      : recipientType === 'collaboratori'
      ? collaboratori.map(c => c.id)
      : [...clients.map(c => c.id), ...collaboratori.map(c => c.id)];
    setSelectedRecipients(allIds);
  };

  const clearSelection = () => setSelectedRecipients([]);

  const sendNotifications = async () => {
    if (!notificationTitle || !notificationBody) {
      setMessage({ type: 'error', text: 'Inserisci titolo e messaggio' });
      return;
    }
    if (selectedRecipients.length === 0) {
      setMessage({ type: 'error', text: 'Seleziona almeno un destinatario' });
      return;
    }

    setIsSending(true);
    try {
      const allUsers = [...clients, ...collaboratori];
      const recipients = selectedRecipients.map(id => allUsers.find(u => u.id === id));

      for (const user of recipients) {
        const personalizedTitle = notificationTitle.replace('{name}', user.name || 'utente');
        const personalizedBody = notificationBody.replace('{name}', user.name || 'utente');

        await addDoc(getTenantCollection(db, 'notifications'), {
          userId: user.id,
          userType: user.type,
          title: personalizedTitle,
          body: personalizedBody,
          read: false,
          sentAt: activeTab === 'scheduled' && scheduledDate && scheduledTime 
            ? Timestamp.fromDate(new Date(`${scheduledDate}T${scheduledTime}`))
            : serverTimestamp(),
          sentBy: auth.currentUser.uid,
          preset: selectedPreset || null,
          scheduled: activeTab === 'scheduled'
        });
      }

      setMessage({ type: 'success', text: `Notifica inviata a ${recipients.length} utenti!` });
      setNotificationTitle('');
      setNotificationBody('');
      setSelectedRecipients([]);
      setSelectedPreset('');
      loadSentNotifications();
    } catch (error) {
      console.error('Errore invio notifiche:', error);
      setMessage({ type: 'error', text: 'Errore durante l\'invio' });
    } finally {
      setIsSending(false);
    }
  };

  const recipientList = recipientType === 'clients' 
    ? clients 
    : recipientType === 'collaboratori' 
    ? collaboratori 
    : [...clients, ...collaboratori];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
          <Bell className="text-rose-400" size={32} />
          Gestione Notifiche
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Send size={18} className="inline mr-2" />
          Invio Manuale
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'scheduled'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Clock size={18} className="inline mr-2" />
          Programmate
        </button>
        <button
          onClick={() => setActiveTab('auto')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'auto'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <AlertTriangle size={18} className="inline mr-2" />
          Automatiche
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna Composizione */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'manual' || activeTab === 'scheduled' ? (
            <>
              {/* Preset */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-200">📝 Preset Rapidi</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(PRESET_NOTIFICATIONS).map(key => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedPreset === key
                          ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-rose-500/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{PRESET_NOTIFICATIONS[key].icon}</div>
                      <div className="text-xs font-medium">{key}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Notifica */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-200">✉️ Messaggio</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Titolo</label>
                    <input
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="Es: Benvenuto!"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Messaggio</label>
                    <textarea
                      value={notificationBody}
                      onChange={(e) => setNotificationBody(e.target.value)}
                      rows={4}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="Scrivi il messaggio... Usa {name} per personalizzare"
                    />
                    <p className="text-xs text-slate-400 mt-1">💡 Usa <code className="bg-slate-700 px-1 rounded">{'{name}'}</code> per inserire il nome del destinatario</p>
                  </div>

                  {activeTab === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Data</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Ora</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pulsante Invio */}
              <motion.button
                onClick={sendNotifications}
                disabled={isSending}
                whileHover={{ scale: isSending ? 1 : 1.02 }}
                whileTap={{ scale: isSending ? 1 : 0.98 }}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={20} />
                {isSending ? 'Invio in corso...' : `Invia a ${selectedRecipients.length} destinatari`}
              </motion.button>

              {message.text && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
                  {message.text}
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
              <h3 className="font-bold text-lg mb-4 text-slate-200">🤖 Notifiche Automatiche</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-200">Scadenza Imminente (3 giorni)</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-slate-400">Notifica automatica 3 giorni prima della scadenza abbonamento</p>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-200">Report Collaboratore Mancante</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-slate-400">Notifica se un collaboratore non invia il report giornaliero entro le 23:00</p>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-200">Check Settimanale Cliente</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-slate-400">Promemoria automatico ogni 7 giorni per il check settimanale</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonna Destinatari */}
        <div className="space-y-6">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h3 className="font-bold text-lg mb-4 text-slate-200 flex items-center gap-2">
              <Users size={20} />
              Destinatari ({selectedRecipients.length})
            </h3>

            {/* Tipo Destinatari */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setRecipientType('clients'); clearSelection(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  recipientType === 'clients'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Clienti
              </button>
              <button
                onClick={() => { setRecipientType('collaboratori'); clearSelection(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  recipientType === 'collaboratori'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Collaboratori
              </button>
              <button
                onClick={() => { setRecipientType('all'); clearSelection(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  recipientType === 'all'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Tutti
              </button>
            </div>

            {/* Azioni Rapide */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={selectAll}
                className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Seleziona Tutti
              </button>
              <button
                onClick={clearSelection}
                className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Deseleziona
              </button>
            </div>

            {/* Lista Utenti */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {recipientList.map(user => (
                <label
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRecipients.includes(user.id)
                      ? 'bg-rose-600/20 border border-rose-500'
                      : 'bg-slate-700/30 border border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRecipients.includes(user.id)}
                    onChange={() => toggleRecipient(user.id)}
                    className="w-4 h-4 text-rose-600 bg-slate-700 border-slate-600 rounded focus:ring-rose-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-200 text-sm">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                    {user.type === 'client' ? '👤' : '🔧'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
