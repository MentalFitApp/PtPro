import React, { useState, useEffect } from 'react';
import { updateDoc } from 'firebase/firestore';
import { getTenantDoc } from '../../config/tenant';
import { db } from '../../firebase';
import { Edit2, Save, X, Settings, Columns, FileText } from 'lucide-react';
import LeadStatusConfig from '../dashboard/LeadStatusConfig';
import LeadColumnsConfig from '../dashboard/LeadColumnsConfig';

/**
 * Tabella leads con checkmarks dinamici e personalizzabili
 */
export default function LeadsTable({ leads, leadStatuses, columns = [], onRefresh, showConfig = false }) {
  const [editingLead, setEditingLead] = useState(null);
  const [showStatusConfig, setShowStatusConfig] = useState(false);
  const [showColumnsConfig, setShowColumnsConfig] = useState(false);
  const [localStatuses, setLocalStatuses] = useState(leadStatuses);
  const [localColumns, setLocalColumns] = useState(columns);
  const [notePopup, setNotePopup] = useState({ show: false, leadName: '', note: '' });

  useEffect(() => {
    setLocalStatuses(leadStatuses);
  }, [leadStatuses]);
  
  useEffect(() => {
    if (columns.length > 0) {
      setLocalColumns(columns);
    }
  }, [columns]);

  const handleToggleStatus = async (leadId, statusId, currentValue) => {
    if (editingLead !== leadId) return; // Solo in modalità editing
    
    try {
      await updateDoc(getTenantDoc(db, 'leads', leadId), {
        [statusId]: !currentValue,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Errore aggiornamento status lead:', error);
      alert('Errore nell\'aggiornamento');
    }
  };

  const getColorClass = (color) => {
    const colorMap = {
      blue: { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-500' },
      green: { bg: 'bg-green-600', text: 'text-green-100', border: 'border-green-500' },
      rose: { bg: 'bg-rose-600', text: 'text-rose-100', border: 'border-rose-500' },
      yellow: { bg: 'bg-yellow-600', text: 'text-yellow-100', border: 'border-yellow-500' },
      purple: { bg: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-500' },
      orange: { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-500' },
      teal: { bg: 'bg-teal-600', text: 'text-teal-100', border: 'border-teal-500' },
      pink: { bg: 'bg-pink-600', text: 'text-pink-100', border: 'border-pink-500' },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      {/* Header con config buttons */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100">Leads ({leads.length})</h3>
        {showConfig && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColumnsConfig(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <Columns size={16} />
              Colonne
            </button>
            <button
              onClick={() => setShowStatusConfig(true)}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
            >
              <Settings size={16} />
              Status
            </button>
          </div>
        )}
      </div>

      {/* Tabella con scroll interno */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full min-w-max">
          <thead className="bg-slate-900/60 sticky top-0">
            <tr className="border-b border-slate-700">
              {localColumns.filter(col => col.visible).map(column => (
                <th key={column.id} className="px-4 py-3 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">
                  {column.label}
                </th>
              ))}
              {localStatuses.map(status => (
                <th key={status.id} className="px-4 py-3 text-center text-xs font-semibold text-slate-300">
                  <div className="flex items-center justify-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getColorClass(status.color).bg}`} />
                    {status.label}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={localColumns.filter(c => c.visible).length + localStatuses.length + 1} className="px-4 py-8 text-center text-slate-400">
                  Nessun lead trovato
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isEditing = editingLead === lead.id;
                
                // Funzione per renderizzare celle dinamicamente
                const renderCell = (column) => {
                  const fieldId = column.field || column.id;
                  const value = lead[fieldId];
                  
                  // Gestione campi speciali
                  if (fieldId === 'dataPrenotazione' && value) {
                    return new Date(value).toLocaleDateString('it-IT');
                  }
                  
                  // Campo note con textarea e pulsante popup
                  if (fieldId === 'note') {
                    return (
                      <div className="max-w-[200px]">
                        {isEditing ? (
                          <textarea
                            defaultValue={value || ''}
                            onBlur={(e) => {
                              if (e.target.value !== value) {
                                updateDoc(getTenantDoc(db, 'leads', lead.id), { [fieldId]: e.target.value });
                              }
                            }}
                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm resize-none"
                            rows={2}
                            placeholder="Note..."
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="line-clamp-2 flex-1">{value || '-'}</span>
                            {value && (
                              <button
                                onClick={() => setNotePopup({ show: true, leadName: lead.name, note: value })}
                                className="p-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors flex-shrink-0"
                                title="Visualizza nota completa"
                              >
                                <FileText size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Campo numerico (dialed, amount, etc)
                  if (fieldId === 'dialed' || fieldId === 'amount' || fieldId === 'mesi') {
                    return isEditing ? (
                      <input
                        type="number"
                        defaultValue={value ?? 0}
                        onBlur={(e) => {
                          const newVal = parseFloat(e.target.value) || 0;
                          if (newVal !== value) {
                            updateDoc(getTenantDoc(db, 'leads', lead.id), { [fieldId]: newVal });
                          }
                        }}
                        className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-center"
                      />
                    ) : (
                      <span className="text-sm text-slate-300">{value ?? 0}</span>
                    );
                  }
                  
                  // Campo email con truncate
                  if (fieldId === 'email') {
                    return (
                      <span className="max-w-[150px] truncate block">{value || '-'}</span>
                    );
                  }
                  
                  // Campo testo standard (editabile)
                  return isEditing ? (
                    <input
                      type="text"
                      defaultValue={value || ''}
                      onBlur={(e) => {
                        if (e.target.value !== value) {
                          updateDoc(getTenantDoc(db, 'leads', lead.id), { [fieldId]: e.target.value });
                        }
                      }}
                      className="w-32 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm"
                      placeholder={column.label}
                    />
                  ) : (
                    <span>{value || '-'}</span>
                  );
                };
                
                return (
                  <tr 
                    key={lead.id} 
                    className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors ${isEditing ? 'bg-blue-500/10' : ''}`}
                  >
                    {/* Colonne dinamiche */}
                    {localColumns.filter(col => col.visible).map(column => (
                      <td 
                        key={column.id} 
                        className={`px-4 py-3 text-sm text-slate-300 whitespace-nowrap ${
                          column.id === 'name' ? 'text-slate-200 font-medium' : ''
                        }`}
                      >
                        {renderCell(column)}
                      </td>
                    ))}
                    
                    {/* Status dinamici */}
                    {localStatuses.map(status => {
                      const isActive = !!lead[status.id];
                      const colors = getColorClass(status.color);
                      
                      return (
                        <td key={status.id} className="px-4 py-3 text-center whitespace-nowrap">
                          {isEditing ? (
                            <button
                              onClick={() => handleToggleStatus(lead.id, status.id, isActive)}
                              className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${
                                isActive 
                                  ? `${colors.bg} ${colors.border}` 
                                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                              }`}
                            >
                              {isActive && (
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ) : (
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              isActive 
                                ? `${colors.bg} ${colors.text}` 
                                : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              {isActive ? 'Sì' : 'No'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    
                    {/* Azioni */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <button
                          onClick={() => setEditingLead(null)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs flex items-center gap-1 mx-auto"
                        >
                          <Save size={14} />
                          Salva
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingLead(lead.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs flex items-center gap-1 mx-auto"
                        >
                          <Edit2 size={14} />
                          Modifica
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info footer */}
      {editingLead && (
        <div className="p-3 bg-blue-500/10 border-t border-blue-500/30">
          <p className="text-xs text-blue-300 text-center">
            ✏️ Modalità modifica attiva - Clicca sui checkbox per modificare gli status
          </p>
        </div>
      )}

      {/* Status Config Modal */}
      {showStatusConfig && (
        <LeadStatusConfig
          onClose={() => setShowStatusConfig(false)}
          onSave={(newStatuses) => {
            setLocalStatuses(newStatuses.filter(s => s.enabled));
            setShowStatusConfig(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
      
      {/* Columns Config Modal */}
      {showColumnsConfig && (
        <LeadColumnsConfig
          onClose={() => setShowColumnsConfig(false)}
          onSave={(newColumns) => {
            setLocalColumns(newColumns);
            setShowColumnsConfig(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
      
      {/* Note Popup Modal */}
      {notePopup.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-100">Note - {notePopup.leadName}</h3>
              </div>
              <button
                onClick={() => setNotePopup({ show: false, leadName: '', note: '' })}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {notePopup.note}
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setNotePopup({ show: false, leadName: '', note: '' })}
                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 text-sm font-medium"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
