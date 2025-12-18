import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Eye, Smartphone, Monitor, Palette, 
  Wand2, Loader2, Sparkles, Layout, 
  ArrowLeft, Settings, Globe, Camera, Upload, Trash2,
  Type, Zap, MessageSquare, Star, DollarSign, 
  Users, HelpCircle, Send, RotateCcw, Copy, Check
} from 'lucide-react';

/**
 * NovelLandingEditor - Editor Landing Page con AI 1-Click
 * 
 * - Generazione AI completa 1-click
 * - Template predefiniti
 * - Editor markdown semplice
 * - AI Helper per sezioni
 * - Preview live
 */

// Palette colori predefinite
const COLOR_PALETTES = [
  { id: 'blue', name: 'Blu Pro', primary: '#0ea5e9', secondary: '#06b6d4', bg: '#0f172a', text: '#f8fafc' },
  { id: 'purple', name: 'Viola', primary: '#8b5cf6', secondary: '#a855f7', bg: '#1e1b4b', text: '#f8fafc' },
  { id: 'green', name: 'Verde', primary: '#10b981', secondary: '#14b8a6', bg: '#022c22', text: '#f8fafc' },
  { id: 'orange', name: 'Arancio', primary: '#f97316', secondary: '#fb923c', bg: '#1c1917', text: '#f8fafc' },
  { id: 'dark', name: 'Dark', primary: '#ffffff', secondary: '#94a3b8', bg: '#09090b', text: '#fafafa' },
  { id: 'gradient', name: 'Aurora', primary: '#6366f1', secondary: '#ec4899', bg: '#0c0a1d', text: '#f8fafc' },
];

// Template predefiniti con sezioni
const PRESET_TEMPLATES = [
  { 
    id: 'fitness', 
    name: 'Personal Trainer', 
    icon: '💪',
    desc: 'Landing per PT e coach fitness',
    sections: ['hero', 'features', 'testimonials', 'pricing', 'faq', 'cta']
  },
  { 
    id: 'consultant', 
    name: 'Consulente', 
    icon: '💼',
    desc: 'Landing per consulenti e professionisti',
    sections: ['hero', 'about', 'features', 'testimonials', 'pricing', 'cta']
  },
  { 
    id: 'course', 
    name: 'Corso Online', 
    icon: '🎓',
    desc: 'Landing per vendita corsi',
    sections: ['hero', 'features', 'testimonials', 'pricing', 'faq', 'cta']
  },
  { 
    id: 'saas', 
    name: 'SaaS/App', 
    icon: '🚀',
    desc: 'Landing per software e app',
    sections: ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta']
  },
];

// Sezioni disponibili per generazione
const SECTION_TYPES = {
  hero: { icon: <Zap />, label: 'Hero', desc: 'Sezione principale' },
  features: { icon: <Star />, label: 'Features', desc: 'Servizi/caratteristiche' },
  pricing: { icon: <DollarSign />, label: 'Prezzi', desc: 'Piani e prezzi' },
  testimonials: { icon: <MessageSquare />, label: 'Testimonianze', desc: 'Recensioni clienti' },
  cta: { icon: <Send />, label: 'Call to Action', desc: 'Invito all\'azione' },
  faq: { icon: <HelpCircle />, label: 'FAQ', desc: 'Domande frequenti' },
  about: { icon: <Users />, label: 'Chi Sono', desc: 'Presentazione' },
};

