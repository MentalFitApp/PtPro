import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

// Import dinamici
const MainLayout = React.lazy(() => import('./components/MainLayout'));
const ClientLayout = React.lazy(() => import('./components/ClientLayout'));
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
  });
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      console.log('onAuthStateChanged:', currentUser ? `Utente autenticato: ${currentUser.uid} (${currentUser.email})` : 'Nessun utente autenticato');
      try {
        if (currentUser) {
          const sessionRole = sessionStorage.getItem('app_role');
          const clientDocRef = doc(db, 'clients', currentUser.uid);
          const clientDoc = await getDoc(clientDocRef, { source: 'server' });
          let isCurrentUserAClient = clientDoc.exists() && clientDoc.data().isClient === true;

          // Create client document if it doesn't exist
          if (!clientDoc.exists()) {
            await setDoc(clientDocRef, {
              name: currentUser.displayName || 'Unknown',
              email: currentUser.email,
              isClient: true,
              firstLogin: false
            }, { merge: true });
            console.log('Client document created for UID:', currentUser.uid);
            isCurrentUserAClient = true;
          }

          const isCurrentUserACoach = currentUser.uid === 'l0RI8TzFjbNVoAdmcXNQkP9mWb12';
          const isCurrentUserAdmin = [
            "QwWST9OVOlTOi5oheyCqfpXLOLg2",
            "3j0AXIRa4XdHq1ywCl4UBxJNsku2",
            "AeZKjJYu5zMZ4mvffaGiqCBb0cF2"
          ].includes(currentUser.uid);

          console.log('Ruolo utente:', {
            uid: currentUser.uid,
            email: currentUser.email,
            isClient: isCurrentUserAClient,
            isCoach: isCurrentUserACoach,
            isAdmin: isCurrentUserAdmin,
            sessionRole,
            clientDocData: clientDoc.exists() ? clientDoc.data() : null
          });

          if (sessionRole && sessionRole !== (isCurrentUserAClient ? 'client' : isCurrentUserACoach ? 'coach' : isCurrentUserAdmin ? 'admin' : null)) {
            console.log('Conflitto ruolo, reset sessionStorage:', sessionRole);
            sessionStorage.removeItem('app_role');
          }

          if (isCurrentUserACoach) {
            sessionStorage.setItem('app_role', 'coach');
          } else if (isCurrentUserAClient) {
            sessionStorage.setItem('app_role', 'client');
          } else if (isCurrentUserAdmin) {
            sessionStorage.setItem('app_role', 'admin');
          } else {
            console.log('Accesso non autorizzato per UID:', currentUser.uid);
            sessionStorage.removeItem('app_role');
            setAuthInfo({ isLoading: false, user: null, isClient: false, isCoach: false, isAdmin: false });
            await signOut(auth);
            navigate('/client-login');
            return;
          }

          setAuthInfo({
            isLoading: false,
            user: currentUser,
            isClient: isCurrentUserAClient,
            isCoach: isCurrentUserACoach,
            isAdmin: isCurrentUserAdmin,
          });
        } else {
          sessionStorage.removeItem('app_role');
          setAuthInfo({ isLoading: false, user: null, isClient: false, isCoach: false, isAdmin: false });
        }
      } catch (error) {
        console.error('Errore nel recupero del documento cliente:', error, {
          uid: currentUser?.uid,
          email: currentUser?.email,
          code: error.code,
          message: error.message
        });
        sessionStorage.removeItem('app_role');
        setAuthInfo({ isLoading: false, user: null, isClient: false, isCoach: false, isAdmin: false });
        await signOut(auth);
        navigate('/client-login');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  if (authInfo.isLoading) return <AuthSpinner />;

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Rotte pubbliche */}
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
        <Route path="*" element={<Navigate to={authInfo.isClient ? "/client/dashboard" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}