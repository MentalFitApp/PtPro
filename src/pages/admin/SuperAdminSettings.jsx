import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';;
import { isSuperAdmin, addSuperAdmin, removeSuperAdmin } from '../../utils/superadmin';
import { Settings, Users, Shield, Lock, Trash2, UserPlus, UserMinus, RefreshCw, AlertTriangle, Check, X, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuperAdminSettings() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [superadmins, setSuperadmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, user: null });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    const isSuperAdminUser = await isSuperAdmin(user.uid);
    if (!isSuperAdminUser) {
      navigate('/dashboard');
      return;
    }

    setAuthorized(true);
    loadAllUsers();
  };

  const loadAllUsers = async () => {
    try {
      // Carica ruoli
      const rolesSnapshot = await getDocs(getTenantCollection(db, 'roles'));
      const rolesData = {};
      rolesSnapshot.docs.forEach(doc => {
        rolesData[doc.id] = doc.data().uids || [];
      });

      setAdmins(rolesData.admins || []);
      setCoaches(rolesData.coaches || []);
      setSuperadmins(rolesData.superadmins || []);

      // Carica tutti i clienti
      const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
      const clientsList = clientsSnap.docs.map(d => ({
        id: d.id,
        email: d.data().email || 'N/D',
        name: d.data().name || 'Senza nome',
        role: 'client',
        ...d.data()
      }));

      // Carica collaboratori
      const collabSnap = await getDocs(getTenantCollection(db, 'collaboratori'));
      const collabList = collabSnap.docs.map(d => ({
        id: d.id,
        email: d.data().email || 'N/D',
        name: d.data().nome || d.data().name || 'Senza nome',
        role: d.data().role?.toLowerCase() || 'collaboratore',
        ...d.data()
      }));

      // Unisci tutto e determina ruolo effettivo
      const allUsers = [...clientsList, ...collabList].map(user => {
        let effectiveRole = user.role;
        if (rolesData.superadmins?.includes(user.id)) effectiveRole = 'superadmin';
        else if (rolesData.admins?.includes(user.id)) effectiveRole = 'admin';
        else if (rolesData.coaches?.includes(user.id)) effectiveRole = 'coach';

        return { ...user, effectiveRole };
      });

      setUsers(allUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Errore caricamento utenti', 'error');
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const handlePromoteToSuperAdmin = async (userId) => {
    try {
      const result = await addSuperAdmin(auth.currentUser.uid, userId);
      if (result.success) {
        showNotification('Utente promosso a SuperAdmin', 'success');
        loadAllUsers();
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      showNotification('Errore promozione: ' + error.message, 'error');
    }
  };

  const handleDemoteFromSuperAdmin = async (userId) => {
    if (userId === auth.currentUser.uid) {
      showNotification('Non puoi rimuovere te stesso come SuperAdmin', 'error');
      return;
    }

    try {
      const result = await removeSuperAdmin(auth.currentUser.uid, userId);
      if (result.success) {
        showNotification('SuperAdmin rimosso', 'success');
        loadAllUsers();
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      showNotification('Errore rimozione: ' + error.message, 'error');
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    try {
      const adminRef = getTenantDoc(db, 'roles', 'admins');
      await setDoc(adminRef, {
        uids: arrayUnion(userId),
        updatedAt: new Date(),
        updatedBy: auth.currentUser.uid
      }, { merge: true });

      showNotification('Utente promosso ad Admin', 'success');
      loadAllUsers();
    } catch (error) {
      showNotification('Errore promozione admin: ' + error.message, 'error');
    }
  };

  const handleDemoteFromAdmin = async (userId) => {
    try {
      const adminRef = getTenantDoc(db, 'roles', 'admins');
      await updateDoc(adminRef, {
        uids: arrayRemove(userId),
        updatedAt: new Date(),
        updatedBy: auth.currentUser.uid
      });

      showNotification('Admin retrocesso', 'success');
      loadAllUsers();
    } catch (error) {
      showNotification('Errore rimozione admin: ' + error.message, 'error');
    }
  };

  const handlePromoteToCoach = async (userId) => {
    try {
      const coachRef = getTenantDoc(db, 'roles', 'coaches');
      await setDoc(coachRef, {
        uids: arrayUnion(userId),
        updatedAt: new Date(),
        updatedBy: auth.currentUser.uid
      }, { merge: true });

      showNotification('Utente promosso a Coach', 'success');
      loadAllUsers();
    } catch (error) {
      showNotification('Errore promozione coach: ' + error.message, 'error');
    }
  };

  const handleDemoteFromCoach = async (userId) => {
    try {
      const coachRef = getTenantDoc(db, 'roles', 'coaches');
      await updateDoc(coachRef, {
        uids: arrayRemove(userId),
        updatedAt: new Date(),
        updatedBy: auth.currentUser.uid
      });

      showNotification('Coach retrocesso', 'success');
      loadAllUsers();
    } catch (error) {
      showNotification('Errore rimozione coach: ' + error.message, 'error');
    }
  };

  const handleRevokeAccess = async (userId) => {
    setConfirmModal({
      show: true,
      action: 'revoke',
      user: users.find(u => u.id === userId),
      onConfirm: async () => {
        try {
          // Rimuovi da tutti i ruoli
          await Promise.all([
            removeSuperAdmin(auth.currentUser.uid, userId).catch(() => {}),
            handleDemoteFromAdmin(userId).catch(() => {}),
            handleDemoteFromCoach(userId).catch(() => {})
          ]);

          // Disabilita account (nota: serve Admin SDK per disabilitare Auth)
          // Per ora: solo rimuovi ruoli, l'utente rimane ma senza permessi
          
          showNotification('Accesso revocato (tutti i ruoli rimossi)', 'success');
          setConfirmModal({ show: false, action: null, user: null });
          loadAllUsers();
        } catch (error) {
          showNotification('Errore revoca accesso: ' + error.message, 'error');
        }
      }
    });
  };

  const handleDeleteUser = async (userId) => {
    setConfirmModal({
      show: true,
      action: 'delete',
      user: users.find(u => u.id === userId),
      onConfirm: async () => {
        try {
          // Elimina documento cliente o collaboratore
          const clientRef = getTenantDoc(db, 'clients', userId);
          const collabRef = getTenantDoc(db, 'collaboratori', userId);
          
          await Promise.all([
            deleteDoc(clientRef).catch(() => {}),
            deleteDoc(collabRef).catch(() => {}),
            // Rimuovi da ruoli
            removeSuperAdmin(auth.currentUser.uid, userId).catch(() => {}),
            handleDemoteFromAdmin(userId).catch(() => {}),
            handleDemoteFromCoach(userId).catch(() => {})
          ]);

          showNotification('Utente eliminato (nota: account Auth rimane attivo)', 'success');
          setConfirmModal({ show: false, action: null, user: null });
          loadAllUsers();
        } catch (error) {
          showNotification('Errore eliminazione: ' + error.message, 'error');
        }
      }
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.effectiveRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Accesso Negato</h2>
          <p className="text-slate-400">Solo i SuperAdmin possono accedere alle impostazioni.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const RoleBadge = ({ role }) => {
    const styles = {
      superadmin: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      coach: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      client: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      setter: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      collaboratore: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    };

    const icons = {
      superadmin: Crown,
      admin: Shield,
      coach: Users,
      client: Users,
      setter: UserPlus,
      collaboratore: Users
    };

    const Icon = icons[role] || Users;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles[role] || styles.client}`}>
        <Icon size={12} />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="text-cyan-400" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-white">Impostazioni SuperAdmin</h1>
              <p className="text-slate-400">Gestione completa piattaforma e utenti</p>
            </div>
          </div>
          <button
            onClick={() => loadAllUsers()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Ricarica
          </button>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-5 right-5 z-50 flex items-center gap-3 p-4 rounded-lg border backdrop-blur-md shadow-lg ${
                notification.type === 'success'
                  ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
                  : 'bg-red-900/80 text-red-300 border-red-500/30'
              }`}
            >
              {notification.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
              <p>{notification.message}</p>
              <button onClick={() => setNotification({ ...notification, show: false })} className="ml-2">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm Modal */}
        <AnimatePresence>
          {confirmModal.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={() => setConfirmModal({ show: false, action: null, user: null })}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-rose-400" size={24} />
                  <h3 className="text-xl font-bold text-white">
                    {confirmModal.action === 'delete' ? 'Elimina Utente' : 'Revoca Accesso'}
                  </h3>
                </div>
                <p className="text-slate-300 mb-6">
                  {confirmModal.action === 'delete'
                    ? `Sei sicuro di voler eliminare "${confirmModal.user?.name}"? Questa azione rimuoverà tutti i dati ma non l'account Firebase Auth (serve Admin SDK).`
                    : `Sei sicuro di voler revocare tutti gli accessi a "${confirmModal.user?.name}"? L'utente perderà tutti i ruoli.`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal({ show: false, action: null, user: null })}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                  >
                    Conferma
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={16} className="text-rose-400" />
              <span className="text-sm text-slate-400">SuperAdmins</span>
            </div>
            <p className="text-2xl font-bold text-white">{superadmins.length}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-purple-400" />
              <span className="text-sm text-slate-400">Admins</span>
            </div>
            <p className="text-2xl font-bold text-white">{admins.length}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-cyan-400" />
              <span className="text-sm text-slate-400">Coaches</span>
            </div>
            <p className="text-2xl font-bold text-white">{coaches.length}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-slate-400" />
              <span className="text-sm text-slate-400">Totale Utenti</span>
            </div>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>
        </div>

        {/* Search (sticky on mobile) */}
        <div className="mb-6 sticky top-2 z-20">
          <div className="bg-slate-900/70 backdrop-blur rounded-xl border border-slate-700 p-2">
            <input
              type="text"
              placeholder="Cerca per nome, email o ruolo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Users Table (desktop) */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Utente</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Ruolo</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{user.name}</p>
                      {user.id === auth.currentUser.uid && (
                        <span className="text-xs text-cyan-400">(Tu)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.effectiveRole} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Promote to SuperAdmin */}
                        {user.effectiveRole !== 'superadmin' && (
                          <button
                            onClick={() => handlePromoteToSuperAdmin(user.id)}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Promuovi a SuperAdmin"
                          >
                            <Crown size={16} />
                          </button>
                        )}

                        {/* Demote from SuperAdmin */}
                        {user.effectiveRole === 'superadmin' && user.id !== auth.currentUser.uid && (
                          <button
                            onClick={() => handleDemoteFromSuperAdmin(user.id)}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Rimuovi SuperAdmin"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}

                        {/* Promote to Admin */}
                        {!['superadmin', 'admin'].includes(user.effectiveRole) && (
                          <button
                            onClick={() => handlePromoteToAdmin(user.id)}
                            className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Promuovi ad Admin"
                          >
                            <Shield size={16} />
                          </button>
                        )}

                        {/* Demote from Admin */}
                        {user.effectiveRole === 'admin' && (
                          <button
                            onClick={() => handleDemoteFromAdmin(user.id)}
                            className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Retrocedi Admin"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}

                        {/* Promote to Coach */}
                        {!['superadmin', 'admin', 'coach'].includes(user.effectiveRole) && (
                          <button
                            onClick={() => handlePromoteToCoach(user.id)}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Promuovi a Coach"
                          >
                            <UserPlus size={16} />
                          </button>
                        )}

                        {/* Demote from Coach */}
                        {user.effectiveRole === 'coach' && (
                          <button
                            onClick={() => handleDemoteFromCoach(user.id)}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Retrocedi Coach"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}

                        {/* Revoke All Access */}
                        {user.id !== auth.currentUser.uid && (
                          <button
                            onClick={() => handleRevokeAccess(user.id)}
                            className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Revoca Tutti gli Accessi"
                          >
                            <Lock size={16} />
                          </button>
                        )}

                        {/* Delete User */}
                        {user.id !== auth.currentUser.uid && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Elimina Utente"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nessun utente trovato</p>
            </div>
          )}
        </div>

        {/* Mobile Card List */}
        <div className="space-y-3 sm:hidden">
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-slate-800/60 rounded-2xl border border-slate-700">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nessun utente trovato</p>
            </div>
          )}
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-slate-800/70 backdrop-blur rounded-xl border border-slate-700 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white text-sm leading-tight">
                    {user.name} {user.id === auth.currentUser.uid && <span className="text-cyan-400 text-xs">(Tu)</span>}
                  </p>
                  <p className="text-xs text-slate-400 break-all">{user.email}</p>
                  <div className="mt-2"><RoleBadge role={user.effectiveRole} /></div>
                </div>
                {user.effectiveRole !== 'superadmin' && (
                  <button
                    onClick={() => handlePromoteToSuperAdmin(user.id)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:scale-95"
                    title="Promuovi SuperAdmin"
                  >
                    <Crown size={18} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!['superadmin','admin'].includes(user.effectiveRole) && (
                  <button
                    onClick={() => handlePromoteToAdmin(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-300 text-xs font-medium active:scale-95"
                  >
                    <Shield size={14} /> Admin
                  </button>
                )}
                {user.effectiveRole === 'admin' && (
                  <button
                    onClick={() => handleDemoteFromAdmin(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-300 text-xs font-medium active:scale-95"
                  >
                    <UserMinus size={14} /> -Admin
                  </button>
                )}
                {!['superadmin','admin','coach'].includes(user.effectiveRole) && (
                  <button
                    onClick={() => handlePromoteToCoach(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 text-xs font-medium active:scale-95"
                  >
                    <UserPlus size={14} /> Coach
                  </button>
                )}
                {user.effectiveRole === 'coach' && (
                  <button
                    onClick={() => handleDemoteFromCoach(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 text-xs font-medium active:scale-95"
                  >
                    <UserMinus size={14} /> -Coach
                  </button>
                )}
                {user.id !== auth.currentUser.uid && (
                  <button
                    onClick={() => handleRevokeAccess(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-medium active:scale-95"
                  >
                    <Lock size={14} /> Revoca
                  </button>
                )}
                {user.id !== auth.currentUser.uid && (
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 text-xs font-medium active:scale-95"
                  >
                    <Trash2 size={14} /> Elimina
                  </button>
                )}
                {user.effectiveRole === 'superadmin' && user.id !== auth.currentUser.uid && (
                  <button
                    onClick={() => handleDemoteFromSuperAdmin(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 text-xs font-medium active:scale-95"
                  >
                    <UserMinus size={14} /> -Super
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
