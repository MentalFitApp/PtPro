// src/components/layout/SidebarCustomizer.jsx
// Modal per personalizzare le voci visibili nella sidebar

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Settings, X, Eye, EyeOff, GripVertical, Save, RotateCcw,
  Home, Users, FileText, Calendar, MessageSquare, BarChart3, 
  BellRing, UserCheck, BookOpen, Target, Activity, Palette, 
  Layout, Link2, Dumbbell, Utensils, Shield, CreditCard,
  ChevronDown, ChevronUp, Check, Zap
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';

// Mappa icone per nome
const ICON_MAP = {
  Home, Users, FileText, Calendar, MessageSquare, BarChart3,
  BellRing, UserCheck, BookOpen, Target, Activity, Palette,
  Layout, Link2, Dumbbell, Utensils, Shield, CreditCard, Settings, Zap
};

// Configurazione default menu per ruolo
const DEFAULT_MENU_CONFIG = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', to: '/', visible: true, locked: true },
    { id: 'clients', label: 'Clienti', icon: 'Users', to: '/clients', visible: true, locked: true },
    { id: 'chat', label: 'Messaggi', icon: 'MessageSquare', to: '/chat', visible: true },
    { id: 'calendar', label: 'Calendario', icon: 'Calendar', to: '/calendar', visible: true },
    { id: 'collaboratori', label: 'Collaboratori', icon: 'UserCheck', to: '/collaboratori', visible: true },
    { id: 'dipendenti', label: 'Dipendenti', icon: 'Users', to: '/admin/dipendenti', visible: true },
    { id: 'schede', label: 'Schede', icon: 'Target', to: '/alimentazione-allenamento', visible: true },
    { id: 'checks', label: 'Check', icon: 'Activity', to: '/admin/checks', visible: true },
    { id: 'anamnesi', label: 'Anamnesi', icon: 'FileText', to: '/admin/anamnesi', visible: true },
    { id: 'courses', label: 'Corsi', icon: 'BookOpen', to: '/courses', visible: true },
    { id: 'community', label: 'Community', icon: 'Users', to: '/community', visible: true },
    { id: 'landing', label: 'Landing Pages', icon: 'Layout', to: '/admin/landing-pages', visible: true },
    { id: 'business-history', label: 'Business History', icon: 'BarChart3', to: '/business-history', visible: true },
    { id: 'statistiche', label: 'Statistiche', icon: 'Activity', to: '/statistiche', visible: true },
    { id: 'branding', label: 'Branding', icon: 'Palette', to: '/admin/branding', visible: true },
    { id: 'integrations', label: 'Integrazioni', icon: 'Link2', to: '/integrations', visible: true },
    { id: 'platform', label: 'Piattaforma', icon: 'Settings', to: '/platform-settings', visible: true },
    { id: 'demo', label: '✨ Demo 2.0', icon: 'Zap', to: '/dashboard-demo', visible: true },
  ],
  coach: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', to: '/coach', visible: true, locked: true },
    { id: 'clients', label: 'Clienti', icon: 'Users', to: '/coach/clients', visible: true, locked: true },
    { id: 'chat', label: 'Messaggi', icon: 'MessageSquare', to: '/coach/chat', visible: true },
    { id: 'checks', label: 'Check', icon: 'Activity', to: '/coach/checks', visible: true },
    { id: 'anamnesi', label: 'Anamnesi', icon: 'FileText', to: '/coach/anamnesi', visible: true },
    { id: 'schede', label: 'Schede', icon: 'Target', to: '/coach/schede', visible: true },
    { id: 'updates', label: 'Aggiornamenti', icon: 'BellRing', to: '/coach/updates', visible: true },
    { id: 'settings', label: 'Impostazioni', icon: 'Settings', to: '/coach/settings', visible: true },
  ],
  client: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', to: '/client/dashboard', visible: true, locked: true },
    { id: 'allenamento', label: 'Allenamento', icon: 'Dumbbell', to: '/client/scheda-allenamento', visible: true },
    { id: 'alimentazione', label: 'Alimentazione', icon: 'Utensils', to: '/client/scheda-alimentazione', visible: true },
    { id: 'chat', label: 'Chat', icon: 'MessageSquare', to: '/client/chat', visible: true },
    { id: 'community', label: 'Community', icon: 'Users', to: '/client/community', visible: true },
    { id: 'anamnesi', label: 'Anamnesi', icon: 'FileText', to: '/client/anamnesi', visible: true },
    { id: 'checks', label: 'Check', icon: 'Activity', to: '/client/checks', visible: true },
    { id: 'payments', label: 'Pagamenti', icon: 'CreditCard', to: '/client/payments', visible: true },
    { id: 'courses', label: 'Corsi', icon: 'BookOpen', to: '/client/courses', visible: true },
    { id: 'settings', label: 'Impostazioni', icon: 'Settings', to: '/client/settings', visible: true },
  ]
};

/**
 * Hook per gestire le preferenze del menu sidebar
 */
