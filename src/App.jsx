import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

// Import dinamici dei layout
const MainLayout = React.lazy(() => import('./components/MainLayout'));
const ClientLayout = React.lazy(() => import('./components/ClientLayout'));
const GuidaLayout = React.lazy(() => import('./components/GuidaLayout'));

// Import dinamici delle pagine
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Clients = React.lazy(() => import('./pages/Clients'));
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
const BusinessHistory = React.lazy(() => import('./pages/BusinessHistory'));
const Collaboratori = React.lazy(() => import('./pages/Collaboratori'));
const CollaboratoreLogin = React.lazy(() => import('./pages/CollaboratoreLogin'));
const CollaboratoreDashboard = React.lazy(() => import('./pages/CollaboratoreDashboard'));
const CollaboratoreDetail = React.lazy(() => import('./pages/CollaboratoreDetail'));
const CalendarReport = React.lazy(() => import('./pages/CalendarReport'));
const NewClient = React.lazy(() => import('./pages/NewClient'));

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
    isCollaboratore: false,
    error: null,
  });
  const [lastNavigated, setLastNavigated] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/guida') {
      setAuthInfo(prev => ({ ...prev, isLoading: false }));
      return;
    }

    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      if (sessionStorage.getItem('creating_collaboratore') === 'true') {
        sessionStorage.removeItem('creating_collaboratore');
        return;
      }

      try {
        if (currentUser) {
          const clientDocRef = doc(db, 'clients', currentUser.uid);
          const adminDocRef = doc(db, 'roles', 'admins');
          const coachDocRef = doc(db, 'roles', 'coaches');
          const collabDocRef = doc(db, 'collaboratori', currentUser.uid);

          const [adminDoc, coachDoc, clientDoc, collabDoc] = await Promise.all([
            getDoc(adminDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(coachDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
            getDoc(clientDocRef).catch(() => ({ exists: () => false, data: () => ({}) })),
            getDoc(collabDocRef).catch(() => ({ exists: () => false, data: () => ({}) }))
          ]);

          if (!adminDoc.exists()) {
            await setDoc(adminDocRef, { uids: [currentUser.uid] });
          }

          const isCurrentUserAdmin = adminDoc.exists() && adminDoc.data().uids.includes(currentUser.uid);
          const isCurrentUserACoach = coachDoc.exists() && coachDoc.data().uids.includes(currentUser.uid);
          const isCurrentUserAClient = clientDoc.exists() && clientDoc.data().isClient === true;
          const isCurrentUserACollaboratore = collabDoc.exists() && collabDoc.data().firstLogin !== undefined;

          if ((isCurrentUserACoach || isCurrentUserAdmin) && (isCurrentUserAClient || isCurrentUserACollaboratore)) {
            await deleteDoc(clientDocRef).catch(() => {});
            await deleteDoc(collabDocRef).catch(() => {});
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
            const clientDocData = clientDoc.data();
            targetRoute = clientDocData.firstLogin ? '/client/first-access' : '/client/dashboard';
          } else if (isCurrentUserACollaboratore) {
            role = 'collaboratore';
            const collabDocData = collabDoc.data();
            targetRoute = collabDocData.firstLogin ? '/collaboratore/first-access' : '/collaboratore/dashboard';
          } else {
            role = null;
            targetRoute = '/login';
          }

          sessionStorage.setItem('app_role', role || '');

          const isValidSubRoute = 
            (isCurrentUserAdmin && (
              location.pathname === '/' ||
              location.pathname === '/clients' ||
              location.pathname === '/new' ||
              location.pathname.startsWith('/client/') ||
              location.pathname.startsWith('/edit/') ||
              location.pathname === '/updates' ||
              location.pathname === '/chat' ||
              location.pathname === '/collaboratori' ||
              location.pathname.startsWith('/collaboratore/') ||
              location.pathname.startsWith('/calendar-report/') ||
              location.pathname === '/business-history'
            )) ||
            (isCurrentUserACoach && (
              location.pathname === '/coach' ||
              location.pathname === '/coach/clients' ||
              location.pathname.startsWith('/coach/client/') ||
              location.pathname === '/coach/anamnesi' ||
              location.pathname === '/coach/updates' ||
              location.pathname === '/coach/chat'
            )) ||
            (isCurrentUserAClient && location.pathname.startsWith('/client/')) ||
            (isCurrentUserACollaboratore && location.pathname.startsWith('/collaboratore/'));

          if (!isValidSubRoute && location.pathname !== targetRoute && lastNavigated !== targetRoute) {
            setLastNavigated(targetRoute);
            navigate(targetRoute, { replace: true });
          }

          setAuthInfo({
            isLoading: false,
            user: currentUser,
            isClient: isCurrentUserAClient,
            isCoach: isCurrentUserACoach,
            isAdmin: isCurrentUserAdmin,
            isCollaboratore: isCurrentUserACollaboratore,
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
            isCollaboratore: false,
            error: null
          });

          const publicPaths = ['/login', '/client-login', '/collaboratore-login', '/client/forgot-password', '/guida'];
          if (!publicPaths.includes(location.pathname)) {
            if (lastNavigated !== '/login') {
              setLastNavigated('/login');
              navigate('/login', { replace: true });
            }
          }
        }
      } catch (error) {
        console.error('Errore verifica ruolo:', error);
        setAuthInfo(prev => ({ ...prev, isLoading: false, error: 'Errore autenticazione.' }));
        if (lastNavigated !== '/login') {
          setLastNavigated('/login');
          navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [location.pathname, navigate]);

  if (authInfo.isLoading) return <AuthSpinner />;
  if (authInfo.error) return <div className="text-red-500 text-center p-4">{authInfo.error}</div>;

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* === ROTTE PUBBLICHE === */}
        <Route element={<GuidaLayout />}>
          <Route path="/guida" element={<GuidaMentalFit />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/collaboratore-login" element={<CollaboratoreLogin />} />
        <Route path="/client/forgot-password" element={<ForgotPassword />} />

        {/* === ROTTE ADMIN / COACH === */}
        <Route element={authInfo.isCoach || authInfo.isAdmin ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/new" element={<NewClient />} />
          <Route path="/client/:clientId" element={<ClientDetail />} />
          <Route path="/edit/:id" element={<EditClient />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/chat" element={<AdminChat />} />
          <Route path="/client/:id/anamnesi" element={<AdminAnamnesi />} />
          <Route path="/collaboratori" element={<Collaboratori />} />
          <Route path="/collaboratore-detail" element={<CollaboratoreDetail />} />
          <Route path="/calendar-report/:date" element={<CalendarReport />} />
          <Route path="/business-history" element={<BusinessHistory />} />

          {/* === COACH === */}
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/coach/clients" element={<CoachClients />} />
          <Route path="/coach/client/:id" element={<CoachClientDetail />} />
          <Route path="/coach/anamnesi" element={<CoachAnamnesi />} />
          <Route path="/coach/updates" element={<CoachUpdates />} />
          <Route path="/coach/chat" element={<CoachChat />} />
          <Route path="/coach/client/:clientId/checks" element={<ClientChecks />} />
        </Route>

        {/* === ROTTE CLIENTI === */}
        <Route element={authInfo.isClient ? <ClientLayout /> : <Navigate to="/client-login" replace />}>
          <Route path="/client/first-access" element={<FirstAccess />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/anamnesi" element={<ClientAnamnesi />} />
          <Route path="/client/checks" element={<ClientChecks />} />
          <Route path="/client/payments" element={<ClientPayments />} />
          <Route path="/client/chat" element={<ClientChat />} />
        </Route>

        {/* === ROTTE COLLABORATORI === */}
        <Route element={authInfo.isCollaboratore ? <ClientLayout /> : <Navigate to="/collaboratore-login" replace />}>
          <Route path="/collaboratore/first-access" element={<FirstAccess />} />
          <Route path="/collaboratore/dashboard" element={<CollaboratoreDashboard />} />
        </Route>

        {/* === DEFAULT === */}
        <Route path="*" element={
          <Navigate 
            to={
              authInfo.user 
                ? (authInfo.isAdmin ? "/" 
                  : authInfo.isCoach ? "/coach" 
                  : authInfo.isCollaboratore ? "/collaboratore/dashboard" 
                  : "/login") 
                : "/login"
            } 
            replace 
          />
        } />
      </Routes>
    </Suspense>
  );
}