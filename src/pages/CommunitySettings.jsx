
// --- Versione avanzata completa per admin community ---
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  UsersRound, Settings, MessageCircle, Layers, Shield, Award,
  BarChart3, UserCheck, Trash2, Edit3, ChevronUp, ChevronDown,
  ToggleLeft, ToggleRight, Save, X, Plus, Search, Filter,
  Crown, Star, Zap, Heart, Eye, EyeOff, Lock, Unlock
} from "lucide-react";

const SECTIONS = [
  { key: "overview", label: "Panoramica", icon: <BarChart3 size={20} /> },
  { key: "general", label: "Generali", icon: <Settings size={20} /> },
  { key: "members", label: "Membri", icon: <UsersRound size={20} /> },
  { key: "levels", label: "Livelli", icon: <Award size={20} /> },
  { key: "content", label: "Contenuti", icon: <Layers size={20} /> },
  { key: "moderation", label: "Moderazione", icon: <Shield size={20} /> },
  { key: "chat", label: "Chat", icon: <MessageCircle size={20} /> },
];

export default function CommunitySettings() {
  const [activeSection, setActiveSection] = useState("overview");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          console.log('No user logged in');
          return setLoading(false);
        }

        // Verifica permessi superadmin
        const adminDoc = await getDoc(doc(db, "roles", "superadmins"));
        const superadminUids = adminDoc.exists() ? adminDoc.data().uids || [] : [];
        const isUserSuperAdmin = superadminUids.includes(user.uid);
        console.log('User is superadmin:', isUserSuperAdmin);
        setIsSuperAdmin(isUserSuperAdmin);

        if (!isUserSuperAdmin) {
          setLoading(false);
          return;
        }

        // Carica impostazioni community
        const settingsDoc = await getDoc(doc(db, "settings", "community"));
        const settingsData = settingsDoc.exists() ? settingsDoc.data() : {};
        console.log('Loaded community settings:', settingsData);
        setSettings(settingsData);

        // Carica membri normali
        const membersQuery = query(collection(db, 'users'), orderBy('level', 'desc'), limit(100));
        const membersSnapshot = await getDocs(membersQuery);
        let membersData = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Carica admin, superadmin e coach per aggiungerli alla lista
        const [adminsDoc, superadminsDoc, coachDoc] = await Promise.all([
          getDoc(doc(db, 'roles', 'admins')),
          getDoc(doc(db, 'roles', 'superadmins')),
          getDoc(doc(db, 'roles', 'coaches'))
        ]);

        console.log('Admins doc exists:', adminsDoc.exists(), adminsDoc.data());
        console.log('Superadmins doc exists:', superadminsDoc.exists(), superadminsDoc.data());
        console.log('Coach doc exists:', coachDoc.exists(), coachDoc.data());

        const adminUids = adminsDoc.exists() ? adminsDoc.data().uids || [] : [];
        const allSuperadminUids = superadminsDoc.exists() ? superadminsDoc.data().uids || [] : [];
        const coachUids = coachDoc.exists() ? coachDoc.data().uids || [] : [];

        console.log('Admin UIDs:', adminUids);
        console.log('Superadmin UIDs:', superadminUids);
        console.log('Coach UIDs:', coachUids);

        // Crea documenti per admin e coach se non esistono già nei membri
        const existingMemberIds = new Set(membersData.map(m => m.id));

        for (const uid of [...adminUids, ...allSuperadminUids, ...coachUids]) {
          if (!existingMemberIds.has(uid)) {
            // Cerca il profilo dell'utente in auth o in altre collezioni
            try {
              // Per ora creiamo un documento base, in futuro potremmo caricare da auth
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                membersData.push({ id: uid, ...userDoc.data(), isStaff: adminUids.includes(uid) || allSuperadminUids.includes(uid) });
              } else {
                // Se non esiste documento, creane uno base
                const isSuperAdmin = allSuperadminUids.includes(uid);
                const isAdmin = adminUids.includes(uid);
                const roleName = isSuperAdmin ? 'SuperAdmin' : (isAdmin ? 'Admin' : 'Coach');
                const level = isSuperAdmin ? 10 : (isAdmin ? 9 : 8);

                membersData.push({
                  id: uid,
                  displayName: `Staff (${roleName})`,
                  email: '',
                  level: level,
                  isStaff: true,
                  createdAt: new Date()
                });
              }
            } catch (error) {
              console.warn(`Errore caricamento profilo staff ${uid}:`, error);
            }
          }
        }

        // Aggiungi l'utente attualmente loggato come membro semplice se non è già presente
        if (!existingMemberIds.has(user.uid)) {
          console.log('Adding current user as member:', user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            membersData.push({ id: user.uid, ...userDoc.data(), isStaff: false });
          } else {
            // Crea documento base per l'utente corrente
            membersData.push({
              id: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'Utente',
              email: user.email || '',
              level: 1, // Livello base per utenti normali
              isStaff: false,
              createdAt: new Date()
            });
          }
        }

        console.log('Total members after adding staff and current user:', membersData.length);
        console.log('Members data:', membersData);

        // Se non ci sono membri, aggiungi alcuni dati di test
        if (membersData.length === 0) {
          console.log('No members found, adding test data...');
          membersData.push({
            id: 'test-admin',
            displayName: 'Test Admin',
            email: 'admin@test.com',
            level: 10,
            isStaff: true,
            createdAt: new Date()
          });
          membersData.push({
            id: 'test-coach',
            displayName: 'Test Coach',
            email: 'coach@test.com',
            level: 8,
            isStaff: true,
            createdAt: new Date()
          });
          membersData.push({
            id: 'test-user',
            displayName: 'Test User',
            email: 'user@test.com',
            level: 3,
            isStaff: false,
            createdAt: new Date()
          });
        }

        setMembers(membersData);

        // Carica post recenti
        const postsQuery = query(collection(db, 'community_posts'), orderBy('timestamp', 'desc'), limit(50));
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(postsData);

        // Calcola statistiche
        const totalMembers = membersData.length;
        const totalPosts = postsData.length;
        const activeMembers = membersData.filter(m => m.level > 1).length;
        const topLevel = Math.max(...membersData.map(m => m.level || 0));

        setStats({
          totalMembers,
          totalPosts,
          activeMembers,
          topLevel,
          avgLevel: totalMembers > 0 ? (membersData.reduce((sum, m) => sum + (m.level || 0), 0) / totalMembers).toFixed(1) : 0
        });

      } catch (error) {
        console.error('Error fetching community data:', error);
        // Fallback settings
        setSettings({
          levels: ["Newbie", "Member", "Pro", "Mentor", "Legend"],
          liveRoomAccess: {
            "Member": true,
            "Pro": true,
            "Mentor": true,
            "Legend": true
          }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Salva impostazioni
  const handleSave = async (sectionKey, data) => {
    if (!isSuperAdmin) {
      console.warn('User is not superadmin, cannot save settings');
      return;
    }

    try {
      console.log('Saving settings for section:', sectionKey, 'with data:', data);
      const newSettings = { ...settings, [sectionKey]: data };
      await setDoc(doc(db, "settings", "community"), newSettings, { merge: true });
      console.log('Settings saved successfully:', newSettings);
      setSettings(newSettings);

      // Mostra feedback di successo
      alert('✅ Impostazioni salvate con successo!');
    } catch (error) {
      console.error('Error saving community settings:', error);
      alert('❌ Errore durante il salvataggio delle impostazioni. Riprova.');
    }
  };

  // Gestione membri
  const updateMemberLevel = async (memberId, newLevel) => {
    try {
      await updateDoc(doc(db, 'users', memberId), { level: newLevel });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, level: newLevel } : m));
      alert('✅ Livello membro aggiornato!');
    } catch (error) {
      console.error('Error updating member level:', error);
      alert('❌ Errore nell\'aggiornamento del livello');
    }
  };

  const deleteMember = async (memberId, memberName) => {
    if (!confirm(`Sei sicuro di voler eliminare il membro "${memberName}" dalla community? Questa azione non può essere annullata.`)) return;

    try {
      await deleteDoc(doc(db, 'users', memberId));
      setMembers(prev => prev.filter(m => m.id !== memberId));
      alert('✅ Membro eliminato dalla community!');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('❌ Errore nell\'eliminazione del membro');
    }
  };

  // Eliminazione post
  const deletePost = async (postId) => {
    if (!confirm('Sei sicuro di voler eliminare questo post?')) return;

    try {
      await deleteDoc(doc(db, 'community_posts', postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
      alert('✅ Post eliminato!');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('❌ Errore nell\'eliminazione del post');
    }
  };

  // Toggle pin post
  const togglePinPost = async (postId, currentlyPinned) => {
    try {
      await updateDoc(doc(db, 'community_posts', postId), {
        pinned: !currentlyPinned,
        pinnedAt: currentlyPinned ? null : new Date()
      });
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        pinned: !currentlyPinned,
        pinnedAt: currentlyPinned ? null : new Date()
      } : p));
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Caricamento impostazioni community...</p>
      </div>
    </div>
  );

  if (!isSuperAdmin)
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Accesso Negato</h2>
          <p className="text-red-600">Solo i SuperAdmin possono gestire le impostazioni della Community.</p>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Sidebar moderna */}
      <aside className="w-72 bg-slate-800/90 backdrop-blur-xl border-r border-slate-700/50 shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-amber-500" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Admin Community
              </h2>
            </div>
            {/* Pulsante indietro per desktop */}
            <button
              onClick={() => window.history.back()}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
              <span className="text-sm">Indietro</span>
            </button>
          </div>
          <p className="text-sm text-slate-400">Gestisci la tua community</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {SECTIONS.map((section) => (
            <button
              key={section.key}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeSection === section.key
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                  : "hover:bg-slate-700/50 text-slate-300 hover:text-white hover:shadow-md"
              }`}
              onClick={() => setActiveSection(section.key)}
            >
              <div className={activeSection === section.key ? "text-white" : "text-blue-400"}>
                {section.icon}
              </div>
              <span className="font-medium">{section.label}</span>
            </button>
          ))}
        </nav>

        {/* Statistiche rapide nella sidebar */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Statistiche Rapide</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Membri:</span>
              <span className="font-semibold text-blue-400">{stats.totalMembers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Post:</span>
              <span className="font-semibold text-green-400">{stats.totalPosts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Livello medio:</span>
              <span className="font-semibold text-purple-400">{stats.avgLevel}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenuto principale */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Pulsante indietro mobile */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-300 hover:text-white border border-slate-700/50"
            >
              <X className="h-5 w-5" />
              <span>Indietro</span>
            </button>
          </div>
          {activeSection === "overview" && (
            <OverviewSection stats={stats} members={members} posts={posts} />
          )}
          {activeSection === "general" && (
            <GeneralSettings data={settings?.general} onSave={(data) => handleSave("general", data)} />
          )}
          {activeSection === "members" && (
            <MembersSection
              members={members}
              settings={settings}
              onUpdateLevel={updateMemberLevel}
              onDeleteMember={deleteMember}
            />
          )}
          {activeSection === "levels" && (
            <LevelsSettings data={settings?.levels} onSave={(data) => handleSave("levels", data)} />
          )}
          {activeSection === "content" && (
            <ContentSection
              posts={posts}
              onDeletePost={deletePost}
              onTogglePin={togglePinPost}
            />
          )}
          {activeSection === "moderation" && (
            <ModerationSettings data={settings?.moderation} onSave={(data) => handleSave("moderation", data)} />
          )}
          {activeSection === "chat" && <ChatSettings />}
        </div>
      </main>
    </div>
  );
}

// === COMPONENTI DELLE SEZIONI ===

// Panoramica Community
function OverviewSection({ stats, members, posts }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Panoramica Community</h1>
      </div>

      {/* Statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <UsersRound className="h-10 w-10 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
              <p className="text-sm text-gray-600">Membri Totali</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-10 w-10 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
              <p className="text-sm text-gray-600">Post Pubblicati</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <UserCheck className="h-10 w-10 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
              <p className="text-sm text-gray-600">Membri Attivi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <Award className="h-10 w-10 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgLevel}</p>
              <p className="text-sm text-gray-600">Livello Medio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Membri recenti */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Membri Recenti</h3>
        <div className="space-y-3">
          {members.slice(0, 5).map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.displayName || 'Utente'}</p>
                  <p className="text-sm text-gray-600">Livello {member.level || 1}</p>
                </div>
              </div>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Post recenti */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Post Recenti</h3>
        <div className="space-y-3">
          {posts.slice(0, 5).map(post => (
            <div key={post.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {post.authorName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{post.authorName || 'Utente'}</p>
                  <p className="text-xs text-gray-600">
                    {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : 'Data sconosciuta'}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">{post.content?.substring(0, 100)}...</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>❤️ {post.likes?.length || 0}</span>
                {post.pinned && <span className="text-amber-600">📌 Pinnato</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Impostazioni Generali
function GeneralSettings({ data, onSave }) {
  const [settings, setSettings] = useState({
    communityName: data?.communityName || "FitFlow Community",
    welcomeMessage: data?.welcomeMessage || "Benvenuto nella nostra community fitness!",
    description: data?.description || "Una community dedicata al fitness e al benessere.",
    allowRegistration: data?.allowRegistration ?? true,
    requireProfileCompletion: data?.requireProfileCompletion ?? true,
    maxPostsPerDay: data?.maxPostsPerDay || 10,
    allowAnonymousPosts: data?.allowAnonymousPosts ?? false,
    enableNotifications: data?.enableNotifications ?? true
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Impostazioni Generali</h1>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/50 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informazioni base */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Informazioni Community</h3>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome Community
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                value={settings.communityName}
                onChange={(e) => setSettings(prev => ({ ...prev, communityName: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Messaggio di Benvenuto
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                value={settings.welcomeMessage}
                onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descrizione
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Impostazioni funzionalità */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Funzionalità</h3>

            <div className="space-y-4">
              <ToggleSetting
                label="Registrazione Aperta"
                description="Permetti ai nuovi utenti di registrarsi"
                value={settings.allowRegistration}
                onChange={(value) => setSettings(prev => ({ ...prev, allowRegistration: value }))}
              />

              <ToggleSetting
                label="Profilo Obbligatorio"
                description="Richiedi completamento profilo per partecipare"
                value={settings.requireProfileCompletion}
                onChange={(value) => setSettings(prev => ({ ...prev, requireProfileCompletion: value }))}
              />

              <ToggleSetting
                label="Post Anonimi"
                description="Permetti post senza mostrare l'autore"
                value={settings.allowAnonymousPosts}
                onChange={(value) => setSettings(prev => ({ ...prev, allowAnonymousPosts: value }))}
              />

              <ToggleSetting
                label="Notifiche"
                description="Abilita notifiche push per la community"
                value={settings.enableNotifications}
                onChange={(value) => setSettings(prev => ({ ...prev, enableNotifications: value }))}
              />

              <ToggleSetting
                label="Mostra Admin in Community"
                description="Gli amministratori appaiono nella lista membri community"
                value={settings.showAdminsInCommunity ?? true}
                onChange={(value) => setSettings(prev => ({ ...prev, showAdminsInCommunity: value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Post Massimi per Giorno
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                value={settings.maxPostsPerDay}
                onChange={(e) => setSettings(prev => ({ ...prev, maxPostsPerDay: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            Salva Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Toggle riutilizzabile
function ToggleSetting({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// Gestione Membri
function MembersSection({ members, settings, onUpdateLevel, onDeleteMember }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === "all" || member.level === parseInt(selectedLevel);
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level) => {
    if (level >= 10) return "from-purple-500 to-pink-500";
    if (level >= 7) return "from-blue-500 to-purple-500";
    if (level >= 5) return "from-green-500 to-blue-500";
    if (level >= 3) return "from-yellow-500 to-orange-500";
    return "from-gray-500 to-gray-600";
  };

  const getLevelName = (level) => {
    const levels = settings?.levels || ["Newbie", "Member", "Pro", "Mentor", "Legend"];
    return levels[level - 1] || `Livello ${level}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <UsersRound className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Gestione Membri</h1>
      </div>

      {/* Filtri e ricerca */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-slate-700/50">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Cerca membri..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="all">Tutti i livelli</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <option key={level} value={level}>Livello {level}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista membri */}
        <div className="space-y-4">
          {filteredMembers.map(member => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-600/30 transition-colors border border-slate-600/30">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${getLevelColor(member.level || 1)} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                  {member.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{member.displayName || 'Utente'}</h3>
                  <p className="text-sm text-slate-400">{member.email}</p>
                  <p className="text-xs text-slate-500">
                    Iscritto il {member.createdAt?.toDate ? member.createdAt.toDate().toLocaleDateString() : 'Data sconosciuta'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getLevelColor(member.level || 1)}`}>
                  <Award className="h-4 w-4" />
                  {getLevelName(member.level || 1)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Livello {member.level || 1}</p>
              </div>                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateLevel(member.id, Math.max(1, (member.level || 1) - 1))}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    disabled={(member.level || 1) <= 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onUpdateLevel(member.id, Math.min(10, (member.level || 1) + 1))}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    disabled={(member.level || 1) >= 10}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onDeleteMember(member.id, member.displayName || 'Utente')}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="Elimina membro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <UsersRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessun membro trovato con i filtri selezionati.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LevelsSettings({ data, onSave }) {
  const defaultLevels = ["Newbie", "Member", "Pro", "Mentor", "Legend"];
  const defaultPermissions = {
    "Member": { liveRoom: true, privateChat: false, moderator: false },
    "Pro": { liveRoom: true, privateChat: true, moderator: false },
    "Mentor": { liveRoom: true, privateChat: true, moderator: true },
    "Legend": { liveRoom: true, privateChat: true, moderator: true }
  };

  const [levels, setLevels] = useState(data?.levels || defaultLevels);
  const [permissions, setPermissions] = useState(data?.permissions || defaultPermissions);
  const [levelRequirements, setLevelRequirements] = useState(data?.levelRequirements || {
    posts: [0, 5, 15, 30, 50],
    likes: [0, 10, 25, 50, 100],
    streak: [0, 7, 14, 30, 60]
  });

  React.useEffect(() => {
    if (data?.levels) setLevels(data.levels);
    if (data?.permissions) setPermissions(data.permissions);
    if (data?.levelRequirements) setLevelRequirements(data.levelRequirements);
  }, [data]);

  const handleLevelChange = (index, newLevel) => {
    const oldLevel = levels[index];
    const newLevels = [...levels];
    newLevels[index] = newLevel;
    setLevels(newLevels);

    // Aggiorna permessi se il nome è cambiato
    if (oldLevel !== newLevel && permissions[oldLevel]) {
      const newPerms = { ...permissions };
      newPerms[newLevel] = newPerms[oldLevel];
      delete newPerms[oldLevel];
      setPermissions(newPerms);
    }
  };

  const updatePermission = (level, permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [level]: { ...prev[level], [permission]: value }
    }));
  };

  const getLevelIcon = (index) => {
    const icons = [<Star />, <Award />, <Zap />, <Crown />, <Heart />];
    return icons[index] || <Star />;
  };

  const getLevelColor = (index) => {
    const colors = [
      "from-gray-400 to-gray-600",
      "from-blue-400 to-blue-600",
      "from-green-400 to-green-600",
      "from-purple-400 to-purple-600",
      "from-amber-400 to-amber-600"
    ];
    return colors[index] || "from-gray-400 to-gray-600";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Award className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Configurazione Livelli</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Livelli e Permessi</h3>
          <p className="text-slate-400 mb-6">
            Configura i livelli della community e i permessi associati. Ogni livello sblocca nuove funzionalità come ricompensa per l'engagement.
          </p>

          <div className="space-y-4">
            {levels.map((level, index) => (
              <div key={level} className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getLevelColor(index)} rounded-full flex items-center justify-center text-white`}>
                    {getLevelIcon(index)}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      value={level}
                      onChange={(e) => handleLevelChange(index, e.target.value)}
                    />
                    <p className="text-sm text-gray-600">Livello {index + 1}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ToggleSetting
                    label="🎥 Accesso Live Room"
                    description="Partecipazione alle videochiamate"
                    value={permissions[level]?.liveRoom ?? false}
                    onChange={(value) => updatePermission(level, 'liveRoom', value)}
                  />

                  <ToggleSetting
                    label="💬 Chat Privata"
                    description="Invio messaggi privati"
                    value={permissions[level]?.privateChat ?? false}
                    onChange={(value) => updatePermission(level, 'privateChat', value)}
                  />

                  <ToggleSetting
                    label="🛡️ Moderatore"
                    description="Poter moderare contenuti"
                    value={permissions[level]?.moderator ?? false}
                    onChange={(value) => updatePermission(level, 'moderator', value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                const newLevelName = `Livello ${levels.length + 1}`;
                setLevels([...levels, newLevelName]);
                setPermissions(prev => ({
                  ...prev,
                  [newLevelName]: { liveRoom: false, privateChat: false, moderator: false }
                }));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Aggiungi Livello
            </button>

            {levels.length > 1 && (
              <button
                onClick={() => {
                  const newLevels = levels.slice(0, -1);
                  const removedLevel = levels[levels.length - 1];
                  setLevels(newLevels);
                  setPermissions(prev => {
                    const newPerms = { ...prev };
                    delete newPerms[removedLevel];
                    return newPerms;
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Rimuovi Ultimo
              </button>
            )}
          </div>
        </div>

        {/* Requisiti per salire di livello */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Requisiti per Salire di Livello</h3>
          <p className="text-gray-600 mb-6">
            Imposta quanti post, like e giorni di streak servono per raggiungere ogni livello.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Livello</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Post Minimi</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Like Ricevuti</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Giorni Streak</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level, index) => (
                  <tr key={level} className="border-t border-gray-200">
                    <td className="px-4 py-3 font-medium text-gray-900">{level}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={levelRequirements.posts[index] || 0}
                        onChange={(e) => {
                          const newReqs = { ...levelRequirements };
                          newReqs.posts[index] = parseInt(e.target.value) || 0;
                          setLevelRequirements(newReqs);
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={levelRequirements.likes[index] || 0}
                        onChange={(e) => {
                          const newReqs = { ...levelRequirements };
                          newReqs.likes[index] = parseInt(e.target.value) || 0;
                          setLevelRequirements(newReqs);
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={levelRequirements.streak[index] || 0}
                        onChange={(e) => {
                          const newReqs = { ...levelRequirements };
                          newReqs.streak[index] = parseInt(e.target.value) || 0;
                          setLevelRequirements(newReqs);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => onSave({ levels, permissions, levelRequirements })}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            Salva Configurazione Livelli
          </button>
        </div>
      </div>
    </div>
  );
}// Gestione Contenuti
function ContentSection({ posts, onDeletePost, onTogglePin }) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === "all" ||
                         (filter === "pinned" && post.pinned) ||
                         (filter === "reported" && post.reported);
    const matchesSearch = post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.authorName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Layers className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Gestione Contenuti</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        {/* Filtri */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Cerca contenuti..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tutti i post</option>
              <option value="pinned">Solo pinnati</option>
              <option value="reported">Segnalati</option>
            </select>
          </div>
        </div>

        {/* Lista post */}
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.authorName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{post.authorName || 'Utente'}</h3>
                    <p className="text-sm text-gray-600">
                      {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleString() : 'Data sconosciuta'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {post.pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                      📌 Pinnato
                    </span>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={() => onTogglePin(post.id, post.pinned)}
                      className={`p-2 rounded-lg transition-colors ${
                        post.pinned
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={post.pinned ? 'Rimuovi pin' : 'Pinna post'}
                    >
                      {post.pinned ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Elimina post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-800">{post.content}</p>
                {post.media && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      📎 Media allegato
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>❤️ {post.likes?.length || 0} like</span>
                  {post.comments && <span>💬 {post.comments} commenti</span>}
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                    Vedi dettagli
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessun contenuto trovato con i filtri selezionati.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Impostazioni Moderazione
function ModerationSettings({ data, onSave }) {
  const [settings, setSettings] = useState({
    autoModeration: data?.autoModeration ?? true,
    blockBadWords: data?.blockBadWords ?? true,
    requireApproval: data?.requireApproval ?? false,
    maxReports: data?.maxReports ?? 3,
    autoBan: data?.autoBan ?? false,
    banThreshold: data?.banThreshold ?? 5,
    allowGuestPosts: data?.allowGuestPosts ?? false,
    moderateLinks: data?.moderateLinks ?? true,
    moderateImages: data?.moderateImages ?? false,
    notifyAdmins: data?.notifyAdmins ?? true
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Impostazioni Moderazione</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Moderazione automatica */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Moderazione Automatica</h3>

            <ToggleSetting
              label="Auto-moderazione"
              description="Rileva automaticamente contenuti inappropriati"
              value={settings.autoModeration}
              onChange={(value) => setSettings(prev => ({ ...prev, autoModeration: value }))}
            />

            <ToggleSetting
              label="Blocca parolacce"
              description="Filtra automaticamente le parolacce nei post"
              value={settings.blockBadWords}
              onChange={(value) => setSettings(prev => ({ ...prev, blockBadWords: value }))}
            />

            <ToggleSetting
              label="Approvazione richiesta"
              description="I nuovi post devono essere approvati prima di essere pubblicati"
              value={settings.requireApproval}
              onChange={(value) => setSettings(prev => ({ ...prev, requireApproval: value }))}
            />

            <ToggleSetting
              label="Moderazione link"
              description="Controlla i link esterni nei post"
              value={settings.moderateLinks}
              onChange={(value) => setSettings(prev => ({ ...prev, moderateLinks: value }))}
            />

            <ToggleSetting
              label="Moderazione immagini"
              description="Controlla le immagini caricate"
              value={settings.moderateImages}
              onChange={(value) => setSettings(prev => ({ ...prev, moderateImages: value }))}
            />
          </div>

          {/* Gestione segnalazioni */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Gestione Segnalazioni</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segnalazioni per blocco automatico
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.maxReports}
                onChange={(e) => setSettings(prev => ({ ...prev, maxReports: parseInt(e.target.value) }))}
              />
              <p className="text-xs text-gray-500 mt-1">Numero di segnalazioni per nascondere automaticamente un post</p>
            </div>

            <ToggleSetting
              label="Ban automatico"
              description="Banna utenti che superano la soglia di segnalazioni"
              value={settings.autoBan}
              onChange={(value) => setSettings(prev => ({ ...prev, autoBan: value }))}
            />

            {settings.autoBan && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soglia ban
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.banThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, banThreshold: parseInt(e.target.value) }))}
                />
                <p className="text-xs text-gray-500 mt-1">Segnalazioni totali per bannare un utente</p>
              </div>
            )}

            <ToggleSetting
              label="Notifiche admin"
              description="Invia notifiche agli admin per nuove segnalazioni"
              value={settings.notifyAdmins}
              onChange={(value) => setSettings(prev => ({ ...prev, notifyAdmins: value }))}
            />

            <ToggleSetting
              label="Post ospiti"
              description="Permetti post anonimi da utenti non registrati"
              value={settings.allowGuestPosts}
              onChange={(value) => setSettings(prev => ({ ...prev, allowGuestPosts: value }))}
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Raccomandazioni di sicurezza</h4>
                <ul className="text-sm text-blue-800 mt-1 space-y-1">
                  <li>• Mantieni l'auto-moderazione attiva per filtrare contenuti inappropriati</li>
                  <li>• Imposta una soglia ragionevole per le segnalazioni (3-5)</li>
                  <li>• Abilita le notifiche per essere informato tempestivamente</li>
                  <li>• Usa il ban automatico con cautela per evitare falsi positivi</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            Salva Impostazioni Moderazione
          </button>
        </div>
      </div>
    </div>
  );
}

// Impostazioni Chat (placeholder per future implementazioni)
function ChatSettings() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Impostazioni Chat</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Community Avanzata</h3>
          <p className="text-gray-600 mb-6">
            Sistema di chat moderno con avatar, messaggi in tempo reale, stanze private e moderazione integrata.
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              🚀 <strong>Prossimamente:</strong> Implementazione completa del sistema chat con tutte le funzionalità moderne che ti aspetti da una community platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
