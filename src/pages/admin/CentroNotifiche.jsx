import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantCollection } from '../../config/tenant';
import { 
  Bell, Send, Users, Filter, Clock, CheckCircle2, 
  AlertCircle, Search, Calendar, X, UserCheck, Plus,
  FileText, Activity, Dumbbell, Utensils, MessageSquare,
  ChevronDown, ChevronRight, TrendingUp, Zap
} from 'lucide-react';
import { 
  sendBulkNotification, 
  NOTIFICATION_TYPES, 
  getNotificationHistory 
} from '../../services/notificationService';
import { useToast } from '../../contexts/ToastContext';

// Template predefiniti di notifiche
const NOTIFICATION_TEMPLATES = {
  WORKOUT_REMINDER: {
    title: '💪 È ora di allenarti!',
    body: 'Non dimenticare di completare il tuo allenamento di oggi',
    icon: Dumbbell,
    color: 'blue'
  },
  CHECK_REMINDER: {
    title: '📊 Carica il tuo check-in',
    body: 'È passata una settimana dall\'ultimo check! Scatta le foto e carica i progressi',
    icon: Activity,
    color: 'green'
  },
  NUTRITION_REMINDER: {
    title: '🍎 Controlla la tua alimentazione',
    body: 'Ricordati di seguire il piano alimentare per raggiungere i tuoi obiettivi',
    icon: Utensils,
    color: 'emerald'
  },
  MOTIVATION: {
    title: '🔥 Continua così!',
    body: 'Ogni giorno è un passo verso il tuo obiettivo. Non mollare!',
    icon: TrendingUp,
    color: 'amber'
  },
  CUSTOM: {
    title: '',
    body: '',
    icon: Bell,
    color: 'purple'
  }
};

// Filtri clienti
const CLIENT_FILTERS = {
  ALL: { label: 'Tutti i Clienti', value: 'all', icon: Users },
  ACTIVE: { label: 'Clienti Attivi', value: 'active', icon: CheckCircle2 },
  EXPIRED: { label: 'Abbonamenti Scaduti', value: 'expired', icon: AlertCircle },
  NO_CHECK_7D: { label: 'Nessun Check da 7+ giorni', value: 'no_check_7d', icon: Activity },
  NO_CHECK_14D: { label: 'Nessun Check da 14+ giorni', value: 'no_check_14d', icon: Activity },
  CUSTOM: { label: 'Selezione Manuale', value: 'custom', icon: UserCheck }
};

