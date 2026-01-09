import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection, getDocs } from 'firebase/firestore';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Zap, Crown, LogIn, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTenantDoc, setCurrentTenantId, getCurrentTenantId, DEFAULT_TENANT_ID } from '../../config/tenant';
import { getDeviceInfo } from '../../utils/deviceInfo';
import NebulaBackground from '../../components/ui/NebulaBackground';

/**
 * Valida se una stringa può essere un tenantId valido
 * Un tenantId valido non deve essere un campo riservato e deve avere un formato ragionevole
 */
function isValidTenantId(id) {
  if (!id || typeof id !== 'string') return false;
  // Lista di campi che NON sono tenantId validi
  const invalidIds = [
    'tenantId', 'role', 'updatedAt', 'joinedAt', 'status', 'migratedAt', 
    'createdAt', 'lastLogin', 'email', 'name', 'uid', 'viaInvite', 
    'isExistingUser', 'firstLogin', 'isClient', 'isDeleted'
  ];
  if (invalidIds.includes(id)) return false;
  // Deve avere almeno 5 caratteri (i tenantId Firestore sono più lunghi)
  if (id.length < 5) return false;
  return true;
}

/**
 * Cerca in quale tenant esiste l'utente
 * 
 * STRATEGIA (in ordine di priorità):
 * 1. Controlla user_tenants/{userId} - mapping con stato attivo/eliminato
 * 2. Se ha 1 solo tenant attivo → usa quello
 * 3. Se ha più tenant attivi E è coach/admin → restituisce lista per selettore
 * 4. Fallback: cerca nel tenant già salvato o default (utenti esistenti)
 * 
 * @returns { tenantId: string, allActiveTenants: Array | null }
 */
