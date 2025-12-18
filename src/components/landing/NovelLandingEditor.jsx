import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Eye, EyeOff, Smartphone, Monitor, Palette, 
  Wand2, Loader2, Check, X, Sparkles, Layout, 
  ArrowLeft, Download, Settings, Image as ImageIcon,
  Type, Columns, Box
} from 'lucide-react';

/**
 * NovelLandingEditor - Editor semplificato Notion-style per landing page
 * 
 * Editor markdown intuitivo con:
 * - Toolbar di formattazione
 * - Template predefiniti
 * - AI Helper per generare contenuti
 * - Preview live
 * - Palette colori
 */

// Palette colori predefinite
const COLOR_PALETTES = [
  { id: 'blue', name: 'Blu Pro', primary: '#0ea5e9', bg: '#0f172a', text: '#f8fafc' },
  { id: 'purple', name: 'Viola', primary: '#8b5cf6', bg: '#1e1b4b', text: '#f8fafc' },
  { id: 'green', name: 'Verde', primary: '#10b981', bg: '#022c22', text: '#f8fafc' },
  { id: 'orange', name: 'Arancio', primary: '#f97316', bg: '#1c1917', text: '#f8fafc' },
  { id: 'dark', name: 'Dark', primary: '#ffffff', bg: '#09090b', text: '#fafafa' },
  { id: 'light', name: 'Light', primary: '#0ea5e9', bg: '#ffffff', text: '#0f172a' },
];

// Template di partenza per landing page
const LANDING_TEMPLATES = {
  fitness: {
    name: 'Personal Trainer',
    icon: '💪',
    content: `
# Trasforma il Tuo Corpo in 12 Settimane

Programma di allenamento personalizzato con supporto 1-to-1 dal tuo personal trainer certificato.

---

## ✨ Cosa Include

- **Piano Personalizzato** - Schede create su misura per te
- **Supporto Continuo** - Chat diretta con il coach  
- **Nutrizione** - Piano alimentare incluso
- **Tracking** - Monitora i tuoi progressi

---

## 💬 Dicono di Me

> "Ho perso 15kg in 3 mesi. Marco è fantastico!" 
> — *Anna R., Milano*

> "Finalmente un programma che funziona davvero."
> — *Luca B., Roma*

---

## 💰 Scegli il Tuo Piano

### Base - €99/mese
- 4 schede mensili
- Supporto chat

### Pro - €199/mese  
- Schede illimitate
- Videochiamate settimanali
- Piano nutrizionale

---

## 📞 Prenota una Consulenza Gratuita

Compila il form e ti ricontatterò entro 24 ore.
    `,
  },
  consultant: {
    name: 'Consulente',
    icon: '💼',
    content: `
# Fai Crescere il Tuo Business

Consulenza strategica per imprenditori ambiziosi che vogliono scalare.

---

## 🎯 Come Posso Aiutarti

- **Strategia** - Definisci la roadmap di crescita
- **Marketing** - Acquisisci clienti in modo prevedibile
- **Operazioni** - Ottimizza processi e team
- **Vendite** - Chiudi più deal, più velocemente

---

## 📈 Risultati dei Miei Clienti

- **+300%** crescita fatturato medio
- **50+** aziende seguite
- **€10M+** revenue generata

---

## 🗓️ Prenota una Call Strategica

30 minuti gratuiti per capire come posso aiutarti.
    `,
  },
  course: {
    name: 'Corso Online',
    icon: '🎓',
    content: `
# Impara [Skill] da Zero a Pro

Il corso completo per padroneggiare [skill] in sole 8 settimane.

---

## 📚 Cosa Imparerai

1. **Fondamenti** - Le basi solide per partire
2. **Pratica** - Esercizi e progetti reali
3. **Avanzato** - Tecniche da professionista
4. **Certificazione** - Attestato finale

---

## 👨‍🏫 Il Tuo Insegnante

Sono [Nome], [ruolo] con [X] anni di esperienza. Ho formato oltre [X] studenti.

---

## 💎 Cosa Ottieni

- 40+ video lezioni
- Esercizi pratici
- Community privata
- Supporto diretto
- Certificato finale

---

## 🚀 Iscriviti Ora

Prezzo lancio: ~~€497~~ **€297**

*Offerta valida ancora per:* **2 giorni**
    `,
  },
};

