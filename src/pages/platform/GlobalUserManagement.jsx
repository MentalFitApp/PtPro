import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Filter, Users, Ban, Shield,
  Eye, EyeOff, Mail, Phone, MapPin, Calendar,
  Activity, AlertTriangle, CheckCircle, XCircle,
  Edit3, Trash2, Download, RefreshCw, UserPlus,
  Building2, Clock, TrendingUp, Zap, Crown
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { 
  collection, getDocs, query, where, orderBy, 
  limit, doc, updateDoc, deleteDoc, Timestamp
} from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

// Privacy utilities
const maskEmail = (email) => {
  if (!email) return '***';
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain?.slice(0, 2)}***.***`;
};

const maskUID = (uid) => {
  if (!uid) return '***';
  return `${uid.slice(0, 4)}***${uid.slice(-4)}`;
};

export default function GlobalUserManagement() {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmDelete, confirmAction } = useConfirm();
  
  const [loading, setLoading] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Data
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      
      // Load all tenants first
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      const usersArray = [];
      
      // Load users from each tenant
      for (const tenantDoc of tenantsSnap.docs) {
        const tenantId = tenantDoc.id;
        const tenantData = tenantDoc.data();
        
        // Load users
        const usersSnap = await getDocs(collection(db, `tenants/${tenantId}/users`));
        usersSnap.docs.forEach(userDoc => {
          usersArray.push({
            id: userDoc.id,
            tenantId,
            tenantName: tenantData.name,
            ...userDoc.data()
          });
        });
        
        // Load clients
        const clientsSnap = await getDocs(collection(db, `tenants/${tenantId}/clients`));
        clientsSnap.docs.forEach(clientDoc => {
          usersArray.push({
            id: clientDoc.id,
            tenantId,
            tenantName: tenantData.name,
            role: 'client',
            ...clientDoc.data()
          });
        });
        
        // Load coaches
        const coachesSnap = await getDocs(collection(db, `tenants/${tenantId}/coaches`));
        coachesSnap.docs.forEach(coachDoc => {
          usersArray.push({
            id: coachDoc.id,
            tenantId,
            tenantName: tenantData.name,
            role: 'coach',
            ...coachDoc.data()
          });
        });
      }
      
      setAllUsers(usersArray);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => {
      const lastActive = u.lastActive?.toDate?.() || new Date(0);
      const daysSinceActive = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
      return daysSinceActive <= 7;
    }).length;
    
    const roleDistribution = allUsers.reduce((acc, u) => {
      const role = u.role || 'user';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    
    const suspendedUsers = allUsers.filter(u => u.status === 'suspended').length;
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      roleDistribution,
      suspendedUsers
    };
  }, [allUsers]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let filtered = [...allUsers];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.tenantName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => (u.role || 'user') === filterRole);
    }
    
    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(u => {
        const lastActive = u.lastActive?.toDate?.() || new Date(0);
        const daysSinceActive = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
        return daysSinceActive <= 7;
      });
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(u => {
        const lastActive = u.lastActive?.toDate?.() || new Date(0);
        const daysSinceActive = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
        return daysSinceActive > 7;
      });
    } else if (filterStatus === 'suspended') {
      filtered = filtered.filter(u => u.status === 'suspended');
    }
    
    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        const aTime = a.lastActive?.toDate?.() || new Date(0);
        const bTime = b.lastActive?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return aTime - bTime;
      });
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => {
        const aName = a.displayName || a.email || '';
        const bName = b.displayName || b.email || '';
        return aName.localeCompare(bName);
      });
    }
    
    return filtered;
  }, [allUsers, searchTerm, filterRole, filterStatus, sortBy]);

  const handleSuspendUser = async (user) => {
    const ok = await confirmAction(`Sospendere l'utente ${user.email}?`, 'Sospendi Utente', 'Sospendi');
    if (!ok) return;
    
    try {
      const userRef = doc(db, `tenants/${user.tenantId}/users`, user.id);
      await updateDoc(userRef, {
        status: 'suspended',
        suspendedAt: Timestamp.now(),
        suspendedBy: auth.currentUser.uid
      });
      
      // Reload users
      loadAllUsers();
      toast.success('Utente sospeso con successo');
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Errore nella sospensione');
    }
  };

  const handleDeleteUser = async (user) => {
    const ok = await confirmDelete(`l'utente ${user.email}`);
    if (!ok) return;
    
    try {
      const userRef = doc(db, `tenants/${user.tenantId}/users`, user.id);
      await deleteDoc(userRef);
      
      // Reload users
      loadAllUsers();
      toast.success('Utente eliminato con successo');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.warning('Seleziona almeno un utente');
      return;
    }
    
    const ok = await confirmAction(`Eseguire l'azione "${action}" su ${selectedUsers.length} utenti?`, 'Azione Multipla', 'Esegui');
    if (!ok) return;
    
    try {
      for (const userId of selectedUsers) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) continue;
        
        const userRef = doc(db, `tenants/${user.tenantId}/users`, user.id);
        
        if (action === 'suspend') {
          await updateDoc(userRef, {
            status: 'suspended',
            suspendedAt: Timestamp.now(),
            suspendedBy: auth.currentUser.uid
          });
        } else if (action === 'activate') {
          await updateDoc(userRef, {
            status: 'active',
            activatedAt: Timestamp.now()
          });
        }
      }
      
      setSelectedUsers([]);
      setShowBulkActions(false);
      loadAllUsers();
      toast.success('Azione bulk completata');
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Errore nell\'azione bulk');
    }
  };

  const handleExportUsers = () => {
    const exportData = filteredUsers.map(u => ({
      email: privacyMode ? maskEmail(u.email) : u.email,
      displayName: u.displayName,
      role: u.role,
      tenantId: u.tenantId,
      tenantName: u.tenantName,
      status: u.status,
      createdAt: u.createdAt?.toDate?.().toISOString(),
      lastActive: u.lastActive?.toDate?.().toISOString()
    }));
    
    const headers = ['Email', 'Name', 'Role', 'Tenant ID', 'Tenant Name', 'Status', 'Created At', 'Last Active'];
    const rows = exportData.map(u => [
      u.email,
      u.displayName || '',
      u.role || 'user',
      u.tenantId,
      u.tenantName,
      u.status || 'active',
      u.createdAt || '',
      u.lastActive || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `global_users_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento utenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/platform-dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
              Global User Management
            </h1>
            <p className="text-slate-400">
              Gestisci utenti attraverso tutti i tenant della piattaforma
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
              <span className="text-white text-sm">
                {privacyMode ? 'Privacy ON' : 'Privacy OFF'}
              </span>
            </button>
            
            <button
              onClick={handleExportUsers}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white preserve-white rounded-lg transition-colors"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>
            
            <button
              onClick={loadAllUsers}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={<Users className="text-blue-400" />}
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
        />
        <StatCard
          icon={<Activity className="text-green-400" />}
          label="Active Users (7d)"
          value={stats.activeUsers.toLocaleString()}
          subtext={`${stats.inactiveUsers} inactive`}
        />
        <StatCard
          icon={<Shield className="text-purple-400" />}
          label="Admins"
          value={stats.roleDistribution.admin || 0}
        />
        <StatCard
          icon={<Ban className="text-red-400" />}
          label="Suspended"
          value={stats.suspendedUsers}
        />
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by email, name, or tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="coach">Coach</option>
            <option value="client">Client</option>
            <option value="user">User</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active (7d)</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-400">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedUsers.length > 0 && (
              <>
                <span className="text-sm text-slate-400">
                  {selectedUsers.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white preserve-white rounded-lg text-sm transition-colors"
                >
                  Bulk Actions
                </button>
              </>
            )}
            <span className="text-sm text-slate-400">
              {filteredUsers.length} users found
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-white font-medium">
              Bulk Actions ({selectedUsers.length} users selected)
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white preserve-white rounded-lg text-sm transition-colors"
              >
                Suspend Selected
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white preserve-white rounded-lg text-sm transition-colors"
              >
                Activate Selected
              </button>
              <button
                onClick={() => {
                  setSelectedUsers([]);
                  setShowBulkActions(false);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white preserve-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.slice(0, 100).map((user) => {
                const lastActive = user.lastActive?.toDate?.();
                const daysSinceActive = lastActive 
                  ? (new Date() - lastActive) / (1000 * 60 * 60 * 24)
                  : 999;
                const isActive = daysSinceActive <= 7;
                
                return (
                  <tr 
                    key={`${user.tenantId}-${user.id}`} 
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-white font-medium">
                          {user.displayName || 'Unknown'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {privacyMode ? maskEmail(user.email) : user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-300">{user.tenantName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        user.role === 'coach' ? 'bg-blue-500/20 text-blue-400' :
                        user.role === 'client' ? 'bg-green-500/20 text-green-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`flex items-center gap-1 ${
                        user.status === 'suspended' ? 'text-red-400' :
                        isActive ? 'text-green-400' : 'text-slate-400'
                      }`}>
                        {user.status === 'suspended' ? (
                          <><Ban size={14} /> Suspended</>
                        ) : isActive ? (
                          <><CheckCircle size={14} /> Active</>
                        ) : (
                          <><Clock size={14} /> Inactive</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {lastActive ? lastActive.toLocaleDateString('it-IT') : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} className="text-slate-400" />
                        </button>
                        {user.status !== 'suspended' ? (
                          <button
                            onClick={() => handleSuspendUser(user)}
                            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Suspend User"
                          >
                            <Ban size={16} className="text-red-400" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendUser(user)}
                            className="p-2 hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Activate User"
                          >
                            <CheckCircle size={16} className="text-green-400" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length > 100 && (
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Showing first 100 of {filteredUsers.length} users. Use filters to narrow down results.
          </p>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ icon, label, value, subtext }) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
    <div className="flex items-center justify-between mb-3">
      <div className="p-3 bg-slate-800/50 rounded-lg">
        {icon}
      </div>
    </div>
    <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
    <p className="text-sm text-slate-400">{label}</p>
    {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
  </div>
);
