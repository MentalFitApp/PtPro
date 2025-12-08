import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { uploadToR2 } from '../../cloudflareStorage';
import { User, Camera, Mail, Phone, Briefcase, Save, ArrowLeft, Upload } from 'lucide-react';
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
    <div className="min-h-screen text-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-800/60 rounded-lg transition-colors border border-slate-700/50"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Il Mio Profilo</h1>
              <p className="text-sm text-slate-400 mt-1">Gestisci le tue informazioni personali</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Foto Profilo */}
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-white">
              <Camera size={20} className="text-blue-400" />
              Foto Profilo
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-800/60 border-2 border-slate-700/50 flex items-center justify-center">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-500" />
                  )}
                </div>
                
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors border-2 border-slate-900">
                  <Camera size={16} />
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
                <p className="text-sm text-slate-400 mb-2">
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
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-white">
              <User size={20} className="text-blue-400" />
              Informazioni Base
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="Es: Mario Rossi"
                  className="w-full p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full p-3 bg-slate-800/20 border border-slate-700/30 rounded-lg text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">
                  L'email non può essere modificata
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Es: +39 123 456 7890"
                  className="w-full p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">
                  Ruolo
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-800/20 border border-slate-700/30 rounded-lg text-slate-400">
                  <Briefcase size={18} className="text-slate-500" />
                  <span className="capitalize">
                    {profile.role === 'admin' ? 'Amministratore' : 
                     profile.role === 'coach' ? 'Coach' : 'Cliente'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Il ruolo è assegnato automaticamente
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">
                  Bio / Descrizione
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Parlaci un po' di te..."
                  rows={4}
                  className="w-full p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none text-white placeholder:text-slate-500"
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
              className="flex-1 py-3 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 rounded-lg transition-colors font-medium"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save size={18} />
              {saving ? 'Salvataggio...' : 'Salva Profilo'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
