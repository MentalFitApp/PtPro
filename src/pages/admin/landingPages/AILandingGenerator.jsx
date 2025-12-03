// src/pages/admin/landingPages/AILandingGenerator.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { getTenantCollection } from '../../../config/tenant';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowLeft, Wand2, Loader2, CheckCircle
} from 'lucide-react';
import { generateLandingPage } from '../../../services/openai';

export default function AILandingGenerator() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [formData, setFormData] = useState({
    businessType: '',
    target: '',
    goal: 'lead-generation',
    style: 'modern',
    additionalInfo: ''
  });

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      // 🚀 CHIAMATA API OPENAI REALE
      setGeneratingStatus('🤖 Contatto OpenAI GPT-4o-mini...');
      console.log('🤖 Generazione AI con OpenAI GPT-4o-mini...');
      
      const aiResult = await generateLandingPage({
        businessType: formData.businessType,
        targetAudience: formData.target,
        goal: formData.goal,
        style: formData.style,
        additionalInfo: formData.additionalInfo
      });

      console.log('✅ AI Result:', aiResult);
      setGeneratingStatus('✍️ Creazione sezioni e contenuti...');

      // Genera slug unico
      const slug = formData.businessType
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now();

      setGeneratingStatus('💾 Salvataggio landing page...');

      // Aggiungi ID unici alle sezioni
      const sectionsToSave = (aiResult.sections || generateDefaultSections(formData)).map((section, idx) => ({
        ...section,
        id: section.id || `section-${Date.now()}-${idx}`,
        props: section.props || {}
      }));

      // Crea landing page con contenuto AI generato
      const landingPageData = {
        title: aiResult.title || `Landing Page - ${formData.businessType}`,
        slug,
        status: 'draft',
        aiGenerated: true,
        aiPrompt: `Business: ${formData.businessType}, Target: ${formData.target}, Goal: ${formData.goal}`,
        sections: sectionsToSave,
        seo: {
          metaTitle: aiResult.seo?.metaTitle || formData.businessType,
          metaDescription: aiResult.seo?.metaDescription || `Scopri ${formData.businessType} - ${formData.target}`,
          ogImage: ''
        },
        style: aiResult.style || formData.style,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      };

      console.log('📝 Dati da salvare:', {
        title: landingPageData.title,
        slug: landingPageData.slug,
        status: landingPageData.status,
        sectionsCount: landingPageData.sections?.length
      });

      const docRef = await addDoc(
        getTenantCollection(db, 'landingPages'),
        landingPageData
      );

      console.log('✅ Landing page salvata con ID:', docRef.id);
      console.log('✅ Path Firestore:', docRef.path);
      setGeneratingStatus('✅ Completato! Reindirizzamento...');

      // Delay per mostrare il messaggio di successo
      await new Promise(resolve => setTimeout(resolve, 800));

      // Naviga all'editor
      navigate(`/landing-pages/${docRef.id}/edit`);

    } catch (error) {
      console.error('Errore generazione AI:', error);
      alert('Errore durante la generazione della landing page');
    } finally {
      setGenerating(false);
    }
  };

  const generateDefaultSections = (data) => {
    // Genera sezioni di default basate sugli input
    return [
      {
        type: 'hero',
        props: {
          title: `Scopri ${data.businessType}`,
          subtitle: data.target,
          ctaText: data.goal === 'sales' ? 'Acquista Ora' : 'Scopri di Più',
          ctaLink: '#contact',
          backgroundImage: '',
          style: data.style
        }
      },
      {
        type: 'features',
        props: {
          title: 'Caratteristiche Principali',
          items: [
            { icon: '⚡', title: 'Veloce', description: 'Risultati immediati' },
            { icon: '💪', title: 'Efficace', description: 'Metodi comprovati' },
            { icon: '🎯', title: 'Personalizzato', description: 'Su misura per te' }
          ]
        }
      },
      {
        type: 'cta',
        props: {
          title: data.goal === 'sales' ? 'Pronto per iniziare?' : 'Richiedi maggiori informazioni',
          buttonText: data.goal === 'sales' ? 'Acquista Ora' : 'Contattaci',
          buttonLink: '#contact'
        }
      }
    ];
  };

  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      <div className="w-full max-w-[100vw] py-2 sm:py-4 space-y-2 sm:space-y-4 mobile-safe-bottom overflow-x-hidden">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-3 sm:p-5 shadow-xl mx-2 sm:mx-4"
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
            Generatore AI Landing Page
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Lascia che l'intelligenza artificiale crei la tua landing page perfetta
          </p>
        </motion.div>

        {/* Form */}
        <div className="mx-2 sm:mx-4">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleGenerate}
            className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-4 sm:p-6 shadow-xl space-y-5"
          >
          {/* Business Type */}
          <div>
            <label className="block text-white font-medium mb-2">
              Tipo di Business *
            </label>
            <input
              type="text"
              required
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              placeholder="es. Palestra, Nutrizionista, Personal Trainer"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Target */}
          <div>
            <label className="block text-white font-medium mb-2">
              Target di Riferimento *
            </label>
            <input
              type="text"
              required
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              placeholder="es. Donne 30-50 anni che vogliono dimagrire"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-white font-medium mb-2">
              Obiettivo della Pagina *
            </label>
            <select
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="lead-generation">Generazione Lead (contatti)</option>
              <option value="sales">Vendita Diretta</option>
              <option value="information">Informazione/Awareness</option>
              <option value="event">Iscrizione Evento</option>
            </select>
          </div>

          {/* Style */}
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
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{style.emoji}</div>
                  <div className="text-sm text-white font-medium">{style.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-white font-medium mb-2">
              Informazioni Aggiuntive (opzionale)
            </label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Aggiungi qualsiasi dettaglio che possa aiutare l'AI a creare una pagina migliore..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

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
              disabled={generating || !formData.businessType || !formData.target}
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

          {/* Info Box */}
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm rounded-xl p-4">
            <div className="flex gap-3">
              <Sparkles className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Come funziona?</p>
                <p className="text-blue-400">
                  L'AI analizzerà le tue informazioni e genererà automaticamente una landing page 
                  completa con sezioni, testi e layout ottimizzati. Potrai poi personalizzarla 
                  ulteriormente nell'editor visuale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
