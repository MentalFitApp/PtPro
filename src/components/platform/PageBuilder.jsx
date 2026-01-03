// src/components/platform/PageBuilder.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  Type, Image, Video, Layout, Code, Palette, Eye, Save,
  Plus, Trash2, MoveUp, MoveDown, Copy, Settings, Link,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3, X
} from 'lucide-react';

const BLOCK_TYPES = {
  hero: { 
    icon: Layout, 
    label: 'Hero Section',
    defaultProps: {
      title: 'Titolo Principale',
      subtitle: 'Sottotitolo descrittivo',
      ctaPrimary: 'Inizia Ora',
      ctaSecondary: 'Scopri di più',
      bgImage: '',
      bgColor: '#1e293b',
      textColor: '#ffffff',
      height: 'screen'
    }
  },
  text: { 
    icon: Type, 
    label: 'Testo',
    defaultProps: {
      content: 'Il tuo contenuto qui...',
      fontSize: 'base',
      fontWeight: 'normal',
      textAlign: 'left',
      color: '#000000',
      bgColor: 'transparent',
      padding: 'normal'
    }
  },
  heading: { 
    icon: Heading1, 
    label: 'Titolo',
    defaultProps: {
      content: 'Titolo Sezione',
      level: 'h2',
      textAlign: 'center',
      color: '#000000',
      fontWeight: 'bold'
    }
  },
  image: { 
    icon: Image, 
    label: 'Immagine',
    defaultProps: {
      src: 'https://via.placeholder.com/800x400',
      alt: 'Immagine',
      width: 'full',
      height: 'auto',
      rounded: 'lg',
      shadow: true
    }
  },
  video: { 
    icon: Video, 
    label: 'Video',
    defaultProps: {
      src: '',
      youtubeId: '',
      width: 'full',
      aspectRatio: '16/9'
    }
  },
  features: { 
    icon: Layout, 
    label: 'Caratteristiche',
    defaultProps: {
      title: 'Caratteristiche',
      columns: 3,
      items: [
        { icon: '🎯', title: 'Feature 1', description: 'Descrizione feature' },
        { icon: '⚡', title: 'Feature 2', description: 'Descrizione feature' },
        { icon: '💪', title: 'Feature 3', description: 'Descrizione feature' }
      ],
      bgColor: '#f8fafc',
      padding: 'large'
    }
  },
  pricing: { 
    icon: Layout, 
    label: 'Prezzi',
    defaultProps: {
      title: 'I Nostri Piani',
      plans: [
        { name: 'Base', price: '29', period: 'mese', features: ['Feature 1', 'Feature 2'], highlighted: false },
        { name: 'Pro', price: '59', period: 'mese', features: ['Feature 1', 'Feature 2', 'Feature 3'], highlighted: true },
        { name: 'Enterprise', price: '99', period: 'mese', features: ['Tutte le features'], highlighted: false }
      ]
    }
  },
  testimonials: { 
    icon: Quote, 
    label: 'Testimonianze',
    defaultProps: {
      title: 'Cosa Dicono i Clienti',
      items: [
        { name: 'Marco Rossi', role: 'Cliente', text: 'Ottimo servizio!', avatar: '' },
        { name: 'Laura Bianchi', role: 'Cliente', text: 'Risultati incredibili!', avatar: '' }
      ],
      columns: 2
    }
  },
  cta: { 
    icon: Link, 
    label: 'Call to Action',
    defaultProps: {
      title: 'Pronto a Iniziare?',
      subtitle: 'Unisciti a noi oggi stesso',
      buttonText: 'Inizia Ora',
      buttonUrl: '#',
      bgColor: '#3b82f6',
      textColor: '#ffffff',
      size: 'large'
    }
  },
  spacer: { 
    icon: Layout, 
    label: 'Spaziatura',
    defaultProps: {
      height: '4rem',
      bgColor: 'transparent'
    }
  },
  custom: { 
    icon: Code, 
    label: 'HTML Personalizzato',
    defaultProps: {
      html: '<div class="p-8 text-center"><p>HTML personalizzato</p></div>'
    }
  }
};

