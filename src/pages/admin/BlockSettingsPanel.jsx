import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DEFAULT_BLOCKS } from '../../services/landingPageService';

/**
 * BlockSettingsPanel - Pannello per modificare le impostazioni di un blocco
 */
const BlockSettingsPanel = ({ block, onUpdate, onClose }) => {
  const [localSettings, setLocalSettings] = useState(block?.settings || {});
  const [expandedSections, setExpandedSections] = useState(['content', 'style']);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalSettings(block?.settings || {});
  }, [block?.id]);

  // Debounced update to parent - evita re-render continui
  const debouncedUpdate = useCallback((newSettings) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onUpdate(newSettings);
    }, 300);
  }, [onUpdate]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    debouncedUpdate(newSettings);
  };

  const handleNestedChange = (parentKey, key, value) => {
    const newSettings = {
      ...localSettings,
      [parentKey]: {
        ...(localSettings[parentKey] || {}),
        [key]: value,
      }
    };
    setLocalSettings(newSettings);
    debouncedUpdate(newSettings);
  };

  const handleArrayItemChange = (arrayKey, index, field, value) => {
    const newArray = [...(localSettings[arrayKey] || [])];
    newArray[index] = { ...newArray[index], [field]: value };
    const newSettings = { ...localSettings, [arrayKey]: newArray };
    setLocalSettings(newSettings);
    debouncedUpdate(newSettings);
  };

  const handleAddArrayItem = (arrayKey, defaultItem) => {
    const newArray = [...(localSettings[arrayKey] || []), defaultItem];
    const newSettings = { ...localSettings, [arrayKey]: newArray };
    setLocalSettings(newSettings);
    debouncedUpdate(newSettings);
  };

  const handleRemoveArrayItem = (arrayKey, index) => {
    const newArray = [...(localSettings[arrayKey] || [])];
    newArray.splice(index, 1);
    const newSettings = { ...localSettings, [arrayKey]: newArray };
    setLocalSettings(newSettings);
    debouncedUpdate(newSettings);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const blockDef = DEFAULT_BLOCKS[block?.type];

  if (!block) return null;

  // Render field based on type
  const renderField = (key, value, type = 'text', options = {}) => {
    const baseInputClass = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500";

    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            rows={options.rows || 3}
            className={`${baseInputClass} resize-none`}
            placeholder={options.placeholder}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            className={`${baseInputClass} cursor-pointer`}
          >
            {(options.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
            min={options.min}
            max={options.max}
            step={options.step || 1}
            className={baseInputClass}
          />
        );

      case 'boolean':
        return (
          <button
            onClick={() => handleChange(key, !value)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              value ? 'bg-sky-500' : 'bg-slate-600'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              value ? 'left-7' : 'left-1'
            }`} />
          </button>
        );

      case 'color':
        return (
          <div className="flex gap-2">
            <input
              type="color"
              value={value || '#ffffff'}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className={baseInputClass}
              placeholder="#000000"
            />
          </div>
        );

      case 'range':
        return (
          <div className="flex items-center gap-3">
            <input
              type="range"
              value={value || options.min || 0}
              onChange={(e) => handleChange(key, parseInt(e.target.value))}
              min={options.min || 0}
              max={options.max || 100}
              step={options.step || 1}
              className="flex-1"
            />
            <span className="text-sm text-slate-400 w-10 text-right">{value || 0}</span>
          </div>
        );

      default:
        return (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            className={baseInputClass}
            placeholder={options.placeholder}
          />
        );
    }
  };

  const Section = ({ title, id, children }) => {
    const isExpanded = expandedSections.includes(id);
    return (
      <div className="border-b border-slate-700">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
        >
          <span className="text-sm font-medium text-white">{title}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  const FieldGroup = ({ label, children, hint }) => (
    <div>
      <label className="block text-sm text-slate-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );

  // Render settings based on block type
  const renderBlockSettings = () => {
    switch (block.type) {
      case 'hero':
        return (
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'centered', label: 'Centrato' },
                    { value: 'split', label: 'Diviso' },
                    { value: 'video', label: 'Video Background' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title, 'textarea', { rows: 2 })}
              </FieldGroup>
              <FieldGroup label="Sottotitolo">
                {renderField('subtitle', localSettings.subtitle, 'textarea', { rows: 2 })}
              </FieldGroup>
              <FieldGroup label="Testo CTA">
                {renderField('ctaText', localSettings.ctaText)}
              </FieldGroup>
              <FieldGroup label="Link CTA" hint="Es: #form o https://...">
                {renderField('ctaLink', localSettings.ctaLink)}
              </FieldGroup>
              <FieldGroup label="Mostra Badge">
                <div className="flex items-center justify-between">
                  {renderField('showBadge', localSettings.showBadge, 'boolean')}
                </div>
              </FieldGroup>
              {localSettings.showBadge && (
                <FieldGroup label="Testo Badge">
                  {renderField('badgeText', localSettings.badgeText)}
                </FieldGroup>
              )}
            </Section>

            <Section title="Stile" id="style">
              <FieldGroup label="Tipo Sfondo">
                {renderField('backgroundType', localSettings.backgroundType, 'select', {
                  options: [
                    { value: 'gradient', label: 'Gradiente' },
                    { value: 'image', label: 'Immagine' },
                    { value: 'video', label: 'Video' },
                  ]
                })}
              </FieldGroup>
              {localSettings.backgroundType === 'gradient' && (
                <FieldGroup label="Gradiente" hint="Classi Tailwind">
                  {renderField('backgroundGradient', localSettings.backgroundGradient)}
                </FieldGroup>
              )}
              {localSettings.backgroundType === 'image' && (
                <FieldGroup label="URL Immagine">
                  {renderField('backgroundImage', localSettings.backgroundImage, 'url')}
                </FieldGroup>
              )}
              <FieldGroup label="Altezza Minima">
                {renderField('minHeight', localSettings.minHeight)}
              </FieldGroup>
              <FieldGroup label="Overlay">
                <div className="flex items-center justify-between">
                  {renderField('overlay', localSettings.overlay, 'boolean')}
                </div>
              </FieldGroup>
              {localSettings.overlay && (
                <FieldGroup label="Opacità Overlay">
                  {renderField('overlayOpacity', localSettings.overlayOpacity, 'range', { min: 0, max: 100 })}
                </FieldGroup>
              )}
            </Section>
          </>
        );

      case 'features':
        return (
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'grid', label: 'Griglia' },
                    { value: 'list', label: 'Lista' },
                    { value: 'alternating', label: 'Alternato' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title)}
              </FieldGroup>
              <FieldGroup label="Sottotitolo">
                {renderField('subtitle', localSettings.subtitle, 'textarea')}
              </FieldGroup>
              <FieldGroup label="Colonne">
                {renderField('columns', localSettings.columns, 'select', {
                  options: [
                    { value: 2, label: '2 Colonne' },
                    { value: 3, label: '3 Colonne' },
                    { value: 4, label: '4 Colonne' },
                  ]
                })}
              </FieldGroup>
            </Section>

            <Section title="Features" id="features">
              {(localSettings.items || []).map((item, index) => (
                <div key={index} className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Feature {index + 1}</span>
                    <button
                      onClick={() => handleRemoveArrayItem('items', index)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.icon || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'icon', e.target.value)}
                    placeholder="Icona (emoji)"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'title', e.target.value)}
                    placeholder="Titolo"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <textarea
                    value={item.description || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'description', e.target.value)}
                    placeholder="Descrizione"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm resize-none"
                  />
                </div>
              ))}
              <button
                onClick={() => handleAddArrayItem('items', { icon: '✨', title: '', description: '' })}
                className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Feature
              </button>
            </Section>
          </>
        );

      case 'testimonials':
        return (
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'carousel', label: 'Carosello' },
                    { value: 'grid', label: 'Griglia' },
                    { value: 'masonry', label: 'Masonry' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title)}
              </FieldGroup>
              <FieldGroup label="Mostra Stelle">
                <div className="flex items-center justify-between">
                  {renderField('showRating', localSettings.showRating, 'boolean')}
                </div>
              </FieldGroup>
              <FieldGroup label="Autoplay">
                <div className="flex items-center justify-between">
                  {renderField('autoplay', localSettings.autoplay, 'boolean')}
                </div>
              </FieldGroup>
            </Section>

            <Section title="Testimonianze" id="testimonials">
              {(localSettings.items || []).map((item, index) => (
                <div key={index} className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Testimonianza {index + 1}</span>
                    <button
                      onClick={() => handleRemoveArrayItem('items', index)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'name', e.target.value)}
                    placeholder="Nome"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={item.role || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'role', e.target.value)}
                    placeholder="Ruolo/Professione"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <textarea
                    value={item.text || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'text', e.target.value)}
                    placeholder="Testo testimonianza"
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm resize-none"
                  />
                  <input
                    type="number"
                    value={item.rating || 5}
                    onChange={(e) => handleArrayItemChange('items', index, 'rating', parseInt(e.target.value))}
                    min={1}
                    max={5}
                    placeholder="Rating (1-5)"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              ))}
              <button
                onClick={() => handleAddArrayItem('items', { name: '', role: '', text: '', rating: 5 })}
                className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Testimonianza
              </button>
            </Section>
          </>
        );

      case 'pricing':
        return (
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'cards', label: 'Cards' },
                    { value: 'comparison', label: 'Tabella Comparativa' },
                    { value: 'simple', label: 'Semplice' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title)}
              </FieldGroup>
              <FieldGroup label="Sottotitolo">
                {renderField('subtitle', localSettings.subtitle)}
              </FieldGroup>
            </Section>

            <Section title="Piani" id="pricing">
              {(localSettings.items || []).map((item, index) => (
                <div key={index} className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Piano {index + 1}</span>
                    <button
                      onClick={() => handleRemoveArrayItem('items', index)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'name', e.target.value)}
                    placeholder="Nome piano"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.price || ''}
                      onChange={(e) => handleArrayItemChange('items', index, 'price', e.target.value)}
                      placeholder="Prezzo"
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                    <input
                      type="text"
                      value={item.period || ''}
                      onChange={(e) => handleArrayItemChange('items', index, 'period', e.target.value)}
                      placeholder="/mese"
                      className="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'description', e.target.value)}
                    placeholder="Descrizione breve"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <textarea
                    value={(item.features || []).join('\n')}
                    onChange={(e) => handleArrayItemChange('items', index, 'features', e.target.value.split('\n'))}
                    placeholder="Features (una per riga)"
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.highlighted || false}
                      onChange={(e) => handleArrayItemChange('items', index, 'highlighted', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-300">Evidenziato</span>
                  </div>
                  {item.highlighted && (
                    <input
                      type="text"
                      value={item.badge || ''}
                      onChange={(e) => handleArrayItemChange('items', index, 'badge', e.target.value)}
                      placeholder="Testo badge (es: Più scelto)"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddArrayItem('items', { 
                  name: '', price: '', period: '/mese', description: '', features: [], highlighted: false 
                })}
                className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Piano
              </button>
            </Section>
          </>
        );

      case 'form':
        return (
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'standard', label: 'Standard' },
                    { value: 'minimal', label: 'Minimalista' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title)}
              </FieldGroup>
              <FieldGroup label="Sottotitolo">
                {renderField('subtitle', localSettings.subtitle)}
              </FieldGroup>
              <FieldGroup label="Testo Bottone">
                {renderField('submitText', localSettings.submitText)}
              </FieldGroup>
              <FieldGroup label="Messaggio Successo">
                {renderField('successMessage', localSettings.successMessage, 'textarea')}
              </FieldGroup>
            </Section>

            <Section title="Campi" id="fields">
              {(localSettings.fields || []).map((field, index) => (
                <div key={index} className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Campo {index + 1}</span>
                    <button
                      onClick={() => handleRemoveArrayItem('fields', index)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <select
                    value={field.type || 'text'}
                    onChange={(e) => handleArrayItemChange('fields', index, 'type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="text">Testo</option>
                    <option value="email">Email</option>
                    <option value="tel">Telefono</option>
                    <option value="textarea">Area di testo</option>
                    <option value="select">Select</option>
                  </select>
                  <input
                    type="text"
                    value={field.label || ''}
                    onChange={(e) => handleArrayItemChange('fields', index, 'label', e.target.value)}
                    placeholder="Label"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => handleArrayItemChange('fields', index, 'placeholder', e.target.value)}
                    placeholder="Placeholder"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  {field.type === 'select' && (
                    <textarea
                      value={(field.options || []).join('\n')}
                      onChange={(e) => handleArrayItemChange('fields', index, 'options', e.target.value.split('\n'))}
                      placeholder="Opzioni (una per riga)"
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm resize-none"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => handleArrayItemChange('fields', index, 'required', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-300">Obbligatorio</span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => handleAddArrayItem('fields', { 
                  id: `field-${Date.now()}`, type: 'text', label: '', placeholder: '', required: false 
                })}
                className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Campo
              </button>
            </Section>
          </>
        );

      case 'faq':
        return (
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'accordion', label: 'Accordion' },
                    { value: 'grid', label: 'Griglia' },
                    { value: 'tabs', label: 'Tabs' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title)}
              </FieldGroup>
              <FieldGroup label="Apri prima domanda">
                <div className="flex items-center justify-between">
                  {renderField('openFirst', localSettings.openFirst, 'boolean')}
                </div>
              </FieldGroup>
            </Section>

            <Section title="Domande" id="faq">
              {(localSettings.items || []).map((item, index) => (
                <div key={index} className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">FAQ {index + 1}</span>
                    <button
                      onClick={() => handleRemoveArrayItem('items', index)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.question || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'question', e.target.value)}
                    placeholder="Domanda"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <textarea
                    value={item.answer || ''}
                    onChange={(e) => handleArrayItemChange('items', index, 'answer', e.target.value)}
                    placeholder="Risposta"
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm resize-none"
                  />
                </div>
              ))}
              <button
                onClick={() => handleAddArrayItem('items', { question: '', answer: '' })}
                className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi FAQ
              </button>
            </Section>
          </>
        );

      case 'cta':
        return (
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'centered', label: 'Centrato' },
                    { value: 'split', label: 'Diviso' },
                    { value: 'banner', label: 'Banner' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title, 'textarea', { rows: 2 })}
              </FieldGroup>
              <FieldGroup label="Sottotitolo">
                {renderField('subtitle', localSettings.subtitle, 'textarea')}
              </FieldGroup>
              <FieldGroup label="Testo CTA">
                {renderField('ctaText', localSettings.ctaText)}
              </FieldGroup>
              <FieldGroup label="Link CTA">
                {renderField('ctaLink', localSettings.ctaLink)}
              </FieldGroup>
              <FieldGroup label="Mostra Statistiche">
                <div className="flex items-center justify-between">
                  {renderField('showStats', localSettings.showStats, 'boolean')}
                </div>
              </FieldGroup>
            </Section>

            <Section title="Stile" id="style">
              <FieldGroup label="Gradiente Sfondo">
                {renderField('backgroundGradient', localSettings.backgroundGradient)}
              </FieldGroup>
            </Section>

            {localSettings.showStats && (
              <Section title="Statistiche" id="stats">
                {(localSettings.stats || []).map((stat, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={stat.value || ''}
                      onChange={(e) => {
                        const newStats = [...(localSettings.stats || [])];
                        newStats[index] = { ...newStats[index], value: e.target.value };
                        handleChange('stats', newStats);
                      }}
                      placeholder="Valore"
                      className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                    <input
                      type="text"
                      value={stat.label || ''}
                      onChange={(e) => {
                        const newStats = [...(localSettings.stats || [])];
                        newStats[index] = { ...newStats[index], label: e.target.value };
                        handleChange('stats', newStats);
                      }}
                      placeholder="Label"
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                    <button
                      onClick={() => {
                        const newStats = [...(localSettings.stats || [])];
                        newStats.splice(index, 1);
                        handleChange('stats', newStats);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleChange('stats', [...(localSettings.stats || []), { value: '', label: '' }])}
                  className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Statistica
                </button>
              </Section>
            )}
          </>
        );

      case 'countdown':
        return (
          <Section title="Contenuto" id="content">
            <FieldGroup label="Variante">
              {renderField('variant', localSettings.variant, 'select', {
                options: [
                  { value: 'banner', label: 'Banner' },
                  { value: 'inline', label: 'Inline' },
                  { value: 'floating', label: 'Floating' },
                ]
              })}
            </FieldGroup>
            <FieldGroup label="Titolo">
              {renderField('title', localSettings.title)}
            </FieldGroup>
            <FieldGroup label="Data Fine">
              <input
                type="datetime-local"
                value={localSettings.endDate ? new Date(localSettings.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleChange('endDate', new Date(e.target.value).toISOString())}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              />
            </FieldGroup>
            <FieldGroup label="Messaggio Scadenza">
              {renderField('expiredMessage', localSettings.expiredMessage)}
            </FieldGroup>
            <FieldGroup label="Sticky">
              <div className="flex items-center justify-between">
                {renderField('sticky', localSettings.sticky, 'boolean')}
              </div>
            </FieldGroup>
          </Section>
        );

      case 'video':
        return (
          <Section title="Contenuto" id="content">
            <FieldGroup label="Variante">
              {renderField('variant', localSettings.variant, 'select', {
                options: [
                  { value: 'featured', label: 'Featured' },
                  { value: 'inline', label: 'Inline' },
                  { value: 'background', label: 'Background' },
                ]
              })}
            </FieldGroup>
            <FieldGroup label="URL Video" hint="YouTube, Vimeo o URL diretto">
              {renderField('videoUrl', localSettings.videoUrl, 'url')}
            </FieldGroup>
            <FieldGroup label="Titolo">
              {renderField('title', localSettings.title)}
            </FieldGroup>
            <FieldGroup label="Autoplay">
              <div className="flex items-center justify-between">
                {renderField('autoplay', localSettings.autoplay, 'boolean')}
              </div>
            </FieldGroup>
            <FieldGroup label="Mostra Controlli">
              <div className="flex items-center justify-between">
                {renderField('showControls', localSettings.showControls, 'boolean')}
              </div>
            </FieldGroup>
          </Section>
        );

      case 'text':
        return (
          <Section title="Contenuto" id="content">
            <FieldGroup label="Variante">
              {renderField('variant', localSettings.variant, 'select', {
                options: [
                  { value: 'standard', label: 'Standard' },
                  { value: 'quote', label: 'Citazione' },
                  { value: 'highlight', label: 'Evidenziato' },
                ]
              })}
            </FieldGroup>
            <FieldGroup label="Contenuto (HTML)">
              {renderField('content', localSettings.content, 'textarea', { rows: 6 })}
            </FieldGroup>
            <FieldGroup label="Allineamento">
              {renderField('textAlign', localSettings.textAlign, 'select', {
                options: [
                  { value: 'left', label: 'Sinistra' },
                  { value: 'center', label: 'Centro' },
                  { value: 'right', label: 'Destra' },
                ]
              })}
            </FieldGroup>
          </Section>
        );

      default:
        return (
          <div className="p-4 text-slate-400 text-center">
            Impostazioni non disponibili per questo blocco
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{blockDef?.icon || '📦'}</span>
          <div>
            <h3 className="text-white font-semibold">{blockDef?.name || block.type}</h3>
            <p className="text-xs text-slate-400">Modifica impostazioni</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-y-auto">
        {renderBlockSettings()}
      </div>
    </div>
  );
};

export default BlockSettingsPanel;
