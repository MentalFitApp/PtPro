import React, { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';

/**
 * Componente per configurare quali dati mostrare nei widget della dashboard
 */
function WidgetContentConfig({ widgetId, widgetName, onClose, onSave }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    showLeadsToday: true,
    showLeadsWeek: true,
    showLeadsMonth: true,
    showLeadsTotal: true,
    showClosedDeals: true,
    showConversionRate: true,
    showSettingCalls: true,
    showShowUpRate: true,
    showDmsStats: true,
    maxItemsInLists: 5,
    chartType: 'bar', // bar, line, doughnut
  });

  // Configurazioni disponibili per tipo di widget
  const availableConfigs = {
    lead_totals: [
      { id: 'showLeadsToday', label: 'Lead Oggi', description: 'Numero lead ricevuti oggi' },
      { id: 'showLeadsWeek', label: 'Lead Settimana', description: 'Lead ultimi 7 giorni' },
      { id: 'showLeadsMonth', label: 'Lead Mese', description: 'Lead del mese corrente' },
      { id: 'showLeadsTotal', label: 'Lead Totali', description: 'Tutti i lead nel periodo' },
    ],
    sales_stats: [
      { id: 'showClosedDeals', label: 'Vendite Chiuse', description: 'Numero totale vendite' },
      { id: 'showConversionRate', label: 'Tasso Conversione', description: 'Percentuale chiusura' },
      { id: 'showRevenue', label: 'Fatturato', description: 'Totale revenue generato' },
      { id: 'showAvgDealSize', label: 'Valore Medio', description: 'Importo medio vendita' },
    ],
    setting_stats: [
      { id: 'showSettingCalls', label: 'Call Prenotate', description: 'Numero call di setting' },
      { id: 'showShowUpRate', label: 'Tasso Show-Up', description: 'Percentuale presenze' },
      { id: 'showFollowUps', label: 'Follow-Up', description: 'Follow-up effettuati' },
      { id: 'showDialedStats', label: 'Dialed Stats', description: 'Statistiche chiamate' },
    ],
    dms_tracker: [
      { id: 'showDmsStats', label: 'DMS Statistiche', description: 'Tracking messaggi DM' },
      { id: 'showResponseRate', label: 'Tasso Risposta', description: 'Percentuale risposte' },
      { id: 'maxItemsInLists', label: 'Max Items Lista', description: 'Numero massimo elementi', type: 'number' },
    ],
    sales_chart: [
      { id: 'chartType', label: 'Tipo Grafico', description: 'Stile visualizzazione', type: 'select', options: [
        { value: 'bar', label: 'Barre' },
        { value: 'line', label: 'Linee' },
        { value: 'doughnut', label: 'Torta' },
      ]},
    ],
  };

  const currentConfigs = availableConfigs[widgetId] || [];

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configDoc = await getDoc(getTenantDoc(db, 'settings', `widgetConfig_${widgetId}`));
        if (configDoc.exists()) {
          setConfig({ ...config, ...configDoc.data() });
        }
      } catch (error) {
        console.error('Errore caricamento configurazione widget:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [widgetId]);

  const handleToggle = (fieldId) => {
    setConfig({ ...config, [fieldId]: !config[fieldId] });
  };

  const handleChange = (fieldId, value) => {
    setConfig({ ...config, [fieldId]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(getTenantDoc(db, 'settings', `widgetConfig_${widgetId}`), {
        ...config,
        widgetId,
        updatedAt: new Date().toISOString(),
      });
      
      if (onSave) onSave(config);
      alert('Configurazione widget salvata!');
      onClose();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
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
          <h2 className="text-xl font-bold text-slate-100">
            Configura Widget: {widgetName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentConfigs.length === 0 ? (
            <p className="text-center text-slate-400 py-8">
              Questo widget non ha opzioni configurabili
            </p>
          ) : (
            currentConfigs.map(field => (
              <div
                key={field.id}
                className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-200 mb-1">
                      {field.label}
                    </h4>
                    <p className="text-xs text-slate-500">{field.description}</p>
                  </div>

                  {/* Toggle/Input basato sul tipo */}
                  {field.type === 'number' ? (
                    <input
                      type="number"
                      value={config[field.id] || 5}
                      onChange={(e) => handleChange(field.id, parseInt(e.target.value) || 5)}
                      min="1"
                      max="20"
                      className="w-20 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={config[field.id] || field.options[0].value}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200"
                    >
                      {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => handleToggle(field.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        config[field.id]
                          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                          : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'
                      }`}
                      title={config[field.id] ? 'Visibile' : 'Nascosto'}
                    >
                      {config[field.id] ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
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

export default WidgetContentConfig;