const BlockPreview = ({ block, isSelected, onClick }) => {
  const BlockIcon = BLOCK_TYPES[block.type].icon;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={onClick}
      className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected 
          ? 'border-blue-500 bg-blue-50/50 shadow-lg' 
          : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <BlockIcon size={20} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800">{BLOCK_TYPES[block.type].label}</h4>
          <p className="text-xs text-slate-500">ID: {block.id}</p>
        </div>
      </div>
      
      {/* Mini preview */}
      <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 line-clamp-2">
        {block.type === 'hero' && `${block.props.title} - ${block.props.subtitle}`}
        {block.type === 'text' && block.props.content}
        {block.type === 'heading' && block.props.content}
        {block.type === 'image' && `Immagine: ${block.props.alt}`}
        {block.type === 'video' && `Video: ${block.props.youtubeId || 'Custom'}`}
        {block.type === 'features' && `${block.props.items.length} features in ${block.props.columns} colonne`}
        {block.type === 'pricing' && `${block.props.plans.length} piani`}
        {block.type === 'testimonials' && `${block.props.items.length} testimonianze`}
        {block.type === 'cta' && block.props.title}
        {block.type === 'spacer' && `Spazio: ${block.props.height}`}
        {block.type === 'custom' && 'HTML personalizzato'}
      </div>
    </motion.div>
  );
};

