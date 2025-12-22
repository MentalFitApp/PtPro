import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { uploadToR2 } from '../../cloudflareStorage';
import { User, Camera, Mail, Phone, Briefcase, Save, ArrowLeft, Upload, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import LinkAccountCard from '../../components/LinkAccountCard';
import { useToast } from '../../contexts/ToastContext';

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = auth.currentUser;

  const [profile, setProfile] = useState({
    displayName: '',
    email: currentUser?.email || '',
    photoURL: '',
    phone: '',
    bio: '',
    role: '', // 'admin', 'coach', 'client'
    visibleInChat: true, // Se admin può essere contattato in chat dai clienti
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadProfile();
  }, [currentUser, navigate]);

  const loadProfile = async () => {
    try {
      // Carica profilo esistente
      const userDoc = await getDoc(getTenantDoc(db, 'users', currentUser.uid));
      
      // Determina ruolo
      const adminDoc = await getDoc(getTenantDoc(db, 'roles', 'admins'));
      const coachDoc = await getDoc(getTenantDoc(db, 'roles', 'coaches'));
      
      let userRole = 'client';
      if (adminDoc.exists() && adminDoc.data().uids?.includes(currentUser.uid)) {
        userRole = 'admin';
      } else if (coachDoc.exists() && coachDoc.data().uids?.includes(currentUser.uid)) {
        userRole = 'coach';
      }

      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile({
          displayName: data.displayName || currentUser.displayName || '',
          email: data.email || currentUser.email || '',
          photoURL: data.photoURL || currentUser.photoURL || '',
          phone: data.phone || '',
          bio: data.bio || '',
          role: userRole,
          visibleInChat: data.visibleInChat !== false, // Default true se non specificato
        });
        setPreviewImage(data.photoURL || currentUser.photoURL);
      } else {
        // Inizializza con dati di Firebase Auth
        setProfile(prev => ({
          ...prev,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '',
          role: userRole,
        }));
        setPreviewImage(currentUser.photoURL);
      }
    } catch (error) {
      console.error('Errore caricamento profilo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validazione tipo file
    if (!file.type.startsWith('image/')) {
      toast.warning('Per favore seleziona un\'immagine valida');
      return;
    }

    // Validazione dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('L\'immagine deve essere inferiore a 5MB');
      return;
    }

    setUploading(true);

    try {
      // Preview locale immediata
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload su Cloudflare R2
      const photoURL = await uploadToR2(
        file, 
        currentUser.uid, 
        'profile-photos',
        (progress) => {
          console.log('Upload progress:', progress);
        },
        true // isAdmin - nessun limite dimensione
      );

      setProfile(prev => ({ ...prev, photoURL }));
    } catch (error) {
      console.error('Errore upload immagine:', error);
      toast.error('Errore durante il caricamento dell\'immagine: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.displayName.trim()) {
      toast.warning('Il nome è obbligatorio');
      return;
    }

    setSaving(true);

    try {
      const userRef = getTenantDoc(db, 'users', currentUser.uid);
      
      const dataToSave = {
        uid: currentUser.uid,
        displayName: profile.displayName.trim(),
        email: profile.email,
        photoURL: profile.photoURL || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        role: profile.role,
        visibleInChat: profile.visibleInChat,
        updatedAt: serverTimestamp(),
      };
      
      console.log('💾 Profile - Salvataggio profilo:', {
        path: userRef.path,
        data: dataToSave
      });
      
      await setDoc(userRef, dataToSave, { merge: true });

      toast.success('Profilo salvato con successo!');
      // Non navigo via, rimango nella pagina profilo
    } catch (error) {
      console.error('Errore salvataggio profilo:', error);
      toast.error('Errore durante il salvataggio del profilo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-20">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Header */}
        <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors border border-slate-700/30"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Il Mio Profilo</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Gestisci le tue informazioni personali</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Foto Profilo */}
          <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-700/30">
            <h2 className="text-sm sm:text-base font-semibold mb-4 flex items-center gap-2 text-white">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <Camera size={16} className="text-blue-400" />
              </div>
              Foto Profilo
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-800/20 border-2 border-slate-700/30 flex items-center justify-center">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-slate-500" />
                  )}
                </div>
                
                <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors border-2 border-slate-900">
                  <Camera size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs sm:text-sm text-slate-400 mb-2">
                  Questa foto verrà mostrata nelle chat e in tutta l'app
                </p>
                <p className="text-xs text-slate-500">
                  Formati supportati: JPG, PNG. Dimensione massima: 5MB
                </p>
                {uploading && (
                  <p className="text-xs text-blue-400 mt-2">Caricamento in corso...</p>
                )}
              </div>
            </div>
          </div>

          {/* Informazioni Base */}
          <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-700/30">
            <h2 className="text-sm sm:text-base font-semibold mb-4 flex items-center gap-2 text-white">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <User size={16} className="text-blue-400" />
              </div>
              Informazioni Base
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-slate-300 mb-2 font-medium">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="Es: Mario Rossi"
                  className="w-full p-3 bg-slate-900/30 border border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors text-white placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-slate-300 mb-2 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full p-3 bg-slate-900/20 border border-slate-700/20 rounded-xl text-slate-400 cursor-not-allowed text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  L'email non può essere modificata
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-slate-300 mb-2 font-medium">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Es: +39 123 456 7890"
                  className="w-full p-3 bg-slate-900/30 border border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors text-white placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-slate-300 mb-2 font-medium">
                  Ruolo
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-900/20 border border-slate-700/20 rounded-xl text-slate-400 text-sm">
                  <Briefcase size={16} className="text-slate-500" />
                  <span className="capitalize">
                    {profile.role === 'admin' ? 'Amministratore' : 
                     profile.role === 'coach' ? 'Coach' : 'Cliente'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Il ruolo è assegnato automaticamente
                </p>
              </div>

              {/* Visibilità Chat - Solo per Admin */}
              {profile.role === 'admin' && (
                <div className="p-4 bg-slate-900/30 border border-slate-700/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <MessageCircle size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Visibile in Chat</p>
                        <p className="text-xs text-slate-400">I clienti possono contattarti direttamente</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfile(prev => ({ ...prev, visibleInChat: !prev.visibleInChat }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        profile.visibleInChat ? 'bg-blue-500' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        profile.visibleInChat ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {!profile.visibleInChat && (
                    <p className="text-xs text-amber-400 mt-2">
                      ⚠️ I clienti non ti vedranno nella lista chat
                    </p>
                  )}
                </div>
              )}

              {/* Info per Coach */}
              {profile.role === 'coach' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <MessageCircle size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-400">Sempre visibile in Chat</p>
                      <p className="text-xs text-slate-400">Come coach, i tuoi clienti possono sempre contattarti</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm text-slate-300 mb-2 font-medium">
                  Bio / Descrizione
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Parlaci un po' di te..."
                  rows={4}
                  className="w-full p-3 bg-slate-900/30 border border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors resize-none text-white placeholder:text-slate-500 text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Questa descrizione sarà visibile nel tuo profilo
                </p>
              </div>
            </div>
          </div>

          {/* Account Linking - Multi-tenant */}
          <LinkAccountCard />

          {/* Pulsanti Azione */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 bg-slate-800/30 hover:bg-slate-700/50 border border-slate-700/30 rounded-xl transition-colors font-medium text-sm"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              <Save size={16} />
              {saving ? 'Salvataggio...' : 'Salva Profilo'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
