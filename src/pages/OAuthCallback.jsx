// Pagina che riceve il callback OAuth
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Completamento autorizzazione...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Verifica errori
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Parametri OAuth mancanti');
      }

      // Verifica state (CSRF protection)
      const savedState = localStorage.getItem('oauth_state');
      if (state !== savedState) {
        throw new Error('State mismatch - possibile attacco CSRF');
      }

      const provider = localStorage.getItem('oauth_provider');
      if (!provider) {
        throw new Error('Provider non trovato');
      }

      // Decodifica state per ottenere tenantId
      const stateData = JSON.parse(atob(state));
      const { tenantId } = stateData;

      setMessage('Scambio token...');

      // Chiama Cloud Function per scambiare code con token
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase');
      
      const exchangeOAuthToken = httpsCallable(functions, 'exchangeOAuthToken');
      const result = await exchangeOAuthToken({
        provider,
        code,
        tenantId,
        redirectUri: `${window.location.origin}/oauth/callback`
      });

      console.log('✅ OAuth completato:', result.data);

      // Pulisci localStorage
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_provider');

      setStatus('success');
      setMessage('Connessione completata!');

      // Redirect alla pagina dell'integrazione
      setTimeout(() => {
        navigate(`/integrations/${provider}`);
      }, 2000);

    } catch (error) {
      console.error('❌ Errore OAuth callback:', error);
      setStatus('error');
      setMessage(error.message || 'Errore durante l\'autorizzazione');

      // Redirect dopo 3 secondi
      setTimeout(() => {
        navigate('/integrations');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {message}
            </h2>
            <p className="text-slate-400">Attendere prego...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              ✅ {message}
            </h2>
            <p className="text-slate-400">Reindirizzamento...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              ❌ Errore
            </h2>
            <p className="text-slate-400">{message}</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
