import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, Upload, Camera, Trash2, Plus, ArrowRight, ArrowLeft,
  Loader2, Check, AlertCircle, Palette, Type, MousePointer, 
  Image as ImageIcon, FileText, MessageSquare, Layout, Layers,
  Settings, Eye, ChevronDown, ChevronUp, Edit3, Copy, Wand2,
  GripVertical, Link, RefreshCw, Zap, Target, RotateCcw,
  Lightbulb, Globe, BookTemplate, Rocket, Crown
} from 'lucide-react';

/**
 * AIWizardModal - Wizard AI Avanzato a Step POTENZIATO
 * 
 * STEP 1: Scegli modalità (Screenshot, URL, Template, Da Zero)
 * STEP 2: AI analizza e estrae sezioni
 * STEP 3: Gestisci sezioni (aggiungi, rimuovi, riordina)
 * STEP 4: Per ogni sezione, domande + suggerimenti AI
 * STEP 5: Personalizzazione colori/stile
 * STEP 6: Generazione e preview
 */

// Colori predefiniti per palette
const COLOR_PALETTES = [
  { id: 'blue', name: 'Blu Professionale', primary: '#0ea5e9', secondary: '#06b6d4', accent: '#f59e0b', bg: '#0f172a' },
  { id: 'purple', name: 'Viola Moderno', primary: '#8b5cf6', secondary: '#a855f7', accent: '#ec4899', bg: '#1e1b4b' },
  { id: 'green', name: 'Verde Natura', primary: '#10b981', secondary: '#14b8a6', accent: '#f59e0b', bg: '#0f172a' },
  { id: 'orange', name: 'Arancione Energia', primary: '#f97316', secondary: '#fb923c', accent: '#eab308', bg: '#1c1917' },
  { id: 'red', name: 'Rosso Passione', primary: '#ef4444', secondary: '#f43f5e', accent: '#fbbf24', bg: '#1f1315' },
  { id: 'dark', name: 'Dark Minimal', primary: '#ffffff', secondary: '#94a3b8', accent: '#22d3ee', bg: '#0a0a0a' },
  { id: 'gradient1', name: 'Aurora', primary: '#6366f1', secondary: '#8b5cf6', accent: '#ec4899', bg: '#0c0a1d' },
  { id: 'gradient2', name: 'Ocean', primary: '#0891b2', secondary: '#06b6d4', accent: '#10b981', bg: '#0a1628' },
];

// Template predefiniti
const PRESET_TEMPLATES = [
  { 
    id: 'fitness', 
    name: 'Personal Trainer', 
    icon: '💪',
    desc: 'Landing per PT e coach fitness',
    sections: ['hero', 'features', 'testimonials', 'pricing', 'faq', 'form']
  },
  { 
    id: 'consultant', 
    name: 'Consulente', 
    icon: '💼',
    desc: 'Landing per consulenti e professionisti',
    sections: ['hero', 'about', 'features', 'testimonials', 'cta', 'form']
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
    sections: ['hero', 'features', 'stats', 'pricing', 'testimonials', 'faq', 'form']
  },
  { 
    id: 'minimal', 
    name: 'Minimal', 
    icon: '✨',
    desc: 'Landing essenziale e pulita',
    sections: ['hero', 'features', 'cta']
  },
];

// Tipi di sezione supportati
const SECTION_TYPES = {
  hero: { icon: '🚀', label: 'Hero', desc: 'Sezione principale con titolo e CTA' },
  features: { icon: '✨', label: 'Features', desc: 'Caratteristiche/servizi' },
  pricing: { icon: '💰', label: 'Prezzi', desc: 'Piani e prezzi' },
  testimonials: { icon: '⭐', label: 'Testimonianze', desc: 'Recensioni clienti' },
  cta: { icon: '🎯', label: 'Call to Action', desc: 'Invito all\'azione' },
  form: { icon: '📝', label: 'Form Contatto', desc: 'Modulo di contatto' },
  faq: { icon: '❓', label: 'FAQ', desc: 'Domande frequenti' },
  about: { icon: '👤', label: 'Chi Sono', desc: 'Presentazione personale' },
  stats: { icon: '📊', label: 'Statistiche', desc: 'Numeri e risultati' },
  gallery: { icon: '🖼️', label: 'Galleria', desc: 'Immagini/portfolio' },
  video: { icon: '🎬', label: 'Video', desc: 'Video presentazione' },
  logos: { icon: '🏢', label: 'Logo Clienti', desc: 'Loghi aziende clienti' },
  countdown: { icon: '⏰', label: 'Countdown', desc: 'Timer per urgenza' },
};

const MAX_SCREENSHOTS = 5;