export default function CentroNotifiche() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('send'); // send | history
  const [selectedTemplate, setSelectedTemplate] = useState('CUSTOM');
  const [notificationData, setNotificationData] = useState({ title: '', body: '' });
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showClientList, setShowClientList] = useState(false);

  // Carica clienti
  useEffect(() => {
    loadClients();
  }, []);

  // Carica storico quando cambi tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadClients = async () => {
    try {
      const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
      const clientsData = await Promise.all(
        clientsSnap.docs.map(async (doc) => {
          const data = doc.data();
          
          // Verifica ultimo check-in
          const checksSnap = await getDocs(
            query(
              getTenantCollection(db, `clients/${doc.id}/checks`),
              orderBy('createdAt', 'desc'),
              limit(1)
            )
          );
          
          const lastCheck = checksSnap.empty ? null : checksSnap.docs[0].data().createdAt?.toDate();
          const daysSinceLastCheck = lastCheck 
            ? Math.floor((new Date() - lastCheck) / (1000 * 60 * 60 * 24))
            : 999;

          return {
            id: doc.id,
            name: data.name || 'Cliente',
            email: data.email || '',
            scadenza: data.scadenza?.toDate?.(),
            isActive: data.scadenza?.toDate?.() > new Date(),
            lastCheck,
            daysSinceLastCheck
          };
        })
      );
      
      setClients(clientsData);
    } catch (error) {
      console.error('Errore caricamento clienti:', error);
      toast.error('Errore nel caricamento dei clienti');
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const historyData = await getNotificationHistory(30);
      setHistory(historyData);
    } catch (error) {
      console.error('Errore caricamento storico:', error);
      toast.error('Errore nel caricamento dello storico');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Applica filtro ai clienti
  const getFilteredClients = () => {
    let filtered = clients;

    // Applica filtro predefinito
    switch (selectedFilter) {
      case 'ACTIVE':
        filtered = clients.filter(c => c.isActive);
        break;
      case 'EXPIRED':
        filtered = clients.filter(c => !c.isActive);
        break;
      case 'NO_CHECK_7D':
        filtered = clients.filter(c => c.daysSinceLastCheck >= 7);
        break;
      case 'NO_CHECK_14D':
        filtered = clients.filter(c => c.daysSinceLastCheck >= 14);
        break;
      case 'CUSTOM':
        // Usa selectedClients
        return clients.filter(c => selectedClients.includes(c.id));
      default:
        break;
    }

    // Applica ricerca
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    const template = NOTIFICATION_TEMPLATES[templateKey];
    setNotificationData({
      title: template.title,
      body: template.body
    });
  };

  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.body) {
      toast.warning('Compila titolo e messaggio');
      return;
    }

    const targetClients = getFilteredClients();
    
    if (targetClients.length === 0) {
      toast.warning('Nessun cliente selezionato');
      return;
    }

    const confirmed = window.confirm(
      `Vuoi inviare questa notifica a ${targetClients.length} cliente${targetClients.length > 1 ? 'i' : ''}?`
    );

    if (!confirmed) return;

    setSending(true);
    try {
      const clientIds = targetClients.map(c => c.id);
      await sendBulkNotification(
        clientIds,
        notificationData.title,
        notificationData.body,
        NOTIFICATION_TYPES.CUSTOM
      );

      toast.success(`Notifica inviata a ${targetClients.length} clienti!`);
      
      // Reset form
      setNotificationData({ title: '', body: '' });
      setSelectedTemplate('CUSTOM');
      setSelectedFilter('ALL');
      setSelectedClients([]);
      
      // Ricarica storico
      if (activeTab === 'history') {
        loadHistory();
      }
    } catch (error) {
      console.error('Errore invio notifica:', error);
      toast.error('Errore nell\'invio della notifica');
    } finally {
      setSending(false);
    }
  };

  const toggleClientSelection = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const filteredClients = getFilteredClients();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl ring-2 ring-purple-500/30">
                <Bell className="text-purple-400" size={28} />
              </div>
              Centro Notifiche
            </h1>
            <p className="text-slate-400 mt-2">Invia notifiche push ai tuoi clienti e monitora lo storico</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'send'
                ? 'bg-purple-500/20 text-purple-300 ring-2 ring-purple-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <Send size={18} />
            Invia Notifiche
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-purple-500/20 text-purple-300 ring-2 ring-purple-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <Clock size={18} />
            Storico
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'send' ? (
            <motion.div
              key="send"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Form Notifica */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Template Selection */}
                <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl border border-slate-700/30 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="text-amber-400" size={20} />
                    Template Rapidi
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(NOTIFICATION_TEMPLATES).map(([key, template]) => {
                      const Icon = template.icon;
                      const colorClasses = {
                        blue: 'bg-blue-500/20 text-blue-300 ring-blue-500/30 hover:bg-blue-500/30',
                        green: 'bg-green-500/20 text-green-300 ring-green-500/30 hover:bg-green-500/30',
                        emerald: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30 hover:bg-emerald-500/30',
                        amber: 'bg-amber-500/20 text-amber-300 ring-amber-500/30 hover:bg-amber-500/30',
                        purple: 'bg-purple-500/20 text-purple-300 ring-purple-500/30 hover:bg-purple-500/30'
                      };
                      
                      return (
                        <button
                          key={key}
                          onClick={() => handleTemplateSelect(key)}
                          className={`p-4 rounded-lg border transition-all flex items-center gap-3 ${
                            selectedTemplate === key
                              ? `ring-2 ${colorClasses[template.color]}`
                              : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-sm font-medium text-left">
                            {template.title || 'Personalizzato'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form */}
                <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl border border-slate-700/30 p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Titolo Notifica
                    </label>
                    <input
                      type="text"
                      value={notificationData.title}
                      onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Es: 💪 È ora di allenarti!"
                      maxLength={50}
                    />
                    <p className="text-xs text-slate-500 mt-1">{notificationData.title.length}/50 caratteri</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Messaggio
                    </label>
                    <textarea
                      value={notificationData.body}
                      onChange={(e) => setNotificationData(prev => ({ ...prev, body: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Scrivi il messaggio della notifica..."
                      rows={4}
                      maxLength={200}
                    />
                    <p className="text-xs text-slate-500 mt-1">{notificationData.body.length}/200 caratteri</p>
                  </div>

                  <button
                    onClick={handleSendNotification}
                    disabled={sending || !notificationData.title || !notificationData.body}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {sending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Invia a {filteredClients.length} cliente{filteredClients.length !== 1 ? 'i' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Filtri e Preview Destinatari */}
              <div className="space-y-6">
                
                {/* Filtri */}
                <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl border border-slate-700/30 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Filter className="text-cyan-400" size={20} />
                    Destinatari
                  </h3>
                  
                  <div className="space-y-2">
                    {Object.entries(CLIENT_FILTERS).map(([key, filter]) => {
                      const Icon = filter.icon;
                      let count = 0;
                      
                      if (key === 'ALL') count = clients.length;
                      else if (key === 'ACTIVE') count = clients.filter(c => c.isActive).length;
                      else if (key === 'EXPIRED') count = clients.filter(c => !c.isActive).length;
                      else if (key === 'NO_CHECK_7D') count = clients.filter(c => c.daysSinceLastCheck >= 7).length;
                      else if (key === 'NO_CHECK_14D') count = clients.filter(c => c.daysSinceLastCheck >= 14).length;
                      else if (key === 'CUSTOM') count = selectedClients.length;

                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedFilter(key);
                            if (key === 'CUSTOM') {
                              setShowClientList(true);
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${
                            selectedFilter === key
                              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                              : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon size={16} />
                            <span className="text-sm font-medium">{filter.label}</span>
                          </div>
                          <span className="text-xs font-semibold">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-blue-200">
                      <p className="font-medium mb-1">Notifiche Push</p>
                      <p className="text-blue-300/80">
                        Le notifiche verranno inviate a tutti i clienti che hanno attivato le notifiche sul dispositivo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-800/20 backdrop-blur-sm rounded-xl border border-slate-700/30 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Clock className="text-amber-400" size={20} />
                Storico Notifiche (ultimi 30 giorni)
              </h3>

              {loadingHistory ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="mx-auto text-slate-600 mb-4" size={48} />
                  <p className="text-slate-400">Nessuna notifica inviata negli ultimi 30 giorni</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, idx) => (
                    <motion.div
                      key={item.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-slate-700/30 rounded-lg border border-slate-600 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-white mb-1">{item.title}</p>
                          <p className="text-sm text-slate-300 mb-2">{item.body}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {item.recipientCount || 1} destinatari
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {item.createdAt?.toDate?.().toLocaleDateString('it-IT')} alle{' '}
                              {item.createdAt?.toDate?.().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Inviata
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Selezione Clienti */}
        <AnimatePresence>
          {showClientList && selectedFilter === 'CUSTOM' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowClientList(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[80vh] flex flex-col"
              >
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Seleziona Clienti</h3>
                  <button
                    onClick={() => setShowClientList(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="text-slate-400" size={20} />
                  </button>
                </div>

                <div className="p-6 border-b border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cerca cliente..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-2">
                    {clients
                      .filter(c => 
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(client => (
                        <button
                          key={client.id}
                          onClick={() => toggleClientSelection(client.id)}
                          className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                            selectedClients.includes(client.id)
                              ? 'bg-purple-500/20 border-purple-500/30'
                              : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedClients.includes(client.id)
                                ? 'bg-purple-500 border-purple-500'
                                : 'border-slate-500'
                            }`}>
                              {selectedClients.includes(client.id) && (
                                <CheckCircle2 size={14} className="text-white" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-white">{client.name}</p>
                              <p className="text-xs text-slate-400">{client.email}</p>
                            </div>
                          </div>
                          {client.daysSinceLastCheck >= 7 && (
                            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">
                              No check da {client.daysSinceLastCheck}gg
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="p-6 border-t border-slate-700 flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    {selectedClients.length} clienti selezionati
                  </p>
                  <button
                    onClick={() => setShowClientList(false)}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    Conferma
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
