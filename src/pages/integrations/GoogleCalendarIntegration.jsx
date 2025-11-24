// Esempio: Pagina integrazione Google Calendar con OAuth
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import OAuthButton from '../../components/integrations/OAuthButton';

export default function GoogleCalendarIntegration() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase');
      const { getTenantDoc } = await import('../../config/tenant');
      
      const integrationRef = getTenantDoc(db, 'integrations', 'google');
      const integrationSnap = await getDoc(integrationRef);
      
      if (integrationSnap.exists() && integrationSnap.data().enabled) {
        setConnected(true);
      }
    } catch (error) {
      console.error('Errore controllo connessione:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800/30 rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl">
              📅
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Google Calendar</h1>
              <p className="text-slate-400">Sincronizza appuntamenti e eventi</p>
            </div>
          </div>

          {connected ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-bold text-white">✅ Connesso!</div>
                  <div className="text-sm text-slate-400">Google Calendar è collegato al tuo account</div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-300 mb-6">
                Collega il tuo Google Calendar per sincronizzare automaticamente appuntamenti e sessioni con i tuoi clienti.
              </p>
              
              <OAuthButton 
                provider="google"
                onSuccess={() => setConnected(true)}
                onError={(error) => alert('Errore: ' + error.message)}
              />
            </div>
          )}
        </div>

        {/* Features */}
        {connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-slate-800/30 rounded-2xl p-6">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-bold text-white mb-2">Sincronizzazione Automatica</h3>
              <p className="text-sm text-slate-400">
                Eventi sincronizzati in tempo reale tra la tua app e Google Calendar
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-2xl p-6">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="font-bold text-white mb-2">Notifiche</h3>
              <p className="text-sm text-slate-400">
                Ricevi promemoria automatici per le sessioni programmate
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-2xl p-6">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-bold text-white mb-2">Condivisione</h3>
              <p className="text-sm text-slate-400">
                Condividi facilmente disponibilità e appuntamenti con i clienti
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
