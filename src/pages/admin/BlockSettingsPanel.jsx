import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Upload, Video, Image } from 'lucide-react';
import { DEFAULT_BLOCKS } from '../../services/landingPageService';
import MediaUploader from '../../components/landing/MediaUploader';
import FormPopupSettings from '../../components/landing/FormPopupSettings';

/**
 * BlockSettingsPanel - Pannello per modificare le impostazioni di un blocco
 * Usa memo per evitare re-render inutili quando il parent cambia
 */
const BlockSettingsPanel = memo(({ block, onUpdate, onClose, tenantId, pageId }) => {
  const [localSettings, setLocalSettings] = useState(block?.settings || {});
  const [expandedSections, setExpandedSections] = useState(['content', 'style']);
  const debounceRef = useRef(null);
  const blockIdRef = useRef(block?.id);
  const localSettingsRef = useRef(localSettings);
  const isInitialMount = useRef(true);
  
  // Mantieni ref aggiornato
  useEffect(() => {
    localSettingsRef.current = localSettings;
  }, [localSettings]);

  // Aggiorna localSettings solo quando cambia il blocco (non ad ogni re-render)
  useEffect(() => {
    if (block?.id !== blockIdRef.current) {
      blockIdRef.current = block?.id;
      setLocalSettings(block?.settings || {});
    }
  }, [block?.id, block?.settings]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handler stabile che usa ref
  const handleChange = useCallback((key, value) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // Usa setTimeout per evitare update sincrono
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onUpdate(newSettings);
      }, 800);
      return newSettings;
    });
  }, [onUpdate]);

  const handleArrayItemChange = useCallback((arrayKey, index, field, value) => {
    setLocalSettings(prev => {
      const newArray = [...(prev[arrayKey] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      const newSettings = { ...prev, [arrayKey]: newArray };
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onUpdate(newSettings);
      }, 800);
      return newSettings;
    });
  }, [onUpdate]);

  const handleAddArrayItem = useCallback((arrayKey, defaultItem) => {
    setLocalSettings(prev => {
      const newArray = [...(prev[arrayKey] || []), defaultItem];
      const newSettings = { ...prev, [arrayKey]: newArray };
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onUpdate(newSettings);
      }, 800);
      return newSettings;
    });
  }, [onUpdate]);

  const handleRemoveArrayItem = useCallback((arrayKey, index) => {
    setLocalSettings(prev => {
      const newArray = [...(prev[arrayKey] || [])];
      newArray.splice(index, 1);
      const newSettings = { ...prev, [arrayKey]: newArray };
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onUpdate(newSettings);
      }, 800);
      return newSettings;
    });
  }, [onUpdate]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

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
                    { value: 'minimal', label: 'Minimale' },
                    { value: 'fullscreen', label: 'Fullscreen' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title, 'textarea', { rows: 2 })}
              </FieldGroup>
              <FieldGroup label="Sottotitolo">
                {renderField('subtitle', localSettings.subtitle, 'textarea', { rows: 2 })}
              </FieldGroup>
            </Section>

            <Section title="Pulsante Principale" id="cta">
              <FieldGroup label="Testo">
                {renderField('ctaText', localSettings.ctaText)}
              </FieldGroup>
              <FieldGroup label="Azione">
                {renderField('ctaAction', localSettings.ctaAction || 'scroll', 'select', {
                  options: [
                    { value: 'scroll', label: 'Scrolla a sezione' },
                    { value: 'form_popup', label: '📝 Apri Form Popup' },
                    { value: 'redirect', label: 'Vai a URL' },
                    { value: 'whatsapp', label: 'Apri WhatsApp' },
                    { value: 'calendly', label: 'Apri Calendly' },
                    { value: 'phone', label: 'Chiama Telefono' },
                  ]
                })}
              </FieldGroup>

              {(!localSettings.ctaAction || localSettings.ctaAction === 'scroll') && (
                <FieldGroup label="ID Sezione" hint="Es: #form o #pricing">
                  {renderField('ctaLink', localSettings.ctaLink)}
                </FieldGroup>
              )}

              {localSettings.ctaAction === 'form_popup' && (
                <FormPopupSettings
                  localSettings={localSettings}
                  handleChange={handleChange}
                  renderField={renderField}
                  FieldGroup={FieldGroup}
                  tenantId={tenantId}
                />
              )}

              {localSettings.ctaAction === 'redirect' && (
                <FieldGroup label="URL">
                  {renderField('ctaRedirectUrl', localSettings.ctaRedirectUrl, 'text', { placeholder: 'https://...' })}
                </FieldGroup>
              )}

              {localSettings.ctaAction === 'whatsapp' && (
                <>
                  <FieldGroup label="Numero WhatsApp">
                    {renderField('ctaWhatsappNumber', localSettings.ctaWhatsappNumber, 'text', { placeholder: '+393331234567' })}
                  </FieldGroup>
                  <FieldGroup label="Messaggio">
                    {renderField('ctaWhatsappMessage', localSettings.ctaWhatsappMessage, 'textarea')}
                  </FieldGroup>
                </>
              )}

              {localSettings.ctaAction === 'calendly' && (
                <FieldGroup label="URL Calendly">
                  {renderField('ctaCalendlyUrl', localSettings.ctaCalendlyUrl, 'text', { placeholder: 'https://calendly.com/...' })}
                </FieldGroup>
              )}

              {localSettings.ctaAction === 'phone' && (
                <FieldGroup label="Numero Telefono">
                  {renderField('ctaPhoneNumber', localSettings.ctaPhoneNumber, 'text', { placeholder: '+393331234567' })}
                </FieldGroup>
              )}

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

            <Section title="Sfondo" id="background">
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
                <FieldGroup label="Gradiente">
                  {renderField('backgroundGradient', localSettings.backgroundGradient, 'select', {
                    options: [
                      { value: 'from-slate-900 via-sky-900 to-slate-900', label: 'Sky Dark' },
                      { value: 'from-slate-900 via-purple-900 to-slate-900', label: 'Purple Dark' },
                      { value: 'from-slate-900 via-emerald-900 to-slate-900', label: 'Emerald Dark' },
                      { value: 'from-sky-600 to-cyan-500', label: 'Sky/Cyan' },
                      { value: 'from-purple-600 to-pink-500', label: 'Purple/Pink' },
                      { value: 'from-orange-500 to-red-500', label: 'Orange/Red' },
                      { value: 'from-slate-800 to-slate-900', label: 'Slate' },
                    ]
                  })}
                </FieldGroup>
              )}

              {localSettings.backgroundType === 'image' && (
                <FieldGroup label="Immagine Sfondo">
                  {localSettings.backgroundImage ? (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden aspect-video">
                        <img 
                          src={localSettings.backgroundImage} 
                          alt="Background" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleChange('backgroundImage', '')}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MediaUploader
                      accept="image"
                      onUpload={(url) => handleChange('backgroundImage', url)}
                      tenantId={tenantId}
                      pageId={pageId}
                      blockId={block.id}
                      compact
                    />
                  )}
                </FieldGroup>
              )}

              {localSettings.backgroundType === 'video' && (
                <FieldGroup label="Video Sfondo">
                  {localSettings.backgroundVideo ? (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden aspect-video bg-slate-700">
                        <video 
                          src={localSettings.backgroundVideo} 
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                        <button
                          onClick={() => handleChange('backgroundVideo', '')}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MediaUploader
                      accept="video"
                      onUpload={(url) => handleChange('backgroundVideo', url)}
                      tenantId={tenantId}
                      pageId={pageId}
                      blockId={block.id}
                      compact
                    />
                  )}
                </FieldGroup>
              )}

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

            <Section title="Altezza" id="height">
              <FieldGroup label="Altezza Minima">
                {renderField('minHeight', localSettings.minHeight, 'select', {
                  options: [
                    { value: '80vh', label: 'Grande (80vh)' },
                    { value: '100vh', label: 'Fullscreen (100vh)' },
                    { value: '60vh', label: 'Media (60vh)' },
                    { value: '50vh', label: 'Compatta (50vh)' },
                  ]
                })}
              </FieldGroup>
            </Section>

            {/* Sezione Immagine Laterale - solo per variante Split */}
            {localSettings.variant === 'split' && (
              <Section title="Immagine Laterale" id="splitImage">
                <FieldGroup label="Immagine">
                  {localSettings.splitImage ? (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden aspect-square">
                        <img 
                          src={localSettings.splitImage} 
                          alt="Split Image" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleChange('splitImage', '')}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MediaUploader
                      accept="image"
                      onUpload={(url) => handleChange('splitImage', url)}
                      tenantId={tenantId}
                      pageId={pageId}
                      blockId={block.id}
                      compact
                    />
                  )}
                </FieldGroup>
                <FieldGroup label="Stile Immagine">
                  {renderField('splitImageStyle', localSettings.splitImageStyle || 'rounded', 'select', {
                    options: [
                      { value: 'rounded', label: 'Arrotondata' },
                      { value: 'circle', label: 'Cerchio' },
                      { value: 'square', label: 'Quadrata' },
                      { value: 'blob', label: 'Forma Organica' },
                    ]
                  })}
                </FieldGroup>
                <FieldGroup label="Posizione Immagine">
                  {renderField('splitImagePosition', localSettings.splitImagePosition || 'right', 'select', {
                    options: [
                      { value: 'right', label: 'Destra' },
                      { value: 'left', label: 'Sinistra' },
                    ]
                  })}
                </FieldGroup>
              </Section>
            )}

            {/* Sezione Stile Testo */}
            <Section title="Stile Testo" id="textStyle">
              <FieldGroup label="Colore Titolo">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={localSettings.titleColor || '#ffffff'}
                    onChange={(e) => handleChange('titleColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-slate-600"
                  />
                  <input
                    type="text"
                    value={localSettings.titleColor || '#ffffff'}
                    onChange={(e) => handleChange('titleColor', e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    placeholder="#ffffff"
                  />
                </div>
              </FieldGroup>
              <FieldGroup label="Dimensione Titolo">
                {renderField('titleSize', localSettings.titleSize || 'default', 'select', {
                  options: [
                    { value: 'small', label: 'Piccolo (3xl)' },
                    { value: 'default', label: 'Normale (4xl-6xl)' },
                    { value: 'large', label: 'Grande (5xl-7xl)' },
                    { value: 'xlarge', label: 'Extra Grande (6xl-8xl)' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Colore Sottotitolo">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={localSettings.subtitleColor || '#cbd5e1'}
                    onChange={(e) => handleChange('subtitleColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-slate-600"
                  />
                  <input
                    type="text"
                    value={localSettings.subtitleColor || '#cbd5e1'}
                    onChange={(e) => handleChange('subtitleColor', e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    placeholder="#cbd5e1"
                  />
                </div>
              </FieldGroup>
              <FieldGroup label="Allineamento Testo">
                {renderField('textAlign', localSettings.textAlign || 'left', 'select', {
                  options: [
                    { value: 'left', label: 'Sinistra' },
                    { value: 'center', label: 'Centro' },
                    { value: 'right', label: 'Destra' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Parole Evidenziate" hint="Testo che verrà colorato diversamente">
                {renderField('highlightedWords', localSettings.highlightedWords || '', 'text', {
                  placeholder: 'es: Trasforma, Risultati'
                })}
              </FieldGroup>
              {localSettings.highlightedWords && (
                <FieldGroup label="Colore Evidenziazione">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localSettings.highlightColor || '#0ea5e9'}
                      onChange={(e) => handleChange('highlightColor', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-slate-600"
                    />
                    <input
                      type="text"
                      value={localSettings.highlightColor || '#0ea5e9'}
                      onChange={(e) => handleChange('highlightColor', e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                      placeholder="#0ea5e9"
                    />
                  </div>
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
                    { value: 'split', label: 'Split con Immagine' },
                    { value: 'floating', label: 'Card Floating' },
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
            </Section>

            <Section title="Azione Dopo Invio" id="afterSubmit">
              <FieldGroup label="Azione">
                {renderField('afterSubmitAction', localSettings.afterSubmitAction || 'message', 'select', {
                  options: [
                    { value: 'message', label: 'Mostra messaggio di successo' },
                    { value: 'redirect', label: 'Redirect a URL' },
                    { value: 'popup', label: 'Mostra Popup' },
                    { value: 'whatsapp', label: 'Apri WhatsApp' },
                    { value: 'calendly', label: 'Apri Calendly' },
                  ]
                })}
              </FieldGroup>

              {(!localSettings.afterSubmitAction || localSettings.afterSubmitAction === 'message') && (
                <FieldGroup label="Messaggio Successo">
                  {renderField('successMessage', localSettings.successMessage, 'textarea')}
                </FieldGroup>
              )}

              {localSettings.afterSubmitAction === 'redirect' && (
                <>
                  <FieldGroup label="URL di Redirect">
                    {renderField('redirectUrl', localSettings.redirectUrl, 'text', { placeholder: 'https://...' })}
                  </FieldGroup>
                  <FieldGroup label="Ritardo (secondi)">
                    {renderField('redirectDelay', localSettings.redirectDelay || 2, 'number', { min: 0, max: 10 })}
                  </FieldGroup>
                </>
              )}

              {localSettings.afterSubmitAction === 'popup' && (
                <>
                  <FieldGroup label="Titolo Popup">
                    {renderField('popupTitle', localSettings.popupTitle || 'Grazie!')}
                  </FieldGroup>
                  <FieldGroup label="Contenuto Popup">
                    {renderField('popupContent', localSettings.popupContent, 'textarea')}
                  </FieldGroup>
                  <FieldGroup label="Testo Pulsante">
                    {renderField('popupCtaText', localSettings.popupCtaText || 'Chiudi')}
                  </FieldGroup>
                </>
              )}

              {localSettings.afterSubmitAction === 'whatsapp' && (
                <>
                  <FieldGroup label="Numero WhatsApp" hint="Formato: +39...">
                    {renderField('whatsappNumber', localSettings.whatsappNumber, 'text', { placeholder: '+393331234567' })}
                  </FieldGroup>
                  <FieldGroup label="Messaggio Precompilato">
                    {renderField('whatsappMessage', localSettings.whatsappMessage, 'textarea')}
                  </FieldGroup>
                </>
              )}

              {localSettings.afterSubmitAction === 'calendly' && (
                <FieldGroup label="URL Calendly">
                  {renderField('calendlyUrl', localSettings.calendlyUrl, 'text', { placeholder: 'https://calendly.com/...' })}
                </FieldGroup>
              )}
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

            <Section title="Gestione Lead" id="leads">
              <FieldGroup label="Salva in Leads">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={localSettings.saveToLeads !== false}
                    onChange={(e) => handleChange('saveToLeads', e.target.checked)}
                    className="rounded w-5 h-5 text-green-500 border-slate-600 bg-slate-700"
                  />
                  <span className="text-sm text-slate-300">
                    Salva i dati del form nella tabella Leads
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  I lead saranno visibili in Landing Pages → Leads
                </p>
              </FieldGroup>
              
              {localSettings.saveToLeads !== false && (
                <>
                  <FieldGroup label="Etichetta Sorgente" hint="Per identificare da quale form arriva il lead">
                    {renderField('leadSource', localSettings.leadSource || 'landing_page', 'text', { 
                      placeholder: 'es: promo-natale, form-contatti' 
                    })}
                  </FieldGroup>
                  <FieldGroup label="Invia Notifica">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={localSettings.sendNotification !== false}
                        onChange={(e) => handleChange('sendNotification', e.target.checked)}
                        className="rounded w-5 h-5 text-green-500 border-slate-600 bg-slate-700"
                      />
                      <span className="text-sm text-slate-300">
                        Invia notifica quando arriva un nuovo lead
                      </span>
                    </div>
                  </FieldGroup>
                </>
              )}
            </Section>

            <Section title="Privacy" id="privacy">
              <FieldGroup label="Testo Privacy">
                {renderField('privacyText', localSettings.privacyText, 'textarea', {
                  placeholder: 'Ho letto e accetto la privacy policy'
                })}
              </FieldGroup>
              <FieldGroup label="Link Privacy Policy">
                {renderField('privacyLink', localSettings.privacyLink || '/privacy', 'text', {
                  placeholder: '/privacy'
                })}
              </FieldGroup>
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
                    { value: 'floating', label: 'Card Floating' },
                    { value: 'fullscreen', label: 'Fullscreen' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title, 'textarea', { rows: 2 })}
              </FieldGroup>
              <FieldGroup label="Sottotitolo">
                {renderField('subtitle', localSettings.subtitle, 'textarea')}
              </FieldGroup>
            </Section>

            <Section title="Pulsante Principale" id="mainCta">
              <FieldGroup label="Testo Pulsante">
                {renderField('ctaText', localSettings.ctaText)}
              </FieldGroup>
              <FieldGroup label="Azione">
                {renderField('ctaAction', localSettings.ctaAction || 'scroll', 'select', {
                  options: [
                    { value: 'scroll', label: 'Scrolla a sezione' },
                    { value: 'form_popup', label: '📝 Apri Form Popup' },
                    { value: 'redirect', label: 'Vai a URL' },
                    { value: 'whatsapp', label: 'Apri WhatsApp' },
                    { value: 'calendly', label: 'Apri Calendly' },
                    { value: 'phone', label: 'Chiama Telefono' },
                  ]
                })}
              </FieldGroup>

              {(!localSettings.ctaAction || localSettings.ctaAction === 'scroll') && (
                <FieldGroup label="ID Sezione" hint="Es: #form o #pricing">
                  {renderField('ctaLink', localSettings.ctaLink)}
                </FieldGroup>
              )}

              {localSettings.ctaAction === 'form_popup' && (
                <FormPopupSettings
                  localSettings={localSettings}
                  handleChange={handleChange}
                  renderField={renderField}
                  FieldGroup={FieldGroup}
                  tenantId={tenantId}
                />
              )}

              {localSettings.ctaAction === 'redirect' && (
                <FieldGroup label="URL">
                  {renderField('ctaRedirectUrl', localSettings.ctaRedirectUrl, 'text', { placeholder: 'https://...' })}
                </FieldGroup>
              )}

              {localSettings.ctaAction === 'whatsapp' && (
                <>
                  <FieldGroup label="Numero WhatsApp">
                    {renderField('ctaWhatsappNumber', localSettings.ctaWhatsappNumber, 'text', { placeholder: '+393331234567' })}
                  </FieldGroup>
                  <FieldGroup label="Messaggio">
                    {renderField('ctaWhatsappMessage', localSettings.ctaWhatsappMessage, 'textarea')}
                  </FieldGroup>
                </>
              )}

              {localSettings.ctaAction === 'calendly' && (
                <FieldGroup label="URL Calendly">
                  {renderField('ctaCalendlyUrl', localSettings.ctaCalendlyUrl, 'text', { placeholder: 'https://calendly.com/...' })}
                </FieldGroup>
              )}

              {localSettings.ctaAction === 'phone' && (
                <FieldGroup label="Numero Telefono">
                  {renderField('ctaPhoneNumber', localSettings.ctaPhoneNumber, 'text', { placeholder: '+393331234567' })}
                </FieldGroup>
              )}
            </Section>

            <Section title="Pulsante Secondario" id="secondaryCta">
              <FieldGroup label="Mostra Pulsante Secondario">
                <div className="flex items-center justify-between">
                  {renderField('showSecondaryButton', localSettings.showSecondaryButton, 'boolean')}
                </div>
              </FieldGroup>
              {localSettings.showSecondaryButton && (
                <>
                  <FieldGroup label="Testo">
                    {renderField('secondaryText', localSettings.secondaryText)}
                  </FieldGroup>
                  <FieldGroup label="Link">
                    {renderField('secondaryLink', localSettings.secondaryLink)}
                  </FieldGroup>
                </>
              )}
            </Section>

            <Section title="Statistiche" id="stats">
              <FieldGroup label="Mostra Statistiche">
                <div className="flex items-center justify-between">
                  {renderField('showStats', localSettings.showStats, 'boolean')}
                </div>
              </FieldGroup>

              {localSettings.showStats && (
                <>
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
                </>
              )}
            </Section>

            <Section title="Stile" id="style">
              <FieldGroup label="Gradiente Sfondo">
                {renderField('backgroundGradient', localSettings.backgroundGradient, 'select', {
                  options: [
                    { value: 'from-sky-600 to-cyan-500', label: 'Sky/Cyan' },
                    { value: 'from-purple-600 to-pink-500', label: 'Purple/Pink' },
                    { value: 'from-orange-500 to-red-500', label: 'Orange/Red' },
                    { value: 'from-green-500 to-emerald-500', label: 'Green/Emerald' },
                    { value: 'from-slate-800 to-slate-900', label: 'Dark' },
                    { value: 'from-rose-500 to-red-600', label: 'Rose/Red' },
                    { value: 'from-indigo-600 to-purple-600', label: 'Indigo/Purple' },
                    { value: 'from-amber-500 to-orange-600', label: 'Amber/Orange' },
                  ]
                })}
              </FieldGroup>
            </Section>
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
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'featured', label: 'Featured' },
                    { value: 'inline', label: 'Inline' },
                    { value: 'background', label: 'Background' },
                    { value: 'fullwidth', label: 'Full Width' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title)}
              </FieldGroup>
              <FieldGroup label="Sottotitolo">
                {renderField('subtitle', localSettings.subtitle, 'textarea')}
              </FieldGroup>
            </Section>

            <Section title="Video" id="video">
              <FieldGroup label="Sorgente Video">
                {renderField('videoSource', localSettings.videoSource || 'url', 'select', {
                  options: [
                    { value: 'url', label: 'URL esterno (YouTube, Vimeo)' },
                    { value: 'upload', label: 'Carica video' },
                  ]
                })}
              </FieldGroup>

              {(localSettings.videoSource === 'url' || !localSettings.videoSource) && (
                <FieldGroup label="URL Video" hint="YouTube, Vimeo o URL diretto">
                  {renderField('videoUrl', localSettings.videoUrl, 'url')}
                </FieldGroup>
              )}

              {localSettings.videoSource === 'upload' && (
                <FieldGroup label="Video">
                  {localSettings.uploadedVideoUrl ? (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden aspect-video bg-slate-700">
                        <video 
                          src={localSettings.uploadedVideoUrl} 
                          className="w-full h-full object-cover"
                          controls
                        />
                        <button
                          onClick={() => handleChange('uploadedVideoUrl', '')}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MediaUploader
                      accept="video"
                      onUpload={(url) => handleChange('uploadedVideoUrl', url)}
                      tenantId={tenantId}
                      pageId={pageId}
                      blockId={block.id}
                      compact
                    />
                  )}
                </FieldGroup>
              )}

              <FieldGroup label="Poster/Thumbnail">
                {localSettings.posterImage ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden aspect-video">
                      <img 
                        src={localSettings.posterImage} 
                        alt="Poster" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleChange('posterImage', '')}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <MediaUploader
                    accept="image"
                    onUpload={(url) => handleChange('posterImage', url)}
                    tenantId={tenantId}
                    pageId={pageId}
                    blockId={block.id}
                    compact
                  />
                )}
              </FieldGroup>
            </Section>

            <Section title="Opzioni" id="options">
              <FieldGroup label="Autoplay">
                <div className="flex items-center justify-between">
                  {renderField('autoplay', localSettings.autoplay, 'boolean')}
                </div>
              </FieldGroup>
              <FieldGroup label="Loop">
                <div className="flex items-center justify-between">
                  {renderField('loop', localSettings.loop, 'boolean')}
                </div>
              </FieldGroup>
              <FieldGroup label="Muto">
                <div className="flex items-center justify-between">
                  {renderField('muted', localSettings.muted, 'boolean')}
                </div>
              </FieldGroup>
              <FieldGroup label="Mostra Controlli">
                <div className="flex items-center justify-between">
                  {renderField('showControls', localSettings.showControls, 'boolean')}
                </div>
              </FieldGroup>
            </Section>
          </>
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

      case 'gallery':
        return (
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'grid', label: 'Griglia' },
                    { value: 'masonry', label: 'Masonry' },
                    { value: 'carousel', label: 'Carosello' },
                    { value: 'lightbox', label: 'Lightbox' },
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

            <Section title="Immagini" id="images">
              {(localSettings.images || []).map((image, index) => (
                <div key={index} className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Immagine {index + 1}</span>
                    <button
                      onClick={() => handleRemoveArrayItem('images', index)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  
                  {image.url ? (
                    <div className="relative rounded-lg overflow-hidden aspect-video">
                      <img 
                        src={image.url} 
                        alt={image.alt || `Image ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleArrayItemChange('images', index, 'url', '')}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <MediaUploader
                      accept="image"
                      onUpload={(url) => handleArrayItemChange('images', index, 'url', url)}
                      tenantId={tenantId}
                      pageId={pageId}
                      blockId={block.id}
                      compact
                    />
                  )}
                  
                  <input
                    type="text"
                    value={image.alt || ''}
                    onChange={(e) => handleArrayItemChange('images', index, 'alt', e.target.value)}
                    placeholder="Alt text"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={image.caption || ''}
                    onChange={(e) => handleArrayItemChange('images', index, 'caption', e.target.value)}
                    placeholder="Didascalia (opzionale)"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              ))}
              <button
                onClick={() => handleAddArrayItem('images', { url: '', alt: '', caption: '' })}
                className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Immagine
              </button>
            </Section>

            <Section title="Opzioni" id="options">
              <FieldGroup label="Gap">
                {renderField('gap', localSettings.gap, 'select', {
                  options: [
                    { value: 'small', label: 'Piccolo' },
                    { value: 'medium', label: 'Medio' },
                    { value: 'large', label: 'Grande' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Hover Effect">
                {renderField('hoverEffect', localSettings.hoverEffect, 'select', {
                  options: [
                    { value: 'none', label: 'Nessuno' },
                    { value: 'zoom', label: 'Zoom' },
                    { value: 'overlay', label: 'Overlay' },
                    { value: 'lift', label: 'Solleva' },
                  ]
                })}
              </FieldGroup>
            </Section>
          </>
        );

      case 'socialProof':
        return (
          <>
            <Section title="Contenuto" id="content">
              <FieldGroup label="Variante">
                {renderField('variant', localSettings.variant, 'select', {
                  options: [
                    { value: 'banner', label: 'Banner' },
                    { value: 'cards', label: 'Cards' },
                    { value: 'minimal', label: 'Minimale' },
                  ]
                })}
              </FieldGroup>
              <FieldGroup label="Titolo">
                {renderField('title', localSettings.title)}
              </FieldGroup>
            </Section>

            <Section title="Elementi Social Proof" id="items">
              {(localSettings.items || []).map((item, index) => (
                <div key={index} className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Elemento {index + 1}</span>
                    <button
                      onClick={() => handleRemoveArrayItem('items', index)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <select
                    value={item.type || 'stat'}
                    onChange={(e) => handleArrayItemChange('items', index, 'type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="stat">Statistica</option>
                    <option value="logo">Logo Partner</option>
                    <option value="badge">Badge</option>
                  </select>
                  
                  {item.type === 'stat' && (
                    <>
                      <input
                        type="text"
                        value={item.value || ''}
                        onChange={(e) => handleArrayItemChange('items', index, 'value', e.target.value)}
                        placeholder="Valore (es: 500+)"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      />
                      <input
                        type="text"
                        value={item.label || ''}
                        onChange={(e) => handleArrayItemChange('items', index, 'label', e.target.value)}
                        placeholder="Label (es: Clienti Attivi)"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      />
                    </>
                  )}
                  
                  {(item.type === 'logo' || item.type === 'badge') && (
                    <>
                      {item.imageUrl ? (
                        <div className="relative rounded-lg overflow-hidden h-16 bg-white p-2">
                          <img 
                            src={item.imageUrl} 
                            alt={item.label || 'Logo'} 
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={() => handleArrayItemChange('items', index, 'imageUrl', '')}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <MediaUploader
                          accept="image"
                          onUpload={(url) => handleArrayItemChange('items', index, 'imageUrl', url)}
                          tenantId={tenantId}
                          pageId={pageId}
                          blockId={block.id}
                          compact
                        />
                      )}
                      <input
                        type="text"
                        value={item.label || ''}
                        onChange={(e) => handleArrayItemChange('items', index, 'label', e.target.value)}
                        placeholder="Nome/Alt text"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      />
                    </>
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddArrayItem('items', { type: 'stat', value: '', label: '' })}
                className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Elemento
              </button>
            </Section>
          </>
        );

      case 'divider':
        return (
          <Section title="Contenuto" id="content">
            <FieldGroup label="Variante">
              {renderField('variant', localSettings.variant, 'select', {
                options: [
                  { value: 'line', label: 'Linea' },
                  { value: 'space', label: 'Spazio' },
                  { value: 'wave', label: 'Onda' },
                  { value: 'angle', label: 'Angolo' },
                ]
              })}
            </FieldGroup>
            <FieldGroup label="Altezza">
              {renderField('height', localSettings.height, 'select', {
                options: [
                  { value: 'small', label: 'Piccola' },
                  { value: 'medium', label: 'Media' },
                  { value: 'large', label: 'Grande' },
                ]
              })}
            </FieldGroup>
            <FieldGroup label="Colore">
              {renderField('color', localSettings.color, 'select', {
                options: [
                  { value: 'slate', label: 'Slate' },
                  { value: 'sky', label: 'Sky' },
                  { value: 'purple', label: 'Purple' },
                  { value: 'white', label: 'Bianco' },
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
// Comparatore personalizzato per memo - re-render solo se cambia l'ID del blocco
}, (prevProps, nextProps) => {
  // Return true se NON deve re-renderizzare
  return prevProps.block?.id === nextProps.block?.id &&
         prevProps.tenantId === nextProps.tenantId &&
         prevProps.pageId === nextProps.pageId;
});

// Export - già memoizzato nella definizione
export default BlockSettingsPanel;