export function useSidebarPreferences(role) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Ricarica quando cambia il ruolo o quando viene triggerato un refresh
  useEffect(() => {
    loadPreferences();
  }, [role, refreshKey]);
  
  // Ascolta l'evento di aggiornamento preferenze per ricaricare
  useEffect(() => {
    const handlePrefsUpdate = () => {
      setRefreshKey(k => k + 1);
    };
    window.addEventListener('sidebar-preferences-updated', handlePrefsUpdate);
    return () => window.removeEventListener('sidebar-preferences-updated', handlePrefsUpdate);
  }, []);

  const loadPreferences = async () => {
    const user = auth.currentUser;
    if (!user || !role) {
      setMenuItems(DEFAULT_MENU_CONFIG[role] || []);
      setLoading(false);
      return;
    }

    try {
      const prefsDoc = await getDoc(doc(db, 'users', user.uid, 'preferences', 'sidebar'));
      
      if (prefsDoc.exists() && prefsDoc.data()[role]) {
        // Merge saved preferences with defaults (in case new items were added)
        const savedItems = prefsDoc.data()[role];
        const defaultItems = DEFAULT_MENU_CONFIG[role] || [];
        
        // Create a map of saved items for quick lookup
        const savedMap = new Map(savedItems.map(item => [item.id, item]));
        
        // Merge: use saved visibility/order, but include any new default items
        const mergedItems = defaultItems.map(defaultItem => {
          const savedItem = savedMap.get(defaultItem.id);
          if (savedItem) {
            return { ...defaultItem, visible: savedItem.visible };
          }
          return defaultItem;
        });
        
        setMenuItems(mergedItems);
      } else {
        setMenuItems(DEFAULT_MENU_CONFIG[role] || []);
      }
    } catch (error) {
      console.error('Error loading sidebar preferences:', error);
      setMenuItems(DEFAULT_MENU_CONFIG[role] || []);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (items) => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      await setDoc(doc(db, 'users', user.uid, 'preferences', 'sidebar'), {
        [role]: items.map(item => ({ id: item.id, visible: item.visible })),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setMenuItems(items);
      return true;
    } catch (error) {
      console.error('Error saving sidebar preferences:', error);
      return false;
    }
  };

  const resetToDefaults = async () => {
    const defaults = DEFAULT_MENU_CONFIG[role] || [];
    await savePreferences(defaults);
    return defaults;
  };

  // Filtra solo gli items visibili per l'uso nella sidebar
  const visibleItems = menuItems.filter(item => item.visible);

  return {
    menuItems,
    visibleItems,
    loading,
    savePreferences,
    resetToDefaults,
    reload: loadPreferences
  };
}

/**
 * Modal per personalizzare il menu sidebar
 */
export default function SidebarCustomizer({ isOpen, onClose, role = 'admin' }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, role]);

  const loadItems = async () => {
    const user = auth.currentUser;
    if (!user) {
      setItems(DEFAULT_MENU_CONFIG[role] || []);
      return;
    }

    try {
      const prefsDoc = await getDoc(doc(db, 'users', user.uid, 'preferences', 'sidebar'));
      
      if (prefsDoc.exists() && prefsDoc.data()[role]) {
        const savedItems = prefsDoc.data()[role];
        const defaultItems = DEFAULT_MENU_CONFIG[role] || [];
        
        const savedMap = new Map(savedItems.map(item => [item.id, item]));
        
        const mergedItems = defaultItems.map(defaultItem => {
          const savedItem = savedMap.get(defaultItem.id);
          if (savedItem) {
            return { ...defaultItem, visible: savedItem.visible };
          }
          return defaultItem;
        });
        
        setItems(mergedItems);
      } else {
        setItems(DEFAULT_MENU_CONFIG[role] || []);
      }
    } catch (error) {
      console.error('Error loading:', error);
      setItems(DEFAULT_MENU_CONFIG[role] || []);
    }
  };

  const toggleVisibility = (id) => {
    setItems(prev => prev.map(item => 
      item.id === id && !item.locked 
        ? { ...item, visible: !item.visible }
        : item
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'preferences', 'sidebar'), {
        [role]: items.map(item => ({ id: item.id, visible: item.visible })),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast.success('Menu personalizzato salvato!');
      setHasChanges(false);
      onClose();
      // Trigger reload della sidebar
      window.dispatchEvent(new CustomEvent('sidebar-preferences-updated'));
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setItems(DEFAULT_MENU_CONFIG[role] || []);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  const visibleCount = items.filter(i => i.visible).length;
  const totalCount = items.length;

  // Usa Portal per renderizzare fuori dalla sidebar
  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && !hasChanges && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="sidebar-customizer-modal bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Personalizza Menu
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {visibleCount}/{totalCount} voci visibili
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {items.map((item) => {
              const Icon = ICON_MAP[item.icon] || Settings;
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${item.visible 
                      ? 'bg-slate-800/60 border-slate-700/50' 
                      : 'bg-slate-800/20 border-slate-800/30 opacity-60'
                    }
                    ${item.locked ? 'cursor-not-allowed' : 'cursor-pointer hover:border-blue-500/30'}
                  `}
                  onClick={() => !item.locked && toggleVisibility(item.id)}
                >
                  {/* Drag Handle (disabled for now) */}
                  <div className="text-slate-600">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${item.visible ? 'bg-blue-500/20' : 'bg-slate-700/50'}`}>
                    <Icon className={`w-4 h-4 ${item.visible ? 'text-blue-400' : 'text-slate-500'}`} />
                  </div>

                  {/* Label */}
                  <span className={`flex-1 font-medium ${item.visible ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>

                  {/* Locked indicator */}
                  {item.locked && (
                    <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800 rounded">
                      Obbligatorio
                    </span>
                  )}

                  {/* Visibility Toggle */}
                  {!item.locked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(item.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.visible 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-700/50 text-slate-500'
                      }`}
                    >
                      {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50 flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            
            <div className="flex-1" />
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Annulla
            </button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salva
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Render tramite Portal per uscire dalla sidebar
  return createPortal(modalContent, document.body);
}
