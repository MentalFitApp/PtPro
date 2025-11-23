import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import { useNavigate } from 'react-router-dom';
import { getTenantSubcollection } from '../../config/tenant';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ArrowLeft, FilePenLine, UploadCloud, Send, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { uploadPhoto } from '../../storageUtils.js';
import normalizePhotoURLs from '../../utils/normalizePhotoURLs';

// Stili personalizzati per il calendario
const calendarStyles = `
  .react-calendar { width: 100%; background: transparent; border: none; font-family: inherit; }
  .react-calendar__navigation button { color: #67e8f9; font-weight: bold; font-size: 1.1em; }
  .react-calendar__navigation button:hover, .react-calendar__navigation button:focus { background: rgba(255, 255, 255, 0.1); border-radius: 0.5rem; }
  .react-calendar__month-view__weekdays__weekday { color: #9ca3af; text-transform: uppercase; font-size: 0.75rem; font-weight: 600; }
  .react-calendar__tile { color: #d1d5db; border-radius: 0.5rem; height: 50px; }
  .react-calendar__tile:disabled { color: #6b7280; }
  .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background: rgba(255, 255, 255, 0.1); }
  .react-calendar__tile--now { background: rgba(63, 63, 70, 0.7); font-weight: bold; }
  .react-calendar__tile--active { background: #0891b2; color: white; }
  .check-day { position: relative; }
  .check-day::after { content: ''; position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; border-radius: 50%; background-color: #f43f5e; }
  .check-submitted { position: relative; background-color: rgba(16, 185, 129, 0.2); }
  .check-submitted::after { content: ''; position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; }
`;

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${type === 'success' ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30' : 'bg-red-900/80 text-red-300 border-red-500/30'} backdrop-blur-md shadow-lg`}
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

const ClientUploadForm = ({ formState, setFormState, handleSubmit, isUploading, uploadProgress, handleFileChange }) => {
  const handleCancel = () => setFormState({ id: null, notes: '', weight: '', photos: {}, photoPreviews: {} });

  const PhotoUploader = ({ type, label, preview }) => (
    <div className="text-center">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div className="mt-2 flex justify-center items-center w-full h-48 bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-600 hover:border-cyan-500 transition-colors relative group">
        {preview ? (
          <img src={preview} alt="preview" className="h-full w-full object-contain rounded-lg p-1" />
        ) : (
          <div className="flex flex-col items-center text-slate-400 transition-colors group-hover:text-cyan-400">
            <UploadCloud size={32} />
            <p className="mt-2 text-sm">Carica foto</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, type)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg mb-4 text-cyan-300">{formState.id ? 'Modifica Check' : 'Carica Check'}</h3>
        <button onClick={handleCancel} className="text-slate-400 hover:text-white p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Peso Attuale (kg)*</label>
          <input
            type="number"
            step="0.1"
            value={formState.weight}
            onChange={(e) => setFormState(prev => ({ ...prev, weight: e.target.value }))}
            required
            className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200"
            placeholder="Es. 75.5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Note sul check</label>
          <textarea
            value={formState.notes}
            onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
            rows="4"
            className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PhotoUploader type="front" label="Frontale" preview={formState.photoPreviews.front} />
          <PhotoUploader type="right" label="Laterale Destro" preview={formState.photoPreviews.right} />
          <PhotoUploader type="left" label="Laterale Sinistro" preview={formState.photoPreviews.left} />
          <PhotoUploader type="back" label="Posteriore" preview={formState.photoPreviews.back} />
        </div>
        {isUploading && (
          <div className="w-full bg-slate-700/50 rounded-lg h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-400 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition font-semibold disabled:opacity-50"
          >
            <Send size={16} />
            {isUploading ? `Caricamento ${uploadProgress}%` : (formState.id ? 'Salva Modifiche' : 'Invia Check')}
          </button>
        </div>
      </form>
    </div>
  );
};

const ImageModal = ({ isOpen, imageUrl, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-6xl max-h-[90vh] w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full z-10 transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={imageUrl}
            alt="Full size"
            className="w-full h-full object-contain rounded-lg"
          />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CheckDetails = ({ check, handleEditClick }) => {
  const [photoURLs, setPhotoURLs] = useState({});
  const [modalImage, setModalImage] = useState(null);
  const isEditable = check.createdAt ? (new Date() - check.createdAt.toDate()) / (1000 * 60 * 60) < 2 : false; // 2 ore

  useEffect(() => {
    const loadPhotos = async () => {
      if (check.photoURLs) {
        // R2 URLs are already public URLs, no need to fetch them
        // Just use them directly (all new uploads will be R2 URLs starting with http)
        const normalized = normalizePhotoURLs(check.photoURLs);
        setPhotoURLs(normalized);
        console.debug('[ClientChecks] Normalized photoURLs for check', check.id, normalized);
      }
    };
    loadPhotos();
  }, [check.photoURLs]);

  return (
    <div>
      <ImageModal
        isOpen={!!modalImage}
        imageUrl={modalImage}
        onClose={() => setModalImage(null)}
      />
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-cyan-300">Riepilogo del {check.createdAt?.toDate().toLocaleDateString('it-IT') || 'N/D'}</h3>
        {isEditable && (
          <button
            onClick={() => handleEditClick(check)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 text-sm font-semibold rounded-lg"
          >
            <FilePenLine size={14} /> Modifica
          </button>
        )}
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <h4 className="font-semibold text-slate-300">Peso Registrato:</h4>
          <p className="text-white text-xl font-bold">{check.weight} kg</p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-300">Note:</h4>
          <p className="text-slate-400 p-3 bg-slate-700/50 rounded-lg whitespace-pre-wrap">{check.notes || 'Nessuna nota.'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-300">Foto:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            {['front', 'right', 'left', 'back'].map((type) => (
              <div key={type} className="text-center relative group">
                <h5 className="text-sm font-semibold text-slate-400 capitalize">
                  {type === 'front' ? 'Frontale' : type === 'back' ? 'Posteriore' : `Laterale ${type === 'left' ? 'Sinistro' : 'Destro'}`}
                </h5>
                {photoURLs[type] ? (
                  <button
                    onClick={() => setModalImage(photoURLs[type])}
                    className="block w-full h-48 overflow-hidden rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-500/20 cursor-pointer"
                  >
                    <img
                      src={photoURLs[type]}
                      alt={type}
                      className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                    />
                  </button>
                ) : (
                  <div className="w-full h-48 bg-slate-700/50 rounded-lg text-slate-500 flex items-center justify-center">Foto non disponibile</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ClientChecks() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formState, setFormState] = useState({ id: null, notes: '', weight: '', photos: {}, photoPreviews: {} });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchInitialData = async () => {
      try {
        // const clientDocRef = getTenantDoc(db, 'clients', user.uid);
        // const clientDoc = await getDoc(clientDocRef);
        // clientStartDate non utilizzato, commento il caricamento
        // if (clientDoc.exists() && clientDoc.data().createdAt) {
        //   setClientStartDate(clientDoc.data().createdAt.toDate());
        // } else {
        //   setClientStartDate(new Date());
        // }
        
        const checksCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'checks');
        const q = query(checksCollectionRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const checksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // R2 URLs are already public, no need to fetch them
          // Just use them directly (all new uploads will be R2 URLs starting with http)
          const updatedChecks = checksData.map((check) => {
            if (check.photoURLs) {
              return { ...check, photoURLs: normalizePhotoURLs(check.photoURLs) };
            }
            return check;
          });
          console.debug('[ClientChecks] Snapshot normalized');
          setChecks(updatedChecks);
          setLoading(false);
        }, (err) => {
          console.error("Errore snapshot checks:", err);
          setError("Errore nel caricamento dei check.");
          setLoading(false);
        });
        return unsubscribe;
      } catch (err) {
        console.error("Errore fetchInitialData:", err);
        setError("Errore nel caricamento dei dati.");
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user, navigate]);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  const getSuggestedCheckDays = (date) => {
    try {
      if (!checks.length) return [];
      const firstCheck = checks.reduce((earliest, check) => {
        const checkDate = check.createdAt?.toDate();
        return (!earliest || (checkDate && checkDate < earliest)) ? checkDate : earliest;
      }, null);
      if (!firstCheck) return [];
      let checkDays = [];
      let currentCheckDate = new Date(firstCheck.getTime());
      const endDate = new Date(date.getFullYear(), date.getMonth() + 2, 1);
      while (currentCheckDate.getTime() < endDate.getTime()) {
        if (currentCheckDate.getMonth() === date.getMonth() && currentCheckDate.getFullYear() === date.getFullYear()) {
          checkDays.push(new Date(currentCheckDate.getTime()));
        }
        currentCheckDate.setDate(currentCheckDate.getDate() + 7);
      }
      return checkDays;
    } catch (err) {
      console.error("Errore getSuggestedCheckDays:", err);
      return [];
    }
  };

  const tileClassName = ({ date, view }) => {
    try {
      if (view === 'month') {
        if (checks.some(c => c.createdAt && c.createdAt.toDate && c.createdAt.toDate().toDateString() === date.toDateString())) {
          return 'check-submitted';
        }
        if (getSuggestedCheckDays(date).some(d => d.toDateString() === date.toDateString())) {
          return 'check-day';
        }
      }
      return null;
    } catch (err) {
      console.error("Errore tileClassName:", err);
      return null;
    }
  };
  
  const handleFileChange = (e, type) => {
    try {
      const file = e.target.files[0];
      if (file) {
        setFormState(prev => ({
          ...prev,
          photos: { ...prev.photos, [type]: file },
          photoPreviews: { ...prev.photoPreviews, [type]: URL.createObjectURL(file) }
        }));
      }
    } catch (err) {
      console.error("Errore handleFileChange:", err);
      showNotification("Errore nel caricamento della foto.");
    }
  };
  
  const handleEditClick = (check) => {
    try {
      setSelectedDate(check.createdAt.toDate());
      setFormState({ id: check.id, notes: check.notes || '', weight: check.weight || '', photos: {}, photoPreviews: normalizePhotoURLs(check.photoURLs) || {} });
    } catch (err) {
      console.error("Errore handleEditClick:", err);
      showNotification("Errore nella modifica del check.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, notes, weight, photos } = formState;
    if (!user || (!id && Object.values(photos).some(p => !p)) || !weight) {
      showNotification("Compila il peso e carica tutte e 4 le foto se è un nuovo check.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const existingCheck = id ? checks.find(c => c.id === id) : null;
      let photoURLs = existingCheck ? { ...existingCheck.photoURLs } : { front: null, right: null, left: null, back: null };
      const photosToUpload = Object.entries(photos).filter(([, file]) => file);

      if (photosToUpload.length > 0) {
        const uploadPromises = photosToUpload.map(async ([type, file]) => {
          const url = await uploadPhoto(
            file,
            user.uid,
            'check_photos',
            (p) => {
              // p.percent: avanza barra fino a 100
              setUploadProgress(p.percent);
            }
          );
            return { type, url };
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        photoURLs = { ...photoURLs, ...Object.fromEntries(uploadedUrls.map(({ type, url }) => [type, url])) };
      }

      const checkData = { notes, weight: parseFloat(weight), photoURLs, createdAt: id ? existingCheck.createdAt : serverTimestamp() };
      if (id) {
        const checksCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'checks');
        await updateDoc(doc(checksCollectionRef.firestore, checksCollectionRef.path, id), { ...checkData, lastUpdatedAt: serverTimestamp() });
        showNotification('Check modificato con successo!', 'success');
      } else {
        await addDoc(getTenantSubcollection(db, 'clients', user.uid, 'checks'), checkData);
        showNotification('Check caricato con successo!', 'success');
      }
      setFormState({ id: null, notes: '', weight: '', photos: {}, photoPreviews: {} });
    } catch (error) {
      console.error("Errore handleSubmit:", error);
      showNotification("Si è verificato un errore.");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  const renderContentForDate = () => {
    try {
      const checkOnDate = checks.find(c => c.createdAt && c.createdAt.toDate && c.createdAt.toDate().toDateString() === selectedDate.toDateString());
      if (formState.id || !checkOnDate) {
        return <ClientUploadForm {...{ formState, setFormState, handleSubmit, isUploading, uploadProgress, handleFileChange }} />;
      }
      if (checkOnDate) {
        return <CheckDetails check={checkOnDate} handleEditClick={handleEditClick} />;
      }
      return <p className="text-center text-slate-400 p-8">Nessun check previsto o registrato per questa data.</p>;
    } catch (err) {
      console.error("Errore renderContentForDate:", err);
      return <p className="text-center text-red-400 p-8">Errore nel caricamento del contenuto.</p>;
    }
  };

  if (error) return <div className="min-h-screen text-red-400 flex justify-center items-center p-4">{error}</div>;
  if (loading) return <LoadingSpinner />;

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="min-h-screen text-slate-200 p-4 sm:p-8 relative">
        <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">I miei Check</h1>
          <button
            onClick={() => navigate('/client/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Dashboard</span>
          </button>
        </header>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-4">
            <Calendar onChange={setSelectedDate} value={selectedDate} tileClassName={tileClassName} />
          </div>
          <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 min-h-[400px]">
            {renderContentForDate()}
          </div>
        </motion.div>
      </div>
    </>
  );
}