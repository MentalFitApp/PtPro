// src/pages/admin/BrandingEditor.jsx
// Editor semplificato per personalizzazione nomi piattaforma
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, ChevronLeft, Save, RotateCcw, 
  Type, Crown, User, Dumbbell, Users, CheckCircle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getCurrentTenantId } from '../../config/tenant';
import { useToast } from '../../contexts/ToastContext';

// === COMPONENTE INPUT FIELD ===
const InputField = ({ label, icon: Icon, value, onChange, placeholder, helpText, iconColor = 'text-blue-400' }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
      {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
      {label}
    </label>
    <input
      type="text"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white 
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
        placeholder:text-slate-500 transition-all"
    />
    {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
  </div>
);

// === MAIN COMPONENT ===
export default function BrandingEditor() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Stati per i nomi
  const [config, setConfig] = useState({
    appName: 'FitFlow',
    adminAreaName: 'Area Personale',
    coachAreaName: 'Area Coach',
    collaboratoreAreaName: 'Area Collaboratore',
    clientAreaName: 'Area Cliente',
  });

  const [originalConfig, setOriginalConfig] = useState(null);

  // Carica configurazione
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const tenantId = getCurrentTenantId();
        if (!tenantId) {
          setMessage({ type: 'error', text: 'Tenant non trovato' });
          setLoading(false);
          return;
        }

        // Carica config dal tenant
        const brandingDoc = await getDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'));
        if (brandingDoc.exists()) {
          const data = brandingDoc.data();
          const loadedConfig = {
            appName: data.appName || 'FitFlow',
            adminAreaName: data.adminAreaName || 'Area Personale',
            coachAreaName: data.coachAreaName || 'Area Coach',
            collaboratoreAreaName: data.collaboratoreAreaName || 'Area Collaboratore',
            clientAreaName: data.clientAreaName || 'Area Cliente',
          };
          setConfig(loadedConfig);
          setOriginalConfig(loadedConfig);
        } else {
          setOriginalConfig(config);
        }
      } catch (error) {
        console.error('Error loading config:', error);
        setMessage({ type: 'error', text: 'Errore nel caricamento' });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [navigate]);

  // Controlla se ci sono modifiche
  useEffect(() => {
    if (originalConfig) {
      const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setHasChanges(changed);
    }
  }, [config, originalConfig]);

  // Aggiorna campo
  const updateField = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setMessage({ type: '', text: '' });
  };

  // Salva configurazione
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const tenantId = getCurrentTenantId();
      const brandingRef = doc(db, 'tenants', tenantId, 'settings', 'branding');
      
      // Prima prova ad aggiornare, se fallisce crea il documento
      try {
        await updateDoc(brandingRef, {
          ...config,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        // Se il documento non esiste, crealo
        await setDoc(brandingRef, {
          ...config,
          updatedAt: new Date().toISOString(),
        });
      }

      setOriginalConfig(config);
      setHasChanges(false);
      setMessage({ type: 'success', text: 'Impostazioni salvate! Ricarica la pagina per vedere le modifiche.' });
      toast?.success?.('Impostazioni salvate con successo!');
    } catch (error) {
      console.error('Error saving:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio' });
      toast?.error?.('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // Reset configurazione
  const handleReset = () => {
    setConfig({
      appName: 'FitFlow',
      adminAreaName: 'Area Personale',
      coachAreaName: 'Area Coach',
      collaboratoreAreaName: 'Area Collaboratore',
      clientAreaName: 'Area Cliente',
    });
    setMessage({ type: 'info', text: 'Ripristinati i valori predefiniti' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500" />
          <p className="text-slate-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Indietro</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <Palette className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Personalizzazione Piattaforma
              </h1>
              <p className="text-slate-400 mt-1">
                Configura i nomi delle aree della tua piattaforma
              </p>
            </div>
          </div>
        </motion.div>

        {/* Messaggio */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : message.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-xl"
        >
          <div className="space-y-6">
            {/* Nome Applicazione */}
            <InputField
              label="Nome Applicazione"
              icon={Type}
              iconColor="text-blue-400"
              value={config.appName}
              onChange={(e) => updateField('appName', e.target.value)}
              placeholder="es. FitFlow, MentalFit, MyCoach"
              helpText="Apparirà nell'header mobile e nei titoli"
            />

            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Nomi delle Aree</h3>
              
              <div className="space-y-5">
                {/* Area Admin */}
                <InputField
                  label="Nome Area Admin/CEO"
                  icon={Crown}
                  iconColor="text-purple-400"
                  value={config.adminAreaName}
                  onChange={(e) => updateField('adminAreaName', e.target.value)}
                  placeholder="es. Area Personale, Dashboard Admin"
                  helpText="Visibile solo agli amministratori"
                />

                {/* Area Coach */}
                <InputField
                  label="Nome Area Coach"
                  icon={Dumbbell}
                  iconColor="text-cyan-400"
                  value={config.coachAreaName}
                  onChange={(e) => updateField('coachAreaName', e.target.value)}
                  placeholder="es. Area Coach, Dashboard Trainer"
                  helpText="Visibile ai coach/personal trainer"
                />

                {/* Area Collaboratore */}
                <InputField
                  label="Nome Area Collaboratore"
                  icon={Users}
                  iconColor="text-emerald-400"
                  value={config.collaboratoreAreaName}
                  onChange={(e) => updateField('collaboratoreAreaName', e.target.value)}
                  placeholder="es. Area Collaboratore, Team Dashboard"
                  helpText="Visibile ai collaboratori/setter"
                />

                {/* Area Cliente */}
                <InputField
                  label="Nome Area Cliente"
                  icon={User}
                  iconColor="text-amber-400"
                  value={config.clientAreaName}
                  onChange={(e) => updateField('clientAreaName', e.target.value)}
                  placeholder="es. Area Cliente, Il Mio Spazio"
                  helpText="Visibile ai clienti finali"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                hasChanges 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {hasChanges ? 'Salva Modifiche' : 'Nessuna Modifica'}
                </>
              )}
            </button>
            
            <button
              onClick={handleReset}
              className="py-3 px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Ripristina Default
            </button>
          </div>
        </motion.div>

        {/* Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-slate-500 mt-6"
        >
          Le modifiche saranno visibili dopo aver ricaricato la pagina
        </motion.p>
      </div>
    </div>
  );
}
