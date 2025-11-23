// src/pages/admin/TenantBranding.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, Save, RotateCcw, Sparkles, User, Users, 
  UserCheck, GraduationCap, CheckCircle, AlertCircle, Upload, Image as ImageIcon 
} from 'lucide-react';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { defaultBranding } from '../../config/tenantBranding';
import { uploadToR2 } from '../../storageUtils';
import { CURRENT_TENANT_ID } from '../../config/tenant';

export default function TenantBranding() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tenantId, setTenantId] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    appName: defaultBranding.appName,
    adminAreaName: defaultBranding.adminAreaName,
    clientAreaName: defaultBranding.clientAreaName,
    coachAreaName: defaultBranding.coachAreaName,
    collaboratoreAreaName: defaultBranding.collaboratoreAreaName,
    logoUrl: null,
  });

  // Carica branding esistente
  useEffect(() => {
    const loadBranding = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Ottieni tenantId dal localStorage o usa quello configurato
        let tid = localStorage.getItem('tenantId') || CURRENT_TENANT_ID;
        
        // Se non c'è nel localStorage, salvalo per la prossima volta
        if (!localStorage.getItem('tenantId')) {
          localStorage.setItem('tenantId', tid);
          console.log('✅ TenantId salvato:', tid);
        }
        
        setTenantId(tid);

        try {
          const brandingDoc = await getDoc(doc(db, 'tenants', tid, 'settings', 'branding'));
          
          if (brandingDoc.exists()) {
            const data = brandingDoc.data();
            setFormData({
              appName: data.appName || defaultBranding.appName,
              adminAreaName: data.adminAreaName || defaultBranding.adminAreaName,
              clientAreaName: data.clientAreaName || defaultBranding.clientAreaName,
              coachAreaName: data.coachAreaName || defaultBranding.coachAreaName,
              collaboratoreAreaName: data.collaboratoreAreaName || defaultBranding.collaboratoreAreaName,
              logoUrl: data.logoUrl || null,
            });
            if (data.logoUrl) {
              setLogoPreview(data.logoUrl);
            }
          }
        } catch (error) {
          console.error('Error loading branding:', error);
          setMessage({ type: 'error', text: `Errore nel caricamento: ${error.message}` });
        }
      } catch (error) {
        console.error('Error in loadBranding:', error);
        setMessage({ type: 'error', text: 'Errore nel caricamento delle impostazioni' });
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const brandingRef = doc(db, 'tenants', tenantId, 'settings', 'branding');
      await setDoc(brandingRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setMessage({ type: 'success', text: 'Impostazioni salvate con successo! Ricarica la pagina per vedere le modifiche.' });
    } catch (error) {
      console.error('Error saving branding:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Per favore carica un\'immagine valida (JPG, PNG, WebP)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      setMessage({ type: 'error', text: 'L\'immagine deve essere inferiore a 5MB' });
      return;
    }

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });

    try {
      // Crea preview locale
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload su R2
      const logoUrl = await uploadToR2(file, tenantId, 'branding');
      
      setFormData({ ...formData, logoUrl });
      setMessage({ type: 'success', text: 'Logo caricato! Ricorda di cliccare "Salva Modifiche"' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Errore durante il caricamento del logo' });
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoUrl: null });
    setLogoPreview(null);
    setMessage({ type: 'info', text: 'Logo rimosso. Ricorda di salvare le modifiche.' });
  };

  const handleReset = () => {
    setFormData({
      appName: defaultBranding.appName,
      adminAreaName: defaultBranding.adminAreaName,
      clientAreaName: defaultBranding.clientAreaName,
      coachAreaName: defaultBranding.coachAreaName,
      collaboratoreAreaName: defaultBranding.collaboratoreAreaName,
      logoUrl: null,
    });
    setLogoPreview(null);
    setMessage({ type: 'info', text: 'Ripristinati i valori predefiniti' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-purple-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Personalizzazione Branding
          </h1>
        </div>
        <p className="text-slate-300 text-sm sm:text-base ml-13">
          Personalizza i nomi delle aree della tua piattaforma
        </p>
      </motion.div>

      {/* MESSAGGIO */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : message.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
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

      {/* FORM */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-xl space-y-6"
      >
        {/* Nome App */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Nome Applicazione
          </label>
          <input
            type="text"
            value={formData.appName}
            onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="es. FitFlow Pro"
          />
          <p className="text-xs text-slate-500">Apparirà nell'header mobile e nei titoli</p>
        </div>

        {/* Area Admin */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <User className="w-4 h-4 text-purple-400" />
            Nome Area Admin/CEO
          </label>
          <input
            type="text"
            value={formData.adminAreaName}
            onChange={(e) => setFormData({ ...formData, adminAreaName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="es. Area Personale, Dashboard Admin, Pannello di Controllo"
          />
          <p className="text-xs text-slate-500">Visibile solo agli amministratori</p>
        </div>

        {/* Area Coach */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            Nome Area Coach
          </label>
          <input
            type="text"
            value={formData.coachAreaName}
            onChange={(e) => setFormData({ ...formData, coachAreaName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder="es. Area Coach, Dashboard Trainer"
          />
          <p className="text-xs text-slate-500">Visibile ai coach/personal trainer</p>
        </div>

        {/* Area Collaboratore */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <UserCheck className="w-4 h-4 text-green-400" />
            Nome Area Collaboratore
          </label>
          <input
            type="text"
            value={formData.collaboratoreAreaName}
            onChange={(e) => setFormData({ ...formData, collaboratoreAreaName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="es. Area Collaboratore, Dashboard Setter"
          />
          <p className="text-xs text-slate-500">Visibile ai collaboratori/setter</p>
        </div>

        {/* Area Cliente */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Users className="w-4 h-4 text-yellow-400" />
            Nome Area Cliente
          </label>
          <input
            type="text"
            value={formData.clientAreaName}
            onChange={(e) => setFormData({ ...formData, clientAreaName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            placeholder="es. Area Cliente, Il Mio Spazio, Dashboard Personale"
          />
          <p className="text-xs text-slate-500">Visibile ai clienti finali</p>
        </div>

        {/* LOGO PERSONALIZZATO */}
        <div className="space-y-3 pt-4 border-t border-slate-700">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <ImageIcon className="w-4 h-4 text-pink-400" />
            Logo Personalizzato
          </label>
          
          {/* Preview Logo */}
          {logoPreview && (
            <div className="relative w-full max-w-xs mx-auto">
              <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 flex items-center justify-center">
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
              <div className={`
                flex items-center justify-center gap-2 px-4 py-3 
                bg-slate-900/50 border-2 border-dashed border-slate-600 
                rounded-lg text-slate-300 hover:border-pink-500 hover:text-pink-400 
                transition-all
                ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-900/70'}
              `}>
                {uploadingLogo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-400"></div>
                    <span className="text-sm">Caricamento...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">
                      {logoPreview ? 'Cambia Logo' : 'Carica Logo'}
                    </span>
                  </>
                )}
              </div>
            </label>
          </div>
          
          <p className="text-xs text-slate-500">
            Formati supportati: JPG, PNG, WebP • Max 5MB • Consigliato: 200x50px
          </p>
          <p className="text-xs text-slate-400 italic">
            Il logo apparirà nell'header mobile al posto del nome dell'app
          </p>
        </div>

        {/* BOTTONI */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salva Modifiche</span>
              </>
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={handleReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ripristina Default</span>
          </motion.button>
        </div>
      </motion.form>

      {/* INFO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20"
      >
        <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Note Importanti
        </h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Le modifiche saranno visibili dopo aver ricaricato la pagina</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Questi nomi sono visibili solo agli utenti del tuo tenant</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Le funzionalità dell'app rimangono invariate, cambia solo la nomenclatura</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Puoi ripristinare i valori predefiniti in qualsiasi momento</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