async function findUserTenant(userId) {
  try {
    // 1. PRIMA: Controlla user_tenants (mapping con stato)
    try {
      const userTenantRef = doc(db, 'user_tenants', userId);
      const userTenantDoc = await getDoc(userTenantRef);
      
      if (userTenantDoc.exists()) {
        const tenantsData = userTenantDoc.data();
        
        // Filtra solo tenant attivi (status === 'active' o status non definito per retrocompatibilità)
        const activeTenants = Object.entries(tenantsData)
          .filter(([key, data]) => {
            // La chiave deve essere un tenantId valido
            if (!isValidTenantId(key)) return false;
            // Il valore deve essere un oggetto (non stringa, numero, null o timestamp)
            if (typeof data !== 'object' || data === null) return false;
            // Se è un Timestamp Firestore, ignoralo
            if (data.toDate && typeof data.toDate === 'function') return false;
            // Deve avere almeno un campo 'role' per essere considerato un tenant valido
            if (!data.role) return false;
            // Considera attivo se status è 'active' o non definito
            return data.status === 'active' || !data.status;
          })
          .map(([tenantId, data]) => ({ tenantId, ...data }));
        
        if (activeTenants.length === 0) {
          // Retrocompatibilità: vecchio formato flat { tenantId: "xyz", role: "client" }
          if (tenantsData.tenantId && isValidTenantId(tenantsData.tenantId)) {
            return { tenantId: tenantsData.tenantId, allActiveTenants: null };
          }
          // Non fare return qui - continua con il fallback sotto
        } else if (activeTenants.length === 1) {
          // Un solo tenant attivo → usa quello direttamente
          return { tenantId: activeTenants[0].tenantId, allActiveTenants: null };
        } else {
          // Più tenant attivi - verifica se è coach/admin
          const hasCoachOrAdminRole = activeTenants.some(t => 
            t.role === 'admin' || t.role === 'coach' || t.role === 'superadmin'
          );
          
          if (hasCoachOrAdminRole) {
            // Coach/Admin con più tenant → restituisci lista per selettore
            return { 
              tenantId: null, 
              allActiveTenants: activeTenants,
              needsSelection: true 
            };
          } else {
            // Cliente con più tenant → usa il più recente
            const sortedTenants = activeTenants.sort((a, b) => {
              const dateA = a.joinedAt?.toDate?.() || new Date(0);
              const dateB = b.joinedAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            });
            return { tenantId: sortedTenants[0].tenantId, allActiveTenants: null };
          }
        }
      }
    } catch (e) {
      // user_tenants non disponibile, usando fallback
    }

    // 2. FALLBACK: Usa tenant già salvato o cerca manualmente
    const savedTenant = getCurrentTenantId();
    const tenantsToCheck = savedTenant ? [savedTenant] : [DEFAULT_TENANT_ID];
    
    for (const tenantId of tenantsToCheck) {
      // Check client
      try {
        const clientRef = doc(db, 'tenants', tenantId, 'clients', userId);
        const clientDoc = await getDoc(clientRef);
        if (clientDoc.exists() && !clientDoc.data().isDeleted) {
          return { tenantId, allActiveTenants: null };
        }
      } catch (e) { /* continue */ }

      // Check collaboratore
      try {
        const collabRef = doc(db, 'tenants', tenantId, 'collaboratori', userId);
        const collabDoc = await getDoc(collabRef);
        if (collabDoc.exists()) {
          return { tenantId, allActiveTenants: null };
        }
      } catch (e) { /* continue */ }

      // Check admin
      try {
        const adminRef = doc(db, 'tenants', tenantId, 'roles', 'admins');
        const adminDoc = await getDoc(adminRef);
        if (adminDoc.exists() && adminDoc.data()?.uids?.includes(userId)) {
          return { tenantId, allActiveTenants: null };
        }
      } catch (e) { /* continue */ }

      // Check coach
      try {
        const coachRef = doc(db, 'tenants', tenantId, 'roles', 'coaches');
        const coachDoc = await getDoc(coachRef);
        if (coachDoc.exists() && coachDoc.data()?.uids?.includes(userId)) {
          return { tenantId, allActiveTenants: null };
        }
      } catch (e) { /* continue */ }
      
      // Check superadmin
      try {
        const superadminRef = doc(db, 'tenants', tenantId, 'roles', 'superadmins');
        const superadminDoc = await getDoc(superadminRef);
        if (superadminDoc.exists() && superadminDoc.data()?.uids?.includes(userId)) {
          return { tenantId, allActiveTenants: null };
        }
      } catch (e) { /* continue */ }
    }

    // Se niente funziona, usa il tenant salvato o default
    return { tenantId: savedTenant || DEFAULT_TENANT_ID, allActiveTenants: null };
  } catch (error) {
    // Ricerca tenant: usando default
    return { tenantId: getCurrentTenantId() || DEFAULT_TENANT_ID, allActiveTenants: null };
  }
}

