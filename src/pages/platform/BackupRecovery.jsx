import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Database, Download, Upload, Calendar,
  Clock, CheckCircle, AlertTriangle, RefreshCw, Play,
  Pause, Trash2, Eye, Settings, CloudDownload, CloudUpload,
  HardDrive, Activity, Zap, Shield, Lock
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, 
  Timestamp, query, orderBy, limit 
} from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function BackupRecovery() {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmAction } = useConfirm();
  
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState([]);
  const [activeTab, setActiveTab] = useState('manual');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  
  // Scheduled backup settings
  const [scheduleConfig, setScheduleConfig] = useState({
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retention: 30,
    destinations: ['firestore', 'cloudflare'],
    notifications: true
  });

  useEffect(() => {
    loadBackups();
    loadScheduleConfig();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      
      const backupsQuery = query(
        collection(db, 'platform_backups'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const backupsSnap = await getDocs(backupsQuery);
      const backupsData = backupsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setBackups(backupsData);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleConfig = async () => {
    try {
      const configDoc = await getDocs(collection(db, 'platform_config'));
      // Load schedule config if exists
    } catch (error) {
      console.error('Error loading schedule config:', error);
    }
  };

  const handleCreateBackup = async (type = 'full') => {
    if (!confirm(`Creare un backup ${type} della piattaforma? Questa operazione potrebbe richiedere alcuni minuti.`)) return;
    
    try {
      setIsBackingUp(true);
      setBackupProgress(0);
      
      const backupId = `backup_${Date.now()}`;
      const backupData = {
        id: backupId,
        type,
        status: 'in_progress',
        createdAt: Timestamp.now(),
        createdBy: auth.currentUser.uid,
        collections: []
      };
      
      // Create backup document
      await setDoc(doc(db, 'platform_backups', backupId), backupData);
      
      // Collections to backup
      const collectionsToBackup = [
        'tenants',
        'platform_admins',
        'platform_config',
        'platform_errors'
      ];
      
      const allData = {};
      
      for (let i = 0; i < collectionsToBackup.length; i++) {
        const collectionName = collectionsToBackup[i];
        setBackupProgress(Math.round(((i + 1) / collectionsToBackup.length) * 100));
        
        const snapshot = await getDocs(collection(db, collectionName));
        allData[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Timestamps to ISO strings
          createdAt: doc.data().createdAt?.toDate?.().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.().toISOString()
        }));
        
        // If backing up tenants, also backup their subcollections
        if (collectionName === 'tenants' && type === 'full') {
          for (const tenantDoc of snapshot.docs) {
            const tenantId = tenantDoc.id;
            
            // Backup tenant subcollections
            const subcollections = ['users', 'clients', 'coaches', 'settings'];
            const tenantSubData = {};
            
            for (const subColl of subcollections) {
              const subSnapshot = await getDocs(collection(db, `tenants/${tenantId}/${subColl}`));
              tenantSubData[subColl] = subSnapshot.docs.map(subDoc => ({
                id: subDoc.id,
                ...subDoc.data()
              }));
            }
            
            allData[collectionName].find(t => t.id === tenantId).subcollections = tenantSubData;
          }
        }
      }
      
      // Create downloadable backup file
      const backupJson = {
        metadata: {
          backupId,
          type,
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser.email,
          version: '1.0.0',
          platform: 'FitFlow'
        },
        data: allData
      };
      
      const blob = new Blob([JSON.stringify(backupJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform_backup_${type}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Update backup status
      await setDoc(doc(db, 'platform_backups', backupId), {
        ...backupData,
        status: 'completed',
        completedAt: Timestamp.now(),
        size: blob.size,
        collections: collectionsToBackup,
        recordCount: Object.values(allData).reduce((sum, coll) => sum + coll.length, 0)
      }, { merge: true });
      
      setBackupProgress(100);
      toast.success('Backup completato e scaricato con successo!');
      loadBackups();
      
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Errore durante la creazione del backup');
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleRestoreBackup = async (backup) => {
    const ok1 = await confirmAction(
      `Ripristinare il backup ${backup.id}? Questa operazione SOVRASCRIVERÀ i dati attuali!`,
      'Ripristina Backup',
      'Ripristina'
    );
    if (!ok1) return;
    
    const ok2 = await confirmAction(
      'Sei ASSOLUTAMENTE sicuro? Questa azione è IRREVERSIBILE!',
      'Conferma Ripristino',
      'Conferma'
    );
    if (!ok2) return;
    
    try {
      setIsRestoring(true);
      toast.info('La funzionalità di restore richiede l\'upload del file di backup. Per sicurezza, questa operazione deve essere eseguita manualmente.');
      
      // In production, this would:
      // 1. Read the backup file
      // 2. Parse JSON
      // 3. Restore each collection
      // 4. Restore subcollections
      // 5. Verify data integrity
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Errore durante il ripristino');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    const ok = await confirmAction('Eliminare questo backup?', 'Elimina Backup', 'Elimina');
    if (!ok) return;
    
    try {
      await deleteDoc(doc(db, 'platform_backups', backupId));
      loadBackups();
      toast.success('Backup eliminato');
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleDownloadBackup = async (backup) => {
    toast.info('Download del backup in corso...');
    // In production, this would download from cloud storage
  };

  const handleToggleSchedule = async () => {
    try {
      const newEnabled = !scheduleConfig.enabled;
      setScheduleConfig(prev => ({ ...prev, enabled: newEnabled }));
      
      await setDoc(doc(db, 'platform_config', 'backup_schedule'), {
        ...scheduleConfig,
        enabled: newEnabled,
        updatedAt: Timestamp.now(),
        updatedBy: auth.currentUser.uid
      }, { merge: true });
      
      toast.success(`Backup automatici ${newEnabled ? 'attivati' : 'disattivati'}`);
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento backup...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'manual', label: 'Manual Backups', icon: <Database size={18} /> },
    { id: 'scheduled', label: 'Scheduled', icon: <Calendar size={18} /> },
    { id: 'restore', label: 'Restore', icon: <Upload size={18} /> }
  ];

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
              Backup & Disaster Recovery
            </h1>
            <p className="text-slate-400">
              Gestisci backup, pianificazioni e ripristino dati
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadBackups}
              disabled={isBackingUp}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className="text-slate-400" />
            </button>
            
            <button
              onClick={() => handleCreateBackup('quick')}
              disabled={isBackingUp}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white preserve-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              <span>Quick Backup</span>
            </button>
            
            <button
              onClick={() => handleCreateBackup('full')}
              disabled={isBackingUp}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white preserve-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Database size={18} />
              <span>Full Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup Progress */}
      {isBackingUp && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="text-white font-bold">Backup in corso...</p>
                <p className="text-sm text-slate-400">Non chiudere questa pagina</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-400">{backupProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${backupProgress}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={<Database className="text-blue-400" />}
          label="Total Backups"
          value={backups.length}
        />
        <StatCard
          icon={<CheckCircle className="text-green-400" />}
          label="Successful"
          value={backups.filter(b => b.status === 'completed').length}
        />
        <StatCard
          icon={<HardDrive className="text-purple-400" />}
          label="Total Size"
          value={formatBytes(backups.reduce((sum, b) => sum + (b.size || 0), 0))}
        />
        <StatCard
          icon={<Clock className="text-yellow-400" />}
          label="Last Backup"
          value={backups[0]?.createdAt?.toDate?.().toLocaleDateString('it-IT') || 'Never'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === tab.id
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* MANUAL BACKUPS TAB */}
        {activeTab === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">Backup History</h3>
              
              {backups.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No backups yet</p>
                  <p className="text-sm text-slate-500 mt-2">Create your first backup to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          backup.status === 'completed' ? 'bg-green-900/30' :
                          backup.status === 'failed' ? 'bg-red-900/30' :
                          'bg-blue-900/30'
                        }`}>
                          {backup.status === 'completed' ? (
                            <CheckCircle className="text-green-400" size={24} />
                          ) : backup.status === 'failed' ? (
                            <AlertTriangle className="text-red-400" size={24} />
                          ) : (
                            <Clock className="text-blue-400" size={24} />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-white font-medium">{backup.id}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              backup.type === 'full' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {backup.type?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {backup.createdAt?.toDate?.().toLocaleString('it-IT')}
                            </span>
                            {backup.size && (
                              <span className="flex items-center gap-1">
                                <HardDrive size={12} />
                                {formatBytes(backup.size)}
                              </span>
                            )}
                            {backup.recordCount && (
                              <span>{backup.recordCount.toLocaleString()} records</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {backup.status === 'completed' && (
                          <>
                            <button
                              onClick={() => handleDownloadBackup(backup)}
                              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                              title="Download"
                            >
                              <CloudDownload size={18} className="text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleRestoreBackup(backup)}
                              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                              title="Restore"
                            >
                              <Upload size={18} className="text-green-400" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SCHEDULED TAB */}
        {activeTab === 'scheduled' && (
          <motion.div
            key="scheduled"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Automatic Backup Schedule</h3>
                <button
                  onClick={handleToggleSchedule}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    scheduleConfig.enabled
                      ? 'bg-green-600 hover:bg-green-700 text-white preserve-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                  }`}
                >
                  {scheduleConfig.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConfigField
                  label="Frequency"
                  value={scheduleConfig.frequency}
                  onChange={(value) => setScheduleConfig(prev => ({ ...prev, frequency: value }))}
                  options={[
                    { value: 'hourly', label: 'Every Hour' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                />
                
                <ConfigField
                  label="Time (24h)"
                  value={scheduleConfig.time}
                  onChange={(value) => setScheduleConfig(prev => ({ ...prev, time: value }))}
                  type="time"
                />
                
                <ConfigField
                  label="Retention (days)"
                  value={scheduleConfig.retention}
                  onChange={(value) => setScheduleConfig(prev => ({ ...prev, retention: parseInt(value) }))}
                  type="number"
                />
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Destinations
                  </label>
                  <div className="space-y-2">
                    {['firestore', 'cloudflare', 'local'].map(dest => (
                      <label key={dest} className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={scheduleConfig.destinations.includes(dest)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScheduleConfig(prev => ({
                                ...prev,
                                destinations: [...prev.destinations, dest]
                              }));
                            } else {
                              setScheduleConfig(prev => ({
                                ...prev,
                                destinations: prev.destinations.filter(d => d !== dest)
                              }));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="capitalize">{dest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={scheduleConfig.notifications}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span>Send email notifications on backup completion</span>
                </label>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Shield className="text-blue-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-white font-bold mb-2">Next Scheduled Backup</h4>
                  <p className="text-slate-300">
                    {scheduleConfig.enabled 
                      ? `Tomorrow at ${scheduleConfig.time}` 
                      : 'Automatic backups are disabled'}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Backups will be stored in: {scheduleConfig.destinations.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* RESTORE TAB */}
        {activeTab === 'restore' && (
          <motion.div
            key="restore"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 flex-shrink-0" size={32} />
                <div>
                  <h4 className="text-white font-bold mb-2">⚠️ Danger Zone</h4>
                  <p className="text-slate-300 mb-4">
                    Il ripristino di un backup SOVRASCRIVERÀ tutti i dati attuali della piattaforma.
                    Questa operazione è IRREVERSIBILE. Procedi solo se sei assolutamente sicuro.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                    <li>Tutti i tenant saranno ripristinati allo stato del backup</li>
                    <li>I dati creati dopo il backup andranno persi</li>
                    <li>Gli utenti potrebbero perdere l'accesso temporaneamente</li>
                    <li>Le integrazioni potrebbero richiedere riconfigurazione</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">Point-in-Time Recovery</h3>
              <p className="text-slate-400 mb-6">
                Seleziona un backup dalla lista per ripristinare la piattaforma a un punto specifico nel tempo.
              </p>
              
              <div className="space-y-3">
                {backups.filter(b => b.status === 'completed').slice(0, 10).map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="text-blue-400" size={24} />
                      <div>
                        <p className="text-white font-medium">{backup.id}</p>
                        <p className="text-sm text-slate-400">
                          {backup.createdAt?.toDate?.().toLocaleString('it-IT')} • 
                          {formatBytes(backup.size || 0)} • 
                          {backup.recordCount?.toLocaleString()} records
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestoreBackup(backup)}
                      disabled={isRestoring}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white preserve-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isRestoring ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const StatCard = ({ icon, label, value }) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
    <div className="flex items-center justify-between mb-3">
      <div className="p-3 bg-slate-800/50 rounded-lg">
        {icon}
      </div>
    </div>
    <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
    <p className="text-sm text-slate-400">{label}</p>
  </div>
);

const ConfigField = ({ label, value, onChange, type = 'text', options }) => (
  <div>
    <label className="block text-sm font-medium text-slate-400 mb-2">
      {label}
    </label>
    {options ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
      />
    )}
  </div>
);
