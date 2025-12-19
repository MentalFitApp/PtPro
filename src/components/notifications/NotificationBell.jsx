import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, MessageSquare, Dumbbell, ClipboardCheck, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * Componente campanella notifiche con dropdown
 * Mostra badge con contatore e lista notifiche al click
 */
export default function NotificationBell({ className = '', role = 'admin' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(20);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Icona per tipo notifica
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'check_viewed':
        return <Eye className="text-green-400" size={16} />;
      case 'new_workout':
        return <Dumbbell className="text-blue-400" size={16} />;
      case 'new_check':
        return <ClipboardCheck className="text-purple-400" size={16} />;
      case 'new_message':
        return <MessageSquare className="text-cyan-400" size={16} />;
      default:
        return <Bell className="text-slate-400" size={16} />;
    }
  };

  // Formatta data relativa
  const formatRelativeTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Ora';
    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    if (days < 7) return `${days}g fa`;
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  };

  // Helper per costruire il percorso client basato sul ruolo
  const getClientPath = (clientId, tab = null) => {
    const basePath = role === 'coach' ? `/coach/client/${clientId}` : `/admin/client/${clientId}`;
    return tab ? `${basePath}?tab=${tab}` : basePath;
  };

  // Gestisce click su notifica
  const handleNotificationClick = (notification) => {
    // Segna come letta
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Naviga alla destinazione appropriata
    const { type, data } = notification;
    
    switch (type) {
      case 'check_viewed':
      case 'new_check':
        if (data?.clientId) {
          navigate(getClientPath(data.clientId, 'check'));
        }
        break;
      case 'new_workout':
        if (data?.clientId) {
          navigate(getClientPath(data.clientId, 'workout'));
        } else {
          navigate('/client/dashboard');
        }
        break;
      case 'new_message':
        if (data?.chatId) {
          navigate(`/chat/${data.chatId}`);
        } else {
          navigate('/chat');
        }
        break;
      default:
        break;
    }
    
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Campanella con badge */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-theme-bg-tertiary/60 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
      >
        <Bell size={20} />
        
        {/* Badge contatore */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown notifiche */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-theme-bg-secondary/95 backdrop-blur-xl border border-theme rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-theme">
              <h3 className="text-sm font-semibold text-theme-text-primary">Notifiche</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60 rounded transition-colors"
                  >
                    <CheckCheck size={14} />
                    <span className="hidden sm:inline">Segna tutte lette</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-theme-bg-tertiary/60 rounded transition-colors text-theme-text-secondary"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Lista notifiche */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-theme-text-secondary">
                  <div className="animate-spin w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-xs">Caricamento...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto text-theme-text-tertiary mb-2" size={32} />
                  <p className="text-sm text-theme-text-secondary">Nessuna notifica</p>
                  <p className="text-xs text-theme-text-tertiary mt-1">Le tue notifiche appariranno qui</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-3 cursor-pointer transition-colors border-b border-theme/30 last:border-0 ${
                      notification.read 
                        ? 'bg-transparent hover:bg-theme-bg-tertiary/30' 
                        : 'bg-theme-accent/5 hover:bg-theme-accent/10'
                    }`}
                  >
                    {/* Icona */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Contenuto */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notification.read ? 'text-theme-text-secondary' : 'text-theme-text-primary font-medium'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-theme-text-tertiary mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-[10px] text-theme-text-tertiary mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    
                    {/* Indicatore non letta */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-theme-accent rounded-full" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2 border-t border-theme">
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                  className="w-full py-2 text-xs text-theme-accent hover:bg-theme-bg-tertiary/60 rounded transition-colors"
                >
                  Vedi tutte le notifiche
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
