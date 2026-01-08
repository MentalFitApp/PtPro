import React, { useState, useEffect, Suspense } from 'react';
import GlobalUploadBar from './components/ui/GlobalUploadBar';
import ErrorBoundary from './components/ErrorBoundary';
import PrivacyBanner from './components/PrivacyBanner';
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { TenantProvider } from './contexts/TenantContext';
import { UserPreferencesProvider } from './hooks/useUserPreferences';
import { getTenantDoc } from './config/tenant';
import useOnlineStatus from './hooks/useOnlineStatus';

// Import dinamici dei layout
const ProLayout = React.lazy(() => import('./components/layout/ProLayout'));
const SimpleLayout = React.lazy(() => import('./components/layout/SimpleLayout'));

// Import componente protezione permessi
import { ProtectedClientRoute } from './components/ProtectedClientRoute';

// Import dinamici delle pagine

// Auth Pages
const Login = React.lazy(() => import('./pages/auth/Login'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const FirstAccess = React.lazy(() => import('./pages/auth/FirstAccess'));
const SetupAccount = React.lazy(() => import('./pages/auth/SetupAccount'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/DashboardPro'));
const DashboardDemo = React.lazy(() => import('./pages/admin/DashboardDemo')); // Demo 2.0 Design
const Clients = React.lazy(() => import('./pages/admin/Clients'));
const ClientDetail = React.lazy(() => import('./pages/admin/ClientDetail'));
const EditClient = React.lazy(() => import('./pages/admin/EditClient'));
const NewClient = React.lazy(() => import('./pages/admin/NewClient'));
const AdminAnamnesi = React.lazy(() => import('./pages/admin/AdminAnamnesi'));
const AdminChecksList = React.lazy(() => import('./pages/admin/AdminChecksList'));
const AdminRatesList = React.lazy(() => import('./pages/admin/AdminRatesList'));
const AdminAnamnesiList = React.lazy(() => import('./pages/admin/AdminAnamnesiList'));
const BusinessHistory = React.lazy(() => import('./pages/admin/BusinessHistory'));
const Collaboratori = React.lazy(() => import('./pages/admin/Collaboratori'));
const CollaboratoreDetail = React.lazy(() => import('./pages/admin/CollaboratoreDetail'));
const Dipendenti = React.lazy(() => import('./pages/admin/Dipendenti'));
const Statistiche = React.lazy(() => import('./pages/admin/Statistiche'));
const StatisticheDashboard = React.lazy(() => import('./pages/admin/StatisticheDashboard'));
const Profile = React.lazy(() => import('./pages/admin/Profile'));
const Settings = React.lazy(() => import('./pages/admin/Settings'));
const Analytics = React.lazy(() => import('./pages/admin/AnalyticsNew')); // V2.0 - Pre-aggregated data
const CourseAdmin = React.lazy(() => import('./pages/admin/CourseAdmin'));
const CourseContentManager = React.lazy(() => import('./pages/admin/CourseContentManager'));
const PlatformSettings = React.lazy(() => import('./pages/admin/PlatformSettings'));
const TenantBranding = React.lazy(() => import('./pages/admin/TenantBranding'));
const ThemePreview = React.lazy(() => import('./pages/admin/ThemePreview'));
const ClientCallsCalendar = React.lazy(() => import('./pages/admin/ClientCallsCalendar'));
const LandingPagesList = React.lazy(() => import('./pages/admin/LandingPagesList'));
const LandingPageEditor = React.lazy(() => import('./pages/admin/LandingPageEditor'));
const LandingPagesLeads = React.lazy(() => import('./pages/admin/LandingPagesLeads'));
const LandingPagesAnalytics = React.lazy(() => import('./pages/admin/LandingPagesAnalytics'));
const CentroNotifiche = React.lazy(() => import('./pages/admin/CentroNotifiche'));

// Platform CEO Pages
const CEOPlatformDashboard = React.lazy(() => import('./pages/platform/CEOPlatformDashboard'));
const TenantDeepDive = React.lazy(() => import('./pages/platform/TenantDeepDive'));
const PlatformLogin = React.lazy(() => import('./pages/platform/PlatformLogin'));
const MainLandingEditor = React.lazy(() => import('./pages/platform/MainLandingEditor'));

// Client Pages
const ClientDashboard = React.lazy(() => import('./pages/client/ClientDashboard'));
const ClientAnamnesi = React.lazy(() => import('./pages/client/ClientAnamnesi'));
const ClientChecks = React.lazy(() => import('./pages/client/ClientChecks'));
const ClientPayments = React.lazy(() => import('./pages/client/ClientPayments'));
const ClientSettings = React.lazy(() => import('./pages/client/ClientSettings'));
const ClientHabits = React.lazy(() => import('./pages/client/ClientHabits'));
const ClientSchedaAlimentazione = React.lazy(() => import('./pages/client/ClientSchedaAlimentazione'));
const ClientSchedaAllenamento = React.lazy(() => import('./pages/client/ClientSchedaAllenamento'));

// Coach Pages
const CoachDashboard = React.lazy(() => import('./pages/coach/CoachDashboardNew'));
const CoachAnamnesi = React.lazy(() => import('./pages/coach/CoachAnamnesi'));
const CoachAnamnesiList = React.lazy(() => import('./pages/coach/CoachAnamnesiList'));
const CoachChecksList = React.lazy(() => import('./pages/coach/CoachChecksList'));
const CoachUpdates = React.lazy(() => import('./pages/coach/CoachUpdates'));
const CoachClients = React.lazy(() => import('./pages/coach/CoachClients'));
// CoachClientDetail rimosso - usiamo ClientDetail con role="coach"
const CoachAnalytics = React.lazy(() => import('./components/admin/CoachAnalytics'));

// Collaboratore Pages
const CollaboratoreDashboard = React.lazy(() => import('./pages/collaboratore/CollaboratoreDashboard'));

// Shared Pages
const Chat = React.lazy(() => import('./pages/shared/Chat'));
const Updates = React.lazy(() => import('./pages/shared/Updates'));
const CalendarPage = React.lazy(() => import('./pages/shared/CalendarPage'));
const CalendarReport = React.lazy(() => import('./pages/shared/CalendarReport'));
const Notifications = React.lazy(() => import('./pages/shared/Notifications'));
const AlimentazioneAllenamento = React.lazy(() => import('./pages/shared/AlimentazioneAllenamento'));
const SchedaAlimentazione = React.lazy(() => import('./pages/shared/SchedaAlimentazione'));
const SchedaAllenamento = React.lazy(() => import('./pages/shared/SchedaAllenamento'));
const OnboardingFlow = React.lazy(() => import('./pages/shared/OnboardingFlow'));
const Community = React.lazy(() => import('./pages/community/Community'));

// Tenant Pages
const InstagramHub = React.lazy(() => import('./pages/tenant/InstagramHub'));
const IntegrationsHub = React.lazy(() => import('./pages/tenant/IntegrationsHub'));
const OAuthCallback = React.lazy(() => import('./pages/OAuthCallback'));

// Courses
const CourseDashboard = React.lazy(() => import('./components/courses/CourseDashboard'));
const CourseDetail = React.lazy(() => import('./components/courses/CourseDetail'));
const LessonPlayer = React.lazy(() => import('./components/courses/LessonPlayer'));

// Public Pages
const LandingPage = React.lazy(() => import('./pages/public/LandingPage'));
const PublicLandingPage = React.lazy(() => import('./pages/public/PublicLandingPage'));
const PrivacyPolicy = React.lazy(() => import('./pages/public/PrivacyPolicyDynamic'));
const TermsOfService = React.lazy(() => import('./pages/public/TermsOfServiceDynamic'));
const AcceptInvite = React.lazy(() => import('./pages/public/AcceptInvite'));
const OfflineIndicator = React.lazy(() => import('./components/ui/OfflineIndicator'));

// Spinner semplice per lazy loading (senza delay forzato)
const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Caricamento...</p>
    </div>
  </div>
);

// Auth Spinner per verifica autenticazione
const AuthSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Verifica autenticazione...</p>
    </div>
  </div>
);

// Componente interno per hook che richiedono i context providers
function OnlineStatusMonitor() {
  useOnlineStatus({ showToast: true });
  return null;
}

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
  const [initialAuthComplete, setInitialAuthComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Inizializza Capacitor plugins (notifiche push native)
  useEffect(() => {
    const initCapacitor = async () => {
      try {
        const { initializeCapacitor } = await import('./utils/capacitor');
        await initializeCapacitor();
      } catch (error) {
        console.error('Errore inizializzazione Capacitor:', error);
      }
    };
    initCapacitor();
  }, []);

  // Salva sempre l'ultima path navigata (HashRouter fornisce pathname già dopo #)
  useEffect(() => {
    try {
      localStorage.setItem('last_path', location.pathname || '/');
    } catch (err) {
      console.warn('Failed to save last path:', err);
    }
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      if (sessionStorage.getItem('creating_collaboratore') === 'true') {
        sessionStorage.removeItem('creating_collaboratore');
        return;
      }

      try {
        if (currentUser) {
          // Se l'auth iniziale è già completa e l'utente naviga tra pagine valide, non fare redirect
          if (initialAuthComplete && authInfo.user?.uid === currentUser.uid) {
            return;
          }
          
          // Se è già autenticato come Platform CEO, mantienilo
          if (authInfo.isPlatformCEO && authInfo.user?.uid === currentUser.uid) {
            return;
          }
          
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

          // Se sta navigando verso pagine pubbliche, permettilo
          if (location.pathname.startsWith('/site') || 
              location.pathname.startsWith('/invite') ||
              location.pathname === '/privacy' || 
              location.pathname === '/terms') {
            // Non fare nulla, lascia che la route pubblica venga gestita
            setAuthInfo({
              isLoading: false,
              user: currentUser,
              isClient: false,
              isCoach: false,
              isAdmin: false,
              isCollaboratore: false,
              isPlatformCEO: isPlatformCEO,
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

          // Skip route validation if we just navigated (avoid interfering with user navigation)
          // Solo redireziona se siamo su una pagina completamente non autorizzata
          const isValidSubRoute =
            // Admin può accedere a tutte le route admin
            (isCurrentUserAdmin && (
              location.pathname === '/' ||
              location.pathname === '/clients' ||
              location.pathname === '/new-client' ||
              location.pathname.startsWith('/client/') ||
              location.pathname.startsWith('/edit/') ||
              location.pathname === '/updates' ||
              location.pathname === '/collaboratori' ||
              location.pathname.startsWith('/collaboratore/') ||
              location.pathname.startsWith('/calendar-report/') ||
              location.pathname === '/business-history' ||
              location.pathname === '/admin/dipendenti' ||
              location.pathname === '/statistiche' ||
              location.pathname === '/analytics' ||
              location.pathname === '/coach-analytics' ||
              location.pathname === '/course-admin' ||
              location.pathname === '/notifications' ||
              location.pathname === '/alimentazione-allenamento' ||
              location.pathname.startsWith('/scheda-alimentazione/') ||
              location.pathname.startsWith('/scheda-allenamento/') ||
              location.pathname === '/courses' ||
              location.pathname.startsWith('/courses/') ||
              location.pathname.startsWith('/admin/course/') ||
              location.pathname === '/profile' ||
              location.pathname === '/chat' ||
              location.pathname === '/calendar' ||
              location.pathname === '/calls-calendar' ||
              location.pathname === '/guida' ||
              location.pathname === '/community' ||
              location.pathname.startsWith('/admin/') ||
              location.pathname === '/integrations' ||
              location.pathname === '/branding' ||
              location.pathname === '/settings' ||
              location.pathname === '/tenant-settings'
            )) ||
            (isCurrentUserACoach && (
              location.pathname === '/coach' ||
              location.pathname === '/coach/clients' ||
              location.pathname.startsWith('/coach/client/') ||
              location.pathname === '/coach/analytics' ||
              location.pathname === '/coach/anamnesi' ||
              location.pathname === '/coach/checks' ||
              location.pathname === '/coach/updates' ||
              location.pathname === '/coach/schede' ||
              location.pathname === '/coach/profile' ||
              location.pathname.startsWith('/coach/scheda-alimentazione/') ||
              location.pathname.startsWith('/coach/scheda-allenamento/') ||
              location.pathname === '/profile'
            )) ||
            (isCurrentUserAClient && (location.pathname.startsWith('/client/') || location.pathname === '/profile')) ||
            (isCurrentUserACollaboratore && (location.pathname.startsWith('/collaboratore/') || location.pathname === '/profile'));

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
          
          if (!initialAuthComplete) {
            setInitialAuthComplete(true);
          }
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

          const publicPaths = ['/login', '/client/forgot-password', '/platform-login', '/platform-dashboard', '/site', '/privacy', '/terms', '/setup', '/invite', '/landing', '/demo'];
          const isPublic = publicPaths.some(p => location.pathname === p || location.pathname.startsWith('/platform') || location.pathname.startsWith('/site') || location.pathname.startsWith('/setup/') || location.pathname.startsWith('/invite') || location.pathname === '/privacy' || location.pathname === '/terms' || location.pathname === '/landing' || location.pathname === '/demo');
          if (!isPublic && !initialAuthComplete) {
            const target = '/login';
            if (lastNavigated !== target) {
              setLastNavigated(target);
              navigate(target, { replace: true });
            }
          }
          
          setInitialAuthComplete(false);
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
    <ErrorBoundary>
    <ToastProvider>
    <ConfirmProvider>
    <ThemeProvider>
    <TenantProvider>
    <UserPreferencesProvider>
      <OnlineStatusMonitor />
      <Suspense fallback={<PageSpinner />}>
        <OfflineIndicator />
        <GlobalUploadBar />
        <PrivacyBanner />
        <Routes>
        {/* === ROTTE PUBBLICHE === */}
        <Route path="/demo" element={<DashboardDemo />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/site" element={<LandingPage />} />
        <Route path="/site/:tenantSlug/:slug" element={<PublicLandingPage />} />
        <Route path="/site/:slug" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup/:token" element={<SetupAccount />} />
        <Route path="/platform-login" element={<PlatformLogin />} />
        <Route path="/client/forgot-password" element={<ForgotPassword />} />
        
        {/* === ROTTE INVITI === */}
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/invite" element={<AcceptInvite />} />

        {/* === ROTTE PLATFORM CEO === */}
        <Route path="/platform-dashboard" element={
          authInfo.isPlatformCEO ? <CEOPlatformDashboard /> : <Navigate to="/platform-login" replace />
        } />
        <Route path="/platform/tenant/:tenantId" element={
          authInfo.isPlatformCEO ? <TenantDeepDive /> : <Navigate to="/platform-login" replace />
        } />
        <Route path="/platform/main-landing" element={
          authInfo.isPlatformCEO ? <MainLandingEditor /> : <Navigate to="/platform-login" replace />
        } />

        {/* === ROTTE ADMIN (SOLO ADMIN) === */}
        
        {/* Dashboard Legacy (fuori layout per compatibilità) */}
        <Route path="/dashboard-legacy" element={
          authInfo.isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />
        } />

        <Route element={authInfo.isAdmin ? <ProLayout /> : <Navigate to="/login" replace />}>
          {/* Dashboard 2.0 Nebula - Ora dentro ProLayout con NebulaSidebar */}
          <Route path="/" element={<DashboardDemo />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/new-client" element={<NewClient />} />
          <Route path="/client/:clientId" element={<ClientDetail />} />
          <Route path="/edit/:id" element={<EditClient />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/admin/checks" element={<AdminChecksList />} />
          <Route path="/admin/rates" element={<AdminRatesList />} />
          <Route path="/admin/anamnesi" element={<AdminAnamnesiList />} />
          <Route path="/admin/notifiche" element={<CentroNotifiche />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/client/:id/anamnesi" element={<AdminAnamnesi />} />
          <Route path="/collaboratori" element={<Collaboratori />} />
          <Route path="/collaboratore-detail" element={<CollaboratoreDetail />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/calls-calendar" element={<ClientCallsCalendar />} />
          <Route path="/calendar-report/:date" element={<CalendarReport />} />
          <Route path="/business-history" element={<BusinessHistory />} />
          <Route path="/admin/dipendenti" element={<Dipendenti />} />
          <Route path="/admin/branding" element={<TenantBranding />} />
          <Route path="/admin/theme-preview" element={<ThemePreview />} />
          <Route path="/statistiche" element={<StatisticheDashboard />} />
          <Route path="/statistiche/legacy" element={<Statistiche />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/coach-analytics" element={<CoachAnalytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/alimentazione-allenamento" element={<AlimentazioneAllenamento />} />
          <Route path="/scheda-alimentazione/:clientId" element={<SchedaAlimentazione />} />
          <Route path="/scheda-allenamento/:clientId" element={<SchedaAllenamento />} />
          <Route path="/courses" element={<CourseAdmin />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<LessonPlayer />} />
          <Route path="/community" element={<Community />} />
          <Route path="/instagram" element={<InstagramHub />} />
          <Route path="/integrations" element={<IntegrationsHub />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/admin/landing-pages" element={<LandingPagesList />} />
          <Route path="/admin/landing-pages/analytics" element={<LandingPagesAnalytics />} />
          <Route path="/admin/landing-pages/leads" element={<LandingPagesLeads />} />
          <Route path="/admin/landing-pages/new" element={<LandingPageEditor />} />
          <Route path="/admin/landing-pages/:pageId/edit" element={<LandingPageEditor />} />

        </Route>

        {/* === ROTTE SUPERADMIN (SOLO SUPERADMIN) === */}
        <Route element={authInfo.isAdmin ? <ProLayout /> : <Navigate to="/login" replace />}>
          <Route path="/platform-settings" element={<PlatformSettings />} />

          <Route path="/course-admin" element={<CourseAdmin />} />
          <Route path="/admin/course/:courseId/manage" element={<CourseContentManager />} />


        </Route>

        {/* === ROTTE COACH (SOLO COACH) === */}
        <Route element={authInfo.isCoach ? <ProLayout /> : <Navigate to="/login" replace />}>
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/coach/clients" element={<Clients role="coach" />} />
          <Route path="/coach/client/:clientId" element={<ClientDetail role="coach" />} />
          <Route path="/coach/client/:id/anamnesi" element={<AdminAnamnesi />} />
          <Route path="/coach/anamnesi" element={<CoachAnamnesiList />} />
          <Route path="/coach/checks" element={<CoachChecksList />} />
          <Route path="/coach/notifiche" element={<CentroNotifiche />} />
          <Route path="/coach/updates" element={<CoachUpdates />} />
          <Route path="/coach/analytics" element={<CoachAnalytics />} />
          <Route path="/coach/chat" element={<Chat />} />
          <Route path="/coach/profile" element={<Profile />} />
          <Route path="/coach/client/:clientId/checks" element={<ClientChecks />} />
          <Route path="/coach/schede" element={<AlimentazioneAllenamento />} />
          <Route path="/coach/scheda-alimentazione/:clientId" element={<SchedaAlimentazione />} />
          <Route path="/coach/scheda-allenamento/:clientId" element={<SchedaAllenamento />} />
        </Route>

        {/* === ROTTE CLIENTI === */}
        <Route element={authInfo.isClient ? <ProLayout /> : <Navigate to="/login" replace />}>
          <Route path="/client/onboarding" element={<OnboardingFlow />} />
          <Route path="/client/first-access" element={<FirstAccess />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/anamnesi" element={<ProtectedClientRoute requiredPermission="anamnesi"><ClientAnamnesi /></ProtectedClientRoute>} />
          <Route path="/client/checks" element={<ProtectedClientRoute requiredPermission="checks"><ClientChecks /></ProtectedClientRoute>} />
          <Route path="/client/payments" element={<ProtectedClientRoute requiredPermission="payments"><ClientPayments /></ProtectedClientRoute>} />
          <Route path="/client/chat" element={<ProtectedClientRoute requiredPermission="chat"><Chat /></ProtectedClientRoute>} />
          <Route path="/client/profile" element={<Profile />} />
          <Route path="/client/scheda-alimentazione" element={<ProtectedClientRoute requiredPermission="scheda-alimentazione"><ClientSchedaAlimentazione /></ProtectedClientRoute>} />
          <Route path="/client/scheda-allenamento" element={<ProtectedClientRoute requiredPermission="scheda-allenamento"><ClientSchedaAllenamento /></ProtectedClientRoute>} />

          <Route path="/client/courses" element={<ProtectedClientRoute requiredPermission="courses"><CourseDashboard /></ProtectedClientRoute>} />
          <Route path="/client/courses/:courseId" element={<ProtectedClientRoute requiredPermission="courses"><CourseDetail /></ProtectedClientRoute>} />
          <Route path="/client/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<ProtectedClientRoute requiredPermission="courses"><LessonPlayer /></ProtectedClientRoute>} />
          <Route path="/client/community" element={<ProtectedClientRoute requiredPermission="community"><Community /></ProtectedClientRoute>} />
          <Route path="/client/settings" element={<ProtectedClientRoute requiredPermission="settings"><ClientSettings /></ProtectedClientRoute>} />
          <Route path="/client/habits" element={<ClientHabits />} />
        </Route>

        {/* === ROTTE COLLABORATORI === */}
        <Route element={authInfo.isCollaboratore ? <ProLayout /> : <Navigate to="/login" replace />}>
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
    </UserPreferencesProvider>
    </TenantProvider>
    </ThemeProvider>
    </ConfirmProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}