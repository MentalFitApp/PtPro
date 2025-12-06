// src/pages/admin/landingPages/CreateLandingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { getTenantCollection } from '../../../config/tenant';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Sparkles, FileText, Link as LinkIcon, Image, Wand2, Loader2
} from 'lucide-react';
import { generateLandingPage, analyzeCompetitorURL, analyzeScreenshot } from '../../../services/openai';

export default function CreateLandingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('form'); // form | url | screenshot
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');

  // Form mode data
  const [formData, setFormData] = useState({
    businessType: '',
    target: '',
    goal: 'lead-generation',
    style: 'modern',
    additionalInfo: ''
  });

  // URL mode data
  const [urlInput, setUrlInput] = useState('');

  // Screenshot mode data
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const generateFromForm = async () => {
    setGeneratingStatus('🤖 Contatto OpenAI GPT-4o-mini...');
    
    const aiResult = await generateLandingPage({
      businessType: formData.businessType,
      targetAudience: formData.target,
      goal: formData.goal,
      style: formData.style,
      additionalInfo: formData.additionalInfo
    });

    return {
      title: aiResult.title || `Landing Page - ${formData.businessType}`,
      sections: aiResult.sections || [],
      seo: aiResult.seo || {},
      style: aiResult.style || formData.style
    };
  };

  const generateFromURL = async () => {
    setGeneratingStatus('🔗 Analisi URL competitor...');
    
    const aiResult = await analyzeCompetitorURL(urlInput);

    return {
      title: aiResult.title || 'Landing Page da URL',
      sections: aiResult.sections || [],
      seo: aiResult.seo || {},
      style: aiResult.style || 'modern'
    };
  };

  const generateFromScreenshot = async () => {
    setGeneratingStatus('📸 Analisi screenshot con GPT-4 Vision...');
    
    // Convert to base64
    const reader = new FileReader();
    const base64Promise = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(screenshot);
    });
    const base64Image = await base64Promise;

    const aiResult = await analyzeScreenshot(base64Image);

    return {
      title: aiResult.title || 'Landing Page da Screenshot',
      sections: aiResult.sections || [],
      seo: aiResult.seo || {},
      style: aiResult.style || 'modern'
    };
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      // Generate based on mode
      let result;
      if (mode === 'form') {
        result = await generateFromForm();
      } else if (mode === 'url') {
        result = await generateFromURL();
      } else if (mode === 'screenshot') {
        result = await generateFromScreenshot();
      }

      setGeneratingStatus('✍️ Creazione sezioni e contenuti...');

      // Generate unique slug
      const baseSlug = mode === 'form' 
        ? formData.businessType 
        : mode === 'url' 
          ? 'url-analysis' 
          : 'screenshot-analysis';
      
      const slug = baseSlug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now();

      setGeneratingStatus('💾 Salvataggio landing page...');

      // Aggiungi ID unici alle sezioni se mancanti
      const sectionsWithIds = (result.sections || []).map((section, idx) => ({
        ...section,
        id: section.id || `section-${Date.now()}-${idx}`,
        props: section.props || {}
      }));

      // Create landing page
      const landingPageData = {
        title: result.title,
        slug,
        status: 'draft',
        aiGenerated: true,
        aiMode: mode,
        sections: sectionsWithIds,
        seo: result.seo,
        style: result.style,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      };

      console.log('📝 Salvando landing page:', {
        title: landingPageData.title,
        slug: landingPageData.slug,
        mode: mode,
        sectionsCount: landingPageData.sections?.length
      });

      const docRef = await addDoc(
        getTenantCollection(db, 'landingPages'),
        landingPageData
      );

      console.log('✅ Landing page salvata:', docRef.id, docRef.path);
      setGeneratingStatus('✅ Completato! Reindirizzamento...');

      await new Promise(resolve => setTimeout(resolve, 800));

      // Navigate to editor
      navigate(`/landing-pages/${docRef.id}/edit`);

    } catch (error) {
      console.error('Errore generazione:', error);
      alert('Errore durante la generazione: ' + error.message);
    } finally {
      setGenerating(false);
      setGeneratingStatus('');
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      <div className="w-full max-w-[100vw] py-2 sm:py-4 space-y-2 sm:space-y-4 mobile-safe-bottom overflow-x-hidden">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-3 sm:p-5 shadow-glow mx-2 sm:mx-4"
        >
          <button
            onClick={() => navigate('/landing-pages')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-3 transition-colors text-sm"
          >
            <ArrowLeft size={18} />
            Torna alle Landing Pages
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="text-purple-400" size={28} />
            Crea Landing Page
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Scegli come vuoi creare la tua landing page
          </p>
        </motion.div>

        {/* Mode Selection */}
        <div className="mx-2 sm:mx-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('form')}
              className={`p-4 sm:p-6 rounded-xl border-2 transition-all ${
                mode === 'form'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
              }`}
            >
              <FileText className={mode === 'form' ? 'text-purple-400' : 'text-slate-400'} size={32} />
              <h3 className="text-white font-semibold mt-3 mb-1">📝 Da Form</h3>
              <p className="text-sm text-slate-400">
                Descrivi il tuo business e lascia l'AI fare il resto
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('url')}
              className={`p-4 sm:p-6 rounded-xl border-2 transition-all ${
                mode === 'url'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
              }`}
            >
              <LinkIcon className={mode === 'url' ? 'text-blue-400' : 'text-slate-400'} size={32} />
              <h3 className="text-white font-semibold mt-3 mb-1">🔗 Da URL</h3>
              <p className="text-sm text-slate-400">
                Analizza un competitor e crea qualcosa di simile
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('screenshot')}
              className={`p-4 sm:p-6 rounded-xl border-2 transition-all ${
                mode === 'screenshot'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
              }`}
            >
              <Image className={mode === 'screenshot' ? 'text-green-400' : 'text-slate-400'} size={32} />
              <h3 className="text-white font-semibold mt-3 mb-1">📸 Da Screenshot</h3>
              <p className="text-sm text-slate-400">
                Carica un'immagine e l'AI la ricreerà
              </p>
            </motion.button>
          </div>

          {/* Form */}
          <motion.form
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleGenerate}
            className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-4 sm:p-6 shadow-glow space-y-4"
          >
            {mode === 'form' && (
              <>
                <div>
                  <label className="block text-white font-medium mb-2">
                    Tipo di Business *
                  </label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    placeholder="es. Palestra CrossFit, Personal Trainer, Studio Yoga..."
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Target Audience *
                  </label>
                  <input
                    type="text"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    placeholder="es. atleti principianti 25-40 anni, donne over 40..."
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Obiettivo *
                  </label>
                  <select
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="lead-generation">Generazione Lead (contatti)</option>
                    <option value="sales">Vendita Diretta</option>
                    <option value="information">Informazione/Awareness</option>
                    <option value="event">Iscrizione Evento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Stile Visivo *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'modern', label: 'Moderno', emoji: '✨' },
                      { value: 'minimal', label: 'Minimale', emoji: '⚪' },
                      { value: 'energetic', label: 'Energico', emoji: '⚡' },
                      { value: 'professional', label: 'Professionale', emoji: '💼' }
                    ].map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, style: style.value })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.style === style.value
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-2xl mb-1">{style.emoji}</div>
                        <div className="text-sm text-white font-medium">{style.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Informazioni Aggiuntive (opzionale)
                  </label>
                  <textarea
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    placeholder="Aggiungi qualsiasi dettaglio che possa aiutare l'AI..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              </>
            )}

            {mode === 'url' && (
              <div>
                <label className="block text-white font-medium mb-2">
                  URL Competitor *
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://esempio.com/landing-page"
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-sm text-slate-400 mt-2">
                  L'AI analizzerà la pagina e creerà una versione simile ma originale
                </p>
              </div>
            )}

            {mode === 'screenshot' && (
              <div>
                <label className="block text-white font-medium mb-2">
                  Carica Screenshot *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
                {screenshotPreview && (
                  <div className="mt-4">
                    <img 
                      src={screenshotPreview} 
                      alt="Preview" 
                      className="w-full max-h-64 object-contain rounded-lg border border-slate-700"
                    />
                  </div>
                )}
                <p className="text-sm text-slate-400 mt-2">
                  GPT-4 Vision analizzerà l'immagine e ricreerà la struttura
                </p>
              </div>
            )}

            {/* Status Message */}
            {generating && generatingStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-purple-400" size={20} />
                  <p className="text-purple-300 font-medium">{generatingStatus}</p>
                </div>
              </motion.div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/landing-pages')}
                disabled={generating}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={generating || (mode === 'form' && (!formData.businessType || !formData.target))}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    Genera con AI
                  </>
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
