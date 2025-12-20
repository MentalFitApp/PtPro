// src/components/notifications/NotificationPermissionModal.jsx
// Modale per richiedere permessi notifiche al primo accesso

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, BellOff, Smartphone } from 'lucide-react';
import { requestNotificationPermissionOnFirstLogin, isFirstLogin } from '../../services/notificationService';
import { auth, db } from '../../firebase';
import { getMessaging, getToken } from 'firebase/messaging';
import { setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { getTenantDoc } from '../../config/tenant';

const VAPID_KEY = 'BPBjZH1KnB4fCdqy5VobaJvb_mC5UTPKxodeIhyhl6PrRBZ1r6bd6nFqoloeDXSXKb4uffOVSupUGHQ4Q0l9Ato';

export default function NotificationPermissionModal() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // 'granted' | 'denied' | null
  const [userRole, setUserRole] = useState(null); // 'client' | 'admin' | 'coach'

  useEffect(() => {
    // Determina ruolo utente
    const role = sessionStorage.getItem('app_role') || 'client';
    setUserRole(role);
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
        
        // Ottieni e salva token FCM nella collezione corretta
        try {
          const messaging = getMessaging();
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY
          });
          
          if (token && auth.currentUser) {
            const userId = auth.currentUser.uid;
            const tokenRef = getTenantDoc(db, 'fcmTokens', userId);
            const existingDoc = await getDoc(tokenRef);
            
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            
            if (existingDoc.exists()) {
              await updateDoc(tokenRef, {
                token: token,
                updatedAt: serverTimestamp(),
                platform: isIOS ? 'ios' : 'android/web',
                isPWA: isPWA
              });
            } else {
              await setDoc(tokenRef, {
                userId,
                token: token,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                platform: isIOS ? 'ios' : 'android/web',
                isPWA: isPWA,
                enabled: true
              });
            }
            console.log('[FCM] Token salvato con successo nella collezione fcmTokens');
          }
        } catch (fcmError) {
          console.error('[FCM] Errore token:', fcmError);
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
      {/* Toast-style notification banner - non blocca l'interfaccia */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[30] pointer-events-auto"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full overflow-hidden shadow-2xl"
        >
          {/* Header compatto */}
          <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-4 flex items-center gap-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25"
            >
              <Bell size={24} className="text-white" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white">
                Attiva le Notifiche 🔔
              </h2>
              <p className="text-slate-300 text-xs">
                Non perdere nessun aggiornamento
              </p>
            </div>

            <button
              onClick={handleSkip}
              className="flex-shrink-0 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Contenuto compatto */}
          <div className="p-4">
            {result === null && (
              <>
                {/* Bottoni compatti */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    className="flex-1 py-2.5 text-slate-400 hover:text-white text-sm transition-colors border border-slate-700 rounded-xl"
                  >
                    Dopo
                  </button>
                  <button
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Bell size={16} />
                        Attiva
                      </>
                    )}
                  </button>
                </div>

                {/* Note iOS */}
                <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Smartphone size={14} className="text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-200/80">
                      <strong>iOS:</strong> Aggiungi alla Home per le notifiche
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
