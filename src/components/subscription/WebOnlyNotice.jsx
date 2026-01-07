// src/components/subscription/WebOnlyNotice.jsx
// Componente che mostra un avviso per funzionalità disponibili solo da web

import React from 'react';
import { Monitor, ExternalLink, CreditCard, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Hook per rilevare se l'app è in esecuzione come PWA/TWA (app installata)
 */
export const useIsInstalledApp = () => {
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    // Controlla se è in modalità standalone (PWA installata)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Controlla se è TWA (Trusted Web Activity)
    const isTWA = document.referrer.includes('android-app://');
    
    // Controlla iOS standalone
    const isIOSStandalone = window.navigator.standalone === true;
    
    // Controlla se è in WebView Android
    const isWebView = /(android.*wv|wv.*android)/i.test(navigator.userAgent);
    
    setIsInstalled(isStandalone || isTWA || isIOSStandalone || isWebView);
  }, []);

  return isInstalled;
};

/**
 * Componente banner per avvisare che la funzione è disponibile solo da web
 */
export function WebOnlyBanner({ 
  title = "Gestisci da Browser",
  message = "Per gestire il tuo abbonamento e i pagamenti, accedi da un browser web.",
  webUrl = null,
  className = ""
}) {
  const isInstalled = useIsInstalledApp();
  
  // Non mostrare se non siamo in app installata
  if (!isInstalled) return null;

  const handleOpenWeb = () => {
    const url = webUrl || window.location.origin;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Monitor size={20} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-300 mb-1">{title}</h4>
          <p className="text-sm text-slate-300">{message}</p>
          <button
            onClick={handleOpenWeb}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ExternalLink size={16} />
            Apri nel Browser
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Componente card per sezione pagamenti/abbonamento
 */
export function SubscriptionWebOnlyCard({ tenantName = "FitFlows" }) {
  const isInstalled = useIsInstalledApp();
  
  if (!isInstalled) return null;

  const handleOpenWeb = () => {
    window.open(window.location.origin + '/settings', '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CreditCard size={32} className="text-blue-400" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">Gestione Abbonamento</h3>
        <p className="text-slate-400 mb-6">
          Per gestire il tuo abbonamento, visualizzare fatture e aggiornare il metodo di pagamento, 
          accedi da un browser web.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleOpenWeb}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg"
          >
            <Monitor size={20} />
            Apri nel Browser
          </button>
          
          <p className="text-xs text-slate-500">
            Verrai reindirizzato al sito web di {tenantName}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Componente wrapper che nasconde il contenuto se in app e mostra avviso
 */
export function WebOnlySection({ 
  children, 
  fallbackTitle = "Disponibile solo da Web",
  fallbackMessage = "Questa funzionalità è disponibile solo accedendo dal browser web."
}) {
  const isInstalled = useIsInstalledApp();

  if (isInstalled) {
    return (
      <div className="p-6">
        <SubscriptionWebOnlyCard />
      </div>
    );
  }

  return children;
}

/**
 * HOC per wrappare pagine che devono essere web-only
 */
export function withWebOnlyCheck(WrappedComponent, options = {}) {
  return function WebOnlyWrapper(props) {
    const isInstalled = useIsInstalledApp();

    if (isInstalled && options.blockOnApp) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <SubscriptionWebOnlyCard tenantName={options.tenantName} />
        </div>
      );
    }

    return (
      <>
        {isInstalled && options.showBanner && (
          <WebOnlyBanner 
            title={options.bannerTitle}
            message={options.bannerMessage}
            className="mx-4 mt-4"
          />
        )}
        <WrappedComponent {...props} />
      </>
    );
  };
}

export default WebOnlyBanner;
