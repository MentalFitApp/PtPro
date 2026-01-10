// src/components/chat/components/NewChatModal.jsx
// Modal per creare una nuova conversazione

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users, Shield, UserCog, User } from 'lucide-react';
import clsx from 'clsx';
import { auth, db } from '../../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getTenantId } from '../../../hooks/useChat';
import { formatRole, RoleIcon } from '../utils/chatHelpers';

const cn = (...classes) => clsx(...classes);

const NewChatModal = ({ isOpen, onClose, onCreate, currentUserRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [actualUserRole, setActualUserRole] = useState(currentUserRole || 'client');

  useEffect(() => {
    if (!isOpen) return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const tenantId = getTenantId();
        const currentUserId = auth.currentUser?.uid;
        const userList = [];
        
        // Determina il ruolo dell'utente corrente se non passato
        let userRole = currentUserRole;
        if (!userRole || userRole === 'client') {
          // Verifica il ruolo direttamente
          const adminDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/admins`));
          const coachDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/coaches`));
          const adminUidsCheck = adminDoc.exists() ? adminDoc.data().uids || [] : [];
          const coachUidsCheck = coachDoc.exists() ? coachDoc.data().uids || [] : [];
          
          if (adminUidsCheck.includes(currentUserId)) {
            userRole = 'admin';
          } else if (coachUidsCheck.includes(currentUserId)) {
            userRole = 'coach';
          } else {
            userRole = 'client';
          }
          setActualUserRole(userRole);
        }
        
        // Carica Admin e Coach (sempre visibili per tutti)
        const adminDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/admins`));
        const coachDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/coaches`));
        
        const adminUids = adminDoc.exists() ? adminDoc.data().uids || [] : [];
        const coachUids = coachDoc.exists() ? coachDoc.data().uids || [] : [];
        
        // Carica info utenti admin/coach
        const usersRef = collection(db, `tenants/${tenantId}/users`);
        const usersSnapshot = await getDocs(usersRef);
        const usersMap = {};
        usersSnapshot.forEach(doc => {
          usersMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Aggiungi admin
        for (const uid of adminUids) {
          if (uid !== currentUserId) {
            const userData = usersMap[uid];
            if (userData?.visibleInChat !== false) {
              userList.push({
                id: uid,
                odiaUserId: uid,
                name: userData?.displayName || userData?.name || 'Admin',
                email: userData?.email,
                photo: userData?.photoURL || userData?.photo,
                role: 'admin'
              });
            }
          }
        }
        
        // Aggiungi coach
        for (const uid of coachUids) {
          if (uid !== currentUserId && !adminUids.includes(uid)) {
            const userData = usersMap[uid];
            if (userData?.visibleInChat !== false) {
              userList.push({
                id: uid,
                odiaUserId: uid,
                name: userData?.displayName || userData?.name || 'Coach',
                email: userData?.email,
                photo: userData?.photoURL || userData?.photo,
                role: 'coach'
              });
            }
          }
        }
        
        // Se admin o coach, carica anche i clienti
        if (userRole === 'admin' || userRole === 'coach') {
          const clientsRef = collection(db, `tenants/${tenantId}/clients`);
          const clientsSnapshot = await getDocs(clientsRef);
          
          clientsSnapshot.forEach(clientDoc => {
            const data = clientDoc.data();
            const clientUserId = clientDoc.id; // L'ID del documento È l'userId
            
            // Salta se è l'utente corrente o se è già stato aggiunto come admin/coach
            if (clientUserId !== currentUserId && 
                !adminUids.includes(clientUserId) && 
                !coachUids.includes(clientUserId)) {
              // Cerca la foto anche nella collection users come fallback
              const userDataFromUsers = usersMap[clientUserId];
              const photoFromUsers = userDataFromUsers?.photoURL || userDataFromUsers?.photo;
              const photoFromClients = data.photoURL || data.photo;
              
              userList.push({
                id: clientDoc.id,
                odiaUserId: clientUserId,
                name: data.name || data.displayName || 'Cliente',
                email: data.email,
                photo: photoFromClients || photoFromUsers, // Prima cerca in clients, poi in users
                role: 'client'
              });
            }
          });
        }
        
        setUsers(userList);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isOpen, currentUserRole]);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Filtra per tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(u => u.role === activeTab);
    }
    
    // Filtra per ricerca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(term) || 
        u.email?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [users, searchTerm, activeTab]);

  const handleSelect = async (user) => {
    setCreating(user.id);
    try {
      await onCreate(user.odiaUserId, user.name, user.photo, user.role);
      onClose();
    } catch (err) {
      console.error('Error creating chat:', err);
    } finally {
      setCreating(null);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'all', label: 'Tutti', icon: Users },
    { id: 'admin', label: 'Admin', icon: Shield },
    { id: 'coach', label: 'Coach', icon: UserCog },
    ...((actualUserRole === 'admin' || actualUserRole === 'coach') ? [{ id: 'client', label: 'Clienti', icon: User }] : [])
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Nuova Conversazione</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca persona..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl 
                         text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === tab.id 
                      ? "bg-blue-500/20 text-blue-400" 
                      : "text-slate-400 hover:bg-slate-700"
                  )}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <User size={40} className="mx-auto mb-2 opacity-50" />
              <p>Nessuna persona trovata</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  disabled={creating === user.id}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-xl 
                             transition-colors disabled:opacity-50"
                >
                  {user.photo ? (
                    <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                      user.role === 'admin' ? "bg-gradient-to-br from-purple-500 to-pink-500" :
                      user.role === 'coach' ? "bg-gradient-to-br from-blue-500 to-cyan-500" :
                      "bg-gradient-to-br from-green-500 to-teal-500"
                    )}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">{user.name}</p>
                    <div className="flex items-center gap-1.5">
                      <RoleIcon role={user.role} size={12} />
                      <span className="text-xs text-slate-500">{formatRole(user.role)}</span>
                      {user.email && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-500 truncate">{user.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {creating === user.id && (
                    <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NewChatModal;
