/**
 * FormPopupSettings - Componente riutilizzabile per le impostazioni dei Form Popup
 * Include sistema di preset salvabili
 */
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FolderOpen, X } from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Preset di default del sistema
const DEFAULT_PRESETS = [
  {
    id: 'lead_basic',
    name: '📧 Lead Base',
    description: 'Nome + Email',
    isSystem: true,
    config: {
      formPopupTitle: 'Richiedi Informazioni',
      formPopupSubtitle: 'Compila il form e ti ricontatteremo',
      formPopupFields: 'name,email',
      formPopupSubmitText: 'Invia Richiesta',
      formPopupSuccessMessage: 'Grazie! Ti contatteremo presto.',
      formPopupAfterSubmit: 'message',
    }
  },
  {
    id: 'lead_complete',
    name: '📱 Lead Completo',
    description: 'Nome + Email + Telefono',
    isSystem: true,
    config: {
      formPopupTitle: 'Richiedi Informazioni',
      formPopupSubtitle: 'Compila il form e ti ricontatteremo entro 24 ore',
      formPopupFields: 'name,email,phone',
      formPopupSubmitText: 'Invia Richiesta',
      formPopupSuccessMessage: 'Grazie! Ti contatteremo presto.',
      formPopupAfterSubmit: 'message',
    }
  },
  {
    id: 'download_guide',
    name: '📚 Download Guida',
    description: 'Per lead magnet gratuiti',
    isSystem: true,
    config: {
      formPopupTitle: 'Scarica la Guida Gratuita',
      formPopupSubtitle: 'Inserisci i tuoi dati per ricevere la guida via email',
      formPopupFields: 'name,email',
      formPopupSubmitText: 'Scarica GRATIS',
      formPopupSuccessMessage: '🎉 Perfetto! Controlla la tua email per scaricare la guida!',
      formPopupAfterSubmit: 'message',
    }
  },
  {
    id: 'consultation',
    name: '📅 Consulenza',
    description: 'Con messaggio opzionale',
    isSystem: true,
    config: {
      formPopupTitle: 'Prenota una Consulenza Gratuita',
      formPopupSubtitle: 'Raccontaci di te e ti ricontatteremo per fissare un appuntamento',
      formPopupFields: 'name,email,phone,message',
      formPopupSubmitText: 'Prenota Consulenza',
      formPopupSuccessMessage: 'Perfetto! Ti contatteremo presto per fissare la consulenza.',
      formPopupAfterSubmit: 'message',
    }
  },
  {
    id: 'whatsapp_redirect',
    name: '💬 Redirect WhatsApp',
    description: 'Dopo invio apre WhatsApp',
    isSystem: true,
    config: {
      formPopupTitle: 'Contattaci su WhatsApp',
      formPopupSubtitle: 'Lascia i tuoi dati e verrai reindirizzato alla chat',
      formPopupFields: 'name,email,phone',
      formPopupSubmitText: 'Vai a WhatsApp',
      formPopupSuccessMessage: 'Reindirizzamento a WhatsApp...',
      formPopupAfterSubmit: 'whatsapp',
      formPopupWhatsappNumber: '',
    }
  },
];

/**
 * FormPopupSettings Component
 */
