import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// --- 1. IMPORT DINAMICI ---
// Le pagine ora vengono importate in questo modo.
// React.lazy dice al browser: "Non caricare questo codice finché non serve".
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


// --- 2. SPINNER DI CARICAMENTO PER LE PAGINE ---
// Questo viene mostrato mentre il codice di una nuova pagina viene scaricato.
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
    return <Navigate to={redirectPath} replace />;
  }
  return children ? children : <Outlet />;
};

export default function App() {
  const [authInfo, setAuthInfo] = useState({
    isLoading: true,
    user: null,
    isClient: false,
  });

  useEffect(() => {
    const sessionRole = sessionStorage.getItem('app_role');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const clientDocRef = doc(db, 'clients', currentUser.uid);
        const clientDoc = await getDoc(clientDocRef);
        const isCurrentUserAClient = clientDoc.exists() && clientDoc.data().isClient;
        if (sessionRole === 'admin' && isCurrentUserAClient) {
          await signOut(auth);
          return;
        }
        setAuthInfo({
          isLoading: false,
          user: currentUser,
          isClient: isCurrentUserAClient,
        });
      } else {
        sessionStorage.removeItem('app_role');
        setAuthInfo({ isLoading: false, user: null, isClient: false });
      }
    });
    return () => unsubscribe();
  }, []);

  if (authInfo.isLoading) {
    return <AuthSpinner />;
  }

  return (
    <HashRouter>
      {/* --- 3. SUSPENSE WRAPPER --- */}
      {/* Suspense è necessario per dire a React cosa mostrare mentre attende il caricamento di una pagina. */}
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* Le rotte rimangono identiche, ma ora caricheranno le pagine dinamicamente */}
          <Route path="/login" element={<Login />} />
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/client/forgot-password" element={<ForgotPassword />} />

          <Route element={<ProtectedRoute isAllowed={authInfo.user && !authInfo.isClient} redirectPath="/login" />}>
              <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/new" element={<NewClient />} />
                  <Route path="/client/:clientId" element={<ClientDetail />} />
                  <Route path="/edit/:clientId" element={<EditClient />} />
                  <Route path="/updates" element={<Updates />} />
                  <Route path="/chat" element={<AdminChat />} />
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
          
          <Route 
              path="*" 
              element={
                  !authInfo.user 
                      ? <Navigate to="/login" /> 
                      : authInfo.isClient 
                          ? <Navigate to="/client/dashboard" /> 
                          : <Navigate to="/" />
              } 
          />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
