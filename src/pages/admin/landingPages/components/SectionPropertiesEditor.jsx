// src/pages/admin/landingPages/components/SectionPropertiesEditor.jsx
import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { uploadToR2 } from '../../../../cloudflareStorage';
import { auth } from '../../../../firebase';

export default function SectionPropertiesEditor({ section, onUpdate, onClose }) {
  const [uploading, setUploading] = useState(false);

  // Early return se section non è valida
  if (!section) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-slate-700 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Errore</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <p className="text-slate-400">Nessuna sezione selezionata</p>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToR2(file, auth.currentUser.uid, 'landing-pages', null, true);
      onUpdate({ [field]: url });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Errore upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const renderField = (key, value, label, type = 'text') => {
    if (type === 'textarea') {
      return (
        <div key={key}>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
          <textarea
            value={value || ''}
            onChange={(e) => onUpdate({ [key]: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      );
    }

    if (type === 'number') {
      return (
        <div key={key}>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onUpdate({ [key]: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      );
    }

    if (type === 'select') {
      return (
        <div key={key}>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
          <select
            value={value || ''}
            onChange={(e) => onUpdate({ [key]: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {/* Options vengono passate dinamicamente */}
          </select>
        </div>
      );
    }

    if (type === 'checkbox') {
      return (
        <div key={key} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onUpdate({ [key]: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm text-slate-300">{label}</label>
        </div>
      );
    }

    if (type === 'image') {
      return (
        <div key={key}>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
          <div className="space-y-2">
            {value && (
              <img src={value} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
            )}
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, key)}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                {uploading ? 'Caricamento...' : 'Carica Immagine'}
              </div>
            </label>
          </div>
        </div>
      );
    }

    return (
      <div key={key}>
        <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onUpdate({ [key]: e.target.value })}
          className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
    );
  };

  // Rendering specifico per tipo sezione
  const renderProps = () => {
    if (!section) {
      return <div className="text-slate-500 text-center py-4">Nessuna sezione selezionata</div>;
    }

    const { type, props = {} } = section;

    // Fallback se props è undefined
    if (!props || typeof props !== 'object') {
      return (
        <div className="text-slate-500 text-center py-4">
          Impossibile caricare le proprietà della sezione
        </div>
      );
    }

    switch (type) {
      case 'hero':
        return (
          <>
            {renderField('title', props.title, 'Titolo', 'text')}
            {renderField('subtitle', props.subtitle, 'Sottotitolo', 'textarea')}
            {renderField('ctaText', props.ctaText, 'Testo Pulsante', 'text')}
            
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Azione Pulsante</label>
              <select
                value={props.ctaAction || 'scroll'}
                onChange={(e) => onUpdate({ ctaAction: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 mb-2"
              >
                <option value="scroll">Scroll a sezione</option>
                <option value="link">Link esterno</option>
                <option value="form">Apri form</option>
                <option value="video">Carica video</option>
              </select>

              {props.ctaAction === 'scroll' && renderField('ctaTarget', props.ctaTarget, 'ID Sezione (es: #contact)', 'text')}
              {props.ctaAction === 'link' && (
                <>
                  {renderField('ctaTarget', props.ctaTarget, 'URL (https://...)', 'text')}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={props.ctaTargetBlank || false}
                      onChange={(e) => onUpdate({ ctaTargetBlank: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-slate-300">Apri in nuova tab</label>
                  </div>
                </>
              )}
              {props.ctaAction === 'video' && (
                <p className="text-xs text-slate-500 mt-2">
                  Il pulsante aprirà un form di upload video (max 1GB)
                </p>
              )}
            </div>

            {renderField('backgroundImage', props.backgroundImage, 'Immagine di Sfondo', 'image')}
            {renderField('showOverlay', props.showOverlay, 'Mostra overlay scuro', 'checkbox')}
          </>
        );

      case 'videoUpload':
        return (
          <>
            {renderField('title', props.title, 'Titolo', 'text')}
            {renderField('description', props.description, 'Descrizione', 'textarea')}
            {renderField('maxSize', props.maxSize, 'Dimensione Max (MB)', 'number')}
            {renderField('requireName', props.requireName, 'Richiedi Nome', 'checkbox')}
            {renderField('requireEmail', props.requireEmail, 'Richiedi Email', 'checkbox')}
            {renderField('requirePhone', props.requirePhone, 'Richiedi Telefono', 'checkbox')}
            {renderField('successMessage', props.successMessage, 'Messaggio Successo', 'text')}
            {renderField('redirectUrl', props.redirectUrl, 'Redirect dopo upload (opzionale)', 'text')}
            {renderField('buttonText', props.buttonText, 'Testo Pulsante', 'text')}
          </>
        );

      case 'contactForm':
        return (
          <>
            {renderField('title', props.title, 'Titolo', 'text')}
            {renderField('description', props.description, 'Descrizione', 'textarea')}
            {renderField('showName', props.showName, 'Campo Nome', 'checkbox')}
            {renderField('showEmail', props.showEmail, 'Campo Email', 'checkbox')}
            {renderField('showPhone', props.showPhone, 'Campo Telefono', 'checkbox')}
            {renderField('showMessage', props.showMessage, 'Campo Messaggio', 'checkbox')}
            {renderField('submitText', props.submitText, 'Testo Pulsante', 'text')}
            {renderField('successMessage', props.successMessage, 'Messaggio Successo', 'text')}
            {renderField('redirectUrl', props.redirectUrl, 'Redirect dopo invio (opzionale)', 'text')}
            {renderField('notificationEmail', props.notificationEmail, 'Email notifica (opzionale)', 'text')}
          </>
        );

      case 'features':
        return (
          <>
            {renderField('title', props.title, 'Titolo', 'text')}
            {renderField('subtitle', props.subtitle, 'Sottotitolo (opzionale)', 'text')}
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Colonne</label>
              <select
                value={props.columns || 3}
                onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {props.items?.length || 0} caratteristiche configurate
            </div>
          </>
        );

      case 'pricing':
        return (
          <>
            {renderField('title', props.title, 'Titolo', 'text')}
            {renderField('subtitle', props.subtitle, 'Sottotitolo (opzionale)', 'text')}
            <div className="text-xs text-slate-500 mt-2">
              {props.plans?.length || 0} piani configurati
            </div>
          </>
        );

      case 'cta':
        return (
          <>
            {renderField('title', props.title, 'Titolo', 'text')}
            {renderField('subtitle', props.subtitle, 'Sottotitolo', 'textarea')}
            {renderField('buttonText', props.buttonText, 'Testo Pulsante', 'text')}
            
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Azione</label>
              <select
                value={props.buttonAction || 'scroll'}
                onChange={(e) => onUpdate({ buttonAction: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 mb-2"
              >
                <option value="scroll">Scroll a sezione</option>
                <option value="link">Link</option>
                <option value="form">Form</option>
              </select>
              {renderField('buttonTarget', props.buttonTarget, 'Target', 'text')}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Stile</label>
              <select
                value={props.style || 'gradient'}
                onChange={(e) => onUpdate({ style: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="gradient">Gradiente</option>
                <option value="solid">Solido</option>
                <option value="outline">Outline</option>
              </select>
            </div>
          </>
        );

      default:
        return <p className="text-sm text-slate-400">Nessuna proprietà disponibile</p>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700">
        <h3 className="font-semibold text-white">Proprietà Sezione</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        {renderProps()}
      </div>
    </div>
  );
}