// === NEBULA LOADING ANIMATION ===
const NebulaLoader = ({ message = 'Caricamento...' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
  >
    {/* Nebula Background for loader */}
    <NebulaBackground preset="geometric" className="opacity-50" />
    
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative z-10 flex flex-col items-center"
    >
      {/* Animated Logo Container */}
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-8 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.5), transparent, rgba(6, 182, 212, 0.5), transparent)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner glow */}
        <motion.div 
          className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 rounded-full blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Logo */}
        <motion.div 
          className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/40"
          animate={{ 
            boxShadow: [
              '0 25px 50px -12px rgba(59, 130, 246, 0.4)',
              '0 25px 50px -12px rgba(6, 182, 212, 0.5)',
              '0 25px 50px -12px rgba(59, 130, 246, 0.4)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img 
            src="/logo192.png" 
            alt="Logo"
            className="w-16 h-16 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </motion.div>
        
        {/* Sparkle effects */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: ['10%', '70%', '30%'][i],
              left: ['80%', '10%', '90%'][i],
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          >
            <Sparkles size={16} className="text-cyan-400" />
          </motion.div>
        ))}
      </div>

      {/* Animated progress bar */}
      <div className="w-64 h-1.5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6)',
            backgroundSize: '200% 100%',
          }}
          animate={{ 
            x: ['-100%', '100%'],
            backgroundPosition: ['0% 0%', '100% 0%']
          }}
          transition={{ 
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      {/* Message */}
      <motion.p
        className="mt-6 text-slate-400 text-sm tracking-wide font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {message}
      </motion.p>
    </motion.div>
  </motion.div>
);

// === ANIMATED STARS BACKGROUND (Legacy - ora usiamo NebulaBackground) ===
const AnimatedStars = () => {
  useEffect(() => {
    const existingStars = document.querySelector('.login-stars');
    if (existingStars) return;

    const container = document.createElement('div');
    container.className = 'login-stars fixed inset-0 pointer-events-none z-0';
    document.body.appendChild(container);

    // Crea 50 stelle premium con effetto twinkle
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'absolute rounded-full';
      
      const isGold = i % 6 === 0;
      const size = isGold ? 3 : i % 3 === 0 ? 2 : 1;
      
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.backgroundColor = isGold ? '#fbbf24' : '#60a5fa';
      star.style.boxShadow = isGold 
        ? '0 0 10px #fbbf24, 0 0 20px #fbbf24' 
        : '0 0 5px #60a5fa';
      star.style.animation = `twinkle ${2 + Math.random() * 3}s infinite, float ${10 + Math.random() * 10}s infinite ease-in-out`;
      
      container.appendChild(star);
    }

    return () => {
      container.remove();
    };
  }, []);

  return null;
};

// === LOGIN COMPONENTE COMPLETO ===

