// src/pages/admin/landingPages/components/AIAssistantModal.jsx
import React, { useState } from 'react';
import { X, Wand2, Loader2, Sparkles, Link as LinkIcon, Image as ImageIcon, MousePointerClick, ExternalLink, Mail, Upload, ArrowRight, Database, ChevronRight } from 'lucide-react';
import { generateLandingPage, analyzeCompetitorURL, analyzeScreenshot } from '../../../../services/openai';

// Componente per mappare azioni CTA
function CTAActionMapper({ cta, onMap, onSkip, currentIndex, totalCTAs }) {
  const [actionType, setActionType] = useState('link');
  const [targetUrl, setTargetUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [formFields, setFormFields] = useState([
    { name: 'name', label: 'Nome', required: true },
    { name: 'email', label: 'Email', required: true }
  ]);
  const [redirectAfterSubmit, setRedirectAfterSubmit] = useState('');
  const [saveToCollection, setSaveToCollection] = useState('');

  const handleSubmit = () => {
    const actionConfig = {
      type: actionType,
      target: targetUrl,
      openInNewTab,
      formFields: actionType === 'form' || actionType === 'video' ? formFields : undefined,
      redirectUrl: redirectAfterSubmit || undefined,
      saveToCollection: saveToCollection || undefined
    };
    
    onMap(cta.id, actionConfig);
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-400">
          Pulsante {currentIndex + 1} di {totalCTAs}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: totalCTAs }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full ${
                i < currentIndex ? 'bg-blue-500' : 
                i === currentIndex ? 'bg-blue-400 animate-pulse' : 
                'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* CTA Info */}
      <div className="p-4 bg-slate-900/70 border border-slate-700 rounded-xl">
        <div className="flex items-start gap-3">
          <MousePointerClick className="text-blue-400 shrink-0 mt-1" size={20} />
          <div className="flex-1">
            <div className="font-semibold text-white mb-1">"{cta.text}"</div>
            <div className="text-sm text-slate-400">📍 {cta.location}</div>
            <div className="text-xs text-slate-500 mt-1">{cta.context}</div>
          </div>
        </div>
      </div>

      {/* Action Type Selector */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-3 block">
          Cosa fa questo pulsante?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActionType('link')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              actionType === 'link'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
            }`}
          >
            <ExternalLink className={actionType === 'link' ? 'text-blue-400' : 'text-slate-400'} size={20} />
            <div className="font-medium text-white mt-2">Link/Redirect</div>
            <div className="text-xs text-slate-500">Va a un'altra pagina</div>
          </button>

          <button
            type="button"
            onClick={() => setActionType('form')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              actionType === 'form'
                ? 'border-green-500 bg-green-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
            }`}
          >
            <Mail className={actionType === 'form' ? 'text-green-400' : 'text-slate-400'} size={20} />
            <div className="font-medium text-white mt-2">Form Contatto</div>
            <div className="text-xs text-slate-500">Raccoglie dati</div>
          </button>

          <button
            type="button"
            onClick={() => setActionType('video')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              actionType === 'video'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
            }`}
          >
            <Upload className={actionType === 'video' ? 'text-purple-400' : 'text-slate-400'} size={20} />
            <div className="font-medium text-white mt-2">Upload Video</div>
            <div className="text-xs text-slate-500">Carica file</div>
          </button>

          <button
            type="button"
            onClick={() => setActionType('scroll')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              actionType === 'scroll'
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
            }`}
          >
            <ChevronRight className={actionType === 'scroll' ? 'text-yellow-400' : 'text-slate-400'} size={20} />
            <div className="font-medium text-white mt-2">Scroll</div>
            <div className="text-xs text-slate-500">Va a sezione</div>
          </button>
        </div>
      </div>

      {/* Configuration based on action type */}
      <div className="space-y-4">
        {actionType === 'link' && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                URL di destinazione
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com o /site/tenant/altra-pagina"
                className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600"
              />
              <label className="text-sm text-slate-300">Apri in nuova tab</label>
            </div>
          </>
        )}

        {(actionType === 'form' || actionType === 'video') && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Campi da raccogliere
              </label>
              <div className="space-y-2">
                {['Nome', 'Email', 'Telefono', 'Messaggio'].map(field => (
                  <div key={field} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded">
                    <input type="checkbox" defaultChecked={field === 'Nome' || field === 'Email'} className="w-4 h-4" />
                    <span className="text-sm text-slate-300">{field}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                <Database size={16} className="inline mr-2" />
                Dove salvare i dati? (opzionale)
              </label>
              <input
                type="text"
                value={saveToCollection}
                onChange={(e) => setSaveToCollection(e.target.value)}
                placeholder="es: leads, contatti, richieste"
                className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
              <div className="text-xs text-slate-500 mt-1">
                I dati verranno salvati in: tenants/{'{tenantId}'}/{saveToCollection || 'formSubmissions'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                <ArrowRight size={16} className="inline mr-2" />
                Redirect dopo invio (opzionale)
              </label>
              <input
                type="text"
                value={redirectAfterSubmit}
                onChange={(e) => setRedirectAfterSubmit(e.target.value)}
                placeholder="/grazie o https://altra-pagina.com"
                className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </>
        )}

        {actionType === 'scroll' && (
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              ID sezione di destinazione
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="#contact o #pricing"
              className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          Salta questo pulsante →
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Conferma e Continua
        </button>
      </div>
    </div>
  );
}

export default function AIAssistantModal({ onGenerate, onClose }) {
  const [mode, setMode] = useState('prompt'); // 'prompt', 'url', 'screenshot'
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(null); // 'structure', 'actions', 'complete'
  const [detectedCTAs, setDetectedCTAs] = useState([]); // CTAs trovati dall'AI
  const [currentCTAIndex, setCurrentCTAIndex] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (mode === 'prompt' && !prompt.trim()) return;
    if (mode === 'url' && !url.trim()) return;
    if (mode === 'screenshot' && !screenshot) return;

    setLoading(true);
    try {
      let result;
      
      if (mode === 'url') {
        result = await generateFromUrl(url);
        // Se null, stiamo aspettando il wizard azioni
        if (!result) {
          setLoading(false);
          return;
        }
      } else if (mode === 'screenshot') {
        result = await generateFromScreenshot(screenshot);
        if (!result) {
          setLoading(false);
          return;
        }
      } else {
        // Genera con AI da prompt
        result = await generateFromPrompt(prompt);
      }
      
      // Converti struttura AI in sezioni
      const newSections = convertAIResultToSections(result);
      onGenerate(newSections);
      onClose();
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Errore generazione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
    }
  };

  // Genera da prompt con AI - estrazione intelligente dal testo
  const generateFromPrompt = async (promptText) => {
    // Cerca parole chiave nel prompt per estrarre info
    const lowerPrompt = promptText.toLowerCase();
    
    // Estrai business type (cerca parole comuni)
    let businessType = 'business';
    const businessKeywords = ['palestra', 'fitness', 'personal trainer', 'pt', 'yoga', 'pilates', 'crossfit', 'nutrizione', 'dietologo', 'psicologo', 'coach', 'consulente'];
    for (const keyword of businessKeywords) {
      if (lowerPrompt.includes(keyword)) {
        businessType = keyword;
        break;
      }
    }

    // Estrai target audience
    let targetAudience = 'clienti interessati';
    const audienceKeywords = ['principianti', 'avanzati', 'donne', 'uomini', 'giovani', 'over 40', 'professionisti', 'studenti'];
    for (const keyword of audienceKeywords) {
      if (lowerPrompt.includes(keyword)) {
        targetAudience = keyword;
        break;
      }
    }

    // Estrai obiettivo
    let mainGoal = 'lead-generation';
    if (lowerPrompt.includes('vendita') || lowerPrompt.includes('acquisto') || lowerPrompt.includes('compra')) {
      mainGoal = 'sales';
    } else if (lowerPrompt.includes('iscrizione') || lowerPrompt.includes('registrazione')) {
      mainGoal = 'signup';
    }

    // Estrai stile
    let style = 'modern';
    if (lowerPrompt.includes('minimal') || lowerPrompt.includes('pulito')) {
      style = 'minimal';
    } else if (lowerPrompt.includes('elegante') || lowerPrompt.includes('lusso')) {
      style = 'elegant';
    } else if (lowerPrompt.includes('dinamico') || lowerPrompt.includes('energico')) {
      style = 'dynamic';
    }

    console.log('🔍 Parametri estratti dal prompt:', {
      businessType,
      targetAudience,
      mainGoal,
      style,
      originalPrompt: promptText
    });

    // Usa il prompt completo come additionalInfo
    return await generateLandingPage({
      businessType: businessType,
      targetAudience: targetAudience,
      goal: mainGoal,
      style: style,
      additionalInfo: promptText // Passa il prompt completo all'AI
    });
  };

  // Converti risultato AI in sezioni
  const convertAIResultToSections = (aiResult) => {
    if (!aiResult || !aiResult.sections) {
      return generatePlaceholderSections('Contenuto di fallback');
    }

    return aiResult.sections.map((section, idx) => ({
      id: `section-${Date.now()}-${idx}`,
      type: section.type,
      props: section.props || {}
    }));
  };

  // Genera da URL competitor con AI REALE
  const generateFromUrl = async (competitorUrl) => {
    try {
      // Step 1: Analizza struttura con OpenAI
      setAnalyzingStep('structure');
      const analysis = await analyzeCompetitorURL(competitorUrl);
      
      // Step 2: Identifica CTAs dall'analisi AI
      const aiCTAs = [];
      analysis.sections.forEach((section, sIdx) => {
        if (section.ctas && section.ctas.length > 0) {
          section.ctas.forEach((cta, cIdx) => {
            aiCTAs.push({
              id: `cta-${sIdx}-${cIdx}`,
              text: cta.label,
              location: `${section.type} Section`,
              context: `Sezione ${section.title || section.type}, azione suggerita: ${cta.actionType}`,
              suggestedAction: cta.actionType
            });
          });
        }
      });

      if (aiCTAs.length === 0) {
        // Nessun CTA trovato, genera direttamente
        return analysis;
      }

      // Mostra wizard per mappare azioni
      setDetectedCTAs(aiCTAs);
      setAnalyzingStep('actions');
      setCurrentCTAIndex(0);
      return null; // Aspetta wizard
    } catch (error) {
      console.error('URL analysis error:', error);
      // Fallback a mock CTAs
      const mockCTAs = [
        { 
          id: 'cta1',
          text: 'Inizia Gratis', 
          location: 'Hero Section',
          context: 'Pulsante principale nella sezione hero'
        },
        { 
          id: 'cta2', 
          text: 'Scopri di Più', 
          location: 'Features',
          context: 'Link per maggiori informazioni'
        }
      ];
      
      setDetectedCTAs(mockCTAs);
      setAnalyzingStep('actions');
      setCurrentCTAIndex(0);
      return null;
    }
  };

  // Genera da screenshot con AI Vision REALE
  const generateFromScreenshot = async (imageFile) => {
    try {
      // Converti immagine in base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(imageFile);
      });

      // Step 1: Analizza immagine con GPT-4 Vision
      setAnalyzingStep('structure');
      const base64Image = await base64Promise;
      const analysis = await analyzeScreenshot(base64Image);
      
      // Step 2: Identifica CTAs dall'analisi Vision
      const aiCTAs = [];
      analysis.sections.forEach((section, sIdx) => {
        if (section.ctas && section.ctas.length > 0) {
          section.ctas.forEach((cta, cIdx) => {
            aiCTAs.push({
              id: `cta-${sIdx}-${cIdx}`,
              text: cta.label,
              location: `${section.type} Section`,
              context: `Sezione ${section.title || section.type}, azione suggerita: ${cta.actionType}`,
              suggestedAction: cta.actionType
            });
          });
        }
      });

      if (aiCTAs.length === 0) {
        // Nessun CTA trovato, genera direttamente
        return analysis;
      }

      // Mostra wizard per mappare azioni
      setDetectedCTAs(aiCTAs);
      setAnalyzingStep('actions');
      setCurrentCTAIndex(0);
      return null;
    } catch (error) {
      console.error('Screenshot analysis error:', error);
      // Fallback a mock CTAs
      const mockCTAs = [
        { 
          id: 'cta1', 
          text: 'Get Started', 
          location: 'Top Section',
          context: 'Pulsante grande al centro'
        },
        { 
          id: 'cta2', 
          text: 'Learn More', 
          location: 'Middle Section',
          context: 'Link testuale sotto il paragrafo'
        }
      ];
      
      setDetectedCTAs(mockCTAs);
      setAnalyzingStep('actions');
      setCurrentCTAIndex(0);
      return null;
    }
  };

  // Completa la generazione con le azioni mappate
  const completeGeneration = () => {
    setAnalyzingStep('complete');
    
    // Genera sezioni con le azioni mappate
    const sections = generatePlaceholderSections(
      mode === 'url' ? `Struttura da: ${url}` : 'Struttura da screenshot'
    );
    
    // Applica le azioni mappate ai CTAs
    detectedCTAs.forEach((cta, index) => {
      if (sections[index] && cta.mappedAction) {
        sections[index].props.ctaAction = cta.mappedAction.type;
        sections[index].props.ctaTarget = cta.mappedAction.target;
        if (cta.mappedAction.formFields) {
          sections[index].props.formFields = cta.mappedAction.formFields;
        }
        if (cta.mappedAction.redirectUrl) {
          sections[index].props.redirectUrl = cta.mappedAction.redirectUrl;
        }
        if (cta.mappedAction.saveToCollection) {
          sections[index].props.saveToCollection = cta.mappedAction.saveToCollection;
        }
      }
    });
    
    return sections;
  };

  // Mappa azione per un CTA
  const handleMapCTAAction = (ctaId, actionConfig) => {
    setDetectedCTAs(prev => prev.map(cta => 
      cta.id === ctaId 
        ? { ...cta, mappedAction: actionConfig }
        : cta
    ));
    
    // Vai al prossimo CTA o completa
    if (currentCTAIndex < detectedCTAs.length - 1) {
      setCurrentCTAIndex(prev => prev + 1);
    } else {
      // Tutti i CTAs mappati, genera le sezioni
      const finalSections = completeGeneration();
      onGenerate(finalSections);
      onClose();
    }
  };

  // Generazione placeholder - da sostituire con chiamata AI reale
  const generatePlaceholderSections = (userPrompt) => {
    // Analisi semplice del prompt per determinare sezioni
    const lower = userPrompt.toLowerCase();
    const sections = [];

    // Hero sempre presente
    sections.push({
      id: `section_${Date.now()}_1`,
      type: 'hero',
      props: {
        title: 'Titolo Generato dall\'AI',
        subtitle: 'Sottotitolo basato sul prompt: ' + userPrompt.substring(0, 50) + '...',
        ctaText: 'Scopri di più',
        ctaAction: 'scroll',
        ctaTarget: '#features',
        showOverlay: true
      }
    });

    // Features se menzionate caratteristiche
    if (lower.includes('caratteristiche') || lower.includes('features') || lower.includes('vantaggi')) {
      sections.push({
        id: `section_${Date.now()}_2`,
        type: 'features',
        props: {
          title: 'Le nostre caratteristiche',
          columns: 3,
          items: [
            { icon: '⚡', title: 'Veloce', description: 'Performance ottimali' },
            { icon: '🔒', title: 'Sicuro', description: 'Protezione garantita' },
            { icon: '💎', title: 'Premium', description: 'Qualità superiore' }
          ]
        }
      });
    }

    // Pricing se menzionati prezzi/piani
    if (lower.includes('prezzi') || lower.includes('piani') || lower.includes('abbonamenti')) {
      sections.push({
        id: `section_${Date.now()}_3`,
        type: 'pricing',
        props: {
          title: 'I nostri piani',
          plans: [
            {
              name: 'Base',
              price: '29',
              period: 'mese',
              features: ['Feature 1', 'Feature 2', 'Feature 3'],
              ctaText: 'Inizia',
              ctaUrl: '#contact',
              highlighted: false
            },
            {
              name: 'Pro',
              price: '79',
              period: 'mese',
              features: ['Tutte le feature Base', 'Feature Premium', 'Supporto prioritario'],
              ctaText: 'Inizia ora',
              ctaUrl: '#contact',
              highlighted: true
            }
          ]
        }
      });
    }

    // Form contatto se menzionato
    if (lower.includes('contatto') || lower.includes('form') || lower.includes('contattaci')) {
      sections.push({
        id: `section_${Date.now()}_4`,
        type: 'contactForm',
        props: {
          title: 'Contattaci',
          description: 'Compila il form e ti risponderemo presto',
          showName: true,
          showEmail: true,
          showPhone: true,
          showMessage: true,
          submitText: 'Invia Messaggio',
          successMessage: 'Messaggio inviato con successo!'
        }
      });
    }

    // CTA finale
    sections.push({
      id: `section_${Date.now()}_5`,
      type: 'cta',
      props: {
        title: 'Pronto a iniziare?',
        subtitle: 'Unisciti a noi oggi stesso e scopri tutti i vantaggi',
        buttonText: 'Contattaci Ora',
        buttonAction: 'scroll',
        buttonTarget: '#contact',
        style: 'gradient',
        size: 'large'
      }
    });

    return sections;
  };

  const quickPrompts = [
    'Landing page per servizi fitness con prezzi e form contatto',
    'Pagina prodotto con caratteristiche, testimonianze e CTA',
    'Pagina evento con video upload e form iscrizione',
    'Sito servizi con hero, features e contatti'
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Wand2 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Assistente AI</h2>
              <p className="text-sm text-slate-400">Crea la tua landing in 3 modi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-6 border-b border-slate-700">
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode('prompt')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'prompt'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
              }`}
              disabled={loading}
            >
              <Sparkles className={`mx-auto mb-2 ${mode === 'prompt' ? 'text-blue-400' : 'text-slate-400'}`} size={24} />
              <div className={`font-medium ${mode === 'prompt' ? 'text-white' : 'text-slate-300'}`}>
                Descrizione
              </div>
              <div className="text-xs text-slate-500 mt-1">Descrivi cosa vuoi</div>
            </button>

            <button
              type="button"
              onClick={() => setMode('url')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'url'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
              }`}
              disabled={loading}
            >
              <LinkIcon className={`mx-auto mb-2 ${mode === 'url' ? 'text-purple-400' : 'text-slate-400'}`} size={24} />
              <div className={`font-medium ${mode === 'url' ? 'text-white' : 'text-slate-300'}`}>
                Da URL
              </div>
              <div className="text-xs text-slate-500 mt-1">Copia competitor</div>
            </button>

            <button
              type="button"
              onClick={() => setMode('screenshot')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'screenshot'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
              }`}
              disabled={loading}
            >
              <ImageIcon className={`mx-auto mb-2 ${mode === 'screenshot' ? 'text-green-400' : 'text-slate-400'}`} size={24} />
              <div className={`font-medium ${mode === 'screenshot' ? 'text-white' : 'text-slate-300'}`}>
                Screenshot
              </div>
              <div className="text-xs text-slate-500 mt-1">Carica immagine</div>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Analyzing Steps */}
          {analyzingStep === 'structure' && (
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
              <div className="text-xl font-bold text-white mb-2">Analisi in corso...</div>
              <div className="text-slate-400">
                {mode === 'url' ? 'Scansione della pagina e identificazione sezioni' : 'Analisi dell\'immagine con AI Vision'}
              </div>
              <div className="mt-6 max-w-md mx-auto">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="flex-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Estrazione struttura...</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Mapping Wizard */}
          {analyzingStep === 'actions' && detectedCTAs.length > 0 && (
            <div>
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Wand2 className="text-blue-400 shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-blue-200">
                    <div className="font-semibold mb-1">✨ Ho trovato {detectedCTAs.length} pulsanti/link</div>
                    <div className="text-blue-300/80">
                      Aiutami a capire cosa fa ognuno per ricreare l'intero flusso
                    </div>
                  </div>
                </div>
              </div>

              <CTAActionMapper
                cta={detectedCTAs[currentCTAIndex]}
                currentIndex={currentCTAIndex}
                totalCTAs={detectedCTAs.length}
                onMap={handleMapCTAAction}
                onSkip={() => handleMapCTAAction(detectedCTAs[currentCTAIndex].id, { type: 'link', target: '#' })}
              />
            </div>
          )}

          {/* Initial Form */}
          {!analyzingStep && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode: Prompt */}
            {mode === 'prompt' && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Descrivi la tua landing page
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Es: Voglio una landing page per la mia palestra con sezione hero, caratteristiche dei nostri servizi, prezzi degli abbonamenti e form di contatto..."
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    disabled={loading}
                  />
                </div>

                {/* Quick prompts */}
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">
                    Oppure prova uno di questi:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {quickPrompts.map((quickPrompt, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setPrompt(quickPrompt)}
                        className="text-left p-3 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 hover:border-blue-500 rounded-lg text-sm text-slate-300 transition-all"
                        disabled={loading}
                      >
                        <Sparkles size={14} className="inline mr-2 text-blue-400" />
                        {quickPrompt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Mode: URL */}
            {mode === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    URL della pagina da copiare
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/landing-page"
                    className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    disabled={loading}
                  />
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <div className="flex gap-3">
                    <LinkIcon className="text-purple-400 shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-purple-200">
                      <div className="font-semibold mb-1">Come funziona:</div>
                      <ol className="space-y-1 text-purple-300/80">
                        <li>1. Incolla l'URL del tuo competitor</li>
                        <li>2. L'AI analizza la struttura della pagina</li>
                        <li>3. Ricrea automaticamente le sezioni</li>
                        <li>4. Adatta i contenuti al tuo brand</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  💡 Funziona con: landing pages, pagine prodotto, home pages
                </div>
              </div>
            )}

            {/* Mode: Screenshot */}
            {mode === 'screenshot' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Carica screenshot della pagina
                  </label>
                  
                  {!screenshot ? (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                        disabled={loading}
                      />
                      <div className="border-2 border-dashed border-slate-700 hover:border-green-500 rounded-xl p-12 text-center cursor-pointer transition-colors bg-slate-900/50 hover:bg-slate-900/70">
                        <ImageIcon className="mx-auto mb-3 text-slate-400" size={48} />
                        <div className="text-white font-medium mb-1">
                          Clicca per caricare screenshot
                        </div>
                        <div className="text-sm text-slate-400">
                          PNG, JPG, WEBP fino a 10MB
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="border border-slate-700 rounded-xl p-4 bg-slate-900/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="text-green-400" size={24} />
                          <div>
                            <div className="text-white font-medium">{screenshot.name}</div>
                            <div className="text-xs text-slate-400">
                              {(screenshot.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setScreenshot(null)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          disabled={loading}
                        >
                          <X size={18} className="text-slate-400" />
                        </button>
                      </div>
                      <img
                        src={URL.createObjectURL(screenshot)}
                        alt="Preview"
                        className="w-full rounded-lg border border-slate-700"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex gap-3">
                    <Sparkles className="text-green-400 shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-green-200">
                      <div className="font-semibold mb-1">AI Vision analizza:</div>
                      <ul className="space-y-1 text-green-300/80">
                        <li>• Layout e struttura delle sezioni</li>
                        <li>• Tipografia e gerarchie dei testi</li>
                        <li>• Colori e stili visivi</li>
                        <li>• Posizionamento elementi e CTAs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info box - solo per prompt mode */}
            {mode === 'prompt' && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-200">
                  💡 <strong>Suggerimento:</strong> Più dettagli fornisci, migliore sarà il risultato. 
                  Specifica tipo di business, sezioni desiderate, stile e target audience.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                disabled={loading}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  (mode === 'prompt' && !prompt.trim()) ||
                  (mode === 'url' && !url.trim()) ||
                  (mode === 'screenshot' && !screenshot)
                }
                className={`px-6 py-2.5 bg-gradient-to-r text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  mode === 'url'
                    ? 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                    : mode === 'screenshot'
                    ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    : 'from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {mode === 'url' ? 'Analisi URL...' : mode === 'screenshot' ? 'Analisi immagine...' : 'Generazione...'}
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    {mode === 'url' ? 'Analizza e Crea' : mode === 'screenshot' ? 'Analizza Screenshot' : 'Genera Sezioni'}
                  </>
                )}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
