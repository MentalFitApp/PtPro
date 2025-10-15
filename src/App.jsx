import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"; // 1. Importa useLocation
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

// Import dinamici dei layout
const MainLayout = React.lazy(() => import('./components/MainLayout'));
const ClientLayout = React.lazy(() => import('./components/ClientLayout'));
const GuidaLayout = React.lazy(() => import('./components/GuidaLayout'));

// Import dinamici delle pagine
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Clients = React.lazy(() => import('./pages/Clients'));
const NewClient = React.lazy(() => import('./pages/NewClient'));
const ClientDetail = React.lazy(() => import('./pages/ClientDetail'));
const EditClient = React.lazy(() => import('./pages/EditClient'));
const Updates = React.lazy(() => import('./pages/Updates'));
const AdminChat = React.lazy(() => import('./pages/AdminChat'));
const ClientLogin = React.lazy(() => import('./pages/ClientLogin'));
const FirstAccess = React.lazy(() => import('./pages/FirstAccess'));
const ClientDashboard = React.lazy(() => import('./pages/ClientDashboard'));
const ClientAnamnesi = React.lazy(() => import('./pages/ClientAnamnesi'));
const ClientChecks = React.lazy(() => import('./pages/ClientChecks'));
const ClientPayments = React.lazy(() => import('./pages/ClientPayments'));
const ClientChat = React.lazy(() => import('./pages/ClientChat'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const AdminAnamnesi = React.lazy(() => import('./pages/AdminAnamnesi'));
const CoachDashboard = React.lazy(() => import('./pages/CoachDashboard'));
const CoachAnamnesi = React.lazy(() => import('./pages/CoachAnamnesi'));
const CoachUpdates = React.lazy(() => import('./pages/CoachUpdates'));
const CoachClients = React.lazy(() => import('./pages/CoachClients'));
const CoachChat = React.lazy(() => import('./pages/CoachChat'));
const CoachClientDetail = React.lazy(() => import('./pages/CoachClientDetail'));
const GuidaMentalFit = React.lazy(() => import('./pages/GuidaMentalFit'));


// Spinner di caricamento
const PageSpinner = () => (
    <div className="flex justify-center items-center h-screen w-full bg-zinc-950">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
);
  
const AuthSpinner = () => (
    <div className="flex flex-col justify-center items-center min-h-screen bg-zinc-950 text-slate-200">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
      <p className="mt-4 text-sm">Verifica autenticazione...</p>
    </div>
);

export default function App() {
  const [authInfo, setAuthInfo] = useState({
    isLoading: true,
    user: null,
    isClient: false,
    isCoach: false,
    isAdmin: false,
    error: null,
  });
  const [lastNavigated, setLastNavigated] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // 2. Ottieni la posizione corrente

  useEffect(() => {
    // 3. NUOVA CONDIZIONE DI BLOCCO
    // Se l'utente si trova sulla pagina della guida, interrompiamo la logica di autenticazione.
    if (location.pathname === '/guida') {
      setAuthInfo(prev => ({ ...prev, isLoading: false })); // Sblocca solo il rendering
      return; // Interrompi l'esecuzione dell'hook
    }

    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      console.log('onAuthStateChanged:', currentUser ? `Utente autenticato: ${currentUser.uid} (${currentUser.email})` : 'Nessun utente autenticato');
      try {
        if (currentUser) {
          const clientDocRef = doc(db, 'clients', currentUser.uid);
          const adminDocRef = doc(db, 'roles', 'admins');
          const coachDocRef = doc(db, 'roles', 'coaches');
          const [adminDoc, coachDoc, clientDoc] = await Promise.all([
            getDoc(adminDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(coachDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(clientDocRef).catch(() => ({ exists: () => false, data: () => ({}) }))
          ]);

          const isCurrentUserAdmin = adminDoc.exists() && adminDoc.data().uids.includes(currentUser.uid);
          const isCurrentUserACoach = coachDoc.exists() && coachDoc.data().uids.includes(currentUser.uid);
          const isCurrentUserAClient = clientDoc.exists() && clientDoc.data().isClient === true;
          
          if ((isCurrentUserACoach || isCurrentUserAdmin) && clientDoc.exists()) {
            await deleteDoc(clientDocRef).catch(err => console.error('Errore eliminazione documento errato:', err));
          }

          let role = null;
          let targetRoute = null;
          if (isCurrentUserAdmin) {
            role = 'admin';
            targetRoute = '/';
          } else if (isCurrentUserACoach) {
            role = 'coach';
            targetRoute = '/coach';
          } else if (isCurrentUserAClient) {
            role = 'client';
            const clientDocData = clientDoc.exists() ? clientDoc.data() : {};
            targetRoute = clientDocData.firstLogin ? '/client/first-access' : '/client/dashboard';
          } else {
            role = null;
            targetRoute = '/login';
          }

          sessionStorage.setItem('app_role', role || '');

          if (location.pathname !== targetRoute && lastNavigated !== targetRoute) {
            setLastNavigated(targetRoute);
            navigate(targetRoute);
          }

          setAuthInfo({
            isLoading: false,
            user: currentUser,
            isClient: isCurrentUserAClient,
            isCoach: isCurrentUserACoach,
            isAdmin: isCurrentUserAdmin,
            error: null
          });
        } else {
          sessionStorage.removeItem('app_role');
          setAuthInfo({
            isLoading: false,
            user: null,
            isClient: false,
            isCoach: false,
            isAdmin: false,
            error: null
          });
          // Non reindirizzare se siamo già su una pagina pubblica permessa
          const publicPaths = ['/login', '/client-login', '/client/forgot-password', '/guida'];
          if (!publicPaths.includes(location.pathname)) {
            if (lastNavigated !== '/login') {
                setLastNavigated('/login');
                navigate('/login');
            }
          }
        }
      } catch (error) {
        console.error('Errore nel recupero del documento cliente:', error.message);
        setAuthInfo({ isLoading: false, user: currentUser, isClient: false, isCoach: false, isAdmin: false, error: 'Errore durante la verifica del ruolo. Riprova.' });
        if (lastNavigated !== '/login') {
          setLastNavigated('/login');
          navigate('/login');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [location.pathname, navigate]); // 4. Aggiungi location.pathname alle dipendenze

  if (authInfo.isLoading) return <AuthSpinner />;
  if (authInfo.error) return <div className="text-red-500 text-center p-4">{authInfo.error}</div>;

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Rotte pubbliche */}
        <Route element={<GuidaLayout />}>
          <Route path="/guida" element={<GuidaMentalFit />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/client/forgot-password" element={<ForgotPassword />} />

        {/* Rotte per admin/coach */}
        <Route element={authInfo.isCoach || authInfo.isAdmin ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/new" element={<NewClient />} />
          <Route path="/client/:id" element={<ClientDetail />} />
          <Route path="/edit/:id" element={<EditClient />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/chat" element={<AdminChat />} />
          <Route path="/client/:id/anamnesi" element={<AdminAnamnesi />} />
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/coach/clients" element={<CoachClients />} />
          <Route path="/coach/client/:id" element={<CoachClientDetail />} />
          <Route path="/coach/anamnesi" element={<CoachAnamnesi />} />
          <Route path="/coach/updates" element={<CoachUpdates />} />
          <Route path="/coach/chat" element={<CoachChat />} />
        </Route>

        {/* Rotte per clienti */}
        <Route element={authInfo.isClient ? <ClientLayout /> : <Navigate to="/client-login" replace />}>
          <Route path="/client/first-access" element={<FirstAccess />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/anamnesi" element={<ClientAnamnesi />} />
          <Route path="/client/checks" element={<ClientChecks />} />
          <Route path="/client/payments" element={<ClientPayments />} />
          <Route path="/client/chat" element={<ClientChat />} />
        </Route>

        {/* Rotta di default */}
        <Route path="*" element={<Navigate to={authInfo.user ? (authInfo.isClient ? "/client/dashboard" : "/") : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}

