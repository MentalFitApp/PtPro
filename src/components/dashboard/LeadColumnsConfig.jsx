import React, { useState, useEffect } from 'react';
import { X, Plus, Save, GripVertical, Eye, EyeOff, Sparkles } from 'lucide-react';
import { doc, getDoc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getTenantDoc, getTenantCollection } from '../../config/tenant';
import { useToast } from '../../contexts/ToastContext';

/**
 * Componente per configurare le colonne visibili nella tabella leads
 */
export default function LeadColumnsConfig({ onClose, onSave }) {
  const toast = useToast();
  const [columns, setColumns] = useState([
    { id: 'name', label: 'Nome', visible: true, locked: true },
    { id: 'number', label: 'Telefono', visible: true, locked: false },
    { id: 'email', label: 'Email', visible: true, locked: false },
    { id: 'dataPrenotazione', label: 'Data', visible: true, locked: false },
    { id: 'source', label: 'Fonte', visible: true, locked: false },
    { id: 'dialed', label: 'Dialed', visible: true, locked: false },
    { id: 'note', label: 'Note', visible: true, locked: false },
  ]);
  const [discoveredFields, setDiscoveredFields] = useState([]);
  const [newColumn, setNewColumn] = useState({ label: '', field: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Campi di sistema da escludere dalla scoperta
  const systemFields = ['id', 'createdAt', 'updatedAt', 'tenantId', 'source', 'landingPageId', 'status'];

  // Carica configurazione esistente e scopri campi dai leads
  useEffect(() => {
    const loadConfigAndDiscoverFields = async () => {
      try {
        // Carica configurazione colonne esistente
        const configDoc = await getDoc(getTenantDoc(db, 'settings', 'leadColumns'));
        let existingColumns = columns;
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.columns && Array.isArray(data.columns)) {
            existingColumns = data.columns;
            setColumns(data.columns);
          }
        }

        // Scopri campi dai leads esistenti
        const leadsSnapshot = await getDocs(getTenantCollection(db, 'leads'));
        const allFields = new Set();
        
        leadsSnapshot.forEach(doc => {
          const data = doc.data();
          Object.keys(data).forEach(key => {
            if (!systemFields.includes(key)) {
              allFields.add(key);
            }
          });
        });

        // Trova campi non ancora configurati
        const configuredFieldIds = existingColumns.map(c => c.field || c.id);
        const newFields = Array.from(allFields).filter(
          field => !configuredFieldIds.includes(field)
        );

        setDiscoveredFields(newFields);
        
        if (newFields.length > 0) {
          console.log('🔍 Campi scoperti non configurati:', newFields);
        }
      } catch (error) {
        console.error('Errore caricamento configurazione colonne:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfigAndDiscoverFields();
  }, []);

  // Aggiungi campo scoperto alle colonne
  const handleAddDiscoveredField = (field) => {
    const label = field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    const newColumnItem = {
      id: field,
      label: label,
      field: field,
      visible: true,
      locked: false,
      custom: true,
    };

    setColumns([...columns, newColumnItem]);
    setDiscoveredFields(discoveredFields.filter(f => f !== field));
    toast.success(`Colonna "${label}" aggiunta!`);
  };

  // Aggiungi tutti i campi scoperti
  const handleAddAllDiscoveredFields = () => {
    const newColumns = discoveredFields.map(field => {
      const label = field
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      return {
        id: field,
        label: label,
        field: field,
        visible: true,
        locked: false,
        custom: true,
      };
    });

    setColumns([...columns, ...newColumns]);
    setDiscoveredFields([]);
    toast.success(`${newColumns.length} colonne aggiunte!`);
  };

  const handleAddColumn = () => {
    if (!newColumn.label.trim() || !newColumn.field.trim()) {
      toast.warning('Inserisci sia il nome che il campo');
      return;
    }
    
    const id = newColumn.field.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newColumnItem = {
      id,
      label: newColumn.label.trim(),
      field: newColumn.field.trim(),
      visible: true,
      locked: false,
      custom: true,
    };

    setColumns([...columns, newColumnItem]);
    setNewColumn({ label: '', field: '' });
  };

  const handleRemoveColumn = (id) => {
    const column = columns.find(c => c.id === id);
    if (column && column.locked) {
      toast.warning('Non puoi rimuovere colonne bloccate');
      return;
    }
    setColumns(columns.filter(c => c.id !== id));
  };

  const handleToggleVisibility = (id) => {
    setColumns(columns.map(c => 
      c.id === id ? { ...c, visible: !c.visible } : c
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Salva configurazione colonne
      await setDoc(getTenantDoc(db, 'settings', 'leadColumns'), {
        columns,
        updatedAt: new Date().toISOString(),
      });
      
      // Inizializza nuovi campi custom nei leads esistenti del tenant
      const customColumns = columns.filter(c => c.custom && c.visible);
      if (customColumns.length > 0) {
        console.log(`🔄 Inizializzazione ${customColumns.length} nuovi campi nei leads...`);
        
        const leadsSnapshot = await getDocs(getTenantCollection(db, 'leads'));
        const updatePromises = [];
        
        leadsSnapshot.forEach(leadDoc => {
          const leadData = leadDoc.data();
          const updates = {};
          let needsUpdate = false;
          
          customColumns.forEach(col => {
            const fieldId = col.field || col.id;
            // Inizializza solo se il campo non esiste
            if (leadData[fieldId] === undefined) {
              updates[fieldId] = ''; // Campo vuoto di default
              needsUpdate = true;
            }
          });
          
          if (needsUpdate) {
            updatePromises.push(
              updateDoc(getTenantDoc(db, 'leads', leadDoc.id), updates)
            );
          }
        });
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log(`✅ ${updatePromises.length} leads aggiornati con nuovi campi`);
          toast.success(`Colonne salvate! ${updatePromises.length} leads aggiornati con i nuovi campi.`);
        } else {
          toast.success('Configurazione colonne salvata!');
        }
      } else {
        toast.success('Configurazione colonne salvata!');
      }
      
      if (onSave) onSave(columns);
      onClose();
    } catch (error) {
      console.error('Errore salvataggio configurazione:', error);
      toast.error('Errore nel salvataggio: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const moveColumn = (index, direction) => {
    const newColumns = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newColumns.length) return;
    
    [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
    setColumns(newColumns);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 p-6 rounded-xl">
          <p className="text-slate-300">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Configura Colonne Tabella</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Campi scoperti dai leads */}
          {discoveredFields.length > 0 && (
            <div className="space-y-3 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <Sparkles size={16} />
                  Campi Scoperti dai Leads ({discoveredFields.length})
                </h3>
                <button
                  onClick={handleAddAllDiscoveredFields}
                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700"
                >
                  Aggiungi Tutti
                </button>
              </div>
              <p className="text-xs text-purple-400/70">
                Questi campi esistono nei tuoi leads ma non sono ancora configurati come colonne:
              </p>
              <div className="flex flex-wrap gap-2">
                {discoveredFields.map(field => (
                  <button
                    key={field}
                    onClick={() => handleAddDiscoveredField(field)}
                    className="px-3 py-1.5 bg-purple-600/30 text-purple-200 text-sm rounded-lg hover:bg-purple-600/50 transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} />
                    {field}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista colonne esistenti */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Colonne Esistenti</h3>
            {columns.map((column, index) => (
              <div
                key={column.id}
                className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                {/* Drag handle */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveColumn(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <GripVertical size={16} className="text-slate-400 rotate-90" />
                  </button>
                  <button
                    onClick={() => moveColumn(index, 'down')}
                    disabled={index === columns.length - 1}
                    className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <GripVertical size={16} className="text-slate-400 -rotate-90" />
                  </button>
                </div>

                {/* Info colonna */}
                <div className="flex-1">
                  <div className="font-medium text-slate-200">{column.label}</div>
                  <div className="text-xs text-slate-500">Campo: {column.field || column.id}</div>
                  {column.locked && (
                    <span className="text-xs text-blue-400">🔒 Colonna obbligatoria</span>
                  )}
                </div>

                {/* Azioni */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVisibility(column.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      column.visible
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'
                    }`}
                    title={column.visible ? 'Visibile' : 'Nascosta'}
                  >
                    {column.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>

                  {!column.locked && (
                    <button
                      onClick={() => handleRemoveColumn(column.id)}
                      className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Aggiungi nuova colonna */}
          <div className="space-y-3 p-4 bg-slate-900/30 rounded-lg border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300">Aggiungi Colonna Personalizzata</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome Colonna</label>
                <input
                  type="text"
                  value={newColumn.label}
                  onChange={(e) => setNewColumn({ ...newColumn, label: e.target.value })}
                  placeholder="es. Budget"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Campo Database</label>
                <input
                  type="text"
                  value={newColumn.field}
                  onChange={(e) => setNewColumn({ ...newColumn, field: e.target.value })}
                  placeholder="es. budget"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleAddColumn}
              disabled={!newColumn.label.trim() || !newColumn.field.trim()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Aggiungi Colonna
            </button>

            <p className="text-xs text-slate-500">
              💡 Il campo database deve corrispondere esattamente al nome del campo in Firestore
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 text-sm font-medium"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Salvataggio...' : 'Salva Configurazione'}
          </button>
        </div>
      </div>
    </div>
  );
}
