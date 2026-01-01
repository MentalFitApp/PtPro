// src/components/notifications/SmartNotificationSettings.jsx
// Pannello impostazioni Smart Notifications per clienti

import React, { useState, useEffect } from 'react';
import { 
  Bell, BellOff, Clock, Calendar, Dumbbell, Scale, 
  Sparkles, Moon, Sun, Save, ChevronDown, ChevronUp,
  Zap, Target, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getSmartNotificationPreferences, 
  saveSmartNotificationPreferences,
  SMART_NOTIFICATION_TYPES 
} from '../../services/smartNotifications';
import { useToast } from '../../contexts/ToastContext';
import { auth } from '../../firebase';

/**
 * Pannello impostazioni per Smart Notifications
 * Permette al cliente di personalizzare i reminder automatici
 */
export default function SmartNotificationSettings({ userId }) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState('workout');
  const toast = useToast();

  const currentUserId = userId || auth.currentUser?.uid;

  useEffect(() => {
    loadPreferences();
  }, [currentUserId]);

  const loadPreferences = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const prefs = await getSmartNotificationPreferences(currentUserId);
      setPreferences(prefs || getDefaultPreferences());
    } catch (error) {
      console.error('Errore caricamento preferenze:', error);
      setPreferences(getDefaultPreferences());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPreferences = () => ({
    enabled: true,
    quietHoursStart: '23:00',
    quietHoursEnd: '08:00',
    workoutReminderTime: '18:00',
    workoutReminderEnabled: true,
    streakAlertsEnabled: true,
    checkinReminderDay: 'sunday',
    checkinReminderEnabled: true,
    motivationalQuotesEnabled: false,
    comebackReminderEnabled: true,
    weightGoalAlertsEnabled: true
  });

  const handleChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    
    setSaving(true);
    try {
      const success = await saveSmartNotificationPreferences(currentUserId, preferences);
      if (success) {
        toast.success('Preferenze salvate con successo!');
      } else {
        throw new Error('Errore salvataggio');
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const days = [
    { value: 'monday', label: 'Lunedì' },
    { value: 'tuesday', label: 'Martedì' },
    { value: 'wednesday', label: 'Mercoledì' },
    { value: 'thursday', label: 'Giovedì' },
    { value: 'friday', label: 'Venerdì' },
    { value: 'saturday', label: 'Sabato' },
    { value: 'sunday', label: 'Domenica' }
  ];

  return (
    <div className="space-y-4">
      {/* Master Toggle */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {preferences.enabled ? (
              <Bell className="w-5 h-5 text-indigo-400" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-500" />
            )}
            <div>
              <h3 className="font-medium text-slate-200">Smart Notifications</h3>
              <p className="text-xs text-slate-400">
                Reminder automatici personalizzati
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {preferences.enabled && (
        <>
          {/* Quiet Hours */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => toggleSection('quiet')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-purple-400" />
                <div className="text-left">
                  <h3 className="font-medium text-slate-200">Ore di silenzio</h3>
                  <p className="text-xs text-slate-400">
                    {preferences.quietHoursStart} - {preferences.quietHoursEnd}
                  </p>
                </div>
              </div>
              {expandedSection === 'quiet' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSection === 'quiet' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <p className="text-xs text-slate-500 mb-3">
                    Nessuna notifica durante queste ore
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Inizio</label>
                      <input
                        type="time"
                        value={preferences.quietHoursStart}
                        onChange={(e) => handleChange('quietHoursStart', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Fine</label>
                      <input
                        type="time"
                        value={preferences.quietHoursEnd}
                        onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Workout Reminders */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => toggleSection('workout')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <h3 className="font-medium text-slate-200">Reminder Allenamento</h3>
                  <p className="text-xs text-slate-400">
                    {preferences.workoutReminderEnabled ? `Ogni giorno alle ${preferences.workoutReminderTime}` : 'Disabilitato'}
                  </p>
                </div>
              </div>
              {expandedSection === 'workout' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSection === 'workout' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 space-y-3"
                >
                  {/* Toggle reminder giornaliero */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-300">Reminder giornaliero</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.workoutReminderEnabled}
                        onChange={(e) => handleChange('workoutReminderEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {preferences.workoutReminderEnabled && (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Orario reminder</label>
                      <input
                        type="time"
                        value={preferences.workoutReminderTime}
                        onChange={(e) => handleChange('workoutReminderTime', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 text-sm"
                      />
                    </div>
                  )}

                  {/* Alert streak */}
                  <div className="flex items-center justify-between py-2 border-t border-slate-700/50 pt-3">
                    <div>
                      <span className="text-sm text-slate-300 block">Alert Streak</span>
                      <span className="text-xs text-slate-500">Avvisi quando la streak è a rischio</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.streakAlertsEnabled}
                        onChange={(e) => handleChange('streakAlertsEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Check-in Reminders */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => toggleSection('checkin')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <h3 className="font-medium text-slate-200">Reminder Check-in</h3>
                  <p className="text-xs text-slate-400">
                    {preferences.checkinReminderEnabled 
                      ? `Ogni ${days.find(d => d.value === preferences.checkinReminderDay)?.label || 'Domenica'}` 
                      : 'Disabilitato'
                    }
                  </p>
                </div>
              </div>
              {expandedSection === 'checkin' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSection === 'checkin' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 space-y-3"
                >
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-300">Reminder settimanale</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.checkinReminderEnabled}
                        onChange={(e) => handleChange('checkinReminderEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {preferences.checkinReminderEnabled && (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Giorno preferito</label>
                      <select
                        value={preferences.checkinReminderDay}
                        onChange={(e) => handleChange('checkinReminderDay', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 text-sm"
                      >
                        {days.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Weight Goal Alerts */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => toggleSection('weight')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-amber-400" />
                <div className="text-left">
                  <h3 className="font-medium text-slate-200">Alert Obiettivo Peso</h3>
                  <p className="text-xs text-slate-400">
                    {preferences.weightGoalAlertsEnabled ? 'Notifiche ai progressi' : 'Disabilitato'}
                  </p>
                </div>
              </div>
              {expandedSection === 'weight' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSection === 'weight' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm text-slate-300 block">Alert progressi peso</span>
                      <span className="text-xs text-slate-500">Notifiche a 25%, 50%, 75% e obiettivo raggiunto</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.weightGoalAlertsEnabled}
                        onChange={(e) => handleChange('weightGoalAlertsEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Motivational Quotes */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => toggleSection('motivation')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <div className="text-left">
                  <h3 className="font-medium text-slate-200">Citazioni Motivazionali</h3>
                  <p className="text-xs text-slate-400">
                    {preferences.motivationalQuotesEnabled ? 'Una al giorno' : 'Disabilitato'}
                  </p>
                </div>
              </div>
              {expandedSection === 'motivation' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSection === 'motivation' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm text-slate-300 block">Pensiero del giorno</span>
                      <span className="text-xs text-slate-500">Una citazione motivazionale ogni mattina</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.motivationalQuotesEnabled}
                        onChange={(e) => handleChange('motivationalQuotesEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comeback Reminder */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-medium text-slate-200">Reminder Ritorno</h3>
                  <p className="text-xs text-slate-400">
                    Promemoria se non apri l'app per qualche giorno
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.comebackReminderEnabled}
                  onChange={(e) => handleChange('comebackReminderEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-colors"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Salvataggio...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Salva Preferenze
          </>
        )}
      </motion.button>
    </div>
  );
}