const BlockEditor = ({ block, onChange, onDelete, onMoveUp, onMoveDown, onDuplicate }) => {
  const [activeTab, setActiveTab] = useState('content');

  const updateProp = (key, value) => {
    onChange({ ...block, props: { ...block.props, [key]: value } });
  };

  const updateNestedProp = (path, value) => {
    const keys = path.split('.');
    const newProps = { ...block.props };
    let current = newProps;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onChange({ ...block, props: newProps });
  };

  const addArrayItem = (key, item) => {
    onChange({ 
      ...block, 
      props: { 
        ...block.props, 
        [key]: [...(block.props[key] || []), item] 
      } 
    });
  };

  const updateArrayItem = (key, index, item) => {
    const newArray = [...block.props[key]];
    newArray[index] = item;
    onChange({ ...block, props: { ...block.props, [key]: newArray } });
  };

  const removeArrayItem = (key, index) => {
    onChange({ 
      ...block, 
      props: { 
        ...block.props, 
        [key]: block.props[key].filter((_, i) => i !== index) 
      } 
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {React.createElement(BLOCK_TYPES[block.type].icon, { size: 20 })}
            {BLOCK_TYPES[block.type].label}
          </h3>
          <div className="flex gap-2">
            <button onClick={onMoveUp} className="p-2 hover:bg-slate-200 rounded-lg transition-colors" title="Sposta su">
              <MoveUp size={16} />
            </button>
            <button onClick={onMoveDown} className="p-2 hover:bg-slate-200 rounded-lg transition-colors" title="Sposta giù">
              <MoveDown size={16} />
            </button>
            <button onClick={onDuplicate} className="p-2 hover:bg-slate-200 rounded-lg transition-colors" title="Duplica">
              <Copy size={16} />
            </button>
            <button onClick={onDelete} className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Elimina">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'content' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Contenuto
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'style' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Stile
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* HERO BLOCK */}
            {block.type === 'hero' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Titolo</label>
                  <input
                    type="text"
                    value={block.props.title}
                    onChange={(e) => updateProp('title', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sottotitolo</label>
                  <textarea
                    value={block.props.subtitle}
                    onChange={(e) => updateProp('subtitle', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bottone Primario</label>
                    <input
                      type="text"
                      value={block.props.ctaPrimary}
                      onChange={(e) => updateProp('ctaPrimary', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bottone Secondario</label>
                    <input
                      type="text"
                      value={block.props.ctaSecondary}
                      onChange={(e) => updateProp('ctaSecondary', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Immagine di Sfondo (URL)</label>
                  <input
                    type="text"
                    value={block.props.bgImage}
                    onChange={(e) => updateProp('bgImage', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </>
            )}

            {/* TEXT BLOCK */}
            {block.type === 'text' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contenuto</label>
                  <textarea
                    value={block.props.content}
                    onChange={(e) => updateProp('content', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Dimensione</label>
                    <select
                      value={block.props.fontSize}
                      onChange={(e) => updateProp('fontSize', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="xs">XS</option>
                      <option value="sm">Small</option>
                      <option value="base">Base</option>
                      <option value="lg">Large</option>
                      <option value="xl">XL</option>
                      <option value="2xl">2XL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Peso</label>
                    <select
                      value={block.props.fontWeight}
                      onChange={(e) => updateProp('fontWeight', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="light">Light</option>
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="semibold">Semibold</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Allineamento</label>
                    <select
                      value={block.props.textAlign}
                      onChange={(e) => updateProp('textAlign', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="left">Sinistra</option>
                      <option value="center">Centro</option>
                      <option value="right">Destra</option>
                      <option value="justify">Giustificato</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* HEADING BLOCK */}
            {block.type === 'heading' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Testo</label>
                  <input
                    type="text"
                    value={block.props.content}
                    onChange={(e) => updateProp('content', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-lg font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Livello</label>
                    <select
                      value={block.props.level}
                      onChange={(e) => updateProp('level', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="h1">H1 - Principale</option>
                      <option value="h2">H2 - Sezione</option>
                      <option value="h3">H3 - Sottosezione</option>
                      <option value="h4">H4 - Piccolo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Allineamento</label>
                    <select
                      value={block.props.textAlign}
                      onChange={(e) => updateProp('textAlign', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="left">Sinistra</option>
                      <option value="center">Centro</option>
                      <option value="right">Destra</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* IMAGE BLOCK */}
            {block.type === 'image' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">URL Immagine</label>
                  <input
                    type="text"
                    value={block.props.src}
                    onChange={(e) => updateProp('src', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                  {block.props.src && (
                    <img src={block.props.src} alt="Preview" className="mt-2 w-full rounded-lg" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Testo Alternativo</label>
                  <input
                    type="text"
                    value={block.props.alt}
                    onChange={(e) => updateProp('alt', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Larghezza</label>
                    <select
                      value={block.props.width}
                      onChange={(e) => updateProp('width', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="full">Full</option>
                      <option value="3/4">75%</option>
                      <option value="1/2">50%</option>
                      <option value="1/3">33%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bordi</label>
                    <select
                      value={block.props.rounded}
                      onChange={(e) => updateProp('rounded', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="none">Nessuno</option>
                      <option value="sm">Piccoli</option>
                      <option value="md">Medi</option>
                      <option value="lg">Grandi</option>
                      <option value="full">Rotondi</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mt-8">
                      <input
                        type="checkbox"
                        checked={block.props.shadow}
                        onChange={(e) => updateProp('shadow', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Ombra</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* VIDEO BLOCK */}
            {block.type === 'video' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">YouTube Video ID</label>
                  <input
                    type="text"
                    value={block.props.youtubeId}
                    onChange={(e) => updateProp('youtubeId', e.target.value)}
                    placeholder="dQw4w9WgXcQ"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                  <p className="text-xs text-slate-500 mt-1">O URL video personalizzato:</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">URL Video Personalizzato</label>
                  <input
                    type="text"
                    value={block.props.src}
                    onChange={(e) => updateProp('src', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Aspect Ratio</label>
                  <select
                    value={block.props.aspectRatio}
                    onChange={(e) => updateProp('aspectRatio', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="16/9">16:9 (Widescreen)</option>
                    <option value="4/3">4:3 (Standard)</option>
                    <option value="1/1">1:1 (Quadrato)</option>
                  </select>
                </div>
              </>
            )}

            {/* FEATURES BLOCK */}
            {block.type === 'features' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Titolo Sezione</label>
                  <input
                    type="text"
                    value={block.props.title}
                    onChange={(e) => updateProp('title', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Numero Colonne</label>
                  <select
                    value={block.props.columns}
                    onChange={(e) => updateProp('columns', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="1">1 Colonna</option>
                    <option value="2">2 Colonne</option>
                    <option value="3">3 Colonne</option>
                    <option value="4">4 Colonne</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Features</label>
                    <button
                      onClick={() => addArrayItem('items', { icon: '✨', title: 'Nuova Feature', description: 'Descrizione' })}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                    >
                      <Plus size={16} className="inline mr-1" /> Aggiungi
                    </button>
                  </div>
                  <div className="space-y-3">
                    {block.props.items?.map((item, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="text"
                            value={item.icon}
                            onChange={(e) => updateArrayItem('items', index, { ...item, icon: e.target.value })}
                            placeholder="🎯"
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
                          />
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateArrayItem('items', index, { ...item, title: e.target.value })}
                            className="flex-1 px-3 py-1 border border-slate-300 rounded"
                            placeholder="Titolo"
                          />
                          <button
                            onClick={() => removeArrayItem('items', index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateArrayItem('items', index, { ...item, description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                          placeholder="Descrizione"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* PRICING BLOCK */}
            {block.type === 'pricing' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Titolo Sezione</label>
                  <input
                    type="text"
                    value={block.props.title}
                    onChange={(e) => updateProp('title', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Piani</label>
                    <button
                      onClick={() => addArrayItem('plans', { name: 'Nuovo Piano', price: '49', period: 'mese', features: ['Feature'], highlighted: false })}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                    >
                      <Plus size={16} className="inline mr-1" /> Aggiungi Piano
                    </button>
                  </div>
                  <div className="space-y-3">
                    {block.props.plans?.map((plan, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            value={plan.name}
                            onChange={(e) => updateArrayItem('plans', index, { ...plan, name: e.target.value })}
                            className="px-3 py-2 border border-slate-300 rounded"
                            placeholder="Nome piano"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={plan.price}
                              onChange={(e) => updateArrayItem('plans', index, { ...plan, price: e.target.value })}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded"
                              placeholder="Prezzo"
                            />
                            <button
                              onClick={() => removeArrayItem('plans', index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={plan.features.join('\n')}
                          onChange={(e) => updateArrayItem('plans', index, { ...plan, features: e.target.value.split('\n').filter(f => f.trim()) })}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm mb-2"
                          placeholder="Features (una per riga)"
                        />
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={plan.highlighted}
                            onChange={(e) => updateArrayItem('plans', index, { ...plan, highlighted: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700">Piano in evidenza</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TESTIMONIALS BLOCK */}
            {block.type === 'testimonials' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Titolo Sezione</label>
                  <input
                    type="text"
                    value={block.props.title}
                    onChange={(e) => updateProp('title', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Colonne</label>
                  <select
                    value={block.props.columns}
                    onChange={(e) => updateProp('columns', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="1">1 Colonna</option>
                    <option value="2">2 Colonne</option>
                    <option value="3">3 Colonne</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Testimonianze</label>
                    <button
                      onClick={() => addArrayItem('items', { name: 'Nome Cliente', role: 'Ruolo', text: 'Testimonianza...', avatar: '' })}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                    >
                      <Plus size={16} className="inline mr-1" /> Aggiungi
                    </button>
                  </div>
                  <div className="space-y-3">
                    {block.props.items?.map((item, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateArrayItem('items', index, { ...item, name: e.target.value })}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded"
                            placeholder="Nome"
                          />
                          <input
                            type="text"
                            value={item.role}
                            onChange={(e) => updateArrayItem('items', index, { ...item, role: e.target.value })}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded"
                            placeholder="Ruolo"
                          />
                          <button
                            onClick={() => removeArrayItem('items', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <textarea
                          value={item.text}
                          onChange={(e) => updateArrayItem('items', index, { ...item, text: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                          placeholder="Testimonianza"
                        />
                        <input
                          type="text"
                          value={item.avatar}
                          onChange={(e) => updateArrayItem('items', index, { ...item, avatar: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm mt-2"
                          placeholder="URL Avatar (opzionale)"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* CTA BLOCK */}
            {block.type === 'cta' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Titolo</label>
                  <input
                    type="text"
                    value={block.props.title}
                    onChange={(e) => updateProp('title', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sottotitolo</label>
                  <input
                    type="text"
                    value={block.props.subtitle}
                    onChange={(e) => updateProp('subtitle', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Testo Bottone</label>
                    <input
                      type="text"
                      value={block.props.buttonText}
                      onChange={(e) => updateProp('buttonText', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">URL Bottone</label>
                    <input
                      type="text"
                      value={block.props.buttonUrl}
                      onChange={(e) => updateProp('buttonUrl', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </>
            )}

            {/* SPACER BLOCK */}
            {block.type === 'spacer' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Altezza</label>
                <input
                  type="text"
                  value={block.props.height}
                  onChange={(e) => updateProp('height', e.target.value)}
                  placeholder="4rem, 100px, etc."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            )}

            {/* CUSTOM HTML BLOCK */}
            {block.type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">HTML Personalizzato</label>
                <textarea
                  value={block.props.html}
                  onChange={(e) => updateProp('html', e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {block.props.bgColor !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Colore Sfondo</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={block.props.bgColor}
                      onChange={(e) => updateProp('bgColor', e.target.value)}
                      className="w-12 h-10 rounded border border-slate-300"
                    />
                    <input
                      type="text"
                      value={block.props.bgColor}
                      onChange={(e) => updateProp('bgColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>
              )}
              {block.props.color !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Colore Testo</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={block.props.color}
                      onChange={(e) => updateProp('color', e.target.value)}
                      className="w-12 h-10 rounded border border-slate-300"
                    />
                    <input
                      type="text"
                      value={block.props.color}
                      onChange={(e) => updateProp('color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>
              )}
              {block.props.textColor !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Colore Testo</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={block.props.textColor}
                      onChange={(e) => updateProp('textColor', e.target.value)}
                      className="w-12 h-10 rounded border border-slate-300"
                    />
                    <input
                      type="text"
                      value={block.props.textColor}
                      onChange={(e) => updateProp('textColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>
              )}
              {block.props.padding !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Padding</label>
                  <select
                    value={block.props.padding}
                    onChange={(e) => updateProp('padding', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="none">Nessuno</option>
                    <option value="small">Piccolo</option>
                    <option value="normal">Normale</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PageBuilder({ initialBlocks = [], onSave, onClose }) {
  const [blocks, setBlocks] = useState(initialBlocks.length > 0 ? initialBlocks : []);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const addBlock = (type) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      props: { ...BLOCK_TYPES[type].defaultProps }
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (updatedBlock) => {
    setBlocks(blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b));
  };

  const deleteBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id, direction) => {
    const index = blocks.findIndex(b => b.id === id);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      setBlocks(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const duplicateBlock = (id) => {
    const block = blocks.find(b => b.id === id);
    if (block) {
      const newBlock = {
        ...block,
        id: `block-${Date.now()}`,
        props: { ...block.props }
      };
      const index = blocks.findIndex(b => b.id === id);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    }
  };

  const handleSave = () => {
    onSave(blocks);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[95vw] h-[95vh] bg-slate-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Layout className="text-blue-500" size={28} />
              Page Builder
            </h2>
            <p className="text-sm text-slate-500 mt-1">Crea la tua landing page personalizzata</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Salva
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Live Preview Area */}
          <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto relative">
            {/* Floating Add Block Toolbar */}
            <div className="sticky top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              <div className="inline-flex bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-2 gap-1 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 px-2 flex items-center">Aggiungi:</span>
                <button
                  onClick={() => addBlock('hero')}
                  className="px-3 py-2 hover:bg-blue-50 rounded-lg transition-all text-xs font-medium text-slate-700 hover:text-blue-600"
                  title="Hero Section"
                >
                  Hero
                </button>
                <button
                  onClick={() => addBlock('text')}
                  className="px-3 py-2 hover:bg-blue-50 rounded-lg transition-all text-xs font-medium text-slate-700 hover:text-blue-600"
                  title="Testo"
                >
                  Testo
                </button>
                <button
                  onClick={() => addBlock('image')}
                  className="px-3 py-2 hover:bg-blue-50 rounded-lg transition-all text-xs font-medium text-slate-700 hover:text-blue-600"
                  title="Immagine"
                >
                  Immagine
                </button>
                <button
                  onClick={() => addBlock('features')}
                  className="px-3 py-2 hover:bg-blue-50 rounded-lg transition-all text-xs font-medium text-slate-700 hover:text-blue-600"
                  title="Features"
                >
                  Features
                </button>
                <button
                  onClick={() => addBlock('pricing')}
                  className="px-3 py-2 hover:bg-blue-50 rounded-lg transition-all text-xs font-medium text-slate-700 hover:text-blue-600"
                  title="Pricing"
                >
                  Pricing
                </button>
                <button
                  onClick={() => addBlock('cta')}
                  className="px-3 py-2 hover:bg-blue-50 rounded-lg transition-all text-xs font-medium text-slate-700 hover:text-blue-600"
                  title="Call to Action"
                >
                  CTA
                </button>
                <div className="w-px bg-slate-200 mx-1" />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addBlock(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 border-0 cursor-pointer"
                >
                  <option value="">Altri...</option>
                  <option value="heading">Heading</option>
                  <option value="video">Video</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="spacer">Spacer</option>
                  <option value="custom">Custom HTML</option>
                </select>
              </div>
            </div>

            {/* Page Canvas */}
            <div className="max-w-6xl mx-auto bg-white shadow-2xl min-h-screen mt-4">
              {blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  layout
                  onMouseEnter={() => setHoveredBlockId(block.id)}
                  onMouseLeave={() => setHoveredBlockId(null)}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`relative cursor-pointer transition-all ${
                    selectedBlockId === block.id 
                      ? 'ring-4 ring-blue-500 ring-inset' 
                      : hoveredBlockId === block.id 
                        ? 'ring-2 ring-blue-300 ring-inset' 
                        : ''
                  }`}
                >
                  {/* Overlay Controls */}
                  {(hoveredBlockId === block.id || selectedBlockId === block.id) && (
                    <>
                      {/* Block Label */}
                      <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {BLOCK_TYPES[block.type].label}
                      </div>

                      {/* Control Buttons */}
                      <div 
                        className="absolute top-2 right-2 z-10 flex gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                          disabled={index === 0}
                          className="p-2 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          title="Sposta su"
                        >
                          <MoveUp size={16} className="text-slate-700" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                          disabled={index === blocks.length - 1}
                          className="p-2 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          title="Sposta giù"
                        >
                          <MoveDown size={16} className="text-slate-700" />
                        </button>
                        <div className="w-px bg-slate-200" />
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                          className="p-2 hover:bg-green-50 rounded transition-colors"
                          title="Duplica"
                        >
                          <Copy size={16} className="text-slate-700" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                          className="p-2 hover:bg-purple-50 rounded transition-colors"
                          title="Modifica"
                        >
                          <Settings size={16} className="text-slate-700" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                          className="p-2 hover:bg-red-50 rounded transition-colors"
                          title="Elimina"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Block Content */}
                  <div className="block-content">
                    {block.type === 'hero' && (
                      <div 
                        className="relative min-h-screen flex items-center justify-center text-center p-8"
                        style={{ 
                          backgroundColor: block.props.bgColor,
                          backgroundImage: block.props.bgImage ? `url(${block.props.bgImage})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          color: block.props.textColor
                        }}
                      >
                        <div className="max-w-4xl">
                          <h1 className="text-5xl md:text-7xl font-bold mb-6">{block.props.title}</h1>
                          <p className="text-xl md:text-2xl mb-8 opacity-90">{block.props.subtitle}</p>
                          <div className="flex gap-4 justify-center">
                            <button className="px-8 py-4 bg-white text-slate-900 rounded-lg font-bold text-lg hover:scale-105 transition-transform">
                              {block.props.ctaPrimary}
                            </button>
                            <button className="px-8 py-4 border-2 border-current rounded-lg font-bold text-lg hover:scale-105 transition-transform">
                              {block.props.ctaSecondary}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {block.type === 'text' && (
                      <div 
                        className={`p-8 text-${block.props.textAlign} font-${block.props.fontWeight} text-${block.props.fontSize}`}
                        style={{ 
                          backgroundColor: block.props.bgColor,
                          color: block.props.color,
                          padding: block.props.padding === 'small' ? '1rem' : block.props.padding === 'large' ? '4rem' : '2rem'
                        }}
                      >
                        <p className="max-w-4xl mx-auto whitespace-pre-wrap">{block.props.content}</p>
                      </div>
                    )}

                    {block.type === 'heading' && (
                      <div className={`p-8 text-${block.props.textAlign}`} style={{ color: block.props.color }}>
                        {React.createElement(
                          block.props.level,
                          { 
                            className: `font-${block.props.fontWeight} ${
                              block.props.level === 'h1' ? 'text-5xl' :
                              block.props.level === 'h2' ? 'text-4xl' :
                              block.props.level === 'h3' ? 'text-3xl' : 'text-2xl'
                            }`
                          },
                          block.props.content
                        )}
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div className="p-8">
                        <img 
                          src={block.props.src} 
                          alt={block.props.alt}
                          className={`mx-auto rounded-${block.props.rounded} ${block.props.shadow ? 'shadow-2xl' : ''} w-${block.props.width}`}
                        />
                      </div>
                    )}

                    {block.type === 'video' && (
                      <div className="p-8">
                        <div className={`mx-auto aspect-video rounded-lg overflow-hidden shadow-xl w-${block.props.width}`}>
                          {block.props.provider === 'youtube' && block.props.videoId && (
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${block.props.videoId}?autoplay=${block.props.autoplay ? 1 : 0}&loop=${block.props.loop ? 1 : 0}`}
                              title="YouTube video"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          )}
                          {block.props.provider === 'vimeo' && block.props.videoId && (
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://player.vimeo.com/video/${block.props.videoId}?autoplay=${block.props.autoplay ? 1 : 0}&loop=${block.props.loop ? 1 : 0}`}
                              title="Vimeo video"
                              frameBorder="0"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {block.type === 'features' && (
                      <div className="p-12" style={{ backgroundColor: block.props.bgColor }}>
                        <h2 className="text-4xl font-bold text-center mb-12">{block.props.title}</h2>
                        <div className={`grid grid-cols-1 md:grid-cols-${block.props.columns} gap-8 max-w-6xl mx-auto`}>
                          {block.props.items?.map((item, i) => (
                            <div key={i} className="text-center p-6 bg-white rounded-xl shadow-lg">
                              <div className="text-5xl mb-4">{item.icon}</div>
                              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                              <p className="text-slate-600">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.type === 'pricing' && (
                      <div className="p-12 bg-slate-50">
                        <h2 className="text-4xl font-bold text-center mb-12">{block.props.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                          {block.props.plans?.map((plan, i) => (
                            <div 
                              key={i} 
                              className={`p-8 bg-white rounded-xl ${plan.highlighted ? 'ring-4 ring-blue-500 scale-105' : 'shadow-lg'}`}
                            >
                              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                              <div className="mb-6">
                                <span className="text-5xl font-bold">€{plan.price}</span>
                                <span className="text-slate-500">/{plan.period}</span>
                              </div>
                              <ul className="space-y-3 mb-8">
                                {plan.features.map((f, j) => (
                                  <li key={j} className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                              <button className={`w-full py-3 rounded-lg font-bold ${plan.highlighted ? 'bg-blue-500 text-white' : 'bg-slate-100'}`}>
                                Scegli Piano
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.type === 'testimonials' && (
                      <div className="p-12">
                        <h2 className="text-4xl font-bold text-center mb-12">{block.props.title}</h2>
                        <div className={`grid grid-cols-1 md:grid-cols-${block.props.columns} gap-8 max-w-6xl mx-auto`}>
                          {block.props.items?.map((item, i) => (
                            <div key={i} className="p-6 bg-white rounded-xl shadow-lg">
                              <p className="text-slate-600 italic mb-4">"{item.text}"</p>
                              <div className="flex items-center gap-3">
                                {item.avatar && (
                                  <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full" />
                                )}
                                <div>
                                  <p className="font-bold">{item.name}</p>
                                  <p className="text-sm text-slate-500">{item.role}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.type === 'cta' && (
                      <div 
                        className="p-16 text-center"
                        style={{ backgroundColor: block.props.bgColor, color: block.props.textColor }}
                      >
                        <h2 className="text-4xl font-bold mb-4">{block.props.title}</h2>
                        <p className="text-xl mb-8 opacity-90">{block.props.subtitle}</p>
                        <a 
                          href={block.props.buttonUrl}
                          className="inline-block px-8 py-4 bg-white text-slate-900 rounded-lg font-bold text-lg hover:scale-105 transition-transform"
                        >
                          {block.props.buttonText}
                        </a>
                      </div>
                    )}

                    {block.type === 'spacer' && (
                      <div style={{ height: block.props.height, backgroundColor: block.props.bgColor }} />
                    )}

                    {block.type === 'custom' && (
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.props.html) }} />
                    )}
                  </div>
                </motion.div>
              ))}
              
              {blocks.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-screen text-slate-400 p-12">
                  <Layout size={80} className="mb-6 opacity-20" />
                  <p className="text-2xl font-bold mb-2 text-slate-600">Pagina Vuota</p>
                  <p className="text-base mb-6">Clicca un pulsante nella toolbar in alto per iniziare</p>
                  <div className="flex gap-2 text-xs">
                    <span className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">Hero</span>
                    <span className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">Testo</span>
                    <span className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">Immagine</span>
                    <span className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">Features</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editor Sidebar - Appare solo quando un blocco è selezionato */}
          <AnimatePresence>
            {selectedBlock && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-96 bg-white border-l border-slate-200 overflow-y-auto shadow-2xl"
              >
              <div className="sticky top-0 bg-white border-b border-slate-200 p-4 z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800">Modifica Blocco</h3>
                  <button
                    onClick={() => setSelectedBlockId(null)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-slate-500">{BLOCK_TYPES[selectedBlock.type].label}</p>
              </div>
              <div className="p-4">
                <BlockEditor
                  block={selectedBlock}
                  onChange={updateBlock}
                  onDelete={() => {
                    deleteBlock(selectedBlock.id);
                    setSelectedBlockId(null);
                  }}
                  onMoveUp={() => moveBlock(selectedBlock.id, 'up')}
                  onMoveDown={() => moveBlock(selectedBlock.id, 'down')}
                  onDuplicate={() => duplicateBlock(selectedBlock.id)}
                />
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
