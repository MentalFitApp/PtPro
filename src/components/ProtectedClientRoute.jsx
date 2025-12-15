import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getTenantDoc } from '../config/tenant';
import { Lock, AlertTriangle } from 'lucide-react';
import BlockedAccess from './client/BlockedAccess';

// Mapping tra path e permessi
const PATH_TO_PERMISSION = {
  '/client/dashboard': 'dashboard',
  '/client/anamnesi': 'anamnesi',
  '/client/checks': 'checks',
  '/client/payments': 'payments',
  '/client/scheda-alimentazione': 'scheda-alimentazione',
  '/client/scheda-allenamento': 'scheda-allenamento',
  '/client/courses': 'courses',
  '/client/community': 'community',
  '/client/settings': 'settings',
  '/client/chat': 'chat',
};

const DEFAULT_PERMISSIONS = {
  access: true,
  pages: {
    dashboard: true,
    anamnesi: true,
    checks: true,
    payments: true,
    'scheda-alimentazione': true,
    'scheda-allenamento': true,
    courses: true,
    community: true,
    settings: true,
    chat: true,
  },
  features: {
    'food-swap': true,
    'pdf-export': true,
    'calendar-booking': true,
  }
};

export function ProtectedClientRoute({ children, requiredPermission }) {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState('');
  const [isArchiveBlocked, setIsArchiveBlocked] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState('');
  const [blockedScreens, setBlockedScreens] = useState([]);
  const location = useLocation();

  useEffect(() => {
    checkPermissions();
  }, [location.pathname]);

  const checkPermissions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Controlla prima le limitazioni globali
      const globalSettingsRef = getTenantDoc(db, 'platform_settings', 'global');
      const globalSettingsSnap = await getDoc(globalSettingsRef);
      
      if (globalSettingsSnap.exists()) {
        const globalSettings = globalSettingsSnap.data();
        const pageGlobalStatus = globalSettings.disabledFeatures?.[requiredPermission];
        
        if (pageGlobalStatus?.disabled) {
          setAccessDenied(true);
          setDeniedMessage(pageGlobalStatus.message || 'Questa sezione è temporaneamente non disponibile.');
          setLoading(false);
          return;
        }
      }

      // Poi controlla i permessi individuali
      const clientRef = getTenantDoc(db, 'clients', user.uid);
      const clientDoc = await getDoc(clientRef);

      if (!clientDoc.exists()) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const clientData = clientDoc.data();

      // Verifica stato archivio e blocco selettivo per screen
      if (clientData.isArchived && clientData.archiveSettings) {
        const { blockAppAccess, blockedScreens: blocked, customMessage } = clientData.archiveSettings;
        
        // Se blockAppAccess è true, l'accesso generale è già bloccato in ClientDashboard
        // Qui gestiamo solo il blocco selettivo per screen specifici
        if (!blockAppAccess && blocked && blocked.length > 0) {
          // Mappa tra requiredPermission e nome screen in archiveSettings
          const permissionToScreen = {
            'scheda-allenamento': 'workouts',
            'scheda-alimentazione': 'nutrition',
            'checks': 'checks',
            'payments': 'payments',
            'chat': 'messages',
            'settings': 'profile'
          };

          const screenName = permissionToScreen[requiredPermission];
          
          if (screenName && blocked.includes(screenName)) {
            setIsArchiveBlocked(true);
            setArchiveMessage(customMessage || 'Questa sezione è temporaneamente non disponibile per il tuo account.');
            setBlockedScreens(blocked);
            setLoading(false);
            return;
          }
        }
      }

      const userPermissions = clientData.permissions || DEFAULT_PERMISSIONS;

      setPermissions(userPermissions);

      // Verifica accesso generale
      if (userPermissions.access === false) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Verifica permesso specifico per la pagina
      if (requiredPermission) {
        const hasPermission = userPermissions.pages?.[requiredPermission] !== false;
        setAccessDenied(!hasPermission);
      }

      setLoading(false);
    } catch (error) {
      console.error('Errore controllo permessi:', error);
      setAccessDenied(true);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Se la sezione è bloccata per archivio
  if (isArchiveBlocked) {
    return <BlockedAccess message={archiveMessage} isPartialBlock={true} blockedScreens={blockedScreens} />;
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 max-w-md w-full text-center">
          <Lock size={64} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Accesso Negato</h1>
          <p className="text-slate-400 mb-6">
            {deniedMessage || (permissions?.access === false
              ? 'Il tuo accesso all\'app è stato temporaneamente revocato. Contatta il tuo trainer per maggiori informazioni.'
              : 'Non hai i permessi per accedere a questa sezione. Contatta il tuo trainer se pensi si tratti di un errore.')}
          </p>
          <div className="flex gap-3">
            <a
              href="/client/dashboard"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
            >
              Torna alla Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook per controllare i permessi delle features
export function useFeaturePermission(featureId) {
  const [hasPermission, setHasPermission] = useState(true);
  const [loading, setLoading] = useState(true);
  const [disabledMessage, setDisabledMessage] = useState('');

  useEffect(() => {
    checkFeaturePermission();
  }, [featureId]);

  const checkFeaturePermission = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      // Controlla prima le impostazioni globali
      const globalSettingsRef = getTenantDoc(db, 'platform_settings', 'global');
      const globalSettingsSnap = await getDoc(globalSettingsRef);
      
      if (globalSettingsSnap.exists()) {
        const globalSettings = globalSettingsSnap.data();
        const featureGlobalStatus = globalSettings.disabledFeatures?.[featureId];
        
        if (featureGlobalStatus?.disabled) {
          setHasPermission(false);
          setDisabledMessage(featureGlobalStatus.message || 'Funzione temporaneamente non disponibile');
          setLoading(false);
          return;
        }
      }

      // Poi controlla i permessi individuali del cliente
      const clientRef = getTenantDoc(db, 'clients', user.uid);
      const clientDoc = await getDoc(clientRef);

      if (!clientDoc.exists()) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      const clientData = clientDoc.data();
      const permissions = clientData.permissions || DEFAULT_PERMISSIONS;

      setHasPermission(permissions.features?.[featureId] !== false);
      setLoading(false);
    } catch (error) {
      console.error('Errore controllo permesso feature:', error);
      setHasPermission(false);
      setLoading(false);
    }
  };

  return { hasPermission, loading, disabledMessage };
}

export default ProtectedClientRoute;
