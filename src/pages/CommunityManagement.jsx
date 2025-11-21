import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import {
  Users,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Crown,
  Shield,
  UserCheck
} from 'lucide-react';

export default function CommunityManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  // Carica membri community
  useEffect(() => {
    const membersQuery = query(
      collection(db, 'users'),
      orderBy('joinedAt', 'desc')
    );

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Reset tutti i membri
  const resetAllMembers = async () => {
    setResetting(true);
    setResetResult(null);

    try {
      const batch = writeBatch(db);
      const membersSnapshot = await getDocs(collection(db, 'users'));

      membersSnapshot.docs.forEach((document) => {
        batch.delete(doc(db, 'users', document.id));
      });

      await batch.commit();

      // Reset anche presenza online e typing indicators
      const presenceSnapshot = await getDocs(collection(db, 'presence'));
      const typingSnapshot = await getDocs(collection(db, 'typing'));

      const cleanupBatch = writeBatch(db);
      presenceSnapshot.docs.forEach((document) => {
        cleanupBatch.delete(doc(db, 'presence', document.id));
      });
      typingSnapshot.docs.forEach((document) => {
        cleanupBatch.delete(doc(db, 'typing', document.id));
      });

      if (presenceSnapshot.docs.length > 0 || typingSnapshot.docs.length > 0) {
        await cleanupBatch.commit();
      }

      setResetResult({
        success: true,
        message: `Reset completato! Eliminati ${membersSnapshot.docs.length} membri.`
      });
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Errore reset membri:', error);
      setResetResult({
        success: false,
        message: 'Errore durante il reset dei membri.'
      });
    } finally {
      setResetting(false);
    }
  };

  // Elimina singolo membro
  const deleteMember = async (memberId) => {
    if (!confirm('Sei sicuro di voler eliminare questo membro?')) return;

    try {
      await deleteDoc(doc(db, 'users', memberId));
      setResetResult({
        success: true,
        message: 'Membro eliminato con successo.'
      });
    } catch (error) {
      console.error('Errore eliminazione membro:', error);
      setResetResult({
        success: false,
        message: 'Errore durante l\'eliminazione del membro.'
      });
    }
  };

  // Ottieni icona ruolo
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'coach':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  // Ottieni colore livello
  const getLevelColor = (level) => {
    if (level >= 10) return "from-purple-500 to-pink-500";
    if (level >= 7) return "from-blue-500 to-purple-500";
    if (level >= 5) return "from-green-500 to-blue-500";
    if (level >= 3) return "from-yellow-500 to-orange-500";
    return "from-gray-500 to-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Caricamento membri...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Gestione Community
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Gestisci i membri della community • {members.length} membri totali
                </p>
              </div>
            </div>

            {/* Pulsante Reset */}
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={resetting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
              Reset Tutti i Membri
            </button>
          </div>
        </div>

        {/* Risultato operazioni */}
        {resetResult && (
          <div className={`p-4 rounded-lg border ${
            resetResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {resetResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{resetResult.message}</span>
            </div>
          </div>
        )}

        {/* Lista Membri */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Membri della Community
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {members.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nessun membro nella community</p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 bg-gradient-to-r ${getLevelColor(member.level || 1)} rounded-full flex items-center justify-center overflow-hidden`}>
                      {member.photoURL ? (
                        <img
                          src={member.photoURL}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>

                    {/* Info membro */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {member.name}
                        </h3>
                        {getRoleIcon(member.role)}
                        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400">
                          Lv. {member.level || 1}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Iscritto il {member.joinedAt?.toDate?.()?.toLocaleDateString('it-IT') || 'Data sconosciuta'}
                      </p>
                    </div>
                  </div>

                  {/* Azioni */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteMember(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Elimina membro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Conferma Reset */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Reset Community
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Questa azione eliminerà tutti i profili dei membri della community. Questa operazione non può essere annullata.
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Verranno eliminati {members.length} membri
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={resetAllMembers}
                  disabled={resetting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {resetting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Reset in corso...
                    </>
                  ) : (
                    'Conferma Reset'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}