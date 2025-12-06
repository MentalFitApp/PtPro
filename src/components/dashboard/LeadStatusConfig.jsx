import React, { useState, useEffect } from 'react';
import { X, Plus, Save, GripVertical } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';

/**
 * Componente per configurare gli status/checkmark dei leads
 */
export default function LeadStatusConfig({ onClose, onSave }) {
  const [statuses, setStatuses] = useState([
    { id: 'showUp', label: 'Show Up', color: 'green', enabled: true },
    { id: 'chiuso', label: 'Chiuso', color: 'rose', enabled: true },
  ]);
  const [newStatus, setNewStatus] = useState({ label: '', color: 'blue' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const colorOptions = [
    { value: 'blue', label: 'Blu', class: 'bg-blue-600' },
    { value: 'green', label: 'Verde', class: 'bg-green-600' },
    { value: 'rose', label: 'Rosso', class: 'bg-rose-600' },
    { value: 'yellow', label: 'Giallo', class: 'bg-yellow-600' },
    { value: 'purple', label: 'Viola', class: 'bg-purple-600' },
    { value: 'orange', label: 'Arancione', class: 'bg-orange-600' },
    { value: 'teal', label: 'Teal', class: 'bg-teal-600' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-600' },
  ];

  // Carica configurazione esistente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configDoc = await getDoc(getTenantDoc(db, 'settings', 'leadStatuses'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.statuses && Array.isArray(data.statuses)) {
            setStatuses(data.statuses);
          }
        }
      } catch (error) {
        console.error('Errore caricamento configurazione lead status:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleAddStatus = () => {
    if (!newStatus.label.trim()) return;
    
    const id = newStatus.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newStatusItem = {
      id,
      label: newStatus.label.trim(),
      color: newStatus.color,
      enabled: true,
      custom: true, // Flag per identificare status personalizzati
    };

    setStatuses([...statuses, newStatusItem]);
    setNewStatus({ label: '', color: 'blue' });
  };

  const handleRemoveStatus = (id) => {
    // Non rimuovere gli status di default
    const status = statuses.find(s => s.id === id);
    if (status && !status.custom) {
      alert('Non puoi rimuovere gli status predefiniti');
      return;
    }
    setStatuses(statuses.filter(s => s.id !== id));
  };

  const handleToggleStatus = (id) => {
    setStatuses(statuses.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(getTenantDoc(db, 'settings', 'leadStatuses'), {
        statuses,
        updatedAt: new Date().toISOString(),
      });
      
      if (onSave) onSave(statuses);
      alert('Configurazione salvata con successo!');
    } catch (error) {
      console.error('Errore salvataggio configurazione:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const moveStatus = (index, direction) => {
    const newStatuses = [...statuses];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newStatuses.length) return;
    
    [newStatuses[index], newStatuses[newIndex]] = [newStatuses[newIndex], newStatuses[index]];
    setStatuses(newStatuses);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-2xl p-6 text-center">
          <p className="text-slate-300">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Configura Status Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={24} />
          </button>
        </div>

        {/* Contenuto */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          
          {/* Lista status esistenti */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Status Attivi</h3>
            {statuses.map((status, index) => (
              <div
                key={status.id}
                className="flex items-center gap-3 bg-slate-800/60 rounded-lg p-3 border border-slate-700 shadow-glow"
              >
                {/* Drag handle */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveStatus(index, -1)}
                    disabled={index === 0}
                    className="text-slate-500 hover:text-slate-300 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <GripVertical size={16} className="text-slate-500" />
                  <button
                    onClick={() => moveStatus(index, 1)}
                    disabled={index === statuses.length - 1}
                    className="text-slate-500 hover:text-slate-300 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                {/* Color indicator */}
                <div className={`w-4 h-4 rounded ${colorOptions.find(c => c.value === status.color)?.class || 'bg-gray-600'}`} />

                {/* Label */}
                <div className="flex-1">
                  <span className="text-slate-100 font-medium">{status.label}</span>
                  {!status.custom && (
                    <span className="ml-2 text-xs text-slate-500">(predefinito)</span>
                  )}
                </div>

                {/* Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status.enabled}
                    onChange={() => handleToggleStatus(status.id)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-xs text-slate-400">Attivo</span>
                </label>

                {/* Rimuovi (solo custom) */}
                {status.custom && (
                  <button
                    onClick={() => handleRemoveStatus(status.id)}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Aggiungi nuovo status */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Aggiungi Nuovo Status</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newStatus.label}
                onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                placeholder="Nome status (es. Interessato)"
                className="flex-1 px-3 py-2 bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddStatus()}
              />
              <select
                value={newStatus.color}
                onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                className="px-3 py-2 bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
              >
                {colorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={handleAddStatus}
                disabled={!newStatus.label.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={18} />
                Aggiungi
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300">
              💡 Gli status personalizzati appariranno automaticamente nella pagina calendario e statistiche.
              Puoi riordinare gli status trascinandoli con le frecce.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-slate-200"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Salvataggio...' : 'Salva Configurazione'}
          </button>
        </div>
      </div>
    </div>
  );
}
