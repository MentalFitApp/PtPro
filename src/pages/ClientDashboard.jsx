import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useNavigate, Link } from 'react-router-dom';
import { User, Calendar, CheckSquare, MessageSquare, LogOut, BarChart2, Briefcase, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// AnimatedBackground per tema stellato
const AnimatedBackground = () => {
  useEffect(() => {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;

    const createStar = () => {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDuration = `${Math.random() * 30 + 40}s, 5s`;
      starsContainer.appendChild(star);
    };

    for (let i = 0; i < 50; i++) {
      createStar();
    }

    return () => {
      while (starsContainer.firstChild) {
        starsContainer.removeChild(starsContainer.firstChild);
      }
    };
  }, []);

  return (
    <div className="starry-background">
      <div className="stars"></div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative">
    <AnimatedBackground />
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

const DashboardCard = ({ title, value, subtext, icon, variants }) => (
  <motion.div variants={variants} className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-300">{title}</h3>
      <div className="text-cyan-300">{icon}</div>
    </div>
    <p className="text-3xl font-bold text-slate-50 mt-2">{value}</p>
    <p className="text-sm text-slate-400 mt-1">{subtext}</p>
  </motion.div>
);

const ActionLink = ({ to, title, description, icon, variants }) => (
  <motion.div variants={variants}>
    <Link to={to} className="group bg-zinc-900/70 hover:bg-zinc-800/90 border border-white/10 rounded-lg p-4 flex items-center gap-4 transition-all duration-300">
      <div className="bg-zinc-800 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-white p-3 rounded-lg transition-colors duration-300">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-200">{title}</h4>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <ChevronRight className="text-slate-500 group-hover:text-white transition-colors duration-300" />
    </Link>
  </motion.div>
);

const ClientDashboard = () => {
  const [clientData, setClientData] = useState(null);
  const [lastCheckDate, setLastCheckDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const fetchClientData = async () => {
        const clientDocRef = doc(db, 'clients', user.uid);
        const docSnap = await getDoc(clientDocRef);
        if (docSnap.exists()) {
          setClientData(docSnap.data());
        } else {
          await signOut(auth);
          navigate('/client-login');
        }
        setLoading(false);
      };

      const fetchLastCheck = () => {
        const checksCollectionRef = collection(db, `clients/${user.uid}/checks`);
        const q = query(checksCollectionRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const checks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const latestCheck = checks[0]?.createdAt?.toDate();
          setLastCheckDate(latestCheck || null);
        });
        return unsubscribe;
      };

      fetchClientData();
      return fetchLastCheck();
    } else {
      navigate('/client-login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    signOut(auth).then(() => {
      sessionStorage.removeItem('app_role');
      navigate('/client-login');
    });
  };

  if (loading) return <LoadingSpinner />;
  if (!clientData) return <p className="text-center text-red-400 p-8">Errore nel caricamento dei dati.</p>;

  let giorniRimanenti = 'N/D';
  let dataScadenzaFormatted = 'Non impostata';
  if (clientData.scadenza && clientData.scadenza.toDate) {
    const scadenzaDate = clientData.scadenza.toDate();
    const oggi = new Date();
    scadenzaDate.setHours(23, 59, 59, 999);
    oggi.setHours(0, 0, 0, 0);
    const diffTime = scadenzaDate - oggi;
    giorniRimanenti = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    dataScadenzaFormatted = scadenzaDate.toLocaleDateString('it-IT');
  }

  let nextCheckText = 'Nessun check registrato';
  let nextCheckSubtext = 'Carica il tuo primo check!';
  if (lastCheckDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextCheckDate = new Date(lastCheckDate);
    nextCheckDate.setDate(nextCheckDate.getDate() + 7); // Prossimo check fra 7 giorni
    const diffDays = Math.max(0, Math.ceil((nextCheckDate - today) / (1000 * 60 * 60 * 24)));
    nextCheckText = diffDays === 0 ? 'Oggi' : `${diffDays} giorni`;
    nextCheckSubtext = `Prossimo check suggerito: ${nextCheckDate.toLocaleDateString('it-IT')}`;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-8 relative">
      <AnimatedBackground />
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.header variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">Ciao, {clientData.name}!</h1>
            <p className="text-slate-300">Benvenuto nella tua area personale.</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors">
            <LogOut size={16} /><span>Logout</span>
          </button>
        </motion.header>

        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <DashboardCard 
              title="Scadenza Percorso" 
              value={`${giorniRimanenti} giorni`} 
              subtext={`Scade il: ${dataScadenzaFormatted}`}
              icon={<Calendar size={24} />}
              variants={itemVariants}
            />
            <DashboardCard 
              title="Tipo Percorso" 
              value={clientData.planType ? clientData.planType.charAt(0).toUpperCase() + clientData.planType.slice(1) : 'Non specificato'}
              subtext="Il tuo piano attuale"
              icon={<Briefcase size={24} />}
              variants={itemVariants}
            />
            <DashboardCard 
              title="Prossimo Check" 
              value={nextCheckText}
              subtext={nextCheckSubtext}
              icon={<CheckSquare size={24} />}
              variants={itemVariants}
            />
          </div>
          
          <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6">
            <h3 className="text-2xl font-bold mb-4 text-white">Cosa vuoi fare?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ActionLink to="/client/anamnesi" title="La mia Anamnesi" description="Visualizza o aggiorna i tuoi dati" icon={<User size={22} />} variants={itemVariants}/>
              <ActionLink to="/client/checks" title="I miei Check" description="Carica i tuoi progressi periodici" icon={<CheckSquare size={22} />} variants={itemVariants}/>
              <ActionLink to="/client/payments" title="I miei Pagamenti" description="Visualizza lo storico dei pagamenti" icon={<BarChart2 size={22} />} variants={itemVariants}/>
              <ActionLink to="/client/chat" title="Chat con il Coach" description="Invia un messaggio diretto" icon={<MessageSquare size={22} />} variants={itemVariants}/>
            </div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
};

export default ClientDashboard;