const FormPopupSettings = ({ 
  localSettings, 
  handleChange, 
  renderField, 
  FieldGroup,
  tenantId 
}) => {
  const [presets, setPresets] = useState([...DEFAULT_PRESETS]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [loadingPresets, setLoadingPresets] = useState(false);

  // Carica preset salvati del tenant
  useEffect(() => {
    if (tenantId) {
      loadTenantPresets();
    }
  }, [tenantId]);

  const loadTenantPresets = async () => {
    if (!tenantId) return;
    
    try {
      setLoadingPresets(true);
      const presetsRef = collection(db, 'tenants', tenantId, 'form_popup_presets');
      const snapshot = await getDocs(presetsRef);
      
      const tenantPresets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isSystem: false
      }));
      
      setPresets([...DEFAULT_PRESETS, ...tenantPresets]);
    } catch (error) {
      console.error('Errore caricamento preset:', error);
    } finally {
      setLoadingPresets(false);
    }
  };

  const applyPreset = (preset) => {
    Object.entries(preset.config).forEach(([key, value]) => {
      handleChange(key, value);
    });
    setShowPresetModal(false);
  };

  const saveAsPreset = async () => {
    if (!newPresetName.trim() || !tenantId) return;
    
    try {
      const presetId = `custom_${Date.now()}`;
      const presetData = {
        name: newPresetName,
        description: newPresetDescription || '',
        config: {
          formPopupTitle: localSettings.formPopupTitle || '',
          formPopupSubtitle: localSettings.formPopupSubtitle || '',
          formPopupFields: localSettings.formPopupFields || 'name,email',
          formPopupCustomFields: localSettings.formPopupCustomFields || [],
          formPopupSubmitText: localSettings.formPopupSubmitText || 'Invia',
          formPopupSuccessMessage: localSettings.formPopupSuccessMessage || '',
          formPopupAfterSubmit: localSettings.formPopupAfterSubmit || 'message',
          formPopupRedirectUrl: localSettings.formPopupRedirectUrl || '',
          formPopupWhatsappNumber: localSettings.formPopupWhatsappNumber || '',
        },
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(
        doc(db, 'tenants', tenantId, 'form_popup_presets', presetId),
        presetData
      );
      
      // Ricarica preset
      await loadTenantPresets();
      
      setShowSavePresetModal(false);
      setNewPresetName('');
      setNewPresetDescription('');
    } catch (error) {
      console.error('Errore salvataggio preset:', error);
    }
  };

  const deletePreset = async (presetId) => {
    if (!tenantId) return;
    
    try {
      await deleteDoc(doc(db, 'tenants', tenantId, 'form_popup_presets', presetId));
      await loadTenantPresets();
    } catch (error) {
      console.error('Errore eliminazione preset:', error);
    }
  };

  return (
    <>
      {/* Preset Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowPresetModal(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
        >
          <FolderOpen className="w-4 h-4" />
          Carica Preset
        </button>
        <button
          onClick={() => setShowSavePresetModal(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          Salva Preset
        </button>
      </div>

      {/* Form Popup Fields */}
      <FieldGroup label="Titolo Form">
        {renderField('formPopupTitle', localSettings.formPopupTitle || 'Richiedi Informazioni', 'text')}
      </FieldGroup>
      
      <FieldGroup label="Sottotitolo">
        {renderField('formPopupSubtitle', localSettings.formPopupSubtitle, 'text', {
          placeholder: 'Compila il form e ti ricontatteremo'
        })}
      </FieldGroup>
      
      <FieldGroup label="Campi Form">
        {renderField('formPopupFields', localSettings.formPopupFields || 'name,email,phone', 'select', {
          options: [
            { value: 'name,email', label: 'Nome + Email' },
            { value: 'name,email,phone', label: 'Nome + Email + Telefono' },
            { value: 'name,email,phone,message', label: 'Nome + Email + Telefono + Messaggio' },
            { value: 'name,email,message', label: 'Nome + Email + Messaggio' },
            { value: 'custom', label: '⚙️ Campi Personalizzati' },
          ]
        })}
      </FieldGroup>
      
      {/* Editor Campi Personalizzati */}
      {localSettings.formPopupFields === 'custom' && (
        <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Campi Personalizzati</span>
            <button
              onClick={() => {
                const currentFields = localSettings.formPopupCustomFields || [];
                handleChange('formPopupCustomFields', [
                  ...currentFields,
                  { 
                    id: `field_${Date.now()}`, 
                    label: 'Nuovo Campo', 
                    type: 'text', 
                    required: false,
                    placeholder: ''
                  }
                ]);
              }}
              className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition-colors"
            >
              + Aggiungi Campo
            </button>
          </div>
          
          {(localSettings.formPopupCustomFields || []).length === 0 && (
            <p className="text-xs text-slate-500 text-center py-2">
              Nessun campo. Clicca &quot;Aggiungi Campo&quot; per iniziare.
            </p>
          )}
          
          {(localSettings.formPopupCustomFields || []).map((field, index) => (
            <div key={field.id} className="p-3 bg-slate-800/50 rounded-lg space-y-2 border border-slate-600/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Campo {index + 1}</span>
                <button
                  onClick={() => {
                    const newFields = [...(localSettings.formPopupCustomFields || [])];
                    newFields.splice(index, 1);
                    handleChange('formPopupCustomFields', newFields);
                  }}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => {
                    const newFields = [...(localSettings.formPopupCustomFields || [])];
                    newFields[index] = { ...field, label: e.target.value };
                    handleChange('formPopupCustomFields', newFields);
                  }}
                  placeholder="Etichetta"
                  className="px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500"
                />
                <select
                  value={field.type}
                  onChange={(e) => {
                    const newFields = [...(localSettings.formPopupCustomFields || [])];
                    newFields[index] = { ...field, type: e.target.value };
                    handleChange('formPopupCustomFields', newFields);
                  }}
                  className="px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                >
                  <option value="text">Testo</option>
                  <option value="name">Nome</option>
                  <option value="cognome">Cognome</option>
                  <option value="email">Email</option>
                  <option value="tel">Telefono</option>
                  <option value="number">Numero</option>
                  <option value="textarea">Area Testo</option>
                  <option value="select">Selezione</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="date">Data</option>
                </select>
              </div>
              
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => {
                  const newFields = [...(localSettings.formPopupCustomFields || [])];
                  newFields[index] = { ...field, placeholder: e.target.value };
                  handleChange('formPopupCustomFields', newFields);
                }}
                placeholder="Placeholder (opzionale)"
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500"
              />
              
              {field.type === 'select' && (
                <input
                  type="text"
                  value={field.options || ''}
                  onChange={(e) => {
                    const newFields = [...(localSettings.formPopupCustomFields || [])];
                    newFields[index] = { ...field, options: e.target.value };
                    handleChange('formPopupCustomFields', newFields);
                  }}
                  placeholder="Opzioni separate da virgola (es: Opzione 1, Opzione 2)"
                  className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500"
                />
              )}
              
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => {
                    const newFields = [...(localSettings.formPopupCustomFields || [])];
                    newFields[index] = { ...field, required: e.target.checked };
                    handleChange('formPopupCustomFields', newFields);
                  }}
                  className="rounded bg-slate-700 border-slate-600"
                />
                Obbligatorio
              </label>
            </div>
          ))}
        </div>
      )}
      
      <FieldGroup label="Testo Bottone Invio">
        {renderField('formPopupSubmitText', localSettings.formPopupSubmitText || 'Invia Richiesta', 'text')}
      </FieldGroup>
      
      <FieldGroup label="Messaggio Successo">
        {renderField('formPopupSuccessMessage', localSettings.formPopupSuccessMessage || 'Grazie! Ti contatteremo presto.', 'textarea')}
      </FieldGroup>
      
      <FieldGroup label="Dopo invio">
        {renderField('formPopupAfterSubmit', localSettings.formPopupAfterSubmit || 'message', 'select', {
          options: [
            { value: 'message', label: 'Mostra messaggio' },
            { value: 'redirect', label: 'Redirect a URL' },
            { value: 'whatsapp', label: 'Apri WhatsApp' },
            { value: 'close', label: 'Chiudi popup' },
          ]
        })}
      </FieldGroup>
      
      {localSettings.formPopupAfterSubmit === 'redirect' && (
        <FieldGroup label="URL Redirect">
          {renderField('formPopupRedirectUrl', localSettings.formPopupRedirectUrl, 'text', { placeholder: 'https://...' })}
        </FieldGroup>
      )}
      
      {localSettings.formPopupAfterSubmit === 'whatsapp' && (
        <FieldGroup label="Numero WhatsApp">
          {renderField('formPopupWhatsappNumber', localSettings.formPopupWhatsappNumber, 'text', { placeholder: '+393331234567' })}
        </FieldGroup>
      )}

      {/* Preset Selection Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Carica Preset Form</h3>
              <button
                onClick={() => setShowPresetModal(false)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {loadingPresets ? (
                <p className="text-center text-slate-400 py-4">Caricamento...</p>
              ) : (
                <>
                  <p className="text-xs text-slate-400 mb-3">Preset di Sistema</p>
                  {presets.filter(p => p.isSystem).map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-white">{preset.name}</div>
                      <div className="text-xs text-slate-400">{preset.description}</div>
                    </button>
                  ))}
                  
                  {presets.filter(p => !p.isSystem).length > 0 && (
                    <>
                      <p className="text-xs text-slate-400 mt-4 mb-3">I Tuoi Preset</p>
                      {presets.filter(p => !p.isSystem).map(preset => (
                        <div key={preset.id} className="flex items-center gap-2">
                          <button
                            onClick={() => applyPreset(preset)}
                            className="flex-1 text-left p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/30"
                          >
                            <div className="font-medium text-purple-300">{preset.name}</div>
                            <div className="text-xs text-slate-400">{preset.description}</div>
                          </button>
                          <button
                            onClick={() => deletePreset(preset.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Salva come Preset</h3>
              <button
                onClick={() => setShowSavePresetModal(false)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Nome Preset *</label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Es: Form Consulenza Fitness"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Descrizione (opzionale)</label>
                <input
                  type="text"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="Es: Per lead di consulenze gratuite"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">Questo preset salverà:</p>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• Titolo: {localSettings.formPopupTitle || '(vuoto)'}</li>
                  <li>• Sottotitolo: {localSettings.formPopupSubtitle || '(vuoto)'}</li>
                  <li>• Campi: {localSettings.formPopupFields || 'name,email'}</li>
                  <li>• Bottone: {localSettings.formPopupSubmitText || 'Invia'}</li>
                  <li>• Dopo invio: {localSettings.formPopupAfterSubmit || 'message'}</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSavePresetModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={saveAsPreset}
                  disabled={!newPresetName.trim()}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salva Preset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormPopupSettings;
