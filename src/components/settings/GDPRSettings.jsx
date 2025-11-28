import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, AlertTriangle, Check, Loader } from 'lucide-react';
import { exportUserData, downloadUserDataAsJSON, deleteUserData, canDeleteAccount } from '../../utils/gdprUtils';
import { auth } from '../../firebase';
import { CURRENT_TENANT_ID } from '../../config/tenant';
import { useToast } from '../../contexts/ToastContext';

const GDPRSettings = () => {
  const toast = useToast();
  const currentUser = auth.currentUser;
  const tenantId = CURRENT_TENANT_ID;
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      const userData = await exportUserData(currentUser.uid, tenantId);
      downloadUserDataAsJSON(userData);
      
      toast.success('I tuoi dati sono stati esportati con successo!');
    } catch (error) {
      toast.error(error.message || 'Errore durante l\'esportazione dei dati.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINA IL MIO ACCOUNT') {
      toast.error('Devi digitare esattamente "ELIMINA IL MIO ACCOUNT" per confermare.');
      return;
    }

    setIsDeleting(true);

    try {
      // Verifica se può eliminare
      const eligibility = await canDeleteAccount(currentUser.uid, tenantId);
      if (!eligibility.canDelete) {
        toast.error(eligibility.reason);
        setIsDeleting(false);
        return;
      }

      // Procedi con eliminazione
      await deleteUserData(currentUser.uid, tenantId);
      
      toast.success('Account eliminato con successo. Verrai disconnesso...');

      // Logout e redirect dopo 2 secondi
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      toast.error(error.message || 'Errore durante l\'eliminazione dell\'account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Privacy e Dati Personali</h2>
        <p className="text-slate-400">
          Gestisci i tuoi dati secondo il GDPR (Regolamento Europeo sulla Protezione dei Dati)
        </p>
      </div>

      {/* Esporta Dati */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download size={24} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">
              Esporta i Tuoi Dati
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              Scarica una copia completa di tutti i tuoi dati personali in formato JSON. 
              Include profilo, anamnesi, check, pagamenti, schede alimentazione e allenamento.
            </p>
            <p className="text-xs text-slate-400 mb-4">
              📌 Diritto GDPR Art. 20 - Diritto alla portabilità dei dati
            </p>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white preserve-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Esportazione in corso...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Esporta Dati
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Elimina Account */}
      <div className="bg-red-500/5 backdrop-blur-sm border border-red-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trash2 size={24} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">
              Elimina il Tuo Account
            </h3>
            <p className="text-slate-300 text-sm mb-2">
              Elimina permanentemente il tuo account e tutti i dati associati. 
              <strong className="text-red-400"> Questa azione è irreversibile.</strong>
            </p>
            <p className="text-xs text-slate-400 mb-4">
              📌 Diritto GDPR Art. 17 - Diritto all'oblio
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white preserve-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={20} />
                Elimina Account
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4 border-t border-red-500/30"
              >
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-semibold mb-1">
                        Attenzione: Questa azione è irreversibile!
                      </p>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Tutti i tuoi dati personali saranno eliminati</li>
                        <li>• Anamnesi, check e schede saranno cancellati</li>
                        <li>• Non potrai più accedere al tuo account</li>
                        <li>• I messaggi inviati potrebbero rimanere visibili agli altri</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Per confermare, digita esattamente:{' '}
                    <span className="font-mono text-red-400">ELIMINA IL MIO ACCOUNT</span>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="ELIMINA IL MIO ACCOUNT"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== 'ELIMINA IL MIO ACCOUNT'}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        Eliminazione...
                      </>
                    ) : (
                      <>
                        <Trash2 size={20} />
                        Elimina Definitivamente
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Info Aggiuntive */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong>Nota:</strong> Questi strumenti sono forniti in conformità al GDPR (Regolamento UE 2016/679). 
          Per qualsiasi domanda sulla privacy o sui tuoi dati, contatta il nostro Data Protection Officer all'indirizzo{' '}
          <a href="mailto:privacy@ptpro.app" className="text-purple-400 hover:text-purple-300 underline">
            privacy@ptpro.app
          </a>
        </p>
      </div>
    </div>
  );
};

export default GDPRSettings;
