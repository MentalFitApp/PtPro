import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, toDate, auth } from '../firebase';
import { Users, ArrowLeft, FileText, CheckCircle, Calendar, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

const Notification = ({ message, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-5 right-5 z-[1000] flex items-center gap-4 p-4 rounded-lg border bg-red-900/80 text-red-300 border-red-500/30 backdrop-blur-md shadow-lg"
      >
        <p>{message}</p>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/10">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const AnamnesiSection = ({ title, data, variants }) => (
  <motion.div variants={variants} className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6">
    <h4 className="font-bold mb-4 text-lg text-rose-300 border-b border-rose-400/20 pb-2">{title}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <p className="text-sm text-slate-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</p>
          <p className="text-sm text-slate-200">{value || 'N/D'}</p>
        </div>
      ))}
    </div>
  </motion.div>
);

const CheckItem = ({ check, variants }) => {
  const formattedDate = toDate(check.createdAt);
  console.log('CheckItem data:', { checkId: check.id, createdAt: check.createdAt, formattedDate });
  return (
    <motion.div variants={variants} className="p-3 rounded-lg bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-slate-200">
          Check del {formattedDate ? formattedDate.toLocaleDateString('it-IT') : 'Data non disponibile'}
        </p>
      </div>
      <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Calendar size={14} /> Data: {formattedDate ? formattedDate.toLocaleString('it-IT') : 'N/D'}
        </span>
        {check.weight && (
          <span className="flex items-center gap-1">
            <CheckCircle size={14} /> Peso: {check.weight} kg
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default function CoachClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [anamnesi, setAnamnesi] = useState(null);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('Nessun utente autenticato, redirect a /login');
      navigate('/login');
      return;
    }
    console.log('Utente autenticato:', { uid: auth.currentUser.uid, email: auth.currentUser.email });

    // Verifica ruolo coach
    const checkCoachRole = async () => {
      try {
        const coachDocRef = doc(db, 'roles', 'coaches');
        const coachDoc = await getDoc(coachDocRef);
        const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(auth.currentUser.uid);
        console.log('Debug ruolo coach:', {
          uid: auth.currentUser.uid,
          coachDocExists: coachDoc.exists(),
          coachUids: coachDoc.data()?.uids,
          isCoach
        });
        if (!isCoach) {
          console.warn('Accesso non autorizzato per CoachClientDetail:', auth.currentUser.uid);
          sessionStorage.removeItem('app_role');
          await auth.signOut();
          navigate('/login');
        }
      } catch (err) {
        console.error('Errore verifica ruolo coach:', err);
        setError('Errore nella verifica del ruolo coach.');
        setLoading(false);
      }
    };
    checkCoachRole();

    const fetchClientData = async () => {
      try {
        // Fetch dati cliente
        const clientRef = doc(db, 'clients', clientId);
        const clientDoc = await getDoc(clientRef);
        if (!clientDoc.exists()) {
          throw new Error("Cliente non trovato.");
        }
        setClient(clientDoc.data());

        // Fetch anamnesi
        const anamnesiRef = doc(db, `clients/${clientId}/anamnesi`, 'initial');
        const anamnesiDoc = await getDoc(anamnesiRef);
        setAnamnesi(anamnesiDoc.exists() ? anamnesiDoc.data() : null);

        // Fetch checks
        const checksQuery = query(collection(db, `clients/${clientId}/checks`), orderBy('createdAt', 'desc'));
        const unsubChecks = onSnapshot(checksQuery, (snap) => {
          try {
            const checksData = snap.docs.map(doc => {
              const data = doc.data();
              console.log('Check doc:', { id: doc.id, data });
              return { id: doc.id, ...data };
            });
            console.log('Checks caricati:', { count: checksData.length, clientId });
            setChecks(checksData);
          } catch (err) {
            console.error("Errore snapshot checks:", err);
            setError(err.code === 'permission-denied' ? 'Permessi insufficienti per accedere ai check.' : 'Errore nel caricamento dei checks.');
          }
        }, (err) => {
          console.error("Errore snapshot checks:", err);
          setError(err.code === 'permission-denied' ? 'Permessi insufficienti per accedere ai check.' : 'Errore nel caricamento dei checks.');
        });

        setLoading(false);
        return () => unsubChecks();
      } catch (err) {
        console.error("Errore nel fetch dati cliente:", err);
        setError(err.code === 'permission-denied' ? 'Permessi insufficienti per accedere ai dati del cliente.' : 'Errore nel caricamento dei dati del cliente.');
        setLoading(false);
      }
    };
    fetchClientData();
  }, [clientId, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (error) return (
    <div className="min-h-screen bg-zinc-950 text-red-400 flex justify-center items-center">
      <Notification message={error} onDismiss={() => setError(null)} />
    </div>
  );
  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-8 relative">
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.header variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-50 flex items-center gap-2">
            <Users size={28} /> Dettagli Cliente: {client?.name || 'N/D'}
          </h1>
          <button
            onClick={() => navigate('/coach/clients')}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Torna ai Clienti</span>
          </button>
        </motion.header>

        <motion.div variants={itemVariants} className="space-y-6">
          {/* Anamnesi */}
          {anamnesi ? (
            <>
              <AnamnesiSection
                title="Dati Anagrafici e Misure"
                data={{
                  Nome: anamnesi.firstName,
                  Cognome: anamnesi.lastName,
                  'Data di Nascita': anamnesi.birthDate,
                  Lavoro: anamnesi.job,
                  Peso: anamnesi.weight ? `${anamnesi.weight} kg` : 'N/D',
                  Altezza: anamnesi.height ? `${anamnesi.height} cm` : 'N/D',
                }}
                variants={itemVariants}
              />
              <AnamnesiSection
                title="Abitudini Alimentari"
                data={{
                  'Pasti al Giorno': anamnesi.mealsPerDay,
                  'Tipo Colazione': anamnesi.breakfastType,
                  'Alimenti Preferiti': anamnesi.desiredFoods,
                  'Alimenti Non Graditi': anamnesi.dislikedFoods,
                  Intolleranze: anamnesi.intolerances,
                  'Problemi Digestivi': anamnesi.digestionIssues,
                }}
                variants={itemVariants}
              />
              <AnamnesiSection
                title="Allenamento"
                data={{
                  'Allenamenti a Settimana': anamnesi.workoutsPerWeek,
                  'Dettagli Allenamento': anamnesi.trainingDetails,
                  'Orario e Durata': anamnesi.trainingTime,
                }}
                variants={itemVariants}
              />
              <AnamnesiSection
                title="Salute e Obiettivi"
                data={{
                  Infortuni: anamnesi.injuries,
                  Farmaci: anamnesi.medications,
                  Integratori: anamnesi.supplements,
                  Obiettivo: anamnesi.mainGoal,
                  'Durata Programma': anamnesi.programDuration,
                }}
                variants={itemVariants}
              />
            </>
          ) : (
            <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6 text-center text-slate-400">
              Nessuna anamnesi disponibile.
            </motion.div>
          )}

          {/* Checks */}
          <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6">
            <h4 className="font-bold mb-4 text-lg text-rose-300 border-b border-rose-400/20 pb-2">Checks</h4>
            <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
              <AnimatePresence>
                {checks.length > 0 ? (
                  checks.map(check => (
                    <CheckItem key={check.id} check={check} variants={itemVariants} />
                  ))
                ) : (
                  <p className="text-slate-400 text-center p-4">Nessun check disponibile.</p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}