import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Import dinamici
const MainLayout = React.lazy(() => import('./components/MainLayout'));
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

// Spinner di caricamento
const PageSpinner = () => (
  <div className="flex justify-center items-center h-screen w-full bg-zinc-950">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
  </div>
);

const AuthSpinner = () => (
  <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
    Caricamento...
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('onAuthStateChanged:', currentUser ? `Utente autenticato: ${currentUser.uid}` : 'Nessun utente autenticato');
      if (currentUser) {
        const sessionRole = sessionStorage.getItem('app_role');
        const clientDocRef = doc(db, 'clients', currentUser.uid);
        try {
          const clientDoc = await getDoc(clientDocRef);
          const isCurrentUserAClient = clientDoc.exists() && clientDoc.data().isClient;
          const isCurrentUserACoach = currentUser.uid === 'l0RI8TzFjbNVoAdmcxNQkP9mWb12';
          console.log('Ruolo utente:', { isClient: isCurrentUserAClient, isCoach: isCurrentUserACoach, sessionRole });
          if (sessionRole === 'admin' && isCurrentUserAClient) {
            console.log('Logout forzato: utente cliente che tenta accesso admin');
            await signOut(auth);
            setAuthInfo({ isLoading: false, user: null, isClient: false, isCoach: false });
            return;
          }
          setAuthInfo({
            isLoading: false,
            user: currentUser,
            isClient: isCurrentUserAClient,
            isCoach: isCurrentUserACoach,
          });
        } catch (error) {
          console.error('Errore nel recupero del documento cliente:', error);
          setAuthInfo({
            isLoading: false,
            user: currentUser,
            isClient: false,
            isCoach: currentUser.uid === 'l0RI8TzFjbNVoAdmcxNQkP9mWb12',
          });
        }
      } else {
        sessionStorage.removeItem('app_role');
        setAuthInfo({ isLoading: false, user: null, isClient: false, isCoach: false });
      }
    });
    return () => unsubscribe();
  }, []);

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
            <Route path="/client/first-access" element={<FirstAccess />} />
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/anamnesi" element={<ClientAnamnesi />} />
            <Route path="/client/checks" element={<ClientChecks />} />
            <Route path="/client/payments" element={<ClientPayments />} />
            <Route path="/client/chat" element={<ClientChat />} />
          </Route>
          <Route element={<ProtectedRoute isAllowed={authInfo.user && authInfo.isCoach} redirectPath="/login" />}>
            <Route element={<MainLayout />}>
              <Route path="/coach-dashboard" element={<CoachDashboard />} />
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