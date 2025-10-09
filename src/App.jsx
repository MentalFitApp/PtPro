import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
    <p className="mt-4 text-sm">Caricamento autenticazione...</p>
  </div>
);

const ProtectedRoute = ({ isAllowed, redirectPath, children }) => {
  if (!isAllowed) {
    console.log('Accesso negato, reindirizzamento a:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }
  return children ? children : <Outlet />;
};

export default function App() {
  const [authInfo, setAuthInfo] = useState({
    isLoading: true,
    user: null,
    isClient: false,
    isCoach: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted || isProcessing) return;

      setIsProcessing(true);
      console.log('onAuthStateChanged:', currentUser ? `Utente autenticato: ${currentUser.uid}` : 'Nessun utente autenticato');
      if (currentUser) {
        const sessionRole = sessionStorage.getItem('app_role');
        const clientDocRef = doc(db, 'clients', currentUser.uid);
        try {
          const clientDoc = await getDoc(clientDocRef);
          const isCurrentUserAClient = clientDoc.exists() && clientDoc.data().isClient === true;
          const isCurrentUserACoach = currentUser.uid === 'l0RI8TzFjbNVoAdmcXNQkP9mWb12';
          const isCurrentUserAdmin = [
            "QwWST9OVOlTOi5oheyCqfpXLOLg2",
            "3j0AXIRa4XdHq1ywCl4UBxJNsku2",
            "AeZKjJYu5zMZ4mvffaGiqCBb0cF2"
          ].includes(currentUser.uid);

          console.log('Ruolo utente:', { isClient: isCurrentUserAClient, isCoach: isCurrentUserACoach, isAdmin: isCurrentUserAdmin, sessionRole });

          if (sessionRole && sessionRole !== (isCurrentUserAClient ? 'client' : isCurrentUserACoach ? 'coach' : 'admin')) {
            console.log('Conflitto ruolo, reset sessionStorage:', sessionRole);
            sessionStorage.removeItem('app_role');
          }

          if (isCurrentUserACoach) {
            sessionStorage.setItem('app_role', 'coach');
          } else if (isCurrentUserAClient) {
            sessionStorage.setItem('app_role', 'client');
          } else if (isCurrentUserAdmin) {
            sessionStorage.setItem('app_role', 'admin');
          }

          setAuthInfo({
            isLoading: false,
            user: currentUser,
            isClient: isCurrentUserAClient,
            isCoach: isCurrentUserACoach,
          });
        } catch (error) {
          console.error('Errore nel recupero del documento cliente:', error);
          // Non eseguiamo signOut, permettiamo alla pagina di login di gestire l'errore
          setAuthInfo({
            isLoading: false,
            user: currentUser,
            isClient: false,
            isCoach: currentUser.uid === 'l0RI8TzFjbNVoAdmcXNQkP9mWb12',
          });
        }
      } else {
        sessionStorage.removeItem('app_role');
        setAuthInfo({ isLoading: false, user: null, isClient: false, isCoach: false });
      }
      setIsProcessing(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isProcessing]);

  if (authInfo.isLoading) {
    return <AuthSpinner />;
  }

  return (
    <HashRouter>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/client/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute isAllowed={authInfo.user && !authInfo.isClient && !authInfo.isCoach} redirectPath="/login" />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/new" element={<NewClient />} />
              <Route path="/client/:clientId" element={<ClientDetail />} />
              <Route path="/edit/:clientId" element={<EditClient />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/chat" element={<AdminChat />} />
              <Route path="/admin/anamnesi/:uid" element={<AdminAnamnesi />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute isAllowed={authInfo.user && authInfo.isClient} redirectPath="/client-login" />}>
            <Route element={<ClientLayout />}>
              <Route path="/client/first-access" element={<FirstAccess />} />
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/anamnesi" element={<ClientAnamnesi />} />
              <Route path="/client/checks" element={<ClientChecks />} />
              <Route path="/client/payments" element={<ClientPayments />} />
              <Route path="/client/chat" element={<ClientChat />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute isAllowed={authInfo.user && authInfo.isCoach} redirectPath="/login" />}>
            <Route element={<MainLayout />}>
              <Route path="/coach-dashboard" element={<CoachDashboard />} />
              <Route path="/coach/anamnesi" element={<CoachAnamnesi />} />
              <Route path="/coach/updates" element={<CoachUpdates />} />
              <Route path="/coach/clients" element={<CoachClients />} />
              <Route path="/coach/chat" element={<CoachChat />} />
              <Route path="/coach/client/:clientId" element={<CoachClientDetail />} />
            </Route>
          </Route>
          <Route 
            path="*" 
            element={
              !authInfo.user 
                ? <Navigate to="/login" /> 
                : authInfo.isClient 
                  ? <Navigate to="/client/dashboard" /> 
                  : authInfo.isCoach 
                    ? <Navigate to="/coach-dashboard" />
                    : <Navigate to="/" />
            } 
          />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}