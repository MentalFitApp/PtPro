import React, { useState, useEffect } from 'react';
import { getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';

/**
 * Widget per visualizzare statistiche sui campi personalizzati
 */
export default function CustomFieldsWidget({ leads }) {
  const [customColumns, setCustomColumns] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const loadCustomColumns = async () => {
      try {
        const configDoc = await getDoc(getTenantDoc(db, 'settings', 'leadColumns'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.columns) {
            const custom = data.columns.filter(c => c.custom && c.visible);
            setCustomColumns(custom);
          }
        }
      } catch (error) {
        console.error('Errore caricamento colonne custom:', error);
      }
    };
    
    loadCustomColumns();
  }, []);

  useEffect(() => {
    if (customColumns.length === 0 || leads.length === 0) return;

    const newStats = {};
    
    customColumns.forEach(col => {
      const fieldId = col.field || col.id;
      const values = leads
        .map(lead => lead[fieldId])
        .filter(val => val !== undefined && val !== null && val !== '');
      
      newStats[fieldId] = {
        label: col.label,
        total: values.length,
        filled: values.filter(v => v !== '').length,
        percentage: leads.length > 0 ? Math.round((values.length / leads.length) * 100) : 0,
        uniqueValues: [...new Set(values)].length,
      };
    });
    
    setStats(newStats);
  }, [customColumns, leads]);

  if (customColumns.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        <p className="text-sm">Nessun campo personalizzato configurato</p>
        <p className="text-xs mt-2">Vai in Collaboratori → Colonne per aggiungerne</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-full overflow-y-auto">
      {customColumns.map(col => {
        const fieldId = col.field || col.id;
        const stat = stats[fieldId] || { total: 0, filled: 0, percentage: 0, uniqueValues: 0 };
        
        return (
          <div key={fieldId} className="p-3 bg-slate-900/40 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-200">{col.label}</h4>
              <span className="text-xs text-slate-400">Campo: {fieldId}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-blue-400">{stat.filled}</div>
                <div className="text-xs text-slate-500">Compilati</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-400">{stat.percentage}%</div>
                <div className="text-xs text-slate-500">Completezza</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-400">{stat.uniqueValues}</div>
                <div className="text-xs text-slate-500">Valori Unici</div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
