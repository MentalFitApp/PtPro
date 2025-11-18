import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
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
const CollaboratoreDashboard = React.lazy(() => import('./pages/CollaboratoreDashboard'));
const CollaboratoreDetail = React.lazy(() => import('./pages/CollaboratoreDetail'));
const CalendarReport = React.lazy(() => import('./pages/CalendarReport'));
const NewClient = React.lazy(() => import('./pages/NewClient'));
const Dipendenti = React.lazy(() => import('./pages/Dipendenti'));
const GuideCapture = React.lazy(() => import('./pages/GuideCapture'));
const GuideManager = React.lazy(() => import('./pages/GuideManager'));

// AGGIUNTO
const Statistiche = React.lazy(() => import('./pages/Statistiche'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const Notifications = React.lazy(() => import('./pages/Notifications'));

// Spinner
const PageSpinner = () => (
  <div className="flex justify-center items-center h-screen w-full bg-slate-900">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
  </div>
);

const AuthSpinner = () => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-slate-900 text-slate-200">
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

  // Salva sempre l'ultima path navigata (HashRouter fornisce pathname già dopo #)
  useEffect(() => {
    try {
      localStorage.setItem('last_path', location.pathname || '/');
    } catch {}
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/guida' || location.pathname.startsWith('/guida/')) {
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

          // Prima controlla se è collaboratore (non richiede permessi su roles)
          const collabDoc = await getDoc(collabDocRef).catch(() => ({ exists: () => false, data: () => ({}) }));
          const isCurrentUserACollaboratore = collabDoc.exists();

          // Se è collaboratore, salta controlli admin/coach/client
          let isCurrentUserAdmin = false;
          let isCurrentUserACoach = false;
          let isCurrentUserAClient = false;
          let adminDoc, coachDoc, clientDoc;

          if (!isCurrentUserACollaboratore) {
            [adminDoc, coachDoc, clientDoc] = await Promise.all([
              getDoc(adminDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
              getDoc(coachDocRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
              getDoc(clientDocRef).catch(() => ({ exists: () => false, data: () => ({}) }))
            ]);

            // RIMOSSO: logica auto-admin per evitare sovrascritture accidentali
            // Gli admin devono essere gestiti manualmente su Firestore o tramite script

            isCurrentUserAdmin = adminDoc.exists() && adminDoc.data().uids.includes(currentUser.uid);
            isCurrentUserACoach = coachDoc.exists() && coachDoc.data().uids.includes(currentUser.uid);
            isCurrentUserAClient = clientDoc.exists() && clientDoc.data().isClient === true;
          }

          // PULIZIA RUOLI DOPPI (solo se non è collaboratore)
          if (!isCurrentUserACollaboratore && (isCurrentUserACoach || isCurrentUserAdmin) && isCurrentUserAClient) {
            await deleteDoc(clientDocRef).catch(() => {});
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
              location.pathname === '/new-client' ||
              location.pathname.startsWith('/client/') ||
              location.pathname.startsWith('/edit/') ||
              location.pathname === '/updates' ||
              location.pathname === '/chat' ||
              location.pathname === '/collaboratori' ||
              location.pathname.startsWith('/collaboratore/') ||
              location.pathname.startsWith('/calendar-report/') ||
              location.pathname === '/business-history' ||
              location.pathname === '/guide-manager' ||
              location.pathname === '/admin/dipendenti' ||
              location.pathname === '/statistiche' ||
              location.pathname === '/notifications'
            )) ||
            (isCurrentUserACoach && (
              location.pathname === '/coach' ||
              location.pathname === '/coach/clients' ||
              location.pathname.startsWith('/coach/client/') ||
              location.pathname === '/coach/anamnesi' ||
              location.pathname === '/coach/updates' ||
              location.pathname === '/coach/chat' ||
              location.pathname.startsWith('/coach/client/')
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

          const publicPaths = ['/login', '/client/forgot-password', '/guida', '/guida/:guideId'];
          const isPublic = publicPaths.some(p => location.pathname === p || location.pathname.startsWith('/guida/'));
          if (!isPublic) {
            const target = '/login';
            if (lastNavigated !== target) {
              setLastNavigated(target);
              navigate(target, { replace: true });
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
  }, [location.pathname, navigate, lastNavigated]);

  if (authInfo.isLoading) return <AuthSpinner />;
  if (authInfo.error) return <div className="text-red-500 text-center p-4">{authInfo.error}</div>;

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* === ROTTE PUBBLICHE === */}
        <Route element={<GuidaLayout />}>
          <Route path="/guida" element={<GuidaMentalFit />} />
          <Route path="/guida/:guideId" element={<GuideCapture />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/client/forgot-password" element={<ForgotPassword />} />

        {/* === ROTTE ADMIN (SOLO ADMIN) === */}
        <Route element={authInfo.isAdmin ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/new-client" element={<NewClient />} />
          <Route path="/client/:clientId" element={<ClientDetail />} />
          <Route path="/edit/:id" element={<EditClient />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/chat" element={<AdminChat />} />
          <Route path="/client/:id/anamnesi" element={<AdminAnamnesi />} />
          <Route path="/collaboratori" element={<Collaboratori />} />
          <Route path="/collaboratore-detail" element={<CollaboratoreDetail />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/calendar-report/:date" element={<CalendarReport />} />
          <Route path="/business-history" element={<BusinessHistory />} />
          <Route path="/guide-manager" element={<GuideManager />} />
          <Route path="/admin/dipendenti" element={<Dipendenti />} />
          <Route path="/statistiche" element={<Statistiche />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* === ROTTE COACH (SOLO COACH) === */}
        <Route element={authInfo.isCoach ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/coach/clients" element={<CoachClients />} />
          <Route path="/coach/client/:id" element={<CoachClientDetail />} />
          <Route path="/coach/anamnesi" element={<CoachAnamnesi />} />
          <Route path="/coach/updates" element={<CoachUpdates />} />
          <Route path="/coach/chat" element={<CoachChat />} />
          <Route path="/coach/client/:clientId/checks" element={<ClientChecks />} />
        </Route>

        {/* === ROTTE CLIENTI === */}
        <Route element={authInfo.isClient ? <ClientLayout /> : <Navigate to="/login" replace />}>
          <Route path="/client/first-access" element={<FirstAccess />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/anamnesi" element={<ClientAnamnesi />} />
          <Route path="/client/checks" element={<ClientChecks />} />
          <Route path="/client/payments" element={<ClientPayments />} />
          <Route path="/client/chat" element={<ClientChat />} />
        </Route>

        {/* === ROTTE COLLABORATORI === */}
        <Route element={authInfo.isCollaboratore ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/collaboratore/first-access" element={<FirstAccess />} />
          <Route path="/collaboratore/dashboard" element={<CollaboratoreDashboard />} />
          <Route path="/collaboratore/calendar" element={<CalendarPage />} />
          {/* Aggiungi altre rotte future qui se vuoi */}
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