import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Lock, Mail, Eye, EyeOff, LogIn, ArrowRight, Sparkles, Crown, Zap, TrendingUp, Shield, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTenantDoc, setCurrentTenantId, getCurrentTenantId, DEFAULT_TENANT_ID } from '../../config/tenant';
import { getDeviceInfo } from '../../utils/deviceInfo';
import NebulaBackground from '../../components/ui/NebulaBackground';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Utility per rilevare mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(null); // null = not checked, true/false = valid/invalid
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetMode, setResetMode] = useState('email'); // 'email' | 'sms'
  const [resetPhone, setResetPhone] = useState('');
  const [phoneAvailable, setPhoneAvailable] = useState(false);
  const [smsCodeSent, setSmsCodeSent] = useState(false); // SMS inviato
  const [smsCode, setSmsCode] = useState(''); // Codice OTP inserito dall'utente
  const [smsVerifying, setSmsVerifying] = useState(false); // Verifica in corso
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false); // Form nuova password
  const [newPassword, setNewPassword] = useState(''); // Nuova password
  const [newPasswordConfirm, setNewPasswordConfirm] = useState(''); // Conferma password
  const [customToken, setCustomToken] = useState(''); // Token per cambio password
  const navigate = useNavigate();

  // Validazione email real-time
  const validateEmail = (email) => {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Cerca numero di telefono associato all'email
  const findPhoneByEmail = async (email) => {
    if (!email || !validateEmail(email)) return null;
    try {
      const tenantId = getCurrentTenantId() || DEFAULT_TENANT_ID;
      // Cerca nei clients
      const clientsRef = collection(db, 'tenants', tenantId, 'clients');
      const clientsSnap = await getDocs(query(clientsRef, where('email', '==', email.toLowerCase())));
      
      if (!clientsSnap.empty) {
        const clientData = clientsSnap.docs[0].data();
        if (clientData.phone) return clientData.phone;
      }
      
      // Cerca nei collaboratori se non trovato nei client
      const collabsRef = collection(db, 'tenants', tenantId, 'collaboratori');
      const collabsSnap = await getDocs(query(collabsRef, where('email', '==', email.toLowerCase())));
      
      if (!collabsSnap.empty) {
        const collabData = collabsSnap.docs[0].data();
        if (collabData.phone) return collabData.phone;
      }
      
      return null;
    } catch (error) {
      console.error('Errore ricerca telefono:', error);
      return null;
    }
  };

  // Gestione Esc key per tornare dal reset
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showResetPassword) {
        setShowResetPassword(false);
        setResetEmail('');
        setError('');
        setResetSuccess(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showResetPassword]);

  // Quando c'è una navigazione pendente, aspetta un po' poi naviga
  useEffect(() => {
    if (pendingNavigation) {
      // Aspetta che l'animazione di loading sia visibile, poi naviga
      const timer = setTimeout(() => {
        navigate(pendingNavigation.path, pendingNavigation.options);
      }, 1200); // 1.2 secondi totali di animazione
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
      // Imposta persistenza basata su remember me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
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
    setIsGoogleLoading(true);
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
      setIsGoogleLoading(false);
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (resetMode === 'email') {
      if (!resetEmail) {
        setError('Inserisci un\'email valida.');
        return;
      }
      setError('');
      setResetSuccess(false);
      try {
        await sendPasswordResetEmail(auth, resetEmail);
        setResetSuccess(true);
        setError('');
        // Dopo 3 secondi torna al form di login
        setTimeout(() => {
          setShowResetPassword(false);
          setResetSuccess(false);
          setResetEmail('');
        }, 3000);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          setError('Nessun account trovato con questa email.');
        } else if (error.code === 'auth/invalid-email') {
          setError('Email non valida.');
        } else {
          setError('Errore invio email: ' + error.message);
        }
      }
    } else {
      // Reset via SMS - Chiama Cloud Function
      if (!resetEmail) {
        setError('Inserisci un\'email valida.');
        return;
      }
      setError('');
      setResetSuccess(false);
      setSmsVerifying(true);
      
      try {
        const functions = getFunctions(undefined, 'europe-west1'); // Specifica region
        const sendSmsReset = httpsCallable(functions, 'sendSmsPasswordReset');
        
        const result = await sendSmsReset({
          email: resetEmail,
          tenantId: getCurrentTenantId() || DEFAULT_TENANT_ID,
        });
        
        if (result.data.success) {
          setSmsCodeSent(true);
          setError('');
          // Messaggio di successo: mostra form per inserire codice
        } else {
          setError(result.data.message || 'Errore invio SMS');
        }
      } catch (error) {
        console.error('Errore invio SMS:', error);
        if (error.code === 'functions/resource-exhausted') {
          setError('Troppi tentativi. Riprova tra 10 minuti.');
        } else if (error.code === 'functions/not-found') {
          setError('Nessun numero di telefono trovato per questa email.');
        } else {
          setError('Errore invio SMS: ' + error.message);
        }
      } finally {
        setSmsVerifying(false);
      }
    }
  };

  // Verifica codice OTP SMS
  const handleVerifySmsCode = async (e) => {
    e.preventDefault();
    
    if (!smsCode || smsCode.length !== 6) {
      setError('Inserisci un codice valido a 6 cifre.');
      return;
    }
    
    setError('');
    setSmsVerifying(true);
    
    try {
      // Solo verifica il codice, poi mostra form password
      setShowNewPasswordForm(true);
      setSmsVerifying(false);
    } catch (error) {
      console.error('Errore:', error);
      setError('Errore: ' + error.message);
      setSmsVerifying(false);
    }
  };

  // Cambia password dopo verifica SMS
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }
    
    if (newPassword !== newPasswordConfirm) {
      setError('Le password non coincidono');
      return;
    }
    
    setError('');
    setSmsVerifying(true);
    
    try {
      const functions = getFunctions(undefined, 'europe-west1');
      const verifySmsCode = httpsCallable(functions, 'verifySmsResetCode');
      
      const result = await verifySmsCode({
        email: resetEmail,
        code: smsCode,
        newPassword: newPassword,
      });
      
      if (result.data.success) {
        // Password cambiata! Mostra messaggio
        setResetSuccess(true);
        setError('');
        
        // Dopo 2 secondi torna al login
        setTimeout(() => {
          setShowResetPassword(false);
          setShowNewPasswordForm(false);
          setResetSuccess(false);
          setResetEmail('');
          setSmsCodeSent(false);
          setSmsCode('');
          setNewPassword('');
          setNewPasswordConfirm('');
          setResetMode('email');
        }, 2000);
      } else {
        setError(result.data.message || 'Errore cambio password');
      }
    } catch (error) {
      console.error('Errore verifica codice:', error);
      if (error.code === 'functions/invalid-argument') {
        setError(error.message); // Include tentativi rimasti
      } else if (error.code === 'functions/deadline-exceeded') {
        setError('Codice scaduto. Richiedi un nuovo codice.');
        setSmsCodeSent(false);
        setSmsCode('');
      } else if (error.code === 'functions/resource-exhausted') {
        setError('Troppi tentativi errati. Il codice è stato invalidato.');
        setSmsCodeSent(false);
        setSmsCode('');
      } else {
        setError('Errore verifica: ' + error.message);
      }
    } finally {
      setSmsVerifying(false);
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

  // Fase di loading/transizione - usa animazione spettacolare
  const showLoadingPhase = isCheckingAuth || isLoggingIn || pendingNavigation;

  if (showLoadingPhase) {
    return (
      <motion.div
        initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.8 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        exit={{ opacity: 0, filter: 'blur(30px)', scale: 1.3 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
      >
        {/* Nebula background con effetti intensi */}
        <NebulaBackground preset="cosmic" className="opacity-70" />
        
        {/* Particelle che esplodono */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
              initial={{ 
                x: '50vw', 
                y: '50vh', 
                scale: 0,
                opacity: 1 
              }}
              animate={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1.5, 0],
                opacity: [1, 0.8, 0]
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.008,
                ease: "easeOut"
              }}
            />
          ))}
        </motion.div>
        
        {/* Onde concentriche */}
        <motion.div className="absolute inset-0 flex items-center justify-center">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-cyan-400/30 rounded-full"
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ 
                width: ['0px', '300px', '800px'], 
                height: ['0px', '300px', '800px'], 
                opacity: [1, 0.5, 0] 
              }}
              transition={{
                duration: 0.4,
                delay: i * 0.08,
                ease: "easeOut"
              }}
            />
          ))}
        </motion.div>
        
        {/* Logo centrale con rotazione spettacolare */}
        <motion.div
          className="relative z-10 flex flex-col items-center"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ 
            scale: [0, 1.2, 1], 
            rotate: [0, 360] 
          }}
          transition={{ 
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          {/* Alone luminoso */}
          <motion.div 
            className="absolute -inset-12 bg-gradient-to-r from-blue-500/40 via-cyan-500/40 to-blue-500/40 rounded-full blur-2xl"
            animate={{ 
              scale: [1, 2, 1.5, 1.2], 
              opacity: [0.4, 0.8, 0.6, 0.5] 
            }}
            transition={{ 
              duration: 0.5, 
              ease: "easeInOut" 
            }}
          />
          
          {/* Logo */}
          <motion.div 
            className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/50"
            animate={{
              boxShadow: [
                '0 0 50px rgba(59, 130, 246, 0.5)',
                '0 0 100px rgba(6, 182, 212, 0.8)',
                '0 0 80px rgba(59, 130, 246, 0.6)',
              ]
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <img 
              src="/logo192.png" 
              alt="Logo" 
              className="w-16 h-16 rounded-xl"
            />
          </motion.div>
        </motion.div>
        
        {/* Testo motivazionale */}
        <motion.div
          className="absolute bottom-24 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.h2
            className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {isLoggingIn ? 'Benvenuto!' : 'PtPro'}
          </motion.h2>
          <motion.p
            className="text-slate-300 text-lg"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {isLoggingIn ? 'Accesso in corso...' : 'Caricamento...'}
          </motion.p>
        </motion.div>
        
        {/* Bordi luminosi che si espandono */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div
            className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          />
          <motion.div
            className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          />
          <motion.div
            className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Sfondo Nebula Full Screen */}
      <NebulaBackground preset="aurora" />
      
      {/* Overlay Satinato leggero */}
      <div className="absolute inset-0 bg-slate-950/15 backdrop-blur-[2px]" />
      
      {/* Logo in alto a sinistra */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-6 left-6 z-20 flex items-center gap-3"
      >
        <div className="relative">
          {/* Glow logo */}
          <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/40 to-blue-600/40 rounded-xl blur-xl" />
          <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-cyan-400/60 shadow-xl shadow-cyan-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600" />
            <img 
              src="/logo192.png" 
              alt="FitFlows Logo" 
              className="relative w-full h-full object-cover z-10"
            />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-black text-white drop-shadow-lg">
            <span className="bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
              FitFlows
            </span>
          </h1>
          <p className="text-slate-300 text-xs font-semibold">Premium Fitness</p>
        </div>
      </motion.div>

      {/* DESKTOP & MOBILE: Form Centrale */}
      <div className="w-full max-w-md px-6 z-10">
        {/* Form Glass */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Glow esterno più definito */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-cyan-600/40 rounded-3xl blur-xl" />
          
          {/* Form Box Glassmorphic Premium */}
          <div className="relative bg-slate-800/60 backdrop-blur-3xl border border-slate-500/50 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(6,182,212,0.2)]">
            {/* Border gradient interno */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />
            
            {/* Riflessi più evidenti */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
            
            {/* Header */}
            <div className="text-center mb-8">
              <motion.h2 
                key={showResetPassword ? 'reset' : 'login'}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-2 drop-shadow-lg"
              >
                {showResetPassword ? 'Reimposta Password' : 'Bentornato!'}
              </motion.h2>
              <motion.p 
                key={showResetPassword ? 'reset-desc' : 'login-desc'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-slate-300"
              >
                {showResetPassword 
                  ? 'Inserisci la tua email per ricevere il link di reset'
                  : 'Siamo così felici di rivederti!'}
              </motion.p>
            </div>

            {/* Form con AnimatePresence per transizioni */}
            <AnimatePresence mode="wait">
            {showResetPassword ? (
              <motion.form 
                key="reset-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleResetPassword} 
                className="space-y-4"
              >
                {/* Tab Switcher Email/SMS - SEMPRE VISIBILE */}
                <div className="flex gap-2 p-1 bg-slate-950/90 rounded-lg border border-slate-700/40 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode('email');
                      setSmsCodeSent(false);
                      setSmsCode('');
                      setError('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                      resetMode === 'email'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📧 Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode('sms');
                      setSmsCodeSent(false);
                      setSmsCode('');
                      setError('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                      resetMode === 'sms'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📱 SMS
                  </button>
                </div>

                {resetMode === 'email' ? (
                  /* Reset via Email */
                  <div>
                    <label htmlFor="reset-email" className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          setIsValidEmail(validateEmail(e.target.value));
                        }}
                        className="w-full px-4 py-3 pr-10 bg-slate-950/90 border border-slate-600/60 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all backdrop-blur-sm"
                        placeholder="nome@esempio.com"
                        autoComplete="email"
                        required
                        autoFocus
                        aria-label="Email per reset password"
                      />
                      {/* Checkmark validazione */}
                      <AnimatePresence>
                        {isValidEmail === true && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <CheckCircle className="text-green-400" size={18} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  /* Reset via SMS */
                  !smsCodeSent ? (
                    /* Step 1: Chiedi email per cercare numero */
                    <div>
                      <label htmlFor="reset-email-sms" className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <div className="relative group">
                        <input
                          id="reset-email-sms"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            setIsValidEmail(validateEmail(e.target.value));
                          }}
                          className="w-full px-4 py-3 pr-10 bg-slate-950/90 border border-slate-600/60 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all backdrop-blur-sm"
                          placeholder="nome@esempio.com"
                          autoComplete="email"
                          required
                          autoFocus
                          aria-label="Email per cercare numero di telefono"
                        />
                        {/* Checkmark validazione */}
                        <AnimatePresence>
                          {isValidEmail === true && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              <CheckCircle className="text-green-400" size={18} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        📲 Invieremo un codice a 6 cifre via SMS al numero associato a questa email
                      </p>
                    </div>
                  ) : !showNewPasswordForm ? (
                    /* Step 2: Form inserimento codice OTP */
                    <div>
                      <label htmlFor="sms-code" className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
                        Codice SMS <span className="text-red-400">*</span>
                      </label>
                      <div className="relative group">
                        <input
                          id="sms-code"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 bg-slate-950/90 border border-slate-600/60 rounded-lg text-white text-center text-2xl tracking-widest placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all backdrop-blur-sm"
                          placeholder="000000"
                          required
                          autoFocus
                          aria-label="Codice OTP ricevuto via SMS"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-400">
                          📱 Inserisci il codice ricevuto via SMS
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSmsCodeSent(false);
                            setSmsCode('');
                            setError('');
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          Richiedi nuovo codice
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Step 3: Form nuova password */
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="new-password" className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
                          Nuova Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative group">
                          <input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-10 bg-slate-950/90 border border-slate-600/60 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all backdrop-blur-sm"
                            placeholder="Almeno 6 caratteri"
                            autoComplete="new-password"
                            required
                            autoFocus
                            minLength={6}
                            aria-label="Nuova password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
                          Conferma Password <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          value={newPasswordConfirm}
                          onChange={(e) => setNewPasswordConfirm(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950/90 border border-slate-600/60 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all backdrop-blur-sm"
                          placeholder="Ripeti la password"
                          autoComplete="new-password"
                          required
                          minLength={6}
                          aria-label="Conferma password"
                        />
                      </div>
                      
                      <p className="text-xs text-slate-400">
                        🔒 La password deve essere di almeno 6 caratteri
                      </p>
                    </div>
                  )
                )}

                {/* Success Message */}
                <AnimatePresence>
                  {resetSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 backdrop-blur-sm"
                    >
                      <p className="text-green-400 text-sm text-center font-medium">
                        {resetMode === 'email' 
                          ? '✅ Email inviata! Controlla la tua casella di posta (anche spam)'
                          : '✅ Codice verificato! Reindirizzamento...'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* SMS Code Sent Message */}
                <AnimatePresence>
                  {smsCodeSent && !resetSuccess && !error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 backdrop-blur-sm"
                    >
                      <p className="text-blue-400 text-sm text-center font-medium">
                        📲 SMS inviato! Controlla il tuo telefono
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && !resetSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm"
                    >
                      <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  onClick={
                    showNewPasswordForm 
                      ? handleChangePassword 
                      : (smsCodeSent && resetMode === 'sms' ? handleVerifySmsCode : handleResetPassword)
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={
                    resetSuccess || 
                    smsVerifying ||
                    (resetMode === 'email' && !isValidEmail) || 
                    (resetMode === 'sms' && !smsCodeSent && !showNewPasswordForm && !isValidEmail) ||
                    (resetMode === 'sms' && smsCodeSent && !showNewPasswordForm && smsCode.length !== 6) ||
                    (showNewPasswordForm && (!newPassword || newPassword.length < 6 || !newPasswordConfirm))
                  }
                  aria-label="Invia link di reset password"
                >
                  {smsVerifying && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {resetSuccess 
                    ? '✓ Password cambiata!' 
                    : smsVerifying
                      ? (showNewPasswordForm ? 'Cambio password...' : smsCodeSent ? 'Verifica...' : 'Invio SMS...')
                      : showNewPasswordForm
                        ? 'Cambia Password'
                        : resetMode === 'email' 
                          ? 'Invia Link via Email' 
                          : smsCodeSent
                            ? 'Verifica Codice'
                            : 'Invia Codice via SMS'}
                </motion.button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail('');
                    setResetPhone('');
                    setPhoneAvailable(false);
                    setResetMode('email');
                    setSmsCodeSent(false);
                    setSmsCode('');
                    setShowNewPasswordForm(false);
                    setNewPassword('');
                    setNewPasswordConfirm('');
                    setError('');
                    setResetSuccess(false);
                  }}
                  className="w-full text-cyan-300 hover:text-cyan-200 text-sm font-semibold transition-colors"
                  aria-label="Torna al form di login"
                  disabled={smsVerifying}
                >
                  ← Torna al login
                </button>
              </motion.form>
            ) : (
              /* Form Login Normale */
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin} 
                className="space-y-4"
              >
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
                  Email o numero di telefono <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsValidEmail(validateEmail(e.target.value));
                    }}
                    className="w-full px-4 py-3 pr-10 bg-slate-950/90 border border-slate-600/60 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="nome@esempio.com"
                    autoComplete="email"
                    required
                    disabled={isLoggingIn}
                    aria-label="Email o numero di telefono"
                  />
                  {/* Checkmark validazione */}
                  <AnimatePresence>
                    {isValidEmail === true && !isLoggingIn && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <CheckCircle className="text-green-400" size={18} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-slate-950/90 border border-slate-600/60 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={isLoggingIn}
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
                    disabled={isLoggingIn}
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password dimenticata */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(true);
                    setError('');
                    setIsValidEmail(null);
                    // Pre-compila email se già inserita
                    if (email && validateEmail(email)) {
                      setResetEmail(email);
                    }
                  }}
                  className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors font-semibold"
                  disabled={isLoggingIn}
                  aria-label="Reimposta password dimenticata"
                >
                  Hai dimenticato la tua password?
                </button>
              </div>

              {/* Checkbox "Ricordami" */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                  disabled={isLoggingIn}
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-300 cursor-pointer select-none">
                  Ricordami su questo dispositivo
                </label>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm"
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
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all text-base disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoggingIn}
                aria-label="Accedi alla piattaforma"
              >
                {isLoggingIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ⏳
                    </motion.span>
                    Accesso in corso...
                  </span>
                ) : 'Accedi'}
              </motion.button>

              {/* Footer - Solo nel form login normale */}
              <div className="mt-4 text-center">
                <p className="text-slate-300 text-sm font-medium">
                  Ti serve un account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (isMobile()) {
                        window.location.href = '/landing';
                      } else {
                        window.open('/landing', '_blank');
                      }
                    }}
                    className="text-cyan-300 hover:text-cyan-200 font-bold hover:underline transition-colors"
                  >
                    Registrati
                  </button>
                </p>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-6 my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600/60"></div>
                </div>
                <div className="relative bg-slate-800/90 backdrop-blur-sm px-3 text-xs text-slate-400 font-semibold">
                  O accedi con passkey
                </div>
              </div>

              {/* Google Login Button */}
              <motion.button
                type="button"
                onClick={handleGoogleLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoggingIn || isGoogleLoading}
                className="w-full py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Accedi con account Google"
              >
                {isGoogleLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⏳
                  </motion.span>
                ) : (
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                )}
                <span>{isGoogleLoading ? 'Connessione...' : 'Accedi con Google'}</span>
              </motion.button>

              <p className="text-xs text-slate-400 text-center mt-3">
                💡 Solo se hai già collegato Google al tuo account
              </p>
            </motion.form>
            )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;