import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Target, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

/**
 * Componente per creare widget personalizzati con metriche selezionabili
 */
function CustomWidgetCreator({ onClose, onSave }) {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [widgetName, setWidgetName] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [customWidgets, setCustomWidgets] = useState([]);

  // Metriche disponibili
  const availableMetrics = [
    { 
      id: 'total_leads', 
      label: 'Lead Totali', 
      description: 'Numero totale di lead',
      icon: Target,
      getValue: (leads) => leads.length,
      color: 'blue'
    },
    { 
      id: 'leads_today', 
      label: 'Lead Oggi', 
      description: 'Lead ricevuti oggi',
      icon: Calendar,
      getValue: (leads) => {
        const today = new Date().toISOString().split('T')[0];
        return leads.filter(l => l.createdAt?.startsWith(today)).length;
      },
      color: 'green'
    },
    { 
      id: 'leads_week', 
      label: 'Lead Settimana', 
      description: 'Lead ultimi 7 giorni',
      icon: TrendingUp,
      getValue: (leads) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return leads.filter(l => new Date(l.createdAt) >= weekAgo).length;
      },
      color: 'cyan'
    },
    { 
      id: 'show_up', 
      label: 'Show Up', 
      description: 'Lead con show up',
      icon: Users,
      getValue: (leads) => leads.filter(l => l.showUp).length,
      color: 'emerald'
    },
    { 
      id: 'chiuso', 
      label: 'Chiusi', 
      description: 'Lead chiusi',
      icon: DollarSign,
      getValue: (leads) => leads.filter(l => l.chiuso).length,
      color: 'rose'
    },
    { 
      id: 'conversion_rate', 
      label: 'Tasso Conversione', 
      description: 'Percentuale chiusura',
      icon: TrendingUp,
      getValue: (leads) => {
        const chiusi = leads.filter(l => l.chiuso).length;
        const total = leads.length;
        return total > 0 ? `${((chiusi / total) * 100).toFixed(1)}%` : '0%';
      },
      color: 'purple'
    },
    { 
      id: 'avg_response_time', 
      label: 'Tempo Medio Risposta', 
      description: 'Media risposta DMS',
      icon: Calendar,
      getValue: (leads) => {
        const withResponse = leads.filter(l => l.responseTime);
        if (withResponse.length === 0) return '0h';
        const avg = withResponse.reduce((sum, l) => sum + l.responseTime, 0) / withResponse.length;
        return `${avg.toFixed(1)}h`;
      },
      color: 'amber'
    },
  ];

  // Carica widget personalizzati esistenti
  useEffect(() => {
    loadCustomWidgets();
  }, []);

  const loadCustomWidgets = async () => {
    try {
      const doc = await getDoc(getTenantDoc(db, 'settings', 'customWidgets'));
      if (doc.exists()) {
        setCustomWidgets(doc.data().widgets || []);
      }
    } catch (error) {
      console.error('Errore caricamento widget custom:', error);
    }
  };

  const toggleMetric = (metricId) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metricId));
    } else {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };

  const handleSaveWidget = async () => {
    if (!widgetName.trim()) {
      toast.warning('Inserisci un nome per il widget');
      return;
    }
    if (selectedMetrics.length === 0) {
      toast.warning('Seleziona almeno una metrica');
      return;
    }

    setLoading(true);
    try {
      const newWidget = {
        id: `custom_${Date.now()}`,
        name: widgetName,
        metrics: selectedMetrics,
        createdAt: new Date().toISOString(),
      };

      const updatedWidgets = [...customWidgets, newWidget];
      
      await setDoc(getTenantDoc(db, 'settings', 'customWidgets'), {
        widgets: updatedWidgets,
        updatedAt: new Date().toISOString(),
      });

      toast.success('Widget creato con successo!');
      onSave(newWidget);
      onClose();
    } catch (error) {
      console.error('Errore salvataggio widget:', error);
      toast.error('Errore nel salvataggio del widget');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWidget = async (widgetId) => {
    const confirmed = await confirmDelete('questo widget personalizzato');
    if (!confirmed) return;

    try {
      const updatedWidgets = customWidgets.filter(w => w.id !== widgetId);
      await setDoc(getTenantDoc(db, 'settings', 'customWidgets'), {
        widgets: updatedWidgets,
        updatedAt: new Date().toISOString(),
      });
      setCustomWidgets(updatedWidgets);
      toast.success('Widget eliminato');
    } catch (error) {
      console.error('Errore eliminazione widget:', error);
      toast.error('Errore nell\'eliminazione del widget');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Crea Widget Personalizzato</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Nome Widget */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome Widget
            </label>
            <input
              type="text"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              placeholder="Es: Le mie metriche chiave"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Selezione Metriche */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Seleziona Metriche da Mostrare
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableMetrics.map(metric => {
                const Icon = metric.icon;
                const isSelected = selectedMetrics.includes(metric.id);
                return (
                  <button
                    key={metric.id}
                    onClick={() => toggleMetric(metric.id)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      isSelected
                        ? `bg-${metric.color}-500/20 border-${metric.color}-500 shadow-lg`
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={20} className={isSelected ? `text-${metric.color}-400` : 'text-slate-400'} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                            {metric.label}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-green-400">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget Esistenti */}
          {customWidgets.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Widget Personalizzati Esistenti
              </label>
              <div className="space-y-2">
                {customWidgets.map(widget => (
                  <div key={widget.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-100">{widget.name}</p>
                      <p className="text-xs text-slate-500">{widget.metrics.length} metriche</p>
                    </div>
                    <button
                      onClick={() => handleDeleteWidget(widget.id)}
                      className="text-rose-400 hover:text-rose-300 transition-colors p-2"
                      title="Elimina widget"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-slate-100 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSaveWidget}
            disabled={loading || !widgetName.trim() || selectedMetrics.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            {loading ? 'Creazione...' : 'Crea Widget'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomWidgetCreator;
