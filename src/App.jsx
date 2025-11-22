import React, { useState, useEffect, Suspense } from 'react';
import GlobalUploadBar from './components/ui/GlobalUploadBar';
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import { getTenantDoc } from './config/tenant';

// Import dinamici dei layout
const MainLayout = React.lazy(() => import('./components/layout/MainLayout'));
const SimpleLayout = React.lazy(() => import('./components/layout/SimpleLayout'));
const GuidaLayout = React.lazy(() => import('./components/layout/GuidaLayout'));

// Import dinamici delle pagine

// Auth Pages
const Login = React.lazy(() => import('./pages/auth/Login'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const FirstAccess = React.lazy(() => import('./pages/auth/FirstAccess'));

// Admin Pages
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const Clients = React.lazy(() => import('./pages/admin/Clients'));
const ClientDetail = React.lazy(() => import('./pages/admin/ClientDetail'));
const EditClient = React.lazy(() => import('./pages/admin/EditClient'));
const NewClient = React.lazy(() => import('./pages/admin/NewClient'));
const AdminAnamnesi = React.lazy(() => import('./pages/admin/AdminAnamnesi'));
const BusinessHistory = React.lazy(() => import('./pages/admin/BusinessHistory'));
const Collaboratori = React.lazy(() => import('./pages/admin/Collaboratori'));
const CollaboratoreDetail = React.lazy(() => import('./pages/admin/CollaboratoreDetail'));
const Dipendenti = React.lazy(() => import('./pages/admin/Dipendenti'));
const GuideCapture = React.lazy(() => import('./pages/admin/GuideCapture'));
const GuideManager = React.lazy(() => import('./pages/admin/GuideManager'));
const Statistiche = React.lazy(() => import('./pages/admin/Statistiche'));
const Analytics = React.lazy(() => import('./pages/admin/Analytics'));
const CourseAdmin = React.lazy(() => import('./pages/admin/CourseAdmin'));
const CourseContentManager = React.lazy(() => import('./pages/admin/CourseContentManager'));
const SuperAdminSettings = React.lazy(() => import('./pages/admin/SuperAdminSettings'));

// Platform CEO Pages
const CEOPlatformDashboard = React.lazy(() => import('./pages/platform/CEOPlatformDashboard'));
const PlatformLogin = React.lazy(() => import('./pages/platform/PlatformLogin'));

// Client Pages
const ClientDashboard = React.lazy(() => import('./pages/client/ClientDashboard'));
const ClientAnamnesi = React.lazy(() => import('./pages/client/ClientAnamnesi'));
const ClientChecks = React.lazy(() => import('./pages/client/ClientChecks'));
const ClientPayments = React.lazy(() => import('./pages/client/ClientPayments'));
const ClientSchedaAlimentazione = React.lazy(() => import('./pages/client/ClientSchedaAlimentazione'));
const ClientSchedaAlimentazioneEnhanced = React.lazy(() => import('./pages/client/ClientSchedaAlimentazioneEnhanced'));
const ClientSchedaAllenamento = React.lazy(() => import('./pages/client/ClientSchedaAllenamento'));

// Coach Pages
const CoachDashboard = React.lazy(() => import('./pages/coach/CoachDashboard'));
const CoachAnamnesi = React.lazy(() => import('./pages/coach/CoachAnamnesi'));
const CoachUpdates = React.lazy(() => import('./pages/coach/CoachUpdates'));
const CoachClients = React.lazy(() => import('./pages/coach/CoachClients'));
const CoachClientDetail = React.lazy(() => import('./pages/coach/CoachClientDetail'));

// Collaboratore Pages
const CollaboratoreDashboard = React.lazy(() => import('./pages/collaboratore/CollaboratoreDashboard'));

// Shared Pages
const UnifiedChat = React.lazy(() => import('./pages/shared/UnifiedChat'));
const Updates = React.lazy(() => import('./pages/shared/Updates'));
const CalendarPage = React.lazy(() => import('./pages/shared/CalendarPage'));
const CalendarReport = React.lazy(() => import('./pages/shared/CalendarReport'));
const Notifications = React.lazy(() => import('./pages/shared/Notifications'));
const AlimentazioneAllenamento = React.lazy(() => import('./pages/shared/AlimentazioneAllenamento'));
const SchedaAlimentazione = React.lazy(() => import('./pages/shared/SchedaAlimentazione'));
const SchedaAllenamento = React.lazy(() => import('./pages/shared/SchedaAllenamento'));
const GuidaMentalFit = React.lazy(() => import('./pages/shared/GuidaMentalFit'));
const Onboarding = React.lazy(() => import('./pages/shared/Onboarding'));
const OnboardingFlow = React.lazy(() => import('./pages/shared/OnboardingFlow'));
const Community = React.lazy(() => import('./pages/community/Community'));

// Courses
const CourseDashboard = React.lazy(() => import('./components/courses/CourseDashboard'));
const CourseDetail = React.lazy(() => import('./components/courses/CourseDetail'));
const LessonPlayer = React.lazy(() => import('./components/courses/LessonPlayer'));

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
    isPlatformCEO: false,
    error: null,
  });
  const [lastNavigated, setLastNavigated] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Salva sempre l'ultima path navigata (HashRouter fornisce pathname già dopo #)
  useEffect(() => {
    try {
      localStorage.setItem('last_path', location.pathname || '/');
    } catch (err) {
      console.warn('Failed to save last path:', err);
    }
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
          // PRIMA: Verifica se è Platform CEO (livello root, non tenant)
          const platformAdminRef = doc(db, 'platform_admins', 'superadmins');
          const platformAdminDoc = await getDoc(platformAdminRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) }));
          const isPlatformCEO = platformAdminDoc.exists() && platformAdminDoc.data().uids?.includes(currentUser.uid);
          
          // Se è Platform CEO e sta navigando verso /platform-*, permettilo senza redirect
          if (isPlatformCEO && (location.pathname === '/platform-dashboard' || location.pathname.startsWith('/platform'))) {
            setAuthInfo({
              isLoading: false,
              user: currentUser,
              isClient: false,
              isCoach: false,
              isAdmin: false,
              isCollaboratore: false,
              isPlatformCEO: true,
              error: null
            });
            return;
          }
          
          // SECONDO: Controlla ruoli nel tenant
          const clientDocRef = getTenantDoc(db, 'clients', currentUser.uid);
          const adminDocRef = getTenantDoc(db, 'roles', 'admins');
          const coachDocRef = getTenantDoc(db, 'roles', 'coaches');
          const collabDocRef = getTenantDoc(db, 'collaboratori', currentUser.uid);

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
              location.pathname === '/analytics' ||
              location.pathname === '/course-admin' ||
              location.pathname === '/notifications' ||
              location.pathname === '/alimentazione-allenamento' ||
              location.pathname.startsWith('/scheda-alimentazione/') ||
              location.pathname.startsWith('/scheda-allenamento/') ||
              location.pathname === '/courses' ||
              location.pathname.startsWith('/courses/') ||
              location.pathname.startsWith('/admin/course/')
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
            isPlatformCEO: false,
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
            isPlatformCEO: false,
            error: null
          });

          const publicPaths = ['/login', '/client/forgot-password', '/guida', '/guida/:guideId', '/platform-login', '/platform-dashboard'];
          const isPublic = publicPaths.some(p => location.pathname === p || location.pathname.startsWith('/guida/') || location.pathname.startsWith('/platform'));
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
    <ThemeProvider>
      <Suspense fallback={<PageSpinner />}>
        <GlobalUploadBar />
        <Routes>
        {/* === ROTTE PUBBLICHE === */}
        <Route element={<GuidaLayout />}>
          <Route path="/guida" element={<GuidaMentalFit />} />
          <Route path="/guida/:guideId" element={<GuideCapture />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/platform-login" element={<PlatformLogin />} />
        <Route path="/client/forgot-password" element={<ForgotPassword />} />

        {/* === ROTTE PLATFORM CEO === */}
        <Route path="/platform-dashboard" element={
          authInfo.isPlatformCEO ? <CEOPlatformDashboard /> : <Navigate to="/platform-login" replace />
        } />

        {/* === ROTTE ADMIN (SOLO ADMIN) === */}

        <Route element={authInfo.isAdmin ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/new-client" element={<NewClient />} />
          <Route path="/client/:clientId" element={<ClientDetail />} />
          <Route path="/edit/:id" element={<EditClient />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/chat" element={<UnifiedChat />} />
          <Route path="/client/:id/anamnesi" element={<AdminAnamnesi />} />
          <Route path="/collaboratori" element={<Collaboratori />} />
          <Route path="/collaboratore-detail" element={<CollaboratoreDetail />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/calendar-report/:date" element={<CalendarReport />} />
          <Route path="/business-history" element={<BusinessHistory />} />
          <Route path="/guide-manager" element={<GuideManager />} />
          <Route path="/admin/dipendenti" element={<Dipendenti />} />
          <Route path="/statistiche" element={<Statistiche />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/alimentazione-allenamento" element={<AlimentazioneAllenamento />} />
          <Route path="/scheda-alimentazione/:clientId" element={<SchedaAlimentazione />} />
          <Route path="/scheda-allenamento/:clientId" element={<SchedaAllenamento />} />
          <Route path="/courses" element={<CourseDashboard />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<LessonPlayer />} />
          <Route path="/community" element={<Community />} />

        </Route>

        {/* === ROTTE SUPERADMIN (SOLO SUPERADMIN) === */}
        <Route element={authInfo.isAdmin ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/superadmin" element={<SuperAdminSettings />} />

          <Route path="/course-admin" element={<CourseAdmin />} />
          <Route path="/admin/course/:courseId/manage" element={<CourseContentManager />} />


        </Route>

        {/* === ROTTE COACH (SOLO COACH) === */}
        <Route element={authInfo.isCoach ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/coach/clients" element={<CoachClients />} />
          <Route path="/coach/client/:id" element={<CoachClientDetail />} />
          <Route path="/coach/anamnesi" element={<CoachAnamnesi />} />
          <Route path="/coach/updates" element={<CoachUpdates />} />
          <Route path="/coach/chat" element={<UnifiedChat />} />
          <Route path="/coach/client/:clientId/checks" element={<ClientChecks />} />
          <Route path="/coach/schede" element={<AlimentazioneAllenamento />} />
          <Route path="/scheda-alimentazione/:clientId" element={<SchedaAlimentazione />} />
          <Route path="/scheda-allenamento/:clientId" element={<SchedaAllenamento />} />
        </Route>

        {/* === ROTTE CLIENTI === */}
        <Route element={authInfo.isClient ? <SimpleLayout /> : <Navigate to="/login" replace />}>
          <Route path="/client/onboarding" element={<Onboarding />} />
          <Route path="/client/first-access" element={<FirstAccess />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/anamnesi" element={<ClientAnamnesi />} />
          <Route path="/client/checks" element={<ClientChecks />} />
          <Route path="/client/payments" element={<ClientPayments />} />
          <Route path="/client/chat" element={<UnifiedChat />} />
          <Route path="/client/scheda-alimentazione" element={<ClientSchedaAlimentazioneEnhanced />} />
          <Route path="/client/scheda-allenamento" element={<ClientSchedaAllenamento />} />

          <Route path="/client/courses" element={<CourseDashboard />} />
          <Route path="/client/courses/:courseId" element={<CourseDetail />} />
          <Route path="/client/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<LessonPlayer />} />
          <Route path="/client/onboarding" element={<OnboardingFlow />} />
          <Route path="/client/community" element={<Community />} />
        </Route>

        {/* === ROTTE COLLABORATORI === */}
        <Route element={authInfo.isCollaboratore ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/collaboratore/first-access" element={<FirstAccess />} />
          <Route path="/collaboratore/dashboard" element={<CollaboratoreDashboard />} />
          <Route path="/collaboratore/calendar" element={<CalendarPage />} />
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
    </ThemeProvider>
  );
}