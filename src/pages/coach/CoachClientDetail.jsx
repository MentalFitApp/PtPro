import React, { useState, useEffect, Component } from 'react';
import normalizePhotoURLs from '../../utils/normalizePhotoURLs';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, toDate, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';;
import { Users, ArrowLeft, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Error Boundary
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-red-400 flex justify-center items-center p-4">
          <p>Errore: {this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Modal per ingrandire immagini
const ImageModal = ({ src, onClose }) => (
  <AnimatePresence>
    {src && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4"
        onClick={onClose}
      >
        <motion.img
          src={src}
          alt="Ingrandita"
          className="max-w-full max-h-full object-contain rounded-lg"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-slate-700/70 rounded-full p-2 hover:bg-slate-700"
        >
          <X size={24} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

// Sezione Anamnesi - usa URL diretti (R2 o vecchi Firebase)
const AnamnesiSection = ({ title, data, photoURLs, onImageClick, variants }) => {
  const [loadedPhotos, setLoadedPhotos] = useState({});

  useEffect(() => {
    const loadPhotos = async () => {
      if (!photoURLs) return;
      // R2 URLs are already public, use them directly
      const photoEntries = Object.entries(photoURLs).map(([type, path]) => {
        return [type, path]; // Use URL directly - both R2 and old Firebase URLs should work
      });
      setLoadedPhotos(Object.fromEntries(photoEntries));
    };
    loadPhotos();
  }, [photoURLs]);

  return (
    <motion.div variants={variants} className="space-y-4">
      <h3 className="text-lg font-bold text-cyan-300">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-slate-400">{key}:</span>
            <span className="text-slate-200 font-medium">{value || 'N/D'}</span>
          </div>
        ))}
      </div>
      {photoURLs && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Foto Anamnesi</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['front', 'back', 'left', 'right'].map(type => (
              loadedPhotos[type] ? (
                <motion.img
                  key={type}
                  src={loadedPhotos[type]}
                  alt={type}
                  className="w-full h-40 object-cover rounded-lg cursor-pointer"
                  onClick={() => onImageClick(loadedPhotos[type])}
                  whileHover={{ scale: 1.05 }}
                />
              ) : (
                <div key={type} className="w-full h-40 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">
                  Nessuna foto
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Componente CheckItem aggiornato: foto grandi (h-80), freccia per mostra/nascondi foto!
const CheckItem = ({ check, onImageClick, variants }) => {
  const [loadedPhotos, setLoadedPhotos] = useState({});
  const [showPhotos, setShowPhotos] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!check.photoURLs) return;
      // R2 URLs are already public, use them directly
      const photoEntries = Object.entries(check.photoURLs).map(([type, path]) => {
        return [type, path]; // Use URL directly - both R2 and old Firebase URLs should work
      });
      setLoadedPhotos(Object.fromEntries(photoEntries));
    };
    loadPhotos();
  }, [check.photoURLs]);

  const date = toDate(check.createdAt);
  return (
    <motion.div variants={variants} className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
      <p className="text-sm font-semibold text-cyan-300 mb-2">
        Check del {date ? date.toLocaleDateString('it-IT') : 'N/D'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-400">Peso:</span>
          <span className="ml-2 font-medium text-white">{check.weight || 'N/D'} kg</span>
        </div>
        <div>
          <span className="text-slate-400">Data:</span>
          <span className="ml-2 font-medium text-white">
            {date ? date.toLocaleString('it-IT') : 'N/D'}
          </span>
        </div>
      </div>
      {check.notes && (
        <p className="mt-3 text-sm text-slate-300">
          <span className="font-medium">Note:</span> {check.notes}
        </p>
      )}
      {check.photoURLs && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowPhotos(v => !v)}
              className="bg-slate-700 text-white px-2 py-1 rounded hover:bg-slate-700 transition"
              title={showPhotos ? "Restringi sezione foto" : "Espandi sezione foto"}
            >
              {showPhotos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <span className="text-xs text-slate-400">{showPhotos ? "Nascondi foto" : "Mostra foto check"}</span>
          </div>
          {showPhotos && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {['front', 'back', 'left', 'right'].map(type => (
                loadedPhotos[type] ? (
                  <motion.img
                    key={type}
                    src={loadedPhotos[type]}
                    alt={type}
                    className="w-full h-80 object-cover rounded-xl cursor-pointer"
                    style={{ maxHeight: 'calc(92vh - 220px)' }}
                    onClick={() => onImageClick(loadedPhotos[type])}
                    whileHover={{ scale: 1.03 }}
                  />
                ) : (
                  <div key={type} className="w-full h-80 bg-slate-700 rounded-xl flex items-center justify-center text-xs text-slate-500">
                    Nessuna foto
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default function CoachClientDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [client, setClient] = useState(null);
  const [checks, setChecks] = useState([]);
  const [anamnesi, setAnamnesi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  // Estrai clientId con fallback per HashRouter
  const clientId = params.clientId || (() => {
    const match = location.pathname.match(/\/coach\/client\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  })();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    if (!clientId) {
      setError("ID cliente non valido");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const clientRef = getTenantDoc(db, 'clients', clientId);
        const clientDoc = await getDoc(clientRef);
        if (!clientDoc.exists()) {
          setError("Cliente non trovato");
          setLoading(false);
          return;
        }
        setClient({ id: clientId, ...clientDoc.data() });

        const anamnesiRef = getTenantDoc(db, 'clients', clientId, 'anamnesi', 'initial');
        const anamnesiDoc = await getDoc(anamnesiRef);
        if (anamnesiDoc.exists()) {
          let aData = anamnesiDoc.data();
          if (aData.photoURLs) {
            aData.photoURLs = normalizePhotoURLs(aData.photoURLs);
            console.debug('[CoachClientDetail] Anamnesi photoURLs normalized:', aData.photoURLs);
          }
          setAnamnesi(aData);
        } else {
          setAnamnesi(null);
        }

        const checksQuery = query(
          getTenantSubcollection(db, 'clients', clientId, 'checks'),
          orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(checksQuery, (snap) => {
          const rawChecks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const normalizedChecks = rawChecks.map(c => {
            if (c.photoURLs) {
              c.photoURLs = normalizePhotoURLs(c.photoURLs);
            }
            return c;
          });
          console.debug('[CoachClientDetail] Checks photoURLs normalized');
          setChecks(normalizedChecks);
          setLoading(false);
        }, (error) => {
          console.error('Error loading checks:', error);
          setError('Errore caricamento check');
          setLoading(false);
        });

        return () => unsub();
      } catch (err) {
        setError('Errore caricamento dati');
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId, navigate]);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  if (error) return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-900 text-red-400 flex justify-center items-center p-4">
        <p>{error}</p>
      </div>
    </ErrorBoundary>
  );

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
    </div>
  );

  const getPathStatus = (scadenza) => {
    if (!scadenza) return 'N/D';
    const diff = (toDate(scadenza) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'Scaduto';
    if (diff <= 7) return 'In scadenza';
    return 'Attivo';
  };

  return (
    <ErrorBoundary>
      <div className="overflow-x-hidden w-full min-h-screen">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full py-4 sm:py-6">
        <motion.header variants={itemVariants} className="flex justify-between items-center mb-8 mx-3 sm:mx-6">
          <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-2">
            <Users size={28} /> {client.name || 'Cliente'}
          </h1>
          <button
            onClick={() => navigate('/coach/clients')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg"
          >
            <ArrowLeft size={16} /> Indietro
          </button>
        </motion.header>

        <motion.div variants={itemVariants} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 mx-3 sm:mx-6">
          <div className="flex flex-wrap gap-2 mb-6 bg-slate-800/70 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-sm rounded-md ${activeTab === 'info' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab('check')}
              className={`px-4 py-2 text-sm rounded-md ${activeTab === 'check' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Check ({checks.length})
            </button>
            <button
              onClick={() => setActiveTab('anamnesi')}
              className={`px-4 py-2 text-sm rounded-md ${activeTab === 'anamnesi' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Anamnesi
            </button>
          </div>

          {activeTab === 'info' && (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-white">
                  {client.email || 'N/D'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inizio:</span>
                <span className="font-medium text-white">
                  {toDate(client.startDate)?.toLocaleDateString('it-IT') || 'N/D'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scadenza:</span>
                <span className="font-medium text-white">
                  {toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Stato:</span>
                <span className="font-medium text-white">{getPathStatus(client.scadenza)}</span>
              </div>
            </div>
          )}

          {activeTab === 'check' && (
            <div className="space-y-4">
              {checks.length > 0 ? (
                checks.map(check => (
                  <CheckItem key={check.id} check={check} onImageClick={setSelectedImage} variants={itemVariants} />
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">Nessun check</p>
              )}
            </div>
          )}

          {activeTab === 'anamnesi' && (
            <div>
              {anamnesi ? (
                <AnamnesiSection
                  title="Anamnesi Iniziale"
                  data={{
                    Nome: anamnesi.firstName,
                    Cognome: anamnesi.lastName,
                    'Data di Nascita': anamnesi.birthDate,
                    Lavoro: anamnesi.job,
                    Peso: anamnesi.weight ? `${anamnesi.weight} kg` : 'N/D',
                    Altezza: anamnesi.height ? `${anamnesi.height} cm` : 'N/D',
                    'Pasti al Giorno': anamnesi.mealsPerDay,
                    'Tipo Colazione': anamnesi.breakfastType,
                    'Alimenti Preferiti': anamnesi.desiredFoods,
                    'Alimenti da Evitare': anamnesi.dislikedFoods,
                    'Allergie/Intolleranze': anamnesi.intolerances,
                    'Problemi di Digestione': anamnesi.digestionIssues,
                    'Allenamenti a Settimana': anamnesi.workoutsPerWeek,
                    'Dettagli Allenamento': anamnesi.trainingDetails,
                    'Orario e Durata': anamnesi.trainingTime,
                    Infortuni: anamnesi.injuries,
                    Farmaci: anamnesi.medications,
                    Integratori: anamnesi.supplements,
                    'Obiettivo Principale': anamnesi.mainGoal,
                    'Durata Percorso': anamnesi.programDuration,
                    'Data Invio': anamnesi.submittedAt ? toDate(anamnesi.submittedAt)?.toLocaleDateString('it-IT') : 'N/D',
                  }}
                  photoURLs={anamnesi.photoURLs}
                  onImageClick={setSelectedImage}
                  variants={itemVariants}
                />
              ) : (
                <p className="text-center text-slate-400 py-8">Nessuna anamnesi</p>
              )}
            </div>
          )}
        </motion.div>

        <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
      </motion.div>
      </div>
    </ErrorBoundary>
  );
}