export default function NovelLandingEditor({ 
  initialContent = '', 
  onSave, 
  onBack,
  landingPage = null 
}) {
  // State principale
  const [content, setContent] = useState(initialContent);
  const [selectedPalette, setSelectedPalette] = useState('blue');
  const [previewMode, setPreviewMode] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [isSaving, setIsSaving] = useState(false);
  
  // AI State
  const [showWizard, setShowWizard] = useState(!initialContent);
  const [wizardStep, setWizardStep] = useState(1); // 1: template, 2: info, 3: generating
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    type: '',
    target: '',
    unique: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [aiSection, setAiSection] = useState(null);
  
  // Refs
  const editorRef = useRef(null);

  // Palette corrente
  const palette = useMemo(() => 
    COLOR_PALETTES.find(p => p.id === selectedPalette) || COLOR_PALETTES[0],
    [selectedPalette]
  );

  // === AI GENERATION ===
  
  // Genera landing completa con AI (1-click)
  const generateWithAI = async () => {
    setIsGenerating(true);
    setWizardStep(3);
    
    try {
      // Simula chiamata AI - in produzione userebbe OpenAI
      await new Promise(r => setTimeout(r, 2500));
      
      const template = PRESET_TEMPLATES.find(t => t.id === selectedTemplate);
      const generatedContent = generateLandingContent(template, businessInfo);
      
      setContent(generatedContent);
      setShowWizard(false);
    } catch (err) {
      console.error('Errore generazione AI:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Genera contenuto per landing
  const generateLandingContent = (template, info) => {
    const name = info.name || 'Il Tuo Nome';
    const type = info.type || 'Personal Trainer';
    const target = info.target || 'persone che vogliono migliorare';
    const unique = info.unique || 'approccio personalizzato e supporto continuo';
    
    let content = '';
    
    // Hero
    content += `# Trasforma la Tua Vita con ${name}\n\n`;
    content += `**${type} certificato** - Aiuto ${target} a raggiungere i propri obiettivi con ${unique}.\n\n`;
    content += `[🚀 INIZIA ORA - Consulenza Gratuita](#contatto)\n\n`;
    content += `---\n\n`;
    
    // Features
    content += `## ✨ Cosa Offro\n\n`;
    content += `### 💪 Programma Personalizzato\nOgni percorso è creato su misura per te, i tuoi obiettivi e il tuo stile di vita.\n\n`;
    content += `### 📱 Supporto Continuo\nSempre al tuo fianco via chat, videochiamate e app dedicata.\n\n`;
    content += `### 📊 Monitoraggio Progressi\nTracking dettagliato dei tuoi miglioramenti con report settimanali.\n\n`;
    content += `---\n\n`;
    
    // Testimonials
    content += `## ⭐ Risultati Reali\n\n`;
    content += `> "Ho raggiunto risultati che non pensavo possibili. ${name} è fantastico!"\n`;
    content += `> — *Marco R., 35 anni*\n\n`;
    content += `> "Finalmente un professionista che ascolta e capisce le mie esigenze."\n`;
    content += `> — *Laura B., 42 anni*\n\n`;
    content += `> "In 3 mesi ho trasformato completamente il mio corpo e la mia mentalità."\n`;
    content += `> — *Giulia S., 28 anni*\n\n`;
    content += `---\n\n`;
    
    // Pricing
    content += `## 💰 Piani e Prezzi\n\n`;
    content += `### Base - €99/mese\n`;
    content += `- 4 sessioni mensili\n`;
    content += `- Piano personalizzato\n`;
    content += `- Supporto chat\n\n`;
    content += `### **Pro - €199/mese** ⭐ CONSIGLIATO\n`;
    content += `- 8 sessioni mensili\n`;
    content += `- Piano personalizzato\n`;
    content += `- Supporto prioritario\n`;
    content += `- Videochiamate illimitate\n\n`;
    content += `### Premium - €349/mese\n`;
    content += `- Sessioni illimitate\n`;
    content += `- Coaching 1-to-1 dedicato\n`;
    content += `- Piano alimentare incluso\n`;
    content += `- Accesso esclusivo community\n\n`;
    content += `---\n\n`;
    
    // FAQ
    content += `## ❓ Domande Frequenti\n\n`;
    content += `**Come funziona la prima consulenza?**\n`;
    content += `La consulenza gratuita dura 30 minuti. Parliamo dei tuoi obiettivi e creo un piano su misura.\n\n`;
    content += `**Posso disdire quando voglio?**\n`;
    content += `Sì, tutti i piani sono senza vincoli. Puoi disdire in qualsiasi momento.\n\n`;
    content += `**Lavori solo online o anche in presenza?**\n`;
    content += `Offro entrambe le opzioni. Possiamo lavorare online da qualsiasi parte del mondo.\n\n`;
    content += `---\n\n`;
    
    // CTA
    content += `## 🎯 Pronto a Iniziare?\n\n`;
    content += `Non aspettare oltre. Prenota ora la tua consulenza gratuita e scopri come posso aiutarti.\n\n`;
    content += `[📞 PRENOTA CONSULENZA GRATUITA](#contatto)\n\n`;
    content += `---\n\n`;
    
    // Contact
    content += `## 📬 Contattami\n\n`;
    content += `**Email:** info@${name.toLowerCase().replace(/\s/g, '')}.com\n`;
    content += `**Telefono:** +39 123 456 7890\n`;
    content += `**Instagram:** @${name.toLowerCase().replace(/\s/g, '')}\n`;
    
    return content;
  };

  // Genera singola sezione con AI
  const generateSection = async (sectionType) => {
    setAiSection(sectionType);
    
    try {
      await new Promise(r => setTimeout(r, 1000));
      
      let newContent = '';
      
      switch(sectionType) {
        case 'hero':
          newContent = `\n\n# Titolo Principale Accattivante\n\nSottotitolo che spiega il valore che offri ai tuoi clienti.\n\n[🚀 CALL TO ACTION](#)\n\n---`;
          break;
        case 'features':
          newContent = `\n\n## ✨ Caratteristiche\n\n### 💎 Feature 1\nDescrizione della prima caratteristica.\n\n### 🎯 Feature 2\nDescrizione della seconda caratteristica.\n\n### ⚡ Feature 3\nDescrizione della terza caratteristica.\n\n---`;
          break;
        case 'testimonials':
          newContent = `\n\n## ⭐ Testimonianze\n\n> "Recensione positiva del cliente soddisfatto."\n> — *Nome Cliente, Ruolo*\n\n> "Un'altra recensione entusiasta."\n> — *Altro Cliente, Ruolo*\n\n---`;
          break;
        case 'pricing':
          newContent = `\n\n## 💰 Prezzi\n\n### Base - €XX/mese\n- Feature inclusa\n- Altra feature\n\n### Pro - €XX/mese ⭐\n- Tutto del Base\n- Feature premium\n- Supporto prioritario\n\n---`;
          break;
        case 'faq':
          newContent = `\n\n## ❓ FAQ\n\n**Domanda frequente 1?**\nRisposta chiara e concisa.\n\n**Domanda frequente 2?**\nAltra risposta utile.\n\n---`;
          break;
        case 'cta':
          newContent = `\n\n## 🎯 Pronto a Iniziare?\n\nTesto persuasivo che spinge all'azione.\n\n[👉 INIZIA ORA](#)\n\n---`;
          break;
        case 'about':
          newContent = `\n\n## 👤 Chi Sono\n\nMi chiamo [Nome] e sono [ruolo] con [X] anni di esperienza. La mia missione è [obiettivo].\n\n---`;
          break;
        default:
          newContent = `\n\n## Nuova Sezione\n\nContenuto della sezione...\n\n---`;
      }
      
      setContent(prev => prev + newContent);
      setShowAiHelper(false);
    } finally {
      setAiSection(null);
    }
  };

  // === EDITOR HELPERS ===
  
  const insertAtCursor = (text) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

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

  // === SAVE & CONVERT ===
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
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

  // Converti markdown in HTML styled
  const convertToHtml = (markdown, pal) => {
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gm, `<h3 style="color: ${pal.primary}; font-size: 1.5rem; font-weight: bold; margin: 2rem 0 1rem;">$1</h3>`)
      .replace(/^## (.*$)/gm, `<h2 style="color: ${pal.text}; font-size: 2rem; font-weight: bold; margin: 2.5rem 0 1rem;">$1</h2>`)
      .replace(/^# (.*$)/gm, `<h1 style="background: linear-gradient(135deg, ${pal.primary}, ${pal.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 3rem; font-weight: 900; margin-bottom: 1.5rem;">$1</h1>`)
      // Text formatting
      .replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${pal.text};">$1</strong>`)
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Lists
      .replace(/^- (.*$)/gm, `<li style="color: ${pal.text}; margin: 0.5rem 0; padding-left: 0.5rem;">$1</li>`)
      // Blockquotes
      .replace(/^> (.*$)/gm, `<blockquote style="border-left: 4px solid ${pal.primary}; padding: 1rem 1.5rem; margin: 1.5rem 0; background: ${pal.primary}15; border-radius: 0 0.5rem 0.5rem 0;"><p style="color: ${pal.text}; font-style: italic; margin: 0;">$1</p></blockquote>`)
      // Horizontal rule
      .replace(/^---$/gm, `<hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, ${pal.primary}50, transparent); margin: 3rem 0;" />`)
      // CTA buttons
      .replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" style="display: inline-block; padding: 1rem 2rem; background: linear-gradient(135deg, ${pal.primary}, ${pal.secondary}); color: white; font-weight: bold; border-radius: 0.75rem; text-decoration: none; margin: 1rem 0; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 40px ${pal.primary}40';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">$1</a>`)
      // Paragraphs
      .replace(/\n\n/g, '</p><p style="color: ' + pal.text + 'cc; line-height: 1.8; margin: 1rem 0; font-size: 1.1rem;">');

    // Wrap lists
    html = html.replace(/(<li.*?<\/li>\n?)+/g, '<ul style="list-style: none; padding: 0; margin: 1.5rem 0;">$&</ul>');

    // Wrap in container
    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif;">
  <div style="background: ${pal.bg}; min-height: 100vh; padding: 4rem 1.5rem;">
    <div style="max-width: 800px; margin: 0 auto;">
      <p style="color: ${pal.text}cc; line-height: 1.8; font-size: 1.1rem;">
        ${html}
      </p>
    </div>
  </div>
</body>
</html>
    `;
  };

  // === WIZARD MODAL ===
  if (showWizard) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Landing Generator</h2>
                <p className="text-sm text-slate-400">Crea la tua landing in 1 click</p>
              </div>
            </div>
            
            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    wizardStep >= step 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {wizardStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && <div className={`w-12 h-0.5 ${wizardStep > step ? 'bg-purple-500' : 'bg-slate-700'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Step 1: Template */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <p className="text-slate-300 text-center mb-6">Scegli un template di partenza</p>
                <div className="grid grid-cols-2 gap-4">
                  {PRESET_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedTemplate === t.id 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-3xl mb-2 block">{t.icon}</span>
                      <h4 className="font-bold text-white">{t.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Business Info */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <p className="text-slate-300 text-center mb-6">Parlami del tuo business</p>
                
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Il tuo nome o brand</label>
                  <input
                    type="text"
                    value={businessInfo.name}
                    onChange={e => setBusinessInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder="Es: Marco Rossi Fitness"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Cosa fai?</label>
                  <input
                    type="text"
                    value={businessInfo.type}
                    onChange={e => setBusinessInfo(p => ({ ...p, type: e.target.value }))}
                    placeholder="Es: Personal Trainer, Coach, Consulente..."
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Chi è il tuo cliente ideale?</label>
                  <input
                    type="text"
                    value={businessInfo.target}
                    onChange={e => setBusinessInfo(p => ({ ...p, target: e.target.value }))}
                    placeholder="Es: donne 30-50 anni che vogliono rimettersi in forma"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Cosa ti rende unico?</label>
                  <textarea
                    value={businessInfo.unique}
                    onChange={e => setBusinessInfo(p => ({ ...p, unique: e.target.value }))}
                    placeholder="Es: metodo brevettato, 10 anni esperienza, garanzia risultati..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Generating */}
            {wizardStep === 3 && (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6"
                >
                  <Sparkles className="w-16 h-16 text-purple-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Generazione in corso...</h3>
                <p className="text-slate-400">L'AI sta creando la tua landing page</p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700 flex items-center justify-between">
            <button
              onClick={() => {
                if (wizardStep === 1) {
                  setShowWizard(false);
                } else {
                  setWizardStep(s => s - 1);
                }
              }}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              {wizardStep === 1 ? 'Salta' : 'Indietro'}
            </button>

            {wizardStep < 3 && (
              <button
                onClick={() => {
                  if (wizardStep === 2) {
                    generateWithAI();
                  } else {
                    setWizardStep(s => s + 1);
                  }
                }}
                disabled={wizardStep === 1 && !selectedTemplate}
                className="flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {wizardStep === 2 ? (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Genera con AI
                  </>
                ) : (
                  <>
                    Avanti
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // === MAIN EDITOR ===
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
              <span className="font-bold text-white">Landing Editor</span>
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
                            style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }}
                          />
                          <span className="text-xs text-white">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rigenera */}
            <button
              onClick={() => setShowWizard(true)}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
              title="Rigenera con AI"
            >
              <RotateCcw className="w-5 h-5" />
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
          // Editor Mode
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto py-8 px-4">
              {/* AI Quick Actions */}
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-purple-300">
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    <strong>AI Helper:</strong> Aggiungi sezioni con un click
                  </p>
                  <button
                    onClick={() => setShowAiHelper(true)}
                    className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Aggiungi Sezione
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-2 p-3 border-b border-slate-700 bg-slate-800/50 flex-wrap">
                  <button onClick={() => insertAtCursor('# ')} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white text-sm font-bold" title="H1">H1</button>
                  <button onClick={() => insertAtCursor('## ')} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white text-sm font-bold" title="H2">H2</button>
                  <button onClick={() => insertAtCursor('### ')} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white text-sm font-bold" title="H3">H3</button>
                  <div className="w-px h-5 bg-slate-600" />
                  <button onClick={() => wrapSelection('**', '**')} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white font-bold" title="Grassetto">B</button>
                  <button onClick={() => wrapSelection('*', '*')} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white italic" title="Corsivo">I</button>
                  <div className="w-px h-5 bg-slate-600" />
                  <button onClick={() => insertAtCursor('- ')} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Lista">•</button>
                  <button onClick={() => insertAtCursor('> ')} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Citazione">"</button>
                  <button onClick={() => insertAtCursor('\n---\n')} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Divisore">—</button>
                  <button onClick={() => insertAtCursor('[Testo Link](url)')} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Link">🔗</button>
                </div>
                
                {/* Textarea */}
                <textarea
                  ref={editorRef}
                  className="w-full min-h-[500px] p-6 bg-transparent text-white font-sans text-base leading-relaxed focus:outline-none resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Inizia a scrivere o usa l'AI per generare contenuti..."
                  style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
                />
              </div>
            </div>
          </div>
        )}
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
                Aggiungi Sezione con AI
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(SECTION_TYPES).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => generateSection(key)}
                    disabled={aiSection !== null}
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left text-white disabled:opacity-50 flex items-center gap-3"
                  >
                    <span className="text-purple-400">{section.icon}</span>
                    <div>
                      <strong className="block text-sm">{section.label}</strong>
                      <span className="text-xs text-slate-400">{section.desc}</span>
                    </div>
                    {aiSection === key && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