// Funzione per creare i pannelli di transizione nel DOM
const createTransitionPanels = () => {
  // Rimuovi eventuali pannelli esistenti
  const existing = document.getElementById('transition-panels');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'transition-panels';
  container.innerHTML = `
    <div class="login-panel-top" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 50vh;
      background: linear-gradient(to bottom, #0f172a, #1e293b);
      z-index: 9999;
      transform: translateY(0);
      transition: transform 1s cubic-bezier(0.76, 0, 0.24, 1);
    ">
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(to right, transparent, #3b82f6, transparent);
      "></div>
    </div>
    <div class="login-panel-bottom" style="
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50vh;
      background: linear-gradient(to top, #0f172a, #1e293b);
      z-index: 9999;
      transform: translateY(0);
      transition: transform 1s cubic-bezier(0.76, 0, 0.24, 1);
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(to right, transparent, #3b82f6, transparent);
      "></div>
    </div>
  `;
  document.body.appendChild(container);

  // Forza reflow per far partire la transizione
  container.offsetHeight;

  // Anima l'apertura
  requestAnimationFrame(() => {
    const topPanel = container.querySelector('.login-panel-top');
    const bottomPanel = container.querySelector('.login-panel-bottom');
    if (topPanel) topPanel.style.transform = 'translateY(-100%)';
    if (bottomPanel) bottomPanel.style.transform = 'translateY(100%)';
  });

  // Rimuovi dopo l'animazione
  setTimeout(() => {
    container.remove();
  }, 1200);
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Flag per evitare race condition
  const [showPassword, setShowPassword] = useState(false);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null); // Per ritardare navigate
  const navigate = useNavigate();

  // Quando c'è una navigazione pendente, aspetta un po' poi avvia apertura pannelli
  useEffect(() => {
    if (pendingNavigation) {
      // Aspetta che il loader sia visibile per un po', poi avvia i pannelli
      const timer = setTimeout(() => {
        // Crea i pannelli nel DOM (sopravvivono allo smontaggio)
        createTransitionPanels();
        // Naviga subito - i pannelli si apriranno sopra la nuova pagina
        setTimeout(() => {
          navigate(pendingNavigation.path, pendingNavigation.options);
        }, 50);
      }, 1500); // 1.5 secondi di loader visibile
      return () => clearTimeout(timer);
    }
  }, [pendingNavigation, navigate]);

  useEffect(() => {
    let isInitialCheck = true;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // Se stiamo già facendo il login manualmente, lascia che handleLogin gestisca tutto
      if (isLoggingIn) {
        return;
      }
      
      if (user && isInitialCheck) {
        try {
          // Cerca il tenant per questo utente
          let tenantId = localStorage.getItem('tenantId');
          if (!tenantId) {
            const tenantResult = await findUserTenant(user.uid);
            
            // Se deve selezionare workspace (coach/admin con più tenant)
            if (tenantResult.needsSelection && tenantResult.allActiveTenants) {
              setPendingUser(user);
              setAvailableWorkspaces(tenantResult.allActiveTenants);
              setShowWorkspaceSelector(true);
              setIsCheckingAuth(false);
              return;
            }
            
            tenantId = tenantResult.tenantId;
            if (tenantId) {
              setCurrentTenantId(tenantId);
            } else {
              // Usa il tenant corrente (fallback)
              tenantId = getCurrentTenantId();
            }
          }

          const adminDocRef = getTenantDoc(db, 'roles', 'admins');
          const coachDocRef = getTenantDoc(db, 'roles', 'coaches');
          const clientDocRef = getTenantDoc(db, 'clients', user.uid);
          const collabDocRef = getTenantDoc(db, 'collaboratori', user.uid);
          const [adminDoc, coachDoc, clientDoc, collabDoc] = await Promise.all([
            getDoc(adminDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(coachDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(clientDocRef).catch(() => ({ exists: () => false, data: () => ({}) })),
            getDoc(collabDocRef).catch(() => ({ exists: () => false, data: () => ({}) }))
          ]);

          const isAdmin = adminDoc.exists() && adminDoc.data().uids.includes(user.uid);
          const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(user.uid);
          const isClient = clientDoc.exists() && clientDoc.data().isClient === true;
          const isCollaboratore = collabDoc.exists();

          if (isAdmin) {
            sessionStorage.setItem('app_role', 'admin');
            setPendingNavigation({ path: '/', options: { replace: true } });
          } else if (isCoach) {
            sessionStorage.setItem('app_role', 'coach');
            setPendingNavigation({ path: '/coach', options: { replace: true } });
          } else if (isCollaboratore) {
            sessionStorage.setItem('app_role', 'collaboratore');
            const hasFirstLogin = collabDoc.data()?.firstLogin === true;
            setPendingNavigation({ 
              path: hasFirstLogin ? '/collaboratore/first-access' : '/collaboratore/dashboard', 
              options: { replace: true } 
            });
          } else if (isClient) {
            sessionStorage.setItem('app_role', 'client');
            const hasFirstLogin = clientDoc.data()?.firstLogin === true;
            setPendingNavigation({ 
              path: hasFirstLogin ? '/client/first-access' : '/client/dashboard', 
              options: { replace: true } 
            });
          } else {
            console.error('❌ Nessun ruolo trovato per:', user.uid);
            setError('Accesso non autorizzato. Contatta l\'amministratore.');
            await signOut(auth);
            setIsCheckingAuth(false);
          }
        } catch (err) {
          setError('Errore verifica ruolo. Riprova.');
          setIsCheckingAuth(false);
        }
      } else {
        setIsCheckingAuth(false);
      }
    });

    return () => {
      isInitialCheck = false;
      unsubscribe();
    };
  }, [navigate, isLoggingIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true); // Blocca onAuthStateChanged
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Cerca e salva il tenant per questo utente
      const tenantResult = await findUserTenant(userCredential.user.uid);
      
      // Se deve selezionare workspace (coach/admin con più tenant)
      if (tenantResult.needsSelection && tenantResult.allActiveTenants) {
        setPendingUser(userCredential.user);
        setAvailableWorkspaces(tenantResult.allActiveTenants);
        setShowWorkspaceSelector(true);
        return;
      }
      
      let tenantId = tenantResult.tenantId;
      if (tenantId) {
        setCurrentTenantId(tenantId);
      } else {
        tenantId = getCurrentTenantId();
      }

      const adminDocRef = getTenantDoc(db, 'roles', 'admins');
      const coachDocRef = getTenantDoc(db, 'roles', 'coaches');
      const clientDocRef = getTenantDoc(db, 'clients', userCredential.user.uid);
      const collabDocRef = getTenantDoc(db, 'collaboratori', userCredential.user.uid);
      const [adminDoc, coachDoc, clientDoc, collabDoc] = await Promise.all([
        getDoc(adminDocRef),
        getDoc(coachDocRef),
        getDoc(clientDocRef),
        getDoc(collabDocRef)
      ]);

      const isAdmin = adminDoc.exists() && adminDoc.data().uids.includes(userCredential.user.uid);
      const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(userCredential.user.uid);
      const isClient = clientDoc.exists() && clientDoc.data().isClient === true;
      const isCollaboratore = collabDoc.exists();

      // Aggiorna lastActive e deviceInfo nel documento client
      if (isClient && clientDoc.exists()) {
        try {
          const deviceInfo = getDeviceInfo();
          await updateDoc(clientDocRef, { 
            lastActive: serverTimestamp(),
            lastDevice: deviceInfo
          });
        } catch (e) {
          console.debug('Could not update lastActive:', e.message);
        }
      }

      if (isAdmin) {
        sessionStorage.setItem('app_role', 'admin');
        setPendingNavigation({ path: '/', options: {} });
      } else if (isCoach) {
        sessionStorage.setItem('app_role', 'coach');
        setPendingNavigation({ path: '/coach', options: {} });
      } else if (isCollaboratore) {
        sessionStorage.setItem('app_role', 'collaboratore');
        setPendingNavigation({ 
          path: collabDoc.data().firstLogin ? '/collaboratore/first-access' : '/collaboratore/dashboard', 
          options: {} 
        });
      } else if (isClient) {
        sessionStorage.setItem('app_role', 'client');
        setPendingNavigation({ 
          path: clientDoc.data().firstLogin ? '/client/first-access' : '/client/dashboard', 
          options: {} 
        });
      } else {
        setError('Accesso non autorizzato. Contatta l\'amministratore.');
        await signOut(auth);
        setIsLoggingIn(false);
      }
    } catch (error) {
      setIsLoggingIn(false); // Reset in caso di errore
      if (error.code === 'auth/wrong-password') {
        setError('Password errata. Riprova o reimposta la password.');
      } else if (error.code === 'auth/user-not-found') {
        setError('Utente non trovato. Verifica l\'email.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Credenziali non valide. Verifica email e password.');
      } else {
        setError('Errore login: ' + error.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoggingIn(true); // Blocca onAuthStateChanged
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Cerca e salva il tenant per questo utente
      const tenantResult = await findUserTenant(userCredential.user.uid);
      
      // Se deve selezionare workspace (coach/admin con più tenant)
      if (tenantResult.needsSelection && tenantResult.allActiveTenants) {
        setPendingUser(userCredential.user);
        setAvailableWorkspaces(tenantResult.allActiveTenants);
        setShowWorkspaceSelector(true);
        return;
      }
      
      let tenantId = tenantResult.tenantId;
      if (tenantId) {
        setCurrentTenantId(tenantId);
      } else {
        tenantId = getCurrentTenantId();
      }

      // Verifica ruolo
      const adminDocRef = getTenantDoc(db, 'roles', 'admins');
      const coachDocRef = getTenantDoc(db, 'roles', 'coaches');
      const clientDocRef = getTenantDoc(db, 'clients', userCredential.user.uid);
      const collabDocRef = getTenantDoc(db, 'collaboratori', userCredential.user.uid);
      const [adminDoc, coachDoc, clientDoc, collabDoc] = await Promise.all([
        getDoc(adminDocRef),
        getDoc(coachDocRef),
        getDoc(clientDocRef),
        getDoc(collabDocRef)
      ]);

      const isAdmin = adminDoc.exists() && adminDoc.data().uids.includes(userCredential.user.uid);
      const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(userCredential.user.uid);
      const isClient = clientDoc.exists() && clientDoc.data().isClient === true;
      const isCollaboratore = collabDoc.exists();

      // Aggiorna lastActive e deviceInfo nel documento client
      if (isClient && clientDoc.exists()) {
        try {
          const deviceInfo = getDeviceInfo();
          await updateDoc(clientDocRef, { 
            lastActive: serverTimestamp(),
            lastDevice: deviceInfo
          });
        } catch (e) {
          console.debug('Could not update lastActive:', e.message);
        }
      }

      if (isAdmin) {
        sessionStorage.setItem('app_role', 'admin');
        setPendingNavigation({ path: '/', options: {} });
      } else if (isCoach) {
        sessionStorage.setItem('app_role', 'coach');
        setPendingNavigation({ path: '/coach', options: {} });
      } else if (isCollaboratore) {
        sessionStorage.setItem('app_role', 'collaboratore');
        setPendingNavigation({ 
          path: collabDoc.data().firstLogin ? '/collaboratore/first-access' : '/collaboratore/dashboard', 
          options: {} 
        });
      } else if (isClient) {
        sessionStorage.setItem('app_role', 'client');
        setPendingNavigation({ 
          path: clientDoc.data().firstLogin ? '/client/first-access' : '/client/dashboard', 
          options: {} 
        });
      } else {
        // IMPORTANTE: Se l'utente non esiste come cliente/admin/coach, elimina l'account Auth
        // appena creato da signInWithPopup per evitare utenti orfani
        try {
          // Elimina l'utente Auth appena creato (possibile perché è ancora autenticato)
          await userCredential.user.delete();
        } catch (deleteError) {
          // Se non riesce a eliminare, almeno fa signOut
          await signOut(auth);
        }
        setError('Account Google non collegato. Devi prima essere registrato come cliente dal tuo coach, poi potrai collegare Google dal tuo profilo.');
        setIsLoggingIn(false);
      }
    } catch (error) {
      setIsLoggingIn(false); // Reset in caso di errore
      console.error('❌ Errore login Google:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Popup chiuso. Riprova.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignora - popup già aperto
      } else {
        setError('Errore login Google: ' + error.message);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Inserisci un\'email per reimpostare la password.\n\n⚠️ Se hai fatto accesso con Google, non hai una password da reimpostare. Usa il pulsante "Accedi con Google".');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('✅ Email di reimpostazione inviata! Controlla la posta (anche spam).\n\n💡 Se non ricevi nulla, probabilmente hai creato l\'account con Google. In quel caso usa "Accedi con Google".');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('Nessun account trovato con questa email.\n\n💡 Se hai usato Google per registrarti, prova con "Accedi con Google".');
      } else {
        setError('Errore invio email: ' + error.message);
      }
    }
  };

  // Funzione per selezionare workspace (coach/admin con più tenant)
  const handleSelectWorkspace = async (workspace) => {
    try {
      setCurrentTenantId(workspace.tenantId);
      setIsLoggingIn(true); // Mostra il loader
      
      // Redirect basato sul ruolo nel workspace selezionato
      if (workspace.role === 'admin' || workspace.role === 'superadmin') {
        setPendingNavigation({ path: '/admin', options: {} });
      } else if (workspace.role === 'coach') {
        setPendingNavigation({ path: '/coach', options: {} });
      } else {
        setPendingNavigation({ path: '/client', options: {} });
      }
    } catch (error) {
      console.error('❌ Errore selezione workspace:', error);
      setError('Errore nella selezione del workspace');
      setIsLoggingIn(false);
    }
  };

  // Se mostra il selettore workspace
  if (showWorkspaceSelector && availableWorkspaces.length > 0) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <NebulaBackground preset="aurora" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md z-10"
        >
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/40 rounded-2xl shadow-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="text-blue-400" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-white">Seleziona Workspace</h2>
              <p className="text-slate-400 text-sm mt-1">
                Hai accesso a più workspace. Quale vuoi aprire?
              </p>
            </div>

            <div className="space-y-3">
              {availableWorkspaces.map((workspace) => (
                <motion.button
                  key={workspace.tenantId}
                  onClick={() => handleSelectWorkspace(workspace)}
                  className="w-full p-4 bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/40 hover:border-blue-500/50 rounded-xl text-left transition-all flex items-center gap-4 backdrop-blur-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                    {workspace.tenantId?.charAt(0)?.toUpperCase() || 'W'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{workspace.tenantId}</p>
                    <p className="text-slate-400 text-sm capitalize">{workspace.role}</p>
                  </div>
                  <LogIn className="text-slate-400" size={20} />
                </motion.button>
              ))}
            </div>

            <button
              onClick={() => {
                signOut(auth);
                setShowWorkspaceSelector(false);
                setAvailableWorkspaces([]);
                setPendingUser(null);
              }}
              className="w-full mt-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Logout e cambia account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fase di loading/transizione - usa NebulaLoader
  const showLoadingPhase = isCheckingAuth || isLoggingIn || pendingNavigation;

  if (showLoadingPhase) {
    return <NebulaLoader message={isLoggingIn ? 'Accesso in corso...' : 'Caricamento...'} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Nebula Background */}
      <NebulaBackground preset="aurora" />

      <AnimatePresence mode="wait">
          {/* Form di Login */}
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-md relative z-10"
          >
        {/* Logo e Titolo */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="relative">
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 rounded-full blur-xl"
                animate={{ 
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-2 ring-blue-500/30 shadow-xl shadow-blue-500/30">
                <img 
                  src="/logo192.png" 
                  alt="FitFlows Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <motion.h1
              className="text-4xl font-black text-white relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.span
                className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 blur-xl opacity-40"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">FitFlows</span>
            </motion.h1>
          </motion.div>

          <motion.p
            className="text-slate-400 text-base font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Accedi alla tua area riservata
          </motion.p>
        </div>

        {/* Card Login */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/40 rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8 space-y-4 sm:space-y-5"
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative w-full pl-12 pr-4 py-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="nome@esempio.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative w-full pl-12 pr-12 py-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors z-10"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 backdrop-blur-sm"
                >
                  <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white preserve-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <LogIn size={20} className="relative" />
              <span className="relative">Accedi</span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/40"></div>
            </div>
            <div className="relative bg-slate-800/60 backdrop-blur-sm px-4 text-sm text-slate-500 rounded-full">
              oppure
            </div>
          </div>

          {/* Google Login Button */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-3 group shadow-sm hover:shadow-md"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Accedi con Google</span>
          </motion.button>

          {/* Info collegamento Google */}
          <p className="text-xs text-slate-500 text-center">
            ℹ️ Funziona solo se hai già collegato Google al tuo account
          </p>

          {/* Password Reset Link */}
          <div className="text-center pt-3 border-t border-slate-700/40">
            <button
              onClick={handleResetPassword}
              className="text-sm text-slate-400 hover:text-cyan-400 transition-colors font-medium inline-flex items-center gap-2 group"
              title="Solo per account email/password. Gli account Google non hanno password."
            >
              <Lock size={14} className="group-hover:rotate-12 transition-transform" />
              Password dimenticata?
            </button>
            <p className="text-xs text-slate-600 mt-1">
              (solo per accesso con email/password)
            </p>
          </div>
        </motion.div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6 space-y-1"
        >
          <p className="text-slate-500 text-xs">
            Powered by <span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text font-semibold">FitFlows</span> Platform
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
            <Crown size={10} className="text-yellow-500" />
            <span>Premium Fitness Management</span>
          </div>
        </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Login;