// src/components/admin/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { Reorder, motion } from 'framer-motion';
import { GripVertical, Eye, EyeOff, RotateCcw, Edit3 } from 'lucide-react';

/**
 * Layout Drag & Drop per Dashboard
 * Consente di riorganizzare e nascondere sezioni
 */
export default function DashboardLayout({ children, isCustomizing = false }) {
  const [sections, setSections] = useState([]);
  const [hiddenSections, setHiddenSections] = useState(new Set());

  // Carica layout salvato
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard_layout');
    const savedHidden = localStorage.getItem('dashboard_hidden');
    
    if (savedLayout) {
      setSections(JSON.parse(savedLayout));
    } else {
      // Layout default
      setSections([
        { id: 'kpi', label: 'KPI Dashboard', defaultVisible: true },
        { id: 'chart', label: 'Grafico Andamento', defaultVisible: true },
        { id: 'focus', label: 'Focus del Giorno', defaultVisible: true },
      ]);
    }
    
    if (savedHidden) {
      setHiddenSections(new Set(JSON.parse(savedHidden)));
    }
  }, []);

  // Salva layout
  const saveLayout = (newSections) => {
    setSections(newSections);
    localStorage.setItem('dashboard_layout', JSON.stringify(newSections));
  };

  // Salva sezioni nascoste
  const saveHidden = (newHidden) => {
    setHiddenSections(newHidden);
    localStorage.setItem('dashboard_hidden', JSON.stringify([...newHidden]));
  };

  // Toggle visibilità sezione
  const toggleSection = (sectionId) => {
    const newHidden = new Set(hiddenSections);
    if (newHidden.has(sectionId)) {
      newHidden.delete(sectionId);
    } else {
      newHidden.add(sectionId);
    }
    saveHidden(newHidden);
  };

  // Reset layout
  const resetLayout = () => {
    const defaultLayout = [
      { id: 'kpi', label: 'KPI Dashboard', defaultVisible: true },
      { id: 'chart', label: 'Grafico Andamento', defaultVisible: true },
      { id: 'focus', label: 'Focus del Giorno', defaultVisible: true },
    ];
    setSections(defaultLayout);
    setHiddenSections(new Set());
    localStorage.removeItem('dashboard_layout');
    localStorage.removeItem('dashboard_hidden');
  };

  // Render children con inject di props
  const renderSection = (section) => {
    const child = React.Children.toArray(children).find(
      c => c.props['data-section-id'] === section.id
    );
    
    if (!child || hiddenSections.has(section.id)) return null;
    
    return (
      <Reorder.Item
        key={section.id}
        value={section}
        className="group"
      >
        <div className="relative">
          {/* Drag Handle (solo in modalità customize) */}
          {isCustomizing && (
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
              <GripVertical size={20} className="text-slate-500" />
            </div>
          )}
          
          {/* Content */}
          {child}
        </div>
      </Reorder.Item>
    );
  };

  return (
    <div className="relative">
      {/* Customization Panel (Gestito da GlobalCustomize) */}
      {isCustomizing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 mb-6 mx-3 sm:mx-6"
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Seleziona sezioni da visualizzare
          </h3>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <motion.button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  hiddenSections.has(section.id)
                    ? 'bg-slate-900/30 border border-slate-700 text-slate-500'
                    : 'bg-slate-700/50 border border-slate-600 text-slate-200'
                }`}
              >
                {hiddenSections.has(section.id) ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
                {section.label}
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            💡 Trascina le sezioni per riordinarle • Clicca l'icona occhio per nascondere/mostrare
          </p>
        </motion.div>
      )}

      {/* Reorderable Sections */}
      <Reorder.Group
        axis="y"
        values={sections}
        onReorder={saveLayout}
        className="space-y-3 sm:space-y-6"
      >
        {sections.map(renderSection)}
      </Reorder.Group>
    </div>
  );
}
