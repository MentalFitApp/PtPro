import React, { useState } from 'react';
import { addDoc } from 'firebase/firestore';
import { X, Camera, Loader2 } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { getTenantSubcollection } from '../../../../config/tenant';
import { uploadToR2 } from '../../../../cloudflareStorage';
import { useToast } from '../../../../contexts/ToastContext';

export default function NewCheckModal({ isOpen, onClose, clientId, db }) {
  const toast = useToast();
  const [checkData, setCheckData] = useState({ 
    weight: '', 
    bodyFat: '', 
    notes: '', 
    photos: {},
    checkDate: new Date().toISOString().split('T')[0]
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = async (position, file) => {
    if (!file) return;
    
    setUploadingPhoto(position);
    try {
      const photoUrl = await uploadToR2(file, clientId, 'check_photos', null, true);
      setCheckData(prev => ({
        ...prev,
        photos: { ...prev.photos, [position]: photoUrl }
      }));
    } catch (error) {
      console.error('Errore upload foto check:', error);
      toast.error('Errore nel caricamento: ' + error.message);
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleSave = async () => {
    if (!clientId) return;
    
    setSaving(true);
    try {
      const checksRef = getTenantSubcollection(db, 'clients', clientId, 'checks');
      
      const checkDate = checkData.checkDate 
        ? new Date(checkData.checkDate + 'T12:00:00')
        : new Date();
      
      await addDoc(checksRef, {
        weight: checkData.weight ? parseFloat(checkData.weight) : null,
        bodyFat: checkData.bodyFat ? parseFloat(checkData.bodyFat) : null,
        notes: checkData.notes || '',
        photoURLs: Object.keys(checkData.photos).length > 0 ? checkData.photos : null,
        createdAt: checkDate,
        createdBy: 'admin',
        source: 'admin_upload'
      });
      
      toast.success('Check salvato con successo');
      onClose();
      // Reset form
      setCheckData({ 
        weight: '', 
        bodyFat: '', 
        notes: '', 
        photos: {},
        checkDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Errore salvataggio check:', error);
      toast.error('Errore nel salvataggio: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const canSave = checkData.weight || checkData.bodyFat || Object.keys(checkData.photos).length > 0;

  const footer = (
    <div className="flex gap-3 w-full">
      <button
        onClick={onClose}
        className="flex-1 py-2.5 border border-theme/50 text-theme-text-secondary rounded-lg hover:bg-theme-bg-tertiary transition-colors"
      >
        Annulla
      </button>
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
        Salva Check
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuovo Check"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        {/* Data del check */}
        <div>
          <label className="block text-sm text-theme-text-secondary mb-1">Data Check</label>
          <input
            type="date"
            value={checkData.checkDate}
            onChange={(e) => setCheckData(prev => ({ ...prev, checkDate: e.target.value }))}
            className="w-full px-3 py-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
            max={new Date().toISOString().split('T')[0]}
          />
          <p className="text-xs text-theme-text-secondary mt-1">
            Seleziona la data in cui è stato effettuato il check
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              value={checkData.weight}
              onChange={(e) => setCheckData(prev => ({ ...prev, weight: e.target.value }))}
              className="w-full px-3 py-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
              placeholder="Es: 75.5"
            />
          </div>
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Body Fat (%)</label>
            <input
              type="number"
              step="0.1"
              value={checkData.bodyFat}
              onChange={(e) => setCheckData(prev => ({ ...prev, bodyFat: e.target.value }))}
              className="w-full px-3 py-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
              placeholder="Es: 15.0"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-theme-text-secondary mb-1">Note</label>
          <textarea
            value={checkData.notes}
            onChange={(e) => setCheckData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary resize-none"
            rows={3}
            placeholder="Note opzionali..."
          />
        </div>
        
        <div>
          <label className="block text-sm text-theme-text-secondary mb-2">Foto Check</label>
          <div className="grid grid-cols-4 gap-2">
            {['front', 'right', 'left', 'back'].map((pos) => (
              <div key={pos} className="rounded-lg border border-theme/50 bg-theme-bg-tertiary overflow-hidden">
                <div className="text-xs text-center py-1 border-b border-theme/30 text-theme-text-secondary capitalize">
                  {pos === 'front' ? 'Front' : pos === 'back' ? 'Back' : pos === 'left' ? 'Left' : 'Right'}
                </div>
                {checkData.photos[pos] ? (
                  <div className="relative">
                    <img src={checkData.photos[pos]} alt={pos} className="w-full h-20 object-cover" />
                    <button 
                      onClick={() => setCheckData(prev => ({ 
                        ...prev, 
                        photos: { ...prev.photos, [pos]: undefined } 
                      }))}
                      className="absolute top-1 right-1 p-1 bg-red-600 rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-20 cursor-pointer hover:bg-theme-bg-primary/50 transition-colors">
                    {uploadingPhoto === pos ? (
                      <Loader2 size={20} className="animate-spin text-blue-400" />
                    ) : (
                      <Camera size={20} className="text-theme-text-secondary" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(pos, file);
                        e.target.value = '';
                      }}
                      disabled={uploadingPhoto !== null}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
