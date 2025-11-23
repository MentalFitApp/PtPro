import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { getTenantSubcollection } from '../../config/tenant';
import { ArrowLeft, FilePenLine, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTI UI RIUTILIZZABILI ---
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-900">
    <div className="aurora-background"></div>
  </div>
);

const ViewField = ({ label, value }) => (
  <div className="mb-4">
    <h4 className="text-sm font-semibold text-slate-400">{label}</h4>
    <p className="mt-1 p-3 bg-slate-800 rounded-lg min-h-[44px] text-slate-200 break-words whitespace-pre-wrap shadow-inner">{value || 'Non specificato'}</p>
  </div>
);

const ViewPhotos = ({ urls }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {['front', 'right', 'left', 'back'].map(type => (
      <div key={type} className="text-center">
        <h4 className="text-sm font-semibold text-slate-400 capitalize">{type === 'front' ? 'Frontale' : type === 'back' ? 'Posteriore' : `Laterale ${type === 'left' ? 'Sinistro' : 'Destro'}`}</h4>
        {urls?.[type] ? (
          <motion.img
            src={urls[type]}
            alt={type}
            className="mt-2 rounded-lg w-full h-48 sm:h-40 object-cover hover:scale-105 transition-transform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="mt-2 flex justify-center items-center w-full h-48 sm:h-40 bg-slate-800 rounded-lg text-slate-500"><span>Non caricata</span></div>
        )}
      </div>
    ))}
  </div>
);

const AdminAnamnesi = () => {
  const { uid } = useParams(); // UID del cliente dalla URL
  const navigate = useNavigate();
  const [anamnesiData, setAnamnesiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnamnesi = async () => {
      if (!uid) {
        setLoading(false);
        return;
      }
      const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', uid, 'anamnesi');
      const anamnesiRef = doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial');
      const docSnap = await getDoc(anamnesiRef);
      if (docSnap.exists()) {
        setAnamnesiData(docSnap.data());
      }
      setLoading(false);
    };
    fetchAnamnesi();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center relative">
        <AnimatedBackground />
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!anamnesiData) {
    return (
      <div className="min-h-screen flex justify-center items-center relative text-slate-200">
        <AnimatedBackground />
        <p>Nessun dato anamnestico trovato per questo cliente.</p>
      </div>
    );
  }

  const sectionStyle = "bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 shadow-lg";
  const headingStyle = "font-bold mb-4 text-lg text-cyan-300 border-b border-cyan-400/20 pb-2 flex items-center gap-2";

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-6 lg:p-8 relative">
      <AnimatedBackground />
      <header className="flex justify-between items-center mb-8 flex-col sm:flex-row gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">Anamnesi - {anamnesiData.firstName} {anamnesiData.lastName}</h1>
        <button onClick={() => navigate('/clients')} className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-300 text-sm font-semibold rounded-lg transition-colors"><ArrowLeft size={16} /><span>Torna ai Clienti</span></button>
      </header>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className={sectionStyle}><h4 className={headingStyle}><FilePenLine size={16} /> Dati Anagrafici</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><ViewField label="Nome" value={anamnesiData.firstName} /><ViewField label="Cognome" value={anamnesiData.lastName} /><ViewField label="Data di Nascita" value={anamnesiData.birthDate} /><ViewField label="Lavoro" value={anamnesiData.job} /><ViewField label="Peso (kg)" value={anamnesiData.weight} /><ViewField label="Altezza (cm)" value={anamnesiData.height} /></div></div>
        <div className={sectionStyle}><h4 className={headingStyle}><Camera size={16} /> Abitudini Alimentari</h4><div className="space-y-4"><ViewField label="Pasti al giorno" value={anamnesiData.mealsPerDay} /><ViewField label="Tipo Colazione" value={anamnesiData.breakfastType} /><ViewField label="Alimenti preferiti" value={anamnesiData.desiredFoods} /><ViewField label="Alimenti da evitare" value={anamnesiData.dislikedFoods} /><ViewField label="Allergie/Intolleranze" value={anamnesiData.intolerances} /><ViewField label="Problemi di digestione" value={anamnesiData.digestionIssues} /></div></div>
        <div className={sectionStyle}><h4 className={headingStyle}><FilePenLine size={16} /> Allenamento</h4><div className="space-y-4"><ViewField label="Allenamenti a settimana" value={anamnesiData.workoutsPerWeek} /><ViewField label="Dettagli Allenamento" value={anamnesiData.trainingDetails} /><ViewField label="Orario e Durata" value={anamnesiData.trainingTime} /></div></div>
        <div className={sectionStyle}><h4 className={headingStyle}><Camera size={16} /> Salute e Obiettivi</h4><div className="space-y-4"><ViewField label="Infortuni o problematiche" value={anamnesiData.injuries} /><ViewField label="Farmaci" value={anamnesiData.medications} /><ViewField label="Integratori" value={anamnesiData.supplements} /><ViewField label="Obiettivo Principale" value={anamnesiData.mainGoal} /><ViewField label="Durata Percorso" value={anamnesiData.programDuration} /></div></div>
        <div className={sectionStyle}><h4 className={headingStyle}><Camera size={16} /> Foto Iniziali</h4><ViewPhotos urls={anamnesiData.photoURLs} /></div>
      </motion.div>
    </div>
  );
};

export default AdminAnamnesi;