import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Bell, Heart, MessageSquare, User, Trophy, Video, X, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsQuery = query(
      collection(db, 'community_notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'community_notifications', notificationId), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'community_notifications', notification.id), {
          read: true,
          readAt: serverTimestamp(),
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const createNotification = async (userId, type, title, message, data = {}) => {
    try {
      await addDoc(collection(db, 'community_notifications'), {
        userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const NotificationBell = ({ className = '' }) => {
  const { unreadCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <NotificationDropdown onClose={() => setShowDropdown(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const NotificationDropdown = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-400" />;
      case 'comment': return <MessageSquare size={16} className="text-blue-400" />;
      case 'level_up': return <Trophy size={16} className="text-yellow-400" />;
      case 'group_call': return <Video size={16} className="text-green-400" />;
      case 'welcome': return <User size={16} className="text-purple-400" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ora';
    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    return `${days}g fa`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute right-0 top-12 w-80 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50"
    >
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100">Notifiche</h3>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Segna tutte lette
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessuna notifica</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-slate-700/20' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  // Handle navigation based on notification type
                  onClose();
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">
                      {notification.title}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Chiudi
        </button>
      </div>
    </motion.div>
  );
};

// Hook per creare notifiche facilmente
export const useCreateNotification = () => {
  const { createNotification } = useNotifications();

  return {
    notifyLike: (userId, likerName, postTitle) =>
      createNotification(
        userId,
        'like',
        'Nuovo like!',
        `${likerName} ha messo like al tuo post "${postTitle}"`
      ),

    notifyComment: (userId, commenterName, postTitle) =>
      createNotification(
        userId,
        'comment',
        'Nuovo commento!',
        `${commenterName} ha commentato il tuo post "${postTitle}"`
      ),

    notifyLevelUp: (userId, newLevel) =>
      createNotification(
        userId,
        'level_up',
        'Livello sbloccato! 🎉',
        `Hai raggiunto il livello ${newLevel}! Nuovi contenuti esclusivi ti aspettano.`
      ),

    notifyGroupCall: (userId, callTime) =>
      createNotification(
        userId,
        'group_call',
        'Group Call in arrivo!',
        `La call settimanale inizia tra 10 minuti (${callTime})`
      ),

    notifyWelcome: (userId) =>
      createNotification(
        userId,
        'welcome',
        'Benvenuto nella Community! 🎊',
        'Il tuo onboarding è completo. Inizia a esplorare e condividere!'
      ),
  };
};