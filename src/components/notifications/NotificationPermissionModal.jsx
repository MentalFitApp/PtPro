// src/components/notifications/NotificationPermissionModal.jsx
// Modale per richiedere permessi notifiche al primo accesso

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, BellOff, Smartphone } from 'lucide-react';
import { requestNotificationPermissionOnFirstLogin, isFirstLogin } from '../../services/notificationService';
import { auth } from '../../firebase';
import { getMessaging, getToken } from 'firebase/messaging';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';

export default function NotificationPermissionModal() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // 'granted' | 'denied' | null

  useEffect(() => {
    checkAndShowModal();
  }, []);

  const checkAndShowModal = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Verifica se già chiesto
    const permissionKey = `notification_permission_asked_${user.uid}`;
    const alreadyAsked = localStorage.getItem(permissionKey);
    
    if (alreadyAsked) return;

    // Verifica se browser supporta le notifiche
    if (typeof Notification === 'undefined') return;

    // Verifica se già concesso
    if (Notification.permission === 'granted') {
      localStorage.setItem(permissionKey, 'true');
      return;
    }

    // Mostra modal dopo un breve delay
    setTimeout(() => {
      setShowModal(true);
    }, 2000);
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setResult('granted');
        
        // Ottieni e salva token FCM
        try {
          const messaging = getMessaging();
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
          });
          
          if (token && auth.currentUser) {
            await setDoc(getTenantDoc(db, 'users', auth.currentUser.uid), {
              fcmToken: token,
              fcmTokenUpdatedAt: serverTimestamp(),
              notificationsEnabled: true
            }, { merge: true });
          }
        } catch (fcmError) {
          console.log('FCM token non disponibile:', fcmError);
        }
        
        // Chiudi modal dopo animazione
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setResult('denied');
      }
    } catch (error) {
      console.error('Errore richiesta permessi:', error);
      setResult('denied');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    const user = auth.currentUser;
    if (user) {
      localStorage.setItem(`notification_permission_asked_${user.uid}`, 'true');
    }
    setShowModal(false);
    setResult(null);
  };

  const handleSkip = () => {
    closeModal();
  };

  if (!showModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-slate-700/50 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
        >
          {/* Header con icona */}
          <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 text-center">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
            
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-500/25"
            >
              <Bell size={40} className="text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Resta Aggiornato! 🔔
            </h2>
            <p className="text-slate-300 text-sm">
              Attiva le notifiche per non perdere nessun aggiornamento
            </p>
          </div>

          {/* Contenuto */}
          <div className="p-6">
            {result === null && (
              <>
                {/* Lista benefici */}
                <div className="space-y-3 mb-6">
                  {[
                    { icon: '🎯', text: 'Nuovi lead dalla landing page' },
                    { icon: '📞', text: 'Richieste chiamata dai clienti' },
                    { icon: '✅', text: 'Check e anamnesi compilate' },
                    { icon: '📅', text: 'Eventi e appuntamenti' },
                    { icon: '💰', text: 'Pagamenti ricevuti' }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-slate-200 text-sm">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Bottoni */}
                <div className="space-y-3">
                  <button
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Bell size={20} />
                        Attiva Notifiche
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleSkip}
                    className="w-full py-3 text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    Forse più tardi
                  </button>
                </div>

                {/* Note iOS */}
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Smartphone size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200/80">
                      <strong>iOS:</strong> Aggiungi l'app alla Home per ricevere notifiche push
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Stato: Concesso */}
            {result === 'granted' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                  <Check size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Notifiche Attivate!</h3>
                <p className="text-slate-400 text-sm">Riceverai aggiornamenti in tempo reale</p>
              </motion.div>
            )}

            {/* Stato: Negato */}
            {result === 'denied' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                  <BellOff size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Notifiche Disattivate</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Puoi attivarle in qualsiasi momento dalle Impostazioni
                </p>
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors"
                >
                  Ho capito
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
