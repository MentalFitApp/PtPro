// src/pages/admin/NotificationDebug.jsx
// Pagina di debug per testare notifiche push in-app

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { Bell, CheckCircle, XCircle, AlertTriangle, Send, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const VAPID_KEY = 'BPBjZH1KnB4fCdqy5VobaJvb_mC5UTPKxodeIhyhl6PrRBZ1r6bd6nFqoloeDXSXKb4uffOVSupUGHQ4Q0l9Ato';

export default function NotificationDebug() {
  const [checks, setChecks] = useState({
    permission: null,
    serviceWorker: null,
    fcmToken: null,
    messaging: null,
    https: null
  });
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [swLoading, setSwLoading] = useState(false);

  useEffect(() => {
    runChecks();
  }, []);

  const runChecks = async () => {
    const results = {};

    // 1. Check permessi
    if ('Notification' in window) {
      results.permission = Notification.permission;
    } else {
      results.permission = 'not-supported';
    }

    // 2. Check Service Worker - specifico per Firebase Messaging
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🔍 Service Workers trovati:', registrations.map(r => r.scope));
      
      // Controlla specificamente il firebase-messaging-sw
      const fcmRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (fcmRegistration && fcmRegistration.active) {
        results.serviceWorker = 'active';
        console.log('✅ Firebase Messaging SW attivo:', fcmRegistration.scope);
      } else if (registrations.length > 0) {
        results.serviceWorker = 'found-but-not-fcm';
        console.log('⚠️ SW trovati ma non FCM:', registrations.map(r => r.scope));
      } else {
        results.serviceWorker = 'not-found';
        console.log('❌ Nessun Service Worker trovato');
      }
    } else {
      results.serviceWorker = 'not-supported';
    }

    // 3. Check HTTPS
    results.https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

    // 4. Check token FCM
    try {
      const userRef = getTenantDoc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().fcmToken) {
        results.fcmToken = 'saved';
        setToken(userSnap.data().fcmToken);
      } else {
        results.fcmToken = 'missing';
      }
    } catch (error) {
      results.fcmToken = 'error';
    }

    // 5. Check Firebase Messaging
    try {
      const { isSupported } = await import('firebase/messaging');
      results.messaging = await isSupported() ? 'supported' : 'not-supported';
    } catch (error) {
      results.messaging = 'error';
    }

    setChecks(results);
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Ottieni token
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { messaging } = await import('../../firebase');
        
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        
        if (currentToken) {
          // Salva in Firestore
          const userRef = getTenantDoc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            fcmToken: currentToken,
            pushEnabled: true,
            updatedAt: new Date()
          });
          
          setToken(currentToken);
          setTestResult({ success: true, message: 'Token FCM salvato!' });
        }
      } else {
        setTestResult({ success: false, message: 'Permesso negato' });
      }
      
      await runChecks();
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!token) return;
    
    setLoading(true);
    setTestResult(null);
    
    try {
      // Invia tramite Cloud Function
      const response = await fetch(`${import.meta.env.VITE_FUNCTIONS_URL || ''}/sendPushNotification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          notification: {
            title: '🎉 Test Notifica',
            body: 'Questa è una notifica di test!',
            icon: '/logo192.png'
          },
          data: {
            type: 'test',
            timestamp: Date.now().toString()
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult({ success: true, message: 'Notifica inviata! Controlla il dispositivo.' });
      } else {
        setTestResult({ success: false, message: result.error || 'Errore invio' });
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const reregisterServiceWorker = async () => {
    setSwLoading(true);
    try {
      // Unregister esistenti
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        if (registration.scope.includes('firebase-messaging-sw')) {
          console.log('🗑️ Rimuovendo SW esistente:', registration.scope);
          await registration.unregister();
        }
      }
      
      // Registra nuovamente
      console.log('🔄 Riregistrando Firebase Messaging SW...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // Aspetta che sia attivo
      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') {
              resolve();
            }
          });
        });
      }
      
      console.log('✅ Service Worker riregistrato con successo');
      
      // Re-run checks
      await runChecks();
      
      setTestResult({ 
        success: true, 
        message: 'Service Worker riregistrato con successo!' 
      });
    } catch (error) {
      console.error('❌ Errore riregistrazione SW:', error);
      setTestResult({ 
        success: false, 
        message: 'Errore riregistrazione: ' + error.message 
      });
    } finally {
      setSwLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'granted':
      case 'active':
      case 'saved':
      case 'supported':
      case true:
        return <CheckCircle className="text-emerald-400" size={20} />;
      case 'missing':
      case 'not-found':
      case 'default':
      case 'found-but-not-fcm':
        return <AlertTriangle className="text-amber-400" size={20} />;
      case 'denied':
      case 'not-supported':
      case 'error':
      case false:
        return <XCircle className="text-rose-400" size={20} />;
      default:
        return <AlertTriangle className="text-slate-400" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'granted':
      case 'active':
      case 'saved':
      case 'supported':
      case true:
        return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30';
      case 'missing':
      case 'not-found':
      case 'default':
      case 'found-but-not-fcm':
        return 'from-amber-500/20 to-orange-500/20 border-amber-500/30';
      case 'denied':
      case 'not-supported':
      case 'error':
      case false:
        return 'from-rose-500/20 to-pink-500/20 border-rose-500/30';
      default:
        return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Bell size={32} className="text-cyan-400" />
            Debug Notifiche Push
          </h1>
          <p className="text-slate-400">Diagnostica completa del sistema di notifiche</p>
        </div>

        {/* Checks */}
        <div className="space-y-4 mb-8">
          {/* Permessi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${getStatusColor(checks.permission)} border backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(checks.permission)}
                <div>
                  <h3 className="font-semibold text-white">Permessi Browser</h3>
                  <p className="text-sm text-slate-400">Notification.permission</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white font-mono text-sm">{checks.permission || 'checking...'}</span>
              </div>
            </div>
          </motion.div>

          {/* Service Worker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${getStatusColor(checks.serviceWorker)} border backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(checks.serviceWorker)}
                <div>
                  <h3 className="font-semibold text-white">Service Worker</h3>
                  <p className="text-sm text-slate-400">Background notifications</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-mono text-sm">{checks.serviceWorker || 'checking...'}</span>
                {(checks.serviceWorker === 'not-found' || checks.serviceWorker === 'found-but-not-fcm') && (
                  <button
                    onClick={reregisterServiceWorker}
                    disabled={swLoading}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {swLoading ? '🔄' : '🔧 Fix'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* HTTPS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${getStatusColor(checks.https)} border backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(checks.https)}
                <div>
                  <h3 className="font-semibold text-white">Connessione Sicura</h3>
                  <p className="text-sm text-slate-400">HTTPS richiesto</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white font-mono text-sm">{checks.https ? 'secure' : 'insecure'}</span>
              </div>
            </div>
          </motion.div>

          {/* Token FCM */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${getStatusColor(checks.fcmToken)} border backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(checks.fcmToken)}
                <div>
                  <h3 className="font-semibold text-white">Token FCM</h3>
                  <p className="text-sm text-slate-400">Salvato in Firestore</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white font-mono text-sm">{checks.fcmToken || 'checking...'}</span>
              </div>
            </div>
            {token && (
              <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs text-slate-400 font-mono break-all">
                {token}
              </div>
            )}
          </motion.div>

          {/* Messaging Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${getStatusColor(checks.messaging)} border backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(checks.messaging)}
                <div>
                  <h3 className="font-semibold text-white">Firebase Messaging</h3>
                  <p className="text-sm text-slate-400">API support</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white font-mono text-sm">{checks.messaging || 'checking...'}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={requestPermission}
            disabled={loading || checks.permission === 'granted'}
            className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Bell size={20} />
            {checks.permission === 'granted' ? 'Permessi Attivi' : 'Richiedi Permessi'}
          </button>

          <button
            onClick={sendTestNotification}
            disabled={loading || !token}
            className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} />
            Invia Test
          </button>

          <button
            onClick={runChecks}
            disabled={loading}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Result */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl ${testResult.success ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-rose-500/20 border-rose-500/30'} border`}
          >
            <div className="flex items-center gap-3">
              {testResult.success ? <CheckCircle className="text-emerald-400" size={24} /> : <XCircle className="text-rose-400" size={24} />}
              <p className="text-white">{testResult.message}</p>
            </div>
          </motion.div>
        )}

        {/* Info */}
        <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
          <h3 className="font-semibold text-white mb-4">ℹ️ Informazioni</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Le notifiche funzionano solo su HTTPS o localhost</li>
            <li>• Su iOS, l'app deve essere installata come PWA</li>
            <li>• Il Service Worker gestisce le notifiche quando l'app è chiusa</li>
            <li>• Il token FCM può scadere, in tal caso va rigenerato</li>
            <li>• Se i permessi sono negati, vanno riattivati nelle impostazioni browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