export default function NovelLandingEditor({ 
  initialContent = '', 
  onSave, 
  onBack,
  landingPage = null 
}) {
  // State
  const [content, setContent] = useState(initialContent || LANDING_TEMPLATES.fitness.content);
  const [selectedPalette, setSelectedPalette] = useState('blue');
  const [previewMode, setPreviewMode] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!initialContent);
  const [showPalette, setShowPalette] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);
  
  // Refs
  const editorRef = useRef(null);

  // Palette corrente
  const palette = useMemo(() => 
    COLOR_PALETTES.find(p => p.id === selectedPalette) || COLOR_PALETTES[0],
    [selectedPalette]
  );

  // Helper per inserire testo al cursore
  const insertAtCursor = (text) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    
    // Ripristina focus e posizione cursore
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

  // Helper per wrappare la selezione
  const wrapSelection = (before, after) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = end + before.length;
    }, 0);
  };

  // AI Action helper
  const aiAction = async (action) => {
    setAiGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 1500)); // Simula API call
      
      let addition = '';
      switch(action) {
        case 'improve':
          addition = '\n\n<!-- Testo migliorato dall\'AI -->';
          break;
        case 'expand':
          addition = '\n\n## 🎯 Perché Scegliere Noi\n\n- **Esperienza** - Anni di risultati comprovati\n- **Supporto** - Sempre al tuo fianco\n- **Garanzia** - Soddisfatti o rimborsati\n';
          break;
        case 'cta':
          addition = '\n\n---\n\n## 🚀 Inizia Oggi!\n\n**Non aspettare oltre.** Prenota ora la tua consulenza gratuita e scopri come possiamo aiutarti a raggiungere i tuoi obiettivi.\n\n[👉 PRENOTA ORA]\n';
          break;
        case 'testimonials':
          addition = '\n\n---\n\n## 💬 Cosa Dicono i Nostri Clienti\n\n> "Risultati incredibili in sole 8 settimane! Non potevo crederci."\n> — *Maria R., 35 anni*\n\n> "Professionalità e competenza al top. Consiglio a tutti!"\n> — *Marco L., 42 anni*\n\n> "Finalmente ho trovato chi mi capisce e mi aiuta davvero."\n> — *Giulia S., 28 anni*\n';
          break;
      }
      
      setContent(prev => prev + addition);
      setShowAiHelper(false);
    } catch (err) {
      console.error('Errore AI:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Gestione save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Converti markdown in HTML
      const html = convertToHtml(content, palette);
      await onSave?.({ 
        content, 
        html, 
        palette: selectedPalette,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Errore salvataggio:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Seleziona template
  const selectTemplate = (templateId) => {
    const template = LANDING_TEMPLATES[templateId];
    if (template) {
      setContent(template.content);
      setShowTemplates(false);
    }
  };

  // AI Generate - genera contenuto con AI
  const generateWithAI = async (prompt) => {
    setAiGenerating(true);
    try {
      // Qui chiameresti OpenAI
      // Per ora simula
      await new Promise(r => setTimeout(r, 2000));
      
      // Contenuto esempio generato
      const generated = `
# ${prompt || 'La Tua Landing Page'}

Testo generato dall'AI per "${prompt}". 

Modifica questo contenuto come preferisci usando l'editor.

---

## Caratteristiche Principali

- Feature 1
- Feature 2  
- Feature 3

---

## Contattaci

Compila il form per maggiori informazioni.
      `;
      
      setContent(generated);
    } catch (err) {
      console.error('Errore AI:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Converti contenuto in HTML styled
  const convertToHtml = (markdown, pal) => {
    // Semplice conversione markdown -> HTML
    let html = markdown
      .replace(/^### (.*$)/gm, `<h3 style="color: ${pal.primary}; font-size: 1.5rem; font-weight: bold; margin: 1.5rem 0 0.5rem;">$1</h3>`)
      .replace(/^## (.*$)/gm, `<h2 style="color: ${pal.text}; font-size: 2rem; font-weight: bold; margin: 2rem 0 1rem;">$1</h2>`)
      .replace(/^# (.*$)/gm, `<h1 style="color: ${pal.text}; font-size: 3rem; font-weight: bold; margin-bottom: 1rem;">$1</h1>`)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/^- (.*$)/gm, `<li style="color: ${pal.text}; margin: 0.5rem 0;">$1</li>`)
      .replace(/^> (.*$)/gm, `<blockquote style="border-left: 4px solid ${pal.primary}; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: ${pal.text}99;">$1</blockquote>`)
      .replace(/^---$/gm, `<hr style="border: none; border-top: 1px solid ${pal.text}22; margin: 2rem 0;" />`)
      .replace(/\n\n/g, '</p><p style="color: ' + pal.text + '; line-height: 1.7; margin: 1rem 0;">')
      .replace(/^(?!<[h|l|b|p|d|u])/gm, '');

    // Wrap in container
    return `
      <div style="background: ${pal.bg}; min-height: 100vh; padding: 4rem 2rem; font-family: system-ui, -apple-system, sans-serif;">
        <div style="max-width: 800px; margin: 0 auto;">
          ${html}
        </div>
      </div>
    `;
  };

  // Template Selection Modal
  if (showTemplates) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-purple-400" />
              Crea la tua Landing Page
            </h2>
            <p className="text-slate-400 mt-1">Scegli un template o parti da zero</p>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            {/* AI Generate */}
            <div className="p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Genera con AI</h3>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Es: Landing per personal trainer yoga donna over 40"
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  id="ai-prompt"
                />
                <button
                  onClick={() => {
                    const prompt = document.getElementById('ai-prompt').value;
                    generateWithAI(prompt);
                    setShowTemplates(false);
                  }}
                  disabled={aiGenerating}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  Genera
                </button>
              </div>
            </div>

            {/* Templates */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Oppure scegli un template</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(LANDING_TEMPLATES).map(([id, template]) => (
                  <button
                    key={id}
                    onClick={() => selectTemplate(id)}
                    className="p-6 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-left transition-all border-2 border-transparent hover:border-purple-500"
                  >
                    <span className="text-4xl mb-3 block">{template.icon}</span>
                    <h4 className="font-bold text-white mb-1">{template.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      Template ottimizzato per {template.name.toLowerCase()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Da Zero */}
            <button
              onClick={() => {
                setContent('# La Tua Landing Page\n\nInizia a scrivere qui...\n\n---\n\n## Sezione 1\n\nContenuto...');
                setShowTemplates(false);
              }}
              className="w-full p-4 border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <Layout className="w-6 h-6 mx-auto mb-2" />
              Parti da zero
            </button>
          </div>

          {onBack && (
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Torna indietro
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Left */}
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-white">Novel Editor</span>
            </div>
          </div>

          {/* Center - View Toggle */}
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !previewMode ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-4 h-4 inline mr-2" />
              Editor
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                previewMode ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Preview
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Device Toggle (only in preview) */}
            {previewMode && (
              <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setDevicePreview('desktop')}
                  className={`p-1.5 rounded ${devicePreview === 'desktop' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDevicePreview('mobile')}
                  className={`p-1.5 rounded ${devicePreview === 'mobile' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Palette */}
            <div className="relative">
              <button
                onClick={() => setShowPalette(!showPalette)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white flex items-center gap-2"
              >
                <div 
                  className="w-5 h-5 rounded-full border-2 border-white/20" 
                  style={{ backgroundColor: palette.primary }}
                />
                <Palette className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showPalette && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 bg-slate-700 rounded-xl p-3 shadow-xl border border-slate-600 z-10"
                  >
                    <p className="text-xs text-slate-400 mb-2">Palette colori</p>
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_PALETTES.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPalette(p.id);
                            setShowPalette(false);
                          }}
                          className={`p-2 rounded-lg flex flex-col items-center gap-1 ${
                            selectedPalette === p.id ? 'bg-slate-600 ring-2 ring-purple-500' : 'hover:bg-slate-600'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-full"
                            style={{ backgroundColor: p.primary }}
                          />
                          <span className="text-xs text-white">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Templates */}
            <button
              onClick={() => setShowTemplates(true)}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
              title="Cambia template"
            >
              <Layout className="w-5 h-5" />
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salva
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {previewMode ? (
          // Preview Mode
          <div className="h-full flex items-center justify-center bg-slate-950 p-4">
            <div 
              className={`bg-white rounded-xl shadow-2xl overflow-hidden transition-all ${
                devicePreview === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full max-w-5xl h-full'
              }`}
            >
              <iframe
                srcDoc={convertToHtml(content, palette)}
                className="w-full h-full border-0"
                title="Preview"
              />
            </div>
          </div>
        ) : (
          // Editor Mode - Novel Editor
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto py-8 px-4">
              {/* Info Box */}
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <p className="text-sm text-purple-300">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  <strong>Suggerimento AI:</strong> Premi <kbd className="px-1.5 py-0.5 bg-purple-500/30 rounded text-xs">++</kbd> per attivare l'autocompletamento AI mentre scrivi.
                </p>
              </div>

              {/* Simple Notion-Style Editor */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-2 p-3 border-b border-slate-700 bg-slate-800/50">
                  <button
                    onClick={() => insertAtCursor('# ')}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white text-sm font-bold"
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    onClick={() => insertAtCursor('## ')}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white text-sm font-bold"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    onClick={() => insertAtCursor('### ')}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white text-sm font-bold"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <div className="w-px h-5 bg-slate-600" />
                  <button
                    onClick={() => wrapSelection('**', '**')}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white font-bold"
                    title="Grassetto"
                  >
                    B
                  </button>
                  <button
                    onClick={() => wrapSelection('*', '*')}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white italic"
                    title="Corsivo"
                  >
                    I
                  </button>
                  <div className="w-px h-5 bg-slate-600" />
                  <button
                    onClick={() => insertAtCursor('- ')}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Lista"
                  >
                    •
                  </button>
                  <button
                    onClick={() => insertAtCursor('> ')}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Citazione"
                  >
                    "
                  </button>
                  <button
                    onClick={() => insertAtCursor('\n---\n')}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Divisore"
                  >
                    —
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setShowAiHelper(true)}
                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <Wand2 className="w-4 h-4" />
                    AI Helper
                  </button>
                </div>
                
                {/* Textarea Editor */}
                <textarea
                  ref={editorRef}
                  className="w-full min-h-[500px] p-6 bg-transparent text-white font-sans text-base leading-relaxed focus:outline-none resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Inizia a scrivere la tua landing page...

Usa la formattazione markdown:
# Titolo grande
## Titolo medio
### Titolo piccolo

**testo grassetto**
*testo corsivo*

- lista puntata
> citazione

---  (linea divisoria)"
                  style={{
                    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif'
                  }}
                />
              </div>
              
              {/* AI Helper Modal */}
              <AnimatePresence>
                {showAiHelper && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowAiHelper(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.95 }}
                      className="bg-slate-800 rounded-xl p-6 max-w-md w-full"
                      onClick={e => e.stopPropagation()}
                    >
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-400" />
                        AI Helper
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => aiAction('improve')}
                          disabled={aiGenerating}
                          className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left text-white"
                        >
                          <strong>✨ Migliora testo</strong>
                          <p className="text-sm text-slate-400 mt-1">Riscrivi il testo selezionato in modo più persuasivo</p>
                        </button>
                        <button
                          onClick={() => aiAction('expand')}
                          disabled={aiGenerating}
                          className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left text-white"
                        >
                          <strong>📝 Espandi contenuto</strong>
                          <p className="text-sm text-slate-400 mt-1">Aggiungi più dettagli e sezioni</p>
                        </button>
                        <button
                          onClick={() => aiAction('cta')}
                          disabled={aiGenerating}
                          className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left text-white"
                        >
                          <strong>🎯 Genera CTA</strong>
                          <p className="text-sm text-slate-400 mt-1">Crea una call-to-action efficace</p>
                        </button>
                        <button
                          onClick={() => aiAction('testimonials')}
                          disabled={aiGenerating}
                          className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left text-white"
                        >
                          <strong>💬 Genera testimonianze</strong>
                          <p className="text-sm text-slate-400 mt-1">Crea sezione recensioni clienti</p>
                        </button>
                      </div>
                      {aiGenerating && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-purple-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generando...</span>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
