// src/pages/admin/landingPages/components/SectionEditorCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Edit3, Trash2, GripVertical, Sparkles, ChevronUp, ChevronDown,
  Eye, Settings, Wand2, Loader2
} from 'lucide-react';
import { quickEditSection } from '../../../../services/openai';

const SECTION_TYPES = {
  hero: { name: 'Hero Banner', color: 'from-purple-500 to-pink-500' },
  videoUpload: { name: 'Upload Video', color: 'from-red-500 to-orange-500' },
  contactForm: { name: 'Form Contatto', color: 'from-blue-500 to-cyan-500' },
  features: { name: 'Features', color: 'from-green-500 to-emerald-500' },
  pricing: { name: 'Pricing', color: 'from-amber-500 to-orange-500' },
  testimonials: { name: 'Testimonianze', color: 'from-pink-500 to-rose-500' },
  cta: { name: 'Call to Action', color: 'from-indigo-500 to-purple-500' },
  faq: { name: 'FAQ', color: 'from-teal-500 to-cyan-500' }
};

export default function SectionEditorCard({ 
  section, 
  index, 
  totalSections, 
  previewMode,
  onEdit, 
  onUpdate, 
  onMoveUp, 
  onMoveDown, 
  onDelete 
}) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const config = SECTION_TYPES[section.type];

  const handleAISubmit = async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    try {
      const updatedSection = await quickEditSection(section, aiPrompt);
      
      // Applica le modifiche
      if (updatedSection && updatedSection.props) {
        onUpdate(updatedSection.props);
        alert('✓ Sezione modificata con AI!');
      }
      
      setAiPrompt('');
      setShowAIInput(false);
    } catch (error) {
      console.error('AI Quick Edit error:', error);
      alert('Errore AI: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (previewMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl overflow-hidden shadow-xl"
      >
        <SectionPreview section={section} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-800/60 backdrop-blur-sm border-2 rounded-xl overflow-hidden transition-all ${
        showAIInput ? 'border-purple-500 shadow-xl shadow-purple-500/20' : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${config.color} flex items-center justify-center`}>
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{config.name}</h4>
            <p className="text-xs text-slate-500">Sezione {index + 1} di {totalSections}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* AI Quick Edit */}
          <button
            onClick={() => setShowAIInput(!showAIInput)}
            className="p-2 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
            title="Modifica con AI"
          >
            <Wand2 size={18} />
          </button>

          {/* Edit */}
          <button
            onClick={onEdit}
            className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Modifica"
          >
            <Edit3 size={18} />
          </button>

          {/* Move Up */}
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-2 hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Sposta su"
          >
            <ChevronUp size={18} className="text-slate-400" />
          </button>

          {/* Move Down */}
          <button
            onClick={onMoveDown}
            disabled={index === totalSections - 1}
            className="p-2 hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Sposta giù"
          >
            <ChevronDown size={18} className="text-slate-400" />
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
            title="Elimina"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* AI Quick Input */}
      {showAIInput && (
        <div className="p-4 bg-purple-500/10 border-b border-purple-500/30">
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !aiLoading && handleAISubmit()}
              placeholder="es. Cambia il titolo in qualcosa di più accattivante"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              autoFocus
              disabled={aiLoading}
            />
            <button
              onClick={handleAISubmit}
              disabled={aiLoading || !aiPrompt.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {aiLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AI...
                </>
              ) : (
                'Applica'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Content Preview */}
      <div className="p-6">
        <SectionPreview section={section} compact />
      </div>
    </motion.div>
  );
}

// Preview sezione (semplificato)
function SectionPreview({ section, compact = false }) {
  if (!section) {
    return <div className="text-slate-500 text-center py-4">Nessuna anteprima disponibile</div>;
  }

  const { type, props = {} } = section;

  // Fallback se props è undefined
  if (!props || typeof props !== 'object') {
    return (
      <div className="text-slate-500 text-center py-4">
        Sezione {type} - Configura le proprietà
      </div>
    );
  }

  switch (type) {
    case 'hero':
      return (
        <div className={`text-center ${compact ? 'space-y-2' : 'space-y-4 py-20'}`}>
          <h1 className={`font-bold text-white ${compact ? 'text-xl' : 'text-5xl'}`}>
            {props.title || 'Titolo Hero'}
          </h1>
          {props.subtitle && (
            <p className={`text-slate-400 ${compact ? 'text-sm' : 'text-xl'}`}>
              {props.subtitle}
            </p>
          )}
          {props.ctaText && (
            <button className={`${compact ? 'px-4 py-2 text-sm' : 'px-8 py-4 text-lg'} bg-blue-600 text-white rounded-lg font-medium mt-4`}>
              {props.ctaText}
            </button>
          )}
        </div>
      );

    case 'videoUpload':
      return (
        <div className="space-y-4">
          <h2 className={`font-bold text-white ${compact ? 'text-lg' : 'text-3xl'}`}>
            {props.title || 'Carica Video'}
          </h2>
          <p className="text-slate-400 text-sm">{props.description}</p>
          {compact ? (
            <div className="text-xs text-slate-500">
              Max {props.maxSize}MB • Form caricamento video
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <p className="text-slate-400">Drop zone per video (max {props.maxSize}MB)</p>
            </div>
          )}
        </div>
      );

    case 'contactForm':
      return (
        <div className="space-y-4">
          <h2 className={`font-bold text-white ${compact ? 'text-lg' : 'text-3xl'}`}>
            {props.title || 'Contattaci'}
          </h2>
          <p className="text-slate-400 text-sm">{props.description}</p>
          {compact ? (
            <div className="text-xs text-slate-500">
              Form contatto • {[props.showName && 'Nome', props.showEmail && 'Email', props.showPhone && 'Tel', props.showMessage && 'Msg'].filter(Boolean).join(', ')}
            </div>
          ) : (
            <div className="grid gap-3">
              {props.showName && <div className="h-10 bg-slate-700/50 rounded"></div>}
              {props.showEmail && <div className="h-10 bg-slate-700/50 rounded"></div>}
              {props.showPhone && <div className="h-10 bg-slate-700/50 rounded"></div>}
              {props.showMessage && <div className="h-20 bg-slate-700/50 rounded"></div>}
            </div>
          )}
        </div>
      );

    case 'features':
      return (
        <div className="space-y-4">
          <h2 className={`font-bold text-white text-center ${compact ? 'text-lg' : 'text-3xl'}`}>
            {props.title || 'Caratteristiche'}
          </h2>
          <div className={`grid gap-4 ${compact ? 'grid-cols-3' : `grid-cols-${props.columns || 3}`}`}>
            {props.items?.slice(0, compact ? 3 : undefined).map((item, i) => (
              <div key={i} className={`text-center ${compact ? 'text-xs' : ''}`}>
                <div className={`${compact ? 'text-2xl mb-1' : 'text-4xl mb-3'}`}>{item.icon}</div>
                <div className={`font-semibold text-white ${compact ? 'text-xs' : 'text-lg'}`}>{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'pricing':
      return (
        <div className="space-y-4">
          <h2 className={`font-bold text-white text-center ${compact ? 'text-lg' : 'text-3xl'}`}>
            {props.title || 'Prezzi'}
          </h2>
          <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {props.plans?.map((plan, i) => (
              <div key={i} className={`${compact ? 'p-3' : 'p-6'} bg-slate-700/30 rounded-lg border ${plan.highlighted ? 'border-blue-500' : 'border-slate-700'}`}>
                <div className={`font-bold text-white ${compact ? 'text-sm' : 'text-xl'}`}>{plan.name}</div>
                <div className={`text-blue-400 ${compact ? 'text-lg' : 'text-3xl'} font-bold mt-2`}>€{plan.price}</div>
                {!compact && <div className="text-xs text-slate-500">/{plan.period}</div>}
              </div>
            ))}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="text-center space-y-4 py-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg">
          <h2 className={`font-bold text-white ${compact ? 'text-lg' : 'text-3xl'}`}>
            {props.title || 'Inizia Ora'}
          </h2>
          {props.subtitle && <p className="text-slate-300">{props.subtitle}</p>}
          <button className={`${compact ? 'px-4 py-2 text-sm' : 'px-8 py-4 text-lg'} bg-blue-600 text-white rounded-lg font-medium`}>
            {props.buttonText}
          </button>
        </div>
      );

    default:
      return (
        <div className="text-slate-400 text-center py-8">
          Sezione {type}
        </div>
      );
  }
}