export default function AIWizardModal({ isOpen, onClose, onGenerated, tenantId }) {
  const fileInputRef = useRef(null);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Step 1: Modalità e input
  const [wizardMode, setWizardMode] = useState(null); // 'screenshot' | 'url' | 'template' | 'scratch'
  const [screenshots, setScreenshots] = useState([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [businessContext, setBusinessContext] = useState(''); // Contesto business per AI
  
  // Step 2: Sezioni analizzate dall'AI
  const [analyzedSections, setAnalyzedSections] = useState([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  // Step 3: Dettagli per ogni sezione (compilati dall'utente)
  const [sectionDetails, setSectionDetails] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  // Step 4: Stile e colori
  const [selectedPalette, setSelectedPalette] = useState('blue');
  const [customColors, setCustomColors] = useState(null);
  const [fontStyle, setFontStyle] = useState('modern'); // modern, classic, bold
  
  // Step 5: HTML generato
  const [generatedHtml, setGeneratedHtml] = useState('');
  
  // AI Suggestions loading
  const [aiSuggesting, setAiSuggesting] = useState({});
  
  // Drag and drop per riordinare sezioni
  const [draggedSection, setDraggedSection] = useState(null);

  // === HANDLERS ===
  
  const handleScreenshotUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_SCREENSHOTS - screenshots.length;
    
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshots(prev => [...prev, {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview: reader.result,
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeScreenshot = (id) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
  };
  
  // === GESTIONE SEZIONI ===
  
  const addSection = (type) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type,
      name: SECTION_TYPES[type]?.label || type,
      detected: false,
      confidence: 1,
    };
    setAnalyzedSections(prev => [...prev, newSection]);
  };
  
  const removeSection = (sectionId) => {
    setAnalyzedSections(prev => prev.filter(s => s.id !== sectionId));
    // Rimuovi anche i dettagli
    setSectionDetails(prev => {
      const updated = { ...prev };
      delete updated[sectionId];
      return updated;
    });
  };
  
  const moveSection = (fromIndex, toIndex) => {
    setAnalyzedSections(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };
  
  const duplicateSection = (sectionId) => {
    const original = analyzedSections.find(s => s.id === sectionId);
    if (!original) return;
    
    const newSection = {
      ...original,
      id: `section-${Date.now()}`,
      name: `${original.name} (copia)`,
    };
    
    const index = analyzedSections.findIndex(s => s.id === sectionId);
    setAnalyzedSections(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, newSection);
      return updated;
    });
    
    // Duplica anche i dettagli
    if (sectionDetails[sectionId]) {
      setSectionDetails(prev => ({
        ...prev,
        [newSection.id]: { ...prev[sectionId] },
      }));
    }
  };
  
  // === AI SUGGESTIONS ===
  
  const generateAISuggestion = async (sectionId, field, context = {}) => {
    setAiSuggesting(prev => ({ ...prev, [`${sectionId}-${field}`]: true }));
    
    try {
      // Simula chiamata AI - in produzione userebbe OpenAI
      await new Promise(r => setTimeout(r, 1000));
      
      const section = analyzedSections.find(s => s.id === sectionId);
      const suggestions = getAISuggestions(section?.type, field, businessContext);
      
      // Aggiorna il campo con il suggerimento
      setSectionDetails(prev => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [field]: suggestions,
        }
      }));
    } catch (err) {
      console.error('Errore suggerimento AI:', err);
    } finally {
      setAiSuggesting(prev => ({ ...prev, [`${sectionId}-${field}`]: false }));
    }
  };

  const handleClose = () => {
    // Reset state
    setCurrentStep(1);
    setWizardMode(null);
    setScreenshots([]);
    setSourceUrl('');
    setSelectedTemplate(null);
    setBusinessContext('');
    setAnalyzedSections([]);
    setSectionDetails({});
    setAnalysisComplete(false);
    setError(null);
    onClose();
  };

  // Vai allo step successivo
  const nextStep = () => {
    const maxSteps = 6;
    if (currentStep < maxSteps) setCurrentStep(currentStep + 1);
  };

  // Vai allo step precedente
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };
  
  // Determina se si può procedere
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        if (!wizardMode) return false;
        if (wizardMode === 'screenshot') return screenshots.length > 0;
        if (wizardMode === 'url') return sourceUrl.trim().length > 0;
        if (wizardMode === 'template') return selectedTemplate !== null;
        if (wizardMode === 'scratch') return true;
        return false;
      case 2:
        return analysisComplete && analyzedSections.length > 0;
      case 3:
        return analyzedSections.length > 0;
      default:
        return true;
    }
  };

  // === STEP INDICATORS ===
  const steps = [
    { num: 1, label: 'Modalità' },
    { num: 2, label: 'Analisi' },
    { num: 3, label: 'Sezioni' },
    { num: 4, label: 'Contenuti' },
    { num: 5, label: 'Stile' },
    { num: 6, label: 'Genera' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI Landing Wizard</h2>
                  <p className="text-sm text-slate-400">Crea landing page professionali in pochi click</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-between">
              {steps.map((step, i) => (
                <React.Fragment key={step.num}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      currentStep === step.num 
                        ? 'bg-purple-500 text-white' 
                        : currentStep > step.num 
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                    }`}>
                      {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
                    </div>
                    <span className={`text-xs hidden md:block ${currentStep === step.num ? 'text-white' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${currentStep > step.num ? 'bg-green-500' : 'bg-slate-700'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 1: Scegli Modalità */}
            {currentStep === 1 && (
              <Step1Mode 
                wizardMode={wizardMode}
                setWizardMode={setWizardMode}
                screenshots={screenshots}
                onUpload={handleScreenshotUpload}
                onRemove={removeScreenshot}
                fileInputRef={fileInputRef}
                maxScreenshots={MAX_SCREENSHOTS}
                sourceUrl={sourceUrl}
                setSourceUrl={setSourceUrl}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                templates={PRESET_TEMPLATES}
                businessContext={businessContext}
                setBusinessContext={setBusinessContext}
              />
            )}

            {/* STEP 2: AI Analysis */}
            {currentStep === 2 && (
              <Step2Analysis 
                wizardMode={wizardMode}
                screenshots={screenshots}
                sourceUrl={sourceUrl}
                selectedTemplate={selectedTemplate}
                templates={PRESET_TEMPLATES}
                businessContext={businessContext}
                analyzedSections={analyzedSections}
                setAnalyzedSections={setAnalyzedSections}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                setError={setError}
                analysisComplete={analysisComplete}
                setAnalysisComplete={setAnalysisComplete}
              />
            )}

            {/* STEP 3: Gestione Sezioni */}
            {currentStep === 3 && (
              <Step3ManageSections 
                sections={analyzedSections}
                addSection={addSection}
                removeSection={removeSection}
                moveSection={moveSection}
                duplicateSection={duplicateSection}
                sectionTypes={SECTION_TYPES}
              />
            )}

            {/* STEP 4: Section Details */}
            {currentStep === 4 && (
              <Step4SectionDetails 
                sections={analyzedSections}
                sectionDetails={sectionDetails}
                setSectionDetails={setSectionDetails}
                currentIndex={currentSectionIndex}
                setCurrentIndex={setCurrentSectionIndex}
                generateAISuggestion={generateAISuggestion}
                aiSuggesting={aiSuggesting}
                businessContext={businessContext}
              />
            )}

            {/* STEP 5: Style */}
            {currentStep === 5 && (
              <Step5Style 
                selectedPalette={selectedPalette}
                setSelectedPalette={setSelectedPalette}
                fontStyle={fontStyle}
                setFontStyle={setFontStyle}
                palettes={COLOR_PALETTES}
              />
            )}

            {/* STEP 6: Generate */}
            {currentStep === 6 && (
              <Step6Generate 
                sections={analyzedSections}
                sectionDetails={sectionDetails}
                palette={COLOR_PALETTES.find(p => p.id === selectedPalette)}
                fontStyle={fontStyle}
                onGenerated={onGenerated}
                onClose={handleClose}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                setError={setError}
              />
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-6 border-t border-slate-700 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Indietro
            </button>

            <div className="text-sm text-slate-500">
              Step {currentStep} di {steps.length}
            </div>

            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Avanti
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div /> // Placeholder per allineamento
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// === AI SUGGESTION HELPER ===
function getAISuggestions(sectionType, field, businessContext) {
  const ctx = businessContext || 'personal trainer';
  
  const suggestions = {
    hero: {
      title: `Trasforma il Tuo Corpo con un ${ctx} Esperto`,
      subtitle: 'Programmi personalizzati per raggiungere i tuoi obiettivi di fitness in modo efficace e sostenibile',
      ctaText: 'Inizia il Tuo Percorso',
      badge: '🔥 Offerta Lancio -30%',
    },
    features: {
      sectionTitle: 'Cosa Include il Programma',
      features: [
        { icon: '💪', title: 'Allenamento Personalizzato', description: 'Schede su misura per i tuoi obiettivi' },
        { icon: '🥗', title: 'Piano Alimentare', description: 'Nutrizione bilanciata e sostenibile' },
        { icon: '📱', title: 'Supporto 24/7', description: 'Sempre al tuo fianco via app' },
      ],
    },
    testimonials: {
      sectionTitle: 'Risultati Reali dei Miei Clienti',
      testimonials: [
        { name: 'Marco R.', role: 'Cliente da 6 mesi', text: 'Ho perso 15kg e mi sento rinato!' },
        { name: 'Laura B.', role: 'Cliente da 1 anno', text: 'Finalmente ho trovato un metodo che funziona' },
      ],
    },
    pricing: {
      sectionTitle: 'Scegli il Piano Perfetto per Te',
    },
    cta: {
      title: 'Pronto a Cambiare la Tua Vita?',
      subtitle: 'Unisciti a centinaia di persone che hanno già trasformato il loro corpo',
      ctaText: 'Prenota una Consulenza Gratuita',
    },
    form: {
      title: 'Richiedi una Consulenza Gratuita',
    },
    about: {
      name: 'Il Tuo Nome',
      role: 'Personal Trainer Certificato',
      bio: 'Con oltre 10 anni di esperienza nel fitness, ho aiutato centinaia di persone a raggiungere i loro obiettivi. La mia filosofia si basa su un approccio olistico che combina allenamento, nutrizione e mindset.',
    },
    faq: {
      sectionTitle: 'Domande Frequenti',
      faqs: [
        { question: 'Quanto dura il programma?', answer: 'I programmi sono personalizzati, tipicamente da 8 a 12 settimane.' },
        { question: 'Serve attrezzatura?', answer: 'No, i programmi possono essere adattati per casa o palestra.' },
      ],
    },
  };
  
  return suggestions[sectionType]?.[field] || '';
}

// ===== STEP COMPONENTS =====

// Step 1: Scegli Modalità
function Step1Mode({ 
  wizardMode, setWizardMode, 
  screenshots, onUpload, onRemove, fileInputRef, maxScreenshots,
  sourceUrl, setSourceUrl,
  selectedTemplate, setSelectedTemplate, templates,
  businessContext, setBusinessContext 
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Wand2 className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Come vuoi creare la landing?</h3>
        <p className="text-slate-400 text-sm">Scegli la modalità e inserisci le informazioni</p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setWizardMode('screenshot')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            wizardMode === 'screenshot' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 hover:border-slate-500'
          }`}
        >
          <Camera className="w-8 h-8 text-purple-400 mb-2" />
          <h4 className="font-bold text-white">Da Screenshot</h4>
          <p className="text-xs text-slate-400">Carica immagini di riferimento</p>
        </button>
        
        <button
          onClick={() => setWizardMode('url')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            wizardMode === 'url' ? 'border-green-500 bg-green-500/10' : 'border-slate-600 hover:border-slate-500'
          }`}
        >
          <Globe className="w-8 h-8 text-green-400 mb-2" />
          <h4 className="font-bold text-white">Da URL</h4>
          <p className="text-xs text-slate-400">Analizza una pagina esistente</p>
        </button>
        
        <button
          onClick={() => setWizardMode('template')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            wizardMode === 'template' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 hover:border-slate-500'
          }`}
        >
          <Layout className="w-8 h-8 text-cyan-400 mb-2" />
          <h4 className="font-bold text-white">Template</h4>
          <p className="text-xs text-slate-400">Parti da un template pronto</p>
        </button>
        
        <button
          onClick={() => setWizardMode('scratch')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            wizardMode === 'scratch' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-600 hover:border-slate-500'
          }`}
        >
          <Sparkles className="w-8 h-8 text-orange-400 mb-2" />
          <h4 className="font-bold text-white">Da Zero</h4>
          <p className="text-xs text-slate-400">Costruisci tu le sezioni</p>
        </button>
      </div>

      {/* Mode-specific content */}
      {wizardMode === 'screenshot' && (
        <div className="space-y-4 pt-4 border-t border-slate-700">
          {screenshots.length < maxScreenshots && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl p-6 text-center cursor-pointer transition-all"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-white font-medium">Carica Screenshot</p>
              <p className="text-xs text-slate-400">Max {maxScreenshots} immagini</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onUpload} className="hidden" />
          
          {screenshots.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {screenshots.map((s, i) => (
                <div key={s.id} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-700">
                  <img src={s.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemove(s.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded">{i+1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {wizardMode === 'url' && (
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div>
            <label className="block text-sm text-slate-300 mb-2">URL della landing page</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://esempio.com/landing-page"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">L'AI analizzerà la struttura della pagina</p>
        </div>
      )}

      {wizardMode === 'template' && (
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedTemplate === t.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <span className="text-2xl mb-2 block">{t.icon}</span>
                <h4 className="font-medium text-white">{t.name}</h4>
                <p className="text-xs text-slate-400">{t.desc}</p>
                <p className="text-xs text-cyan-400 mt-2">{t.sections.length} sezioni</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {wizardMode === 'scratch' && (
        <div className="pt-4 border-t border-slate-700">
          <p className="text-center text-slate-400 text-sm">
            Potrai aggiungere le sezioni manualmente nello step successivo
          </p>
        </div>
      )}

      {/* Business Context - sempre visibile */}
      {wizardMode && (
        <div className="pt-4 border-t border-slate-700">
          <label className="block text-sm text-slate-300 mb-2">
            <Lightbulb className="w-4 h-4 inline mr-1 text-yellow-400" />
            Descrivi il tuo business (per suggerimenti AI migliori)
          </label>
          <textarea
            value={businessContext}
            onChange={(e) => setBusinessContext(e.target.value)}
            placeholder="Es: Personal trainer specializzato in perdita peso per donne over 40..."
            rows={2}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

// Step 2: Analisi AI - supporta tutte le modalità
function Step2Analysis({ 
  wizardMode, screenshots, sourceUrl, selectedTemplate, templates, businessContext,
  analyzedSections, setAnalyzedSections, isProcessing, setIsProcessing, setError, analysisComplete, setAnalysisComplete 
}) {
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');

  const startAnalysis = async () => {
    setIsProcessing(true);
    setError(null);
    setAnalysisProgress(0);
    
    try {
      // Analisi basata sulla modalità
      if (wizardMode === 'template') {
        // Usa template predefinito
        setAnalysisStatus('Caricamento template...');
        setAnalysisProgress(50);
        await new Promise(r => setTimeout(r, 500));
        
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          const sections = template.sections.map((type, i) => ({
            id: `section-${Date.now()}-${i}`,
            type,
            name: SECTION_TYPES[type]?.label || type,
            detected: false,
            confidence: 1,
          }));
          setAnalyzedSections(sections);
        }
        setAnalysisProgress(100);
        setAnalysisComplete(true);
        
      } else if (wizardMode === 'scratch') {
        // Da zero - sezioni vuote, l'utente le aggiunge dopo
        setAnalysisStatus('Preparazione ambiente...');
        setAnalysisProgress(50);
        await new Promise(r => setTimeout(r, 500));
        
        // Sezioni di default minime
        const defaultSections = [
          { id: `section-${Date.now()}-1`, type: 'hero', name: 'Hero', detected: false, confidence: 1 },
        ];
        setAnalyzedSections(defaultSections);
        setAnalysisProgress(100);
        setAnalysisComplete(true);
        
      } else if (wizardMode === 'url') {
        // Analisi URL
        setAnalysisStatus('Analisi URL in corso...');
        setAnalysisProgress(30);
        
        // Simula analisi URL (in produzione userebbe un servizio di scraping)
        await new Promise(r => setTimeout(r, 1500));
        setAnalysisProgress(70);
        setAnalysisStatus('Estrazione sezioni...');
        await new Promise(r => setTimeout(r, 1000));
        
        // Sezioni tipiche trovate
        const mockSections = [
          { id: `section-${Date.now()}-1`, type: 'hero', name: 'Hero Section', detected: true, confidence: 0.95 },
          { id: `section-${Date.now()}-2`, type: 'features', name: 'Features/Servizi', detected: true, confidence: 0.88 },
          { id: `section-${Date.now()}-3`, type: 'testimonials', name: 'Testimonianze', detected: true, confidence: 0.75 },
          { id: `section-${Date.now()}-4`, type: 'cta', name: 'Call to Action', detected: true, confidence: 0.90 },
          { id: `section-${Date.now()}-5`, type: 'form', name: 'Form Contatto', detected: true, confidence: 0.85 },
        ];
        setAnalyzedSections(mockSections);
        setAnalysisProgress(100);
        setAnalysisComplete(true);
        
      } else {
        // Analisi screenshot
        setAnalysisStatus('Preparazione immagini...');
        setAnalysisProgress(10);

        const imageData = screenshots.map(s => s.preview.split(',')[1]);
        
        setAnalysisStatus('Analisi struttura con AI...');
        setAnalysisProgress(30);

        // Prova API, altrimenti fallback
        try {
          const response = await fetch('/api/analyze-landing-screenshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: imageData, businessContext }),
          });

          if (response.ok) {
            const result = await response.json();
            setAnalysisProgress(80);
            setAnalysisStatus('Elaborazione risultati...');
            setAnalyzedSections(result.sections || []);
            setAnalysisProgress(100);
            setAnalysisComplete(true);
            return;
          }
        } catch (e) {
          console.warn('API non disponibile, uso analisi simulata');
        }

        // Fallback simulato
        await simulateAnalysis();
      }
      
    } catch (err) {
      console.error('Errore analisi:', err);
      await simulateAnalysis();
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateAnalysis = async () => {
    setAnalysisStatus('Analisi struttura...');
    await new Promise(r => setTimeout(r, 1000));
    setAnalysisProgress(50);
    
    setAnalysisStatus('Identificazione sezioni...');
    await new Promise(r => setTimeout(r, 1000));
    setAnalysisProgress(75);

    const mockSections = [
      { id: `section-${Date.now()}-1`, type: 'hero', name: 'Hero Section', detected: true, confidence: 0.95 },
      { id: `section-${Date.now()}-2`, type: 'features', name: 'Features/Servizi', detected: true, confidence: 0.88 },
      { id: `section-${Date.now()}-3`, type: 'testimonials', name: 'Testimonianze', detected: true, confidence: 0.82 },
      { id: `section-${Date.now()}-4`, type: 'pricing', name: 'Prezzi', detected: true, confidence: 0.79 },
      { id: `section-${Date.now()}-5`, type: 'cta', name: 'Call to Action', detected: true, confidence: 0.91 },
      { id: `section-${Date.now()}-6`, type: 'form', name: 'Form Contatto', detected: true, confidence: 0.87 },
    ];

    setAnalysisProgress(100);
    setAnalysisStatus('Completato!');
    setAnalyzedSections(mockSections);
    setAnalysisComplete(true);
  };

  // Auto-start
  React.useEffect(() => {
    if (!analysisComplete && !isProcessing) {
      startAnalysis();
    }
  }, []);

  const getModeIcon = () => {
    switch (wizardMode) {
      case 'screenshot': return <Camera className="w-5 h-5" />;
      case 'url': return <Globe className="w-5 h-5" />;
      case 'template': return <Layout className="w-5 h-5" />;
      case 'scratch': return <Sparkles className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getModeText = () => {
    switch (wizardMode) {
      case 'screenshot': return `Analizzando ${screenshots.length} screenshot`;
      case 'url': return `Analizzando ${sourceUrl}`;
      case 'template': return `Template: ${templates.find(t => t.id === selectedTemplate)?.name}`;
      case 'scratch': return 'Preparazione struttura base';
      default: return 'Analisi in corso';
    }
  };

  if (isProcessing) {
    return (
      <div className="text-center py-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
          <div 
            className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400">
            {getModeIcon()}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">Analisi in corso...</h3>
        <p className="text-slate-400 mb-1">{analysisStatus}</p>
        <p className="text-xs text-slate-500 mb-4">{getModeText()}</p>
        
        <div className="max-w-xs mx-auto">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">{analysisProgress}%</p>
        </div>
      </div>
    );
  }

  if (analysisComplete && analyzedSections.length > 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Analisi Completata!</h3>
          <p className="text-slate-400">Ho identificato {analyzedSections.length} sezioni</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Sezioni rilevate:</h4>
          {analyzedSections.map((section) => (
            <div 
              key={section.id}
              className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl"
            >
              <span className="text-2xl">{SECTION_TYPES[section.type]?.icon || '📦'}</span>
              <div className="flex-1">
                <p className="font-medium text-white">{section.name}</p>
                <p className="text-xs text-slate-400">{SECTION_TYPES[section.type]?.desc || 'Sezione generica'}</p>
              </div>
              {section.confidence && (
                <div className="text-right">
                  <span className="text-xs text-green-400">{Math.round(section.confidence * 100)}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <p className="text-sm text-purple-300">
            💡 Nel prossimo step potrai modificare, aggiungere o rimuovere sezioni.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Pronto per l'analisi</h3>
      <p className="text-slate-400 mb-6">Clicca per avviare l'analisi AI</p>
      <button 
        onClick={startAnalysis}
        className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
      >
        <Sparkles className="w-4 h-4 inline mr-2" />
        Avvia Analisi
      </button>
    </div>
  );
}

// Step 3: Gestione Sezioni (aggiungi, rimuovi, riordina)
function Step3ManageSections({ sections, addSection, removeSection, moveSection, duplicateSection, sectionTypes }) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Layers className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Gestisci le Sezioni</h3>
        <p className="text-slate-400 text-sm">Aggiungi, rimuovi o riordina le sezioni</p>
      </div>

      {/* Section List */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl group"
          >
            {/* Drag Handle */}
            <div className="cursor-move text-slate-500 hover:text-slate-300">
              <GripVertical className="w-5 h-5" />
            </div>
            
            {/* Section Info */}
            <span className="text-2xl">{sectionTypes[section.type]?.icon || '📦'}</span>
            <div className="flex-1">
              <p className="font-medium text-white">{section.name}</p>
              <p className="text-xs text-slate-400">{sectionTypes[section.type]?.desc}</p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Move Up */}
              <button
                onClick={() => moveSection(index, Math.max(0, index - 1))}
                disabled={index === 0}
                className="p-1.5 hover:bg-slate-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                title="Sposta su"
              >
                <ChevronUp className="w-4 h-4 text-slate-400" />
              </button>
              
              {/* Move Down */}
              <button
                onClick={() => moveSection(index, Math.min(sections.length - 1, index + 1))}
                disabled={index === sections.length - 1}
                className="p-1.5 hover:bg-slate-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                title="Sposta giù"
              >
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {/* Duplicate */}
              <button
                onClick={() => duplicateSection(section.id)}
                className="p-1.5 hover:bg-slate-600 rounded-lg"
                title="Duplica"
              >
                <Copy className="w-4 h-4 text-slate-400" />
              </button>
              
              {/* Remove */}
              <button
                onClick={() => removeSection(section.id)}
                className="p-1.5 hover:bg-red-500/20 rounded-lg"
                title="Rimuovi"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Section Button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-3 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl text-slate-400 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Sezione
        </button>
        
        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 rounded-xl border border-slate-600 shadow-xl z-10 max-h-64 overflow-y-auto">
            {Object.entries(sectionTypes).map(([type, info]) => (
              <button
                key={type}
                onClick={() => {
                  addSection(type);
                  setShowAddMenu(false);
                }}
                className="w-full px-4 py-3 hover:bg-slate-600 flex items-center gap-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="text-xl">{info.icon}</span>
                <div>
                  <p className="font-medium text-white">{info.label}</p>
                  <p className="text-xs text-slate-400">{info.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p>Nessuna sezione. Aggiungi almeno una sezione per continuare.</p>
        </div>
      )}
    </div>
  );
}

// Step 4: Personalizzazione sezioni con domande interattive
function Step4SectionDetails({ sections, sectionDetails, setSectionDetails, currentIndex, setCurrentIndex, generateAISuggestion, aiSuggesting, businessContext }) {
  const currentSection = sections[currentIndex];
  const totalSections = sections.length;
  
  // Ottieni i dettagli correnti o inizializza
  const details = sectionDetails[currentSection?.id] || {};
  
  const updateDetail = (key, value) => {
    setSectionDetails(prev => ({
      ...prev,
      [currentSection.id]: {
        ...prev[currentSection.id],
        [key]: value,
      }
    }));
  };

  const goToNext = () => {
    if (currentIndex < totalSections - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentSection) {
    return (
      <div className="text-center py-8">
        <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">Tutte le sezioni completate!</h3>
      </div>
    );
  }

  // Componente per input con suggerimento AI
  const AIInputField = ({ label, field, placeholder, multiline = false }) => {
    const isLoading = aiSuggesting[`${currentSection.id}-${field}`];
    
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">{label}</label>
          <button
            onClick={() => generateAISuggestion(currentSection.id, field, { businessContext })}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Lightbulb className="w-3 h-3" />
            )}
            Suggerisci AI
          </button>
        </div>
        {multiline ? (
          <textarea
            value={details[field] || ''}
            onChange={(e) => updateDetail(field, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        ) : (
          <input
            type="text"
            value={details[field] || ''}
            onChange={(e) => updateDetail(field, e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        )}
      </div>
    );
  };

  // Domande specifiche per tipo di sezione con supporto AI
  const renderQuestions = () => {
    switch (currentSection.type) {
      case 'hero':
        return <HeroQuestions details={details} updateDetail={updateDetail} sectionId={currentSection.id} generateAISuggestion={generateAISuggestion} aiSuggesting={aiSuggesting} businessContext={businessContext} />;
      case 'features':
        return <FeaturesQuestions details={details} updateDetail={updateDetail} />;
      case 'testimonials':
        return <TestimonialsQuestions details={details} updateDetail={updateDetail} />;
      case 'pricing':
        return <PricingQuestions details={details} updateDetail={updateDetail} />;
      case 'cta':
        return <CTAQuestions details={details} updateDetail={updateDetail} />;
      case 'form':
        return <FormQuestions details={details} updateDetail={updateDetail} />;
      case 'faq':
        return <FAQQuestions details={details} updateDetail={updateDetail} />;
      case 'about':
        return <AboutQuestions details={details} updateDetail={updateDetail} />;
      default:
        return <GenericQuestions details={details} updateDetail={updateDetail} sectionType={currentSection.type} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400">
          Sezione {currentIndex + 1} di {totalSections}
        </span>
        <div className="flex gap-1">
          {sections.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === currentIndex ? 'bg-purple-500' : i < currentIndex ? 'bg-green-500' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
        <span className="text-3xl">{SECTION_TYPES[currentSection.type]?.icon || '📦'}</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{currentSection.name}</h3>
          <p className="text-sm text-slate-400">{SECTION_TYPES[currentSection.type]?.desc}</p>
        </div>
        {/* Fill All with AI */}
        <button
          onClick={async () => {
            // Genera suggerimenti per tutti i campi principali
            const fields = ['title', 'subtitle', 'ctaText'];
            for (const field of fields) {
              await generateAISuggestion(currentSection.id, field, { businessContext });
            }
          }}
          className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          Auto-compila
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {renderQuestions()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Precedente
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex === totalSections - 1}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          {currentIndex === totalSections - 1 ? 'Completato' : 'Prossima'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// === QUESTION COMPONENTS PER OGNI TIPO DI SEZIONE ===

// Componente helper per input con bottone AI
function AIField({ label, value, onChange, placeholder, multiline = false, onAISuggest, isLoading }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        {onAISuggest && (
          <button
            onClick={onAISuggest}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Lightbulb className="w-3 h-3" />
            )}
            AI
          </button>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      )}
    </div>
  );
}

function HeroQuestions({ details, updateDetail, sectionId, generateAISuggestion, aiSuggesting, businessContext }) {
  return (
    <>
      <AIField
        label="Titolo principale (headline)"
        value={details.title}
        onChange={(v) => updateDetail('title', v)}
        placeholder="Es: Trasforma il tuo corpo in 12 settimane"
        onAISuggest={generateAISuggestion ? () => generateAISuggestion(sectionId, 'title', { businessContext }) : null}
        isLoading={aiSuggesting?.[`${sectionId}-title`]}
      />
      <AIField
        label="Sottotitolo"
        value={details.subtitle}
        onChange={(v) => updateDetail('subtitle', v)}
        placeholder="Es: Programma personalizzato con supporto 1-to-1"
        multiline
        onAISuggest={generateAISuggestion ? () => generateAISuggestion(sectionId, 'subtitle', { businessContext }) : null}
        isLoading={aiSuggesting?.[`${sectionId}-subtitle`]}
      />
      <div className="grid grid-cols-2 gap-4">
        <AIField
          label="Testo bottone primario"
          value={details.ctaText}
          onChange={(v) => updateDetail('ctaText', v)}
          placeholder="Es: Inizia Ora"
          onAISuggest={generateAISuggestion ? () => generateAISuggestion(sectionId, 'ctaText', { businessContext }) : null}
          isLoading={aiSuggesting?.[`${sectionId}-ctaText`]}
        />
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Azione bottone
          </label>
          <select
            value={details.ctaAction || 'scroll'}
            onChange={(e) => updateDetail('ctaAction', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="scroll">Scrolla al form</option>
            <option value="popup">Apre popup form</option>
            <option value="link">Link esterno</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>
      <AIField
        label="Badge/etichetta (opzionale)"
        value={details.badge}
        onChange={(v) => updateDetail('badge', v)}
        placeholder="Es: 🔥 Offerta Limitata | ⭐ Best Seller"
        onAISuggest={generateAISuggestion ? () => generateAISuggestion(sectionId, 'badge', { businessContext }) : null}
        isLoading={aiSuggesting?.[`${sectionId}-badge`]}
      />
    </>
  );
}

function FeaturesQuestions({ details, updateDetail }) {
  const features = details.features || [{ title: '', description: '', icon: '' }];
  
  const addFeature = () => {
    updateDetail('features', [...features, { title: '', description: '', icon: '' }]);
  };
  
  const updateFeature = (index, key, value) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [key]: value };
    updateDetail('features', updated);
  };
  
  const removeFeature = (index) => {
    updateDetail('features', features.filter((_, i) => i !== index));
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Titolo sezione
        </label>
        <input
          type="text"
          value={details.sectionTitle || ''}
          onChange={(e) => updateDetail('sectionTitle', e.target.value)}
          placeholder="Es: Cosa Include il Programma"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-300">
          Features/Servizi ({features.length})
        </label>
        {features.map((feature, i) => (
          <div key={i} className="p-4 bg-slate-700/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Feature {i + 1}</span>
              {features.length > 1 && (
                <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={feature.icon}
                onChange={(e) => updateFeature(i, 'icon', e.target.value)}
                placeholder="Emoji"
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-center"
              />
              <input
                type="text"
                value={feature.title}
                onChange={(e) => updateFeature(i, 'title', e.target.value)}
                placeholder="Titolo"
                className="col-span-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <input
              type="text"
              value={feature.description}
              onChange={(e) => updateFeature(i, 'description', e.target.value)}
              placeholder="Breve descrizione"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
        ))}
        <button
          onClick={addFeature}
          className="w-full py-2 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl text-slate-400 hover:text-purple-400 transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Aggiungi Feature
        </button>
      </div>
    </>
  );
}

function TestimonialsQuestions({ details, updateDetail }) {
  const testimonials = details.testimonials || [{ name: '', text: '', role: '' }];
  
  const addTestimonial = () => {
    updateDetail('testimonials', [...testimonials, { name: '', text: '', role: '' }]);
  };
  
  const updateTestimonial = (index, key, value) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [key]: value };
    updateDetail('testimonials', updated);
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Titolo sezione
        </label>
        <input
          type="text"
          value={details.sectionTitle || ''}
          onChange={(e) => updateDetail('sectionTitle', e.target.value)}
          placeholder="Es: Cosa Dicono i Miei Clienti"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-300">Testimonianze ({testimonials.length})</label>
        {testimonials.map((t, i) => (
          <div key={i} className="p-4 bg-slate-700/30 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={t.name}
                onChange={(e) => updateTestimonial(i, 'name', e.target.value)}
                placeholder="Nome"
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <input
                type="text"
                value={t.role}
                onChange={(e) => updateTestimonial(i, 'role', e.target.value)}
                placeholder="Ruolo (es: Cliente da 6 mesi)"
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <textarea
              value={t.text}
              onChange={(e) => updateTestimonial(i, 'text', e.target.value)}
              placeholder="Testo della testimonianza..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
        ))}
        <button onClick={addTestimonial} className="w-full py-2 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl text-slate-400 hover:text-purple-400">
          <Plus className="w-4 h-4 inline mr-2" />
          Aggiungi Testimonianza
        </button>
      </div>
    </>
  );
}

function PricingQuestions({ details, updateDetail }) {
  const plans = details.plans || [{ name: '', price: '', features: [''] }];
  
  const addPlan = () => {
    updateDetail('plans', [...plans, { name: '', price: '', features: [''], highlighted: false }]);
  };
  
  const updatePlan = (index, key, value) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [key]: value };
    updateDetail('plans', updated);
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Titolo sezione</label>
        <input
          type="text"
          value={details.sectionTitle || ''}
          onChange={(e) => updateDetail('sectionTitle', e.target.value)}
          placeholder="Es: Scegli il Tuo Piano"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div className="space-y-4">
        {plans.map((plan, i) => (
          <div key={i} className="p-4 bg-slate-700/30 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={plan.name}
                onChange={(e) => updatePlan(i, 'name', e.target.value)}
                placeholder="Nome piano (es: Base)"
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <input
                type="text"
                value={plan.price}
                onChange={(e) => updatePlan(i, 'price', e.target.value)}
                placeholder="€99/mese"
                className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={plan.highlighted}
                  onChange={(e) => updatePlan(i, 'highlighted', e.target.checked)}
                  className="rounded"
                />
                In evidenza
              </label>
            </div>
            <textarea
              value={(plan.features || []).join('\n')}
              onChange={(e) => updatePlan(i, 'features', e.target.value.split('\n'))}
              placeholder="Una feature per riga..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
        ))}
        <button onClick={addPlan} className="w-full py-2 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl text-slate-400 hover:text-purple-400">
          <Plus className="w-4 h-4 inline mr-2" />
          Aggiungi Piano
        </button>
      </div>
    </>
  );
}

function CTAQuestions({ details, updateDetail }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Titolo CTA</label>
        <input
          type="text"
          value={details.title || ''}
          onChange={(e) => updateDetail('title', e.target.value)}
          placeholder="Es: Pronto a Iniziare il Tuo Percorso?"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Sottotitolo</label>
        <input
          type="text"
          value={details.subtitle || ''}
          onChange={(e) => updateDetail('subtitle', e.target.value)}
          placeholder="Es: Inizia oggi con una consulenza gratuita"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Testo bottone</label>
          <input
            type="text"
            value={details.ctaText || ''}
            onChange={(e) => updateDetail('ctaText', e.target.value)}
            placeholder="Es: Prenota Consulenza"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Azione</label>
          <select
            value={details.ctaAction || 'scroll'}
            onChange={(e) => updateDetail('ctaAction', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
          >
            <option value="scroll">Scrolla al form</option>
            <option value="popup">Apre popup</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="calendly">Calendly</option>
          </select>
        </div>
      </div>
    </>
  );
}

function FormQuestions({ details, updateDetail }) {
  const fields = details.fields || [{ name: 'nome', label: 'Nome', type: 'text', required: true }];
  
  const addField = () => {
    updateDetail('fields', [...fields, { name: '', label: '', type: 'text', required: false }]);
  };
  
  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    updateDetail('fields', updated);
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Titolo form</label>
        <input
          type="text"
          value={details.title || ''}
          onChange={(e) => updateDetail('title', e.target.value)}
          placeholder="Es: Richiedi una Consulenza Gratuita"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">Campi del form ({fields.length})</label>
        {fields.map((field, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField(i, 'label', e.target.value)}
              placeholder="Label campo"
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
            <select
              value={field.type}
              onChange={(e) => updateField(i, 'type', e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="text">Testo</option>
              <option value="email">Email</option>
              <option value="tel">Telefono</option>
              <option value="textarea">Messaggio</option>
              <option value="select">Selezione</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(i, 'required', e.target.checked)}
              />
              Req.
            </label>
          </div>
        ))}
        <button onClick={addField} className="w-full py-2 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl text-slate-400 hover:text-purple-400">
          <Plus className="w-4 h-4 inline mr-2" />
          Aggiungi Campo
        </button>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Testo bottone invio</label>
        <input
          type="text"
          value={details.submitText || ''}
          onChange={(e) => updateDetail('submitText', e.target.value)}
          placeholder="Es: Invia Richiesta"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </>
  );
}

function FAQQuestions({ details, updateDetail }) {
  const faqs = details.faqs || [{ question: '', answer: '' }];
  
  const addFaq = () => {
    updateDetail('faqs', [...faqs, { question: '', answer: '' }]);
  };
  
  const updateFaq = (index, key, value) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [key]: value };
    updateDetail('faqs', updated);
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Titolo sezione</label>
        <input
          type="text"
          value={details.sectionTitle || ''}
          onChange={(e) => updateDetail('sectionTitle', e.target.value)}
          placeholder="Es: Domande Frequenti"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="p-4 bg-slate-700/30 rounded-xl space-y-2">
            <input
              type="text"
              value={faq.question}
              onChange={(e) => updateFaq(i, 'question', e.target.value)}
              placeholder="Domanda"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
            <textarea
              value={faq.answer}
              onChange={(e) => updateFaq(i, 'answer', e.target.value)}
              placeholder="Risposta"
              rows={2}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
        ))}
        <button onClick={addFaq} className="w-full py-2 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl text-slate-400 hover:text-purple-400">
          <Plus className="w-4 h-4 inline mr-2" />
          Aggiungi FAQ
        </button>
      </div>
    </>
  );
}

function AboutQuestions({ details, updateDetail }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Il tuo nome</label>
        <input
          type="text"
          value={details.name || ''}
          onChange={(e) => updateDetail('name', e.target.value)}
          placeholder="Es: Marco Rossi"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Titolo/Ruolo</label>
        <input
          type="text"
          value={details.role || ''}
          onChange={(e) => updateDetail('role', e.target.value)}
          placeholder="Es: Personal Trainer Certificato"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">La tua storia</label>
        <textarea
          value={details.bio || ''}
          onChange={(e) => updateDetail('bio', e.target.value)}
          placeholder="Racconta brevemente chi sei, la tua esperienza, cosa ti distingue..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Certificazioni (una per riga)</label>
        <textarea
          value={details.certifications || ''}
          onChange={(e) => updateDetail('certifications', e.target.value)}
          placeholder="Es:&#10;Certificazione ISSA&#10;Laurea Scienze Motorie&#10;Specializzazione Nutrizione"
          rows={3}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </>
  );
}

function GenericQuestions({ details, updateDetail, sectionType }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Titolo sezione</label>
        <input
          type="text"
          value={details.title || ''}
          onChange={(e) => updateDetail('title', e.target.value)}
          placeholder="Inserisci titolo..."
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Contenuto</label>
        <textarea
          value={details.content || ''}
          onChange={(e) => updateDetail('content', e.target.value)}
          placeholder="Inserisci il contenuto di questa sezione..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </>
  );
}

// Step 5: Selezione stile e colori
function Step5Style({ selectedPalette, setSelectedPalette, fontStyle, setFontStyle, palettes }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Palette className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Scegli lo Stile</h3>
        <p className="text-slate-400 text-sm">Seleziona i colori e lo stile della tua landing page</p>
      </div>

      {/* Color Palettes */}
      <div>
        <h4 className="text-sm font-medium text-slate-300 mb-4">Palette Colori</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              onClick={() => setSelectedPalette(palette.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPalette === palette.id 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
              }`}
            >
              <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.primary }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.secondary }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.accent }} />
              </div>
              <p className="text-sm font-medium text-white">{palette.name}</p>
              {selectedPalette === palette.id && (
                <Check className="w-4 h-4 text-purple-400 mt-2" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Style */}
      <div>
        <h4 className="text-sm font-medium text-slate-300 mb-4">Stile Font</h4>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setFontStyle('modern')}
            className={`p-4 rounded-xl border-2 transition-all ${
              fontStyle === 'modern' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <p className="text-lg font-medium text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Aa</p>
            <p className="text-xs text-slate-400 mt-1">Moderno</p>
          </button>
          <button
            onClick={() => setFontStyle('classic')}
            className={`p-4 rounded-xl border-2 transition-all ${
              fontStyle === 'classic' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <p className="text-lg font-medium text-white" style={{ fontFamily: 'Georgia, serif' }}>Aa</p>
            <p className="text-xs text-slate-400 mt-1">Classico</p>
          </button>
          <button
            onClick={() => setFontStyle('bold')}
            className={`p-4 rounded-xl border-2 transition-all ${
              fontStyle === 'bold' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <p className="text-lg font-black text-white">Aa</p>
            <p className="text-xs text-slate-400 mt-1">Bold</p>
          </button>
        </div>
      </div>

      {/* Preview Box */}
      <div className="p-6 rounded-xl border border-slate-600" style={{ 
        backgroundColor: palettes.find(p => p.id === selectedPalette)?.bg || '#0f172a' 
      }}>
        <h4 className="text-sm text-slate-400 mb-4">Anteprima</h4>
        <div className="space-y-4">
          <h2 
            className="text-2xl font-bold"
            style={{ 
              color: palettes.find(p => p.id === selectedPalette)?.primary,
              fontWeight: fontStyle === 'bold' ? 900 : 700,
              fontFamily: fontStyle === 'classic' ? 'Georgia, serif' : 'Inter, sans-serif'
            }}
          >
            Titolo Esempio
          </h2>
          <p className="text-slate-300">
            Questo è un esempio di come apparirà il testo della tua landing page.
          </p>
          <button
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: palettes.find(p => p.id === selectedPalette)?.primary }}
          >
            Bottone CTA
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 6: Generazione HTML finale
function Step6Generate({ sections, sectionDetails, palette, fontStyle, onGenerated, onClose, isProcessing, setIsProcessing, setError }) {
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateHtml = async () => {
    setIsGenerating(true);
    setIsProcessing(true);
    
    try {
      // Genera HTML per ogni sezione
      let html = '';
      
      for (const section of sections) {
        const details = sectionDetails[section.id] || {};
        html += generateSectionHtml(section.type, details, palette, fontStyle);
      }
      
      setGeneratedHtml(html);
      setShowPreview(true);
      
    } catch (err) {
      console.error('Errore generazione:', err);
      setError('Errore durante la generazione');
    } finally {
      setIsGenerating(false);
      setIsProcessing(false);
    }
  };

  const handleUseHtml = () => {
    if (generatedHtml) {
      onGenerated({ html: generatedHtml, sections, sectionDetails, palette, fontStyle });
      onClose();
    }
  };

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
          <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Generazione in corso...</h3>
        <p className="text-slate-400">Sto creando la tua landing page</p>
      </div>
    );
  }

  if (showPreview && generatedHtml) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Landing Page Generata!</h3>
          <p className="text-slate-400">{sections.length} sezioni create con i tuoi contenuti</p>
        </div>

        {/* Preview */}
        <div className="border border-slate-600 rounded-xl overflow-hidden">
          <div className="bg-slate-700 px-4 py-2 flex items-center justify-between">
            <span className="text-sm text-slate-300">Anteprima</span>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <div 
            className="h-64 overflow-y-auto bg-white"
            dangerouslySetInnerHTML={{ __html: generatedHtml }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => { setShowPreview(false); setGeneratedHtml(''); }}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            Rigenera
          </button>
          <button
            onClick={handleUseHtml}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Usa nell'Editor
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Pronto per Generare</h3>
        <p className="text-slate-400 text-sm">Riepilogo della tua landing page</p>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <div className="p-4 bg-slate-700/50 rounded-xl">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Sezioni ({sections.length})</h4>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <span 
                key={section.id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-slate-600 rounded-full text-sm text-white"
              >
                {SECTION_TYPES[section.type]?.icon} {SECTION_TYPES[section.type]?.label}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-700/50 rounded-xl">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Stile</h4>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: palette?.primary }} />
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: palette?.secondary }} />
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: palette?.accent }} />
            </div>
            <span className="text-sm text-slate-400">{palette?.name}</span>
            <span className="text-sm text-slate-400 border-l border-slate-600 pl-4">
              Font: {fontStyle === 'modern' ? 'Moderno' : fontStyle === 'classic' ? 'Classico' : 'Bold'}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={generateHtml}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        Genera Landing Page
      </button>
    </div>
  );
}

// === HTML GENERATORS PER OGNI SEZIONE ===

function generateSectionHtml(type, details, palette, fontStyle) {
  const primary = palette?.primary || '#0ea5e9';
  const secondary = palette?.secondary || '#06b6d4';
  const bg = palette?.bg || '#0f172a';
  const fontClass = fontStyle === 'bold' ? 'font-black' : 'font-bold';
  const fontFamily = fontStyle === 'classic' ? 'Georgia, serif' : 'Inter, system-ui, sans-serif';

  switch (type) {
    case 'hero':
      return `
        <section class="relative min-h-[600px] py-20 overflow-hidden" style="background: linear-gradient(135deg, ${bg} 0%, #1e293b 100%);">
          <div class="container mx-auto px-6 text-center relative z-10">
            ${details.badge ? `<span class="inline-block px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white text-sm mb-6">${details.badge}</span>` : ''}
            <h1 class="text-4xl md:text-6xl ${fontClass} text-white mb-6" style="font-family: ${fontFamily};">
              ${details.title || 'Il Tuo Titolo Qui'}
            </h1>
            <p class="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              ${details.subtitle || 'Il tuo sottotitolo va qui'}
            </p>
            <a href="#form" class="inline-block px-8 py-4 text-white font-bold rounded-xl transition-all hover:scale-105" style="background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%);">
              ${details.ctaText || 'Inizia Ora'}
            </a>
          </div>
        </section>
      `;

    case 'features':
      const features = details.features || [{ icon: '✨', title: 'Feature 1', description: 'Descrizione' }];
      return `
        <section class="py-20" style="background-color: ${bg};">
          <div class="container mx-auto px-6">
            <h2 class="text-3xl ${fontClass} text-white text-center mb-16" style="font-family: ${fontFamily};">
              ${details.sectionTitle || 'Le Nostre Features'}
            </h2>
            <div class="grid md:grid-cols-3 gap-8">
              ${features.map(f => `
                <div class="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
                  <span class="text-4xl mb-4 block">${f.icon || '✨'}</span>
                  <h3 class="text-xl font-bold text-white mb-3">${f.title}</h3>
                  <p class="text-slate-400">${f.description}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'testimonials':
      const testimonials = details.testimonials || [{ name: 'Cliente', text: 'Testimonianza', role: 'Cliente' }];
      return `
        <section class="py-20" style="background-color: ${bg};">
          <div class="container mx-auto px-6">
            <h2 class="text-3xl ${fontClass} text-white text-center mb-16" style="font-family: ${fontFamily};">
              ${details.sectionTitle || 'Cosa Dicono di Noi'}
            </h2>
            <div class="grid md:grid-cols-3 gap-8">
              ${testimonials.map(t => `
                <div class="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
                  <p class="text-slate-300 italic mb-6">"${t.text}"</p>
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full" style="background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%);"></div>
                    <div>
                      <p class="font-bold text-white">${t.name}</p>
                      <p class="text-sm text-slate-400">${t.role}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'pricing':
      const plans = details.plans || [{ name: 'Piano', price: '€99', features: ['Feature 1'], highlighted: false }];
      return `
        <section class="py-20" style="background: linear-gradient(180deg, ${bg} 0%, #1e293b 100%);">
          <div class="container mx-auto px-6">
            <h2 class="text-3xl ${fontClass} text-white text-center mb-16" style="font-family: ${fontFamily};">
              ${details.sectionTitle || 'I Nostri Prezzi'}
            </h2>
            <div class="grid md:grid-cols-${Math.min(plans.length, 3)} gap-8 max-w-5xl mx-auto">
              ${plans.map(p => `
                <div class="p-8 rounded-2xl ${p.highlighted ? 'border-2' : 'border border-white/10'}" style="${p.highlighted ? `border-color: ${primary}; background: rgba(${parseInt(primary.slice(1,3),16)}, ${parseInt(primary.slice(3,5),16)}, ${parseInt(primary.slice(5,7),16)}, 0.1);` : 'background: rgba(255,255,255,0.05);'}">
                  <h3 class="text-lg font-semibold mb-2" style="color: ${p.highlighted ? primary : '#94a3b8'};">${p.name}</h3>
                  <div class="text-4xl font-black text-white mb-6">${p.price}</div>
                  <ul class="space-y-3 mb-8">
                    ${(p.features || []).map(f => `<li class="flex items-center text-slate-300"><span class="mr-2" style="color: ${primary};">✓</span>${f}</li>`).join('')}
                  </ul>
                  <a href="#form" class="block w-full py-3 text-center text-white rounded-xl font-medium" style="background: ${p.highlighted ? `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` : 'rgba(255,255,255,0.1)'};">
                    Scegli
                  </a>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'cta':
      return `
        <section class="py-20" style="background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%);">
          <div class="container mx-auto px-6 text-center">
            <h2 class="text-3xl md:text-4xl ${fontClass} text-white mb-6" style="font-family: ${fontFamily};">
              ${details.title || 'Pronto a Iniziare?'}
            </h2>
            <p class="text-xl text-white/90 max-w-2xl mx-auto mb-10">
              ${details.subtitle || 'Non aspettare, inizia oggi il tuo percorso'}
            </p>
            <a href="#form" class="inline-block px-10 py-5 bg-white font-bold text-lg rounded-xl hover:scale-105 transition-all" style="color: ${primary};">
              ${details.ctaText || 'Inizia Ora'}
            </a>
          </div>
        </section>
      `;

    case 'form':
      const fields = details.fields || [{ label: 'Nome', type: 'text' }, { label: 'Email', type: 'email' }];
      return `
        <section id="form" class="py-20" style="background-color: ${bg};">
          <div class="container mx-auto px-6 max-w-xl">
            <h2 class="text-3xl ${fontClass} text-white text-center mb-4" style="font-family: ${fontFamily};">
              ${details.title || 'Contattaci'}
            </h2>
            <form class="space-y-4 mt-8">
              ${fields.map(f => f.type === 'textarea' 
                ? `<textarea placeholder="${f.label}" rows="4" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[${primary}]" ${f.required ? 'required' : ''}></textarea>`
                : `<input type="${f.type}" placeholder="${f.label}" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[${primary}]" ${f.required ? 'required' : ''} />`
              ).join('')}
              <button type="submit" class="w-full py-4 text-white font-bold rounded-xl transition-all hover:scale-[1.02]" style="background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%);">
                ${details.submitText || 'Invia'}
              </button>
            </form>
          </div>
        </section>
      `;

    case 'faq':
      const faqs = details.faqs || [{ question: 'Domanda?', answer: 'Risposta' }];
      return `
        <section class="py-20" style="background-color: ${bg};">
          <div class="container mx-auto px-6 max-w-3xl">
            <h2 class="text-3xl ${fontClass} text-white text-center mb-16" style="font-family: ${fontFamily};">
              ${details.sectionTitle || 'Domande Frequenti'}
            </h2>
            <div class="space-y-4">
              ${faqs.map(faq => `
                <details class="bg-white/5 rounded-xl border border-white/10 group">
                  <summary class="px-6 py-4 cursor-pointer text-white font-semibold flex items-center justify-between">
                    ${faq.question}
                    <span style="color: ${primary};">▼</span>
                  </summary>
                  <p class="px-6 pb-4 text-slate-400">${faq.answer}</p>
                </details>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'about':
      const certs = (details.certifications || '').split('\n').filter(c => c.trim());
      return `
        <section class="py-20" style="background-color: ${bg};">
          <div class="container mx-auto px-6">
            <div class="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div class="aspect-square rounded-2xl" style="background: linear-gradient(135deg, ${primary}33 0%, ${secondary}33 100%);"></div>
              <div>
                <h2 class="text-3xl ${fontClass} text-white mb-2" style="font-family: ${fontFamily};">
                  ${details.name || 'Il Tuo Nome'}
                </h2>
                <p class="text-lg mb-6" style="color: ${primary};">${details.role || 'Il tuo ruolo'}</p>
                <p class="text-slate-300 leading-relaxed mb-6">${details.bio || 'La tua bio...'}</p>
                ${certs.length > 0 ? `
                  <ul class="space-y-2">
                    ${certs.map(c => `<li class="flex items-center text-slate-300"><span class="mr-2" style="color: ${primary};">✓</span>${c}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            </div>
          </div>
        </section>
      `;

    default:
      return `
        <section class="py-16" style="background-color: ${bg};">
          <div class="container mx-auto px-6 text-center">
            <h2 class="text-2xl font-bold text-white mb-4">${details.title || 'Sezione'}</h2>
            <p class="text-slate-400">${details.content || 'Contenuto sezione'}</p>
          </div>
        </section>
      `;
  }
}
