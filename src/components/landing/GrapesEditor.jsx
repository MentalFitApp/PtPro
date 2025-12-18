import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsPluginForms from 'grapesjs-plugin-forms';
import gjsStyleBg from 'grapesjs-style-bg';
import AIGeneratorModal from './AIGeneratorModal';
import AIWizardModal from './AIWizardModal';
import AIAssistantPanel from './AIAssistantPanel';
import LandingPageLeads from './LandingPageLeads';
import { 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Code, 
  Smartphone, 
  Monitor, 
  Tablet,
  ArrowLeft,
  Globe,
  Sparkles,
  Settings,
  Layers,
  Paintbrush,
  LayoutGrid,
  Bot,
  Users,
  ChevronLeft,
  Wand2,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  X,
  Link2,
  AlertCircle,
  Info,
} from 'lucide-react';

// Plugin per blocchi fitness personalizzati
const fitnessBlocksPlugin = (editor) => {
  const blockManager = editor.BlockManager;
  
  // Categoria Fitness
  blockManager.add('fitness-hero', {
    label: '💪 Hero Fitness',
    category: 'Fitness',
    content: `
      <section class="relative min-h-[600px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920')] bg-cover bg-center opacity-30"></div>
        <div class="relative z-10 container mx-auto px-6 py-24 flex flex-col items-center text-center">
          <h1 class="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Trasforma il Tuo <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">Corpo</span>
          </h1>
          <p class="text-xl text-slate-300 max-w-2xl mb-10">
            Allenamenti personalizzati, nutrizione su misura e supporto costante per raggiungere i tuoi obiettivi.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <a href="#" class="px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-sky-500/30 transition-all">
              Inizia Ora
            </a>
            <a href="#" class="px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all">
              Scopri di Più
            </a>
          </div>
        </div>
      </section>
    `,
    attributes: { class: 'gjs-block-section' }
  });

  blockManager.add('fitness-services', {
    label: '🎯 Servizi',
    category: 'Fitness',
    content: `
      <section class="py-20 bg-slate-900">
        <div class="container mx-auto px-6">
          <h2 class="text-4xl font-bold text-white text-center mb-4">I Miei Servizi</h2>
          <p class="text-slate-400 text-center max-w-2xl mx-auto mb-16">Soluzioni complete per ogni tuo obiettivo fitness</p>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700/50 hover:border-sky-500/50 transition-all group">
              <div class="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span class="text-3xl">🏋️</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-3">Personal Training</h3>
              <p class="text-slate-400">Sessioni 1-to-1 personalizzate per massimizzare i tuoi risultati.</p>
            </div>
            <div class="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700/50 hover:border-emerald-500/50 transition-all group">
              <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span class="text-3xl">🥗</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-3">Piano Nutrizionale</h3>
              <p class="text-slate-400">Alimentazione su misura per supportare i tuoi allenamenti.</p>
            </div>
            <div class="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/50 transition-all group">
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span class="text-3xl">📱</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-3">Coaching Online</h3>
              <p class="text-slate-400">Supporto costante ovunque tu sia, tramite app dedicata.</p>
            </div>
          </div>
        </div>
      </section>
    `,
    attributes: { class: 'gjs-block-section' }
  });

  blockManager.add('fitness-pricing', {
    label: '💰 Prezzi',
    category: 'Fitness',
    content: `
      <section class="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div class="container mx-auto px-6">
          <h2 class="text-4xl font-bold text-white text-center mb-4">Piani e Prezzi</h2>
          <p class="text-slate-400 text-center max-w-2xl mx-auto mb-16">Scegli il piano più adatto alle tue esigenze</p>
          <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div class="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
              <h3 class="text-lg font-semibold text-slate-400 mb-2">Base</h3>
              <div class="text-4xl font-black text-white mb-6">€49<span class="text-lg text-slate-400">/mese</span></div>
              <ul class="space-y-3 mb-8">
                <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-2">✓</span> Scheda allenamento</li>
                <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-2">✓</span> Supporto chat</li>
                <li class="flex items-center text-slate-500"><span class="text-slate-600 mr-2">✗</span> Video chiamate</li>
              </ul>
              <a href="#" class="block w-full py-3 text-center bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Scegli Base</a>
            </div>
            <div class="bg-gradient-to-b from-sky-500/20 to-cyan-500/20 rounded-2xl p-8 border-2 border-sky-500/50 relative">
              <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full text-sm font-bold text-white">Popolare</div>
              <h3 class="text-lg font-semibold text-sky-400 mb-2">Pro</h3>
              <div class="text-4xl font-black text-white mb-6">€99<span class="text-lg text-slate-400">/mese</span></div>
              <ul class="space-y-3 mb-8">
                <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-2">✓</span> Scheda allenamento</li>
                <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-2">✓</span> Piano alimentare</li>
                <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-2">✓</span> 2 videocall/mese</li>
              </ul>
              <a href="#" class="block w-full py-3 text-center bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all">Scegli Pro</a>
            </div>
            <div class="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
              <h3 class="text-lg font-semibold text-slate-400 mb-2">Premium</h3>
              <div class="text-4xl font-black text-white mb-6">€199<span class="text-lg text-slate-400">/mese</span></div>
              <ul class="space-y-3 mb-8">
                <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-2">✓</span> Tutto di Pro</li>
                <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-2">✓</span> Sessioni illimitate</li>
                <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-2">✓</span> Priorità massima</li>
              </ul>
              <a href="#" class="block w-full py-3 text-center bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Scegli Premium</a>
            </div>
          </div>
        </div>
      </section>
    `,
    attributes: { class: 'gjs-block-section' }
  });

  blockManager.add('fitness-testimonials', {
    label: '⭐ Testimonianze',
    category: 'Fitness',
    content: `
      <section class="py-20 bg-slate-900">
        <div class="container mx-auto px-6">
          <h2 class="text-4xl font-bold text-white text-center mb-16">Cosa Dicono i Clienti</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
              <div class="flex items-center gap-4 mb-6">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Cliente" class="w-14 h-14 rounded-full object-cover">
                <div>
                  <h4 class="font-bold text-white">Maria R.</h4>
                  <p class="text-sm text-slate-400">Cliente da 6 mesi</p>
                </div>
              </div>
              <p class="text-slate-300 italic">"Ho perso 12kg in 4 mesi! Il supporto costante fa davvero la differenza."</p>
              <div class="flex gap-1 mt-4 text-yellow-400">⭐⭐⭐⭐⭐</div>
            </div>
            <div class="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
              <div class="flex items-center gap-4 mb-6">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Cliente" class="w-14 h-14 rounded-full object-cover">
                <div>
                  <h4 class="font-bold text-white">Luca M.</h4>
                  <p class="text-sm text-slate-400">Cliente da 1 anno</p>
                </div>
              </div>
              <p class="text-slate-300 italic">"Finalmente ho raggiunto i miei obiettivi di massa muscolare. Professionalità top!"</p>
              <div class="flex gap-1 mt-4 text-yellow-400">⭐⭐⭐⭐⭐</div>
            </div>
            <div class="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
              <div class="flex items-center gap-4 mb-6">
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Cliente" class="w-14 h-14 rounded-full object-cover">
                <div>
                  <h4 class="font-bold text-white">Sara B.</h4>
                  <p class="text-sm text-slate-400">Cliente da 3 mesi</p>
                </div>
              </div>
              <p class="text-slate-300 italic">"L'app è comodissima e gli allenamenti sono perfetti per i miei impegni."</p>
              <div class="flex gap-1 mt-4 text-yellow-400">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>
      </section>
    `,
    attributes: { class: 'gjs-block-section' }
  });

  blockManager.add('fitness-cta', {
    label: '🚀 Call to Action',
    category: 'Fitness',
    content: `
      <section class="py-20 bg-gradient-to-r from-sky-600 to-cyan-500 relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10"></div>
        <div class="container mx-auto px-6 text-center relative z-10">
          <h2 class="text-4xl md:text-5xl font-black text-white mb-6">Pronto a Iniziare?</h2>
          <p class="text-xl text-white/90 max-w-2xl mx-auto mb-10">
            Prenota la tua consulenza gratuita e scopri come posso aiutarti a raggiungere i tuoi obiettivi.
          </p>
          <a href="#" class="inline-block px-10 py-5 bg-white text-sky-600 font-bold text-lg rounded-xl hover:shadow-2xl hover:scale-105 transition-all">
            Prenota Consulenza Gratuita
          </a>
        </div>
      </section>
    `,
    attributes: { class: 'gjs-block-section' }
  });

  blockManager.add('fitness-contact-form', {
    label: '📝 Form Contatto',
    category: 'Fitness',
    content: `
      <section class="py-20 bg-slate-900">
        <div class="container mx-auto px-6 max-w-2xl">
          <h2 class="text-4xl font-bold text-white text-center mb-4">Contattami</h2>
          <p class="text-slate-400 text-center mb-12">Compila il form e ti risponderò entro 24 ore</p>
          <form class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                <input type="text" placeholder="Il tuo nome" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input type="email" placeholder="La tua email" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Telefono</label>
              <input type="tel" placeholder="Il tuo numero" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Obiettivo</label>
              <select class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all">
                <option value="">Seleziona il tuo obiettivo</option>
                <option value="dimagrimento">Dimagrimento</option>
                <option value="massa">Aumento massa muscolare</option>
                <option value="tonificazione">Tonificazione</option>
                <option value="sport">Preparazione sportiva</option>
                <option value="salute">Miglioramento salute</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Messaggio</label>
              <textarea rows="4" placeholder="Raccontami i tuoi obiettivi..." class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all resize-none"></textarea>
            </div>
            <button type="submit" class="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all">
              Invia Richiesta
            </button>
          </form>
        </div>
      </section>
    `,
    attributes: { class: 'gjs-block-section' }
  });

  blockManager.add('fitness-stats', {
    label: '📊 Statistiche',
    category: 'Fitness',
    content: `
      <section class="py-16 bg-slate-800/50">
        <div class="container mx-auto px-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 mb-2">500+</div>
              <p class="text-slate-400">Clienti Soddisfatti</p>
            </div>
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 mb-2">10+</div>
              <p class="text-slate-400">Anni Esperienza</p>
            </div>
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 mb-2">50k</div>
              <p class="text-slate-400">Kg Persi dai Clienti</p>
            </div>
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 mb-2">98%</div>
              <p class="text-slate-400">Tasso Soddisfazione</p>
            </div>
          </div>
        </div>
      </section>
    `,
    attributes: { class: 'gjs-block-section' }
  });

  blockManager.add('fitness-about', {
    label: '👤 Chi Sono',
    category: 'Fitness',
    content: `
      <section class="py-20 bg-slate-900">
        <div class="container mx-auto px-6">
          <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="relative">
              <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600" alt="Personal Trainer" class="rounded-2xl shadow-2xl">
              <div class="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-sky-500 to-cyan-400 rounded-2xl flex items-center justify-center">
                <span class="text-white font-bold text-center text-sm">10+ anni<br>esperienza</span>
              </div>
            </div>
            <div>
              <h2 class="text-4xl font-bold text-white mb-6">Ciao, sono [Nome]</h2>
              <p class="text-slate-300 text-lg leading-relaxed mb-6">
                Personal trainer certificato con oltre 10 anni di esperienza. La mia missione è aiutarti a raggiungere i tuoi obiettivi attraverso un approccio personalizzato e scientifico.
              </p>
              <ul class="space-y-3 mb-8">
                <li class="flex items-center text-slate-300">
                  <span class="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center mr-3 text-sky-400">✓</span>
                  Certificazione ISSA Personal Trainer
                </li>
                <li class="flex items-center text-slate-300">
                  <span class="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center mr-3 text-sky-400">✓</span>
                  Laurea in Scienze Motorie
                </li>
                <li class="flex items-center text-slate-300">
                  <span class="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center mr-3 text-sky-400">✓</span>
                  Specializzazione Nutrizione Sportiva
                </li>
              </ul>
              <a href="#" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all">
                Scopri la mia storia →
              </a>
            </div>
          </div>
        </div>
      </section>
    `,
    attributes: { class: 'gjs-block-section' }
  });

  blockManager.add('fitness-faq', {
    label: '❓ FAQ',
    category: 'Fitness',
    content: `
      <section class="py-20 bg-slate-900">
        <div class="container mx-auto px-6 max-w-3xl">
          <h2 class="text-4xl font-bold text-white text-center mb-16">Domande Frequenti</h2>
          <div class="space-y-4">
            <details class="bg-slate-800/50 rounded-xl border border-slate-700/50 group">
              <summary class="px-6 py-4 cursor-pointer text-white font-semibold flex items-center justify-between">
                Quanto dura una sessione di allenamento?
                <span class="text-sky-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p class="px-6 pb-4 text-slate-400">Le sessioni durano circa 60 minuti, incluso riscaldamento e defaticamento. Per il coaching online, la durata può variare in base alle tue esigenze.</p>
            </details>
            <details class="bg-slate-800/50 rounded-xl border border-slate-700/50 group">
              <summary class="px-6 py-4 cursor-pointer text-white font-semibold flex items-center justify-between">
                Posso allenarmi anche a casa?
                <span class="text-sky-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p class="px-6 pb-4 text-slate-400">Assolutamente sì! Con il piano di coaching online riceverai schede personalizzate per allenarti dove preferisci, con o senza attrezzatura.</p>
            </details>
            <details class="bg-slate-800/50 rounded-xl border border-slate-700/50 group">
              <summary class="px-6 py-4 cursor-pointer text-white font-semibold flex items-center justify-between">
                Come funziona la prima consulenza?
                <span class="text-sky-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p class="px-6 pb-4 text-slate-400">La prima consulenza è gratuita e dura circa 30 minuti. Parleremo dei tuoi obiettivi, valuteremo la tua situazione attuale e ti proporrò il percorso più adatto.</p>
            </details>
          </div>
        </div>
      </section>
    `,
    attributes: { class: 'gjs-block-section' }
  });
};

// Stili custom per GrapesJS theme dark
const customStyles = `
  .gjs-one-bg {
    background-color: #1e293b !important;
  }
  .gjs-two-color {
    color: #94a3b8 !important;
  }
  .gjs-three-bg {
    background-color: #334155 !important;
  }
  .gjs-four-color, .gjs-four-color-h:hover {
    color: #0ea5e9 !important;
  }
  .gjs-pn-btn {
    border-radius: 8px !important;
  }
  .gjs-pn-btn:hover {
    background-color: #475569 !important;
  }
  .gjs-pn-active {
    background-color: #0ea5e9 !important;
    color: white !important;
  }
  .gjs-block {
    background-color: #334155 !important;
    border-radius: 8px !important;
    border: 1px solid #475569 !important;
    padding: 10px !important;
  }
  .gjs-block:hover {
    border-color: #0ea5e9 !important;
  }
  .gjs-block__media {
    color: #94a3b8 !important;
  }
  .gjs-category-title {
    background-color: #1e293b !important;
    border-bottom: 1px solid #334155 !important;
  }
  .gjs-sm-sector-title {
    background-color: #1e293b !important;
    border-bottom: 1px solid #334155 !important;
  }
  .gjs-clm-tags {
    background-color: #334155 !important;
    border-radius: 8px !important;
  }
  .gjs-sm-property {
    background-color: transparent !important;
  }
  .gjs-field {
    background-color: #1e293b !important;
    border: 1px solid #475569 !important;
    border-radius: 6px !important;
  }
  .gjs-field:focus-within {
    border-color: #0ea5e9 !important;
  }
  .gjs-input {
    color: white !important;
  }
  .gjs-cv-canvas {
    background-color: #0f172a !important;
  }
  .gjs-frame-wrapper {
    background-color: #1e293b !important;
  }
  .gjs-toolbar {
    background-color: #1e293b !important;
    border-radius: 8px !important;
  }
  .gjs-toolbar-item {
    color: #94a3b8 !important;
  }
  .gjs-resizer-c {
    background-color: #0ea5e9 !important;
  }
  .gjs-highlighter {
    outline: 2px solid #0ea5e9 !important;
  }
  .gjs-badge {
    background-color: #0ea5e9 !important;
  }
  /* Custom scrollbar */
  .gjs-pn-views-container::-webkit-scrollbar,
  .gjs-blocks-c::-webkit-scrollbar {
    width: 8px;
  }
  .gjs-pn-views-container::-webkit-scrollbar-track,
  .gjs-blocks-c::-webkit-scrollbar-track {
    background: #1e293b;
  }
  .gjs-pn-views-container::-webkit-scrollbar-thumb,
  .gjs-blocks-c::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 4px;
  }
`;

const GrapesEditor = ({ 
  initialContent = '', 
  onSave, 
  onPublish,
  onUpdateSettings,
  page,
  pageTitle = 'Landing Page',
  isPublished = false,
  onBack,
  tenantId,
  pageId,
}) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [deviceMode, setDeviceMode] = useState('Desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activePanel, setActivePanel] = useState('blocks'); // blocks, layers, styles
  
  // Sidebar collapsata di default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Modals
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLeads, setShowLeads] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    // Inject custom styles
    const styleEl = document.createElement('style');
    styleEl.innerHTML = customStyles;
    document.head.appendChild(styleEl);

    const gjsEditor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: 'auto',
      storageManager: false,
      plugins: [
        gjsPresetWebpage,
        gjsBlocksBasic,
        gjsPluginForms,
        gjsStyleBg,
        fitnessBlocksPlugin,
      ],
      pluginsOpts: {
        [gjsPresetWebpage]: {
          blocksBasicOpts: {
            flexGrid: true,
          },
          navbarOpts: false,
          countdownOpts: false,
        },
        [gjsBlocksBasic]: {
          flexGrid: true,
        },
        [gjsPluginForms]: {
          blocks: ['form', 'input', 'textarea', 'select', 'button', 'label', 'checkbox', 'radio'],
        },
      },
      canvas: {
        styles: [
          'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
        ],
      },
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '375px', widthMedia: '480px' },
        ],
      },
      panels: {
        defaults: [],
      },
      blockManager: {
        appendTo: '#blocks-container',
      },
      layerManager: {
        appendTo: '#layers-container',
      },
      styleManager: {
        appendTo: '#styles-container',
        sectors: [
          {
            name: 'Dimensioni',
            open: true,
            properties: ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'padding', 'margin'],
          },
          {
            name: 'Tipografia',
            open: false,
            properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-shadow'],
          },
          {
            name: 'Background',
            open: false,
            properties: ['background-color', 'background-image', 'background-repeat', 'background-position', 'background-size', 'background-attachment'],
          },
          {
            name: 'Bordi',
            open: false,
            properties: ['border', 'border-radius', 'box-shadow'],
          },
          {
            name: 'Layout',
            open: false,
            properties: ['display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'gap', 'position', 'top', 'right', 'bottom', 'left', 'z-index'],
          },
          {
            name: 'Extra',
            open: false,
            properties: ['opacity', 'overflow', 'cursor', 'transition'],
          },
        ],
      },
      selectorManager: {
        appendTo: '#selectors-container',
      },
    });

    // Load initial content
    if (initialContent) {
      gjsEditor.setComponents(initialContent);
    }

    // Track changes
    gjsEditor.on('component:update', () => setHasChanges(true));
    gjsEditor.on('component:add', () => setHasChanges(true));
    gjsEditor.on('component:remove', () => setHasChanges(true));
    gjsEditor.on('style:change', () => setHasChanges(true));

    editorRef.current = gjsEditor;
    setEditor(gjsEditor);

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      styleEl.remove();
    };
  }, []);

  // Update content when initialContent changes
  useEffect(() => {
    if (editor && initialContent) {
      editor.setComponents(initialContent);
      setHasChanges(false);
    }
  }, [initialContent, editor]);

  const handleDeviceChange = (device) => {
    if (editor) {
      editor.setDevice(device);
      setDeviceMode(device);
    }
  };

  const handleUndo = () => {
    if (editor) editor.UndoManager.undo();
  };

  const handleRedo = () => {
    if (editor) editor.UndoManager.redo();
  };

  const handleSave = async (publish = false) => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const html = editor.getHtml();
      const css = editor.getCss();
      const components = editor.getComponents();
      
      const data = {
        html,
        css,
        components: JSON.stringify(components),
        fullHtml: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>${css}</style>
          </head>
          <body class="bg-slate-900">
            ${html}
          </body>
          </html>
        `,
      };

      if (publish && onPublish) {
        await onPublish(data);
      } else if (onSave) {
        await onSave(data);
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    
    const previewHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>${css}</style>
      </head>
      <body class="bg-slate-900">
        ${html}
      </body>
      </html>
    `;
    
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(previewHtml);
    previewWindow.document.close();
  };

  const handleViewCode = () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    
    console.log('=== HTML ===');
    console.log(html);
    console.log('=== CSS ===');
    console.log(css);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Top toolbar - Più chiara con etichette */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Indietro</span>
          </button>
          
          <div className="h-8 w-px bg-slate-700" />
          
          <div>
            <h1 className="text-white font-semibold">{pageTitle}</h1>
            <p className="text-xs text-slate-500">
              {isPublished ? '🟢 Pubblicata' : '🟡 Bozza'}
            </p>
          </div>
        </div>

        {/* Center - Device switcher con label */}
        <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
          <button
            onClick={() => handleDeviceChange('Desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-sm ${
              deviceMode === 'Desktop' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => handleDeviceChange('Tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-sm ${
              deviceMode === 'Tablet' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => handleDeviceChange('Mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-sm ${
              deviceMode === 'Mobile' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Right - Actions con etichette */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={handleUndo}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Annulla (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Ripeti (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
          
          {/* Leads */}
          {pageId && pageId !== 'new' && (
            <button
              onClick={() => setShowLeads(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">Leads</span>
            </button>
          )}
          
          {/* AI Wizard - Nuovo */}
          <button
            onClick={() => setShowAIWizard(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white rounded-lg transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            <span className="text-sm">Wizard AI</span>
          </button>
          
          {/* AI Generator - Legacy */}
          <button
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600/50 hover:bg-purple-500 text-white rounded-lg transition-colors"
            title="Generatore AI classico"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm hidden lg:inline">AI Quick</span>
          </button>
          
          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Impostazioni</span>
          </button>
          
          {/* Preview */}
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm">Anteprima</span>
          </button>
          
          {/* Save */}
          {hasChanges && (
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">Salva</span>
            </button>
          )}
          
          {/* Publish */}
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-sky-500/30 transition-all disabled:opacity-50"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm">Pubblica</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Panels - Sempre visibile */}
        <aside className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden flex-shrink-0">
          {/* Panel tabs */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActivePanel('blocks')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
                activePanel === 'blocks' 
                  ? 'text-sky-400 border-b-2 border-sky-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Blocchi
            </button>
            <button
              onClick={() => setActivePanel('layers')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
                activePanel === 'layers' 
                  ? 'text-sky-400 border-b-2 border-sky-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Layer
            </button>
            <button
              onClick={() => setActivePanel('styles')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
                activePanel === 'styles' 
                  ? 'text-sky-400 border-b-2 border-sky-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
              Stile
            </button>
          </div>

          {/* Panel contents */}
          <div className="flex-1 overflow-y-auto">
            <div 
              id="blocks-container" 
              className={activePanel === 'blocks' ? 'block p-2' : 'hidden'}
            />
            <div 
              id="layers-container" 
              className={activePanel === 'layers' ? 'block' : 'hidden'}
            />
            <div className={activePanel === 'styles' ? 'block' : 'hidden'}>
              <div id="selectors-container" className="p-2 border-b border-slate-700" />
              <div id="styles-container" />
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 overflow-hidden" />
      </div>
      
      {/* AI Wizard Modal - Nuovo wizard a step */}
      <AIWizardModal
        isOpen={showAIWizard}
        onClose={() => setShowAIWizard(false)}
        onGenerated={(result) => {
          if (result?.html && editor) {
            editor.setComponents(result.html);
            setHasChanges(true);
          }
          setShowAIWizard(false);
        }}
        tenantId={tenantId}
      />
      
      {/* AI Generator Modal - Legacy */}
      <AIGeneratorModal
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerated={(result) => {
          if (result?.html && editor) {
            editor.setComponents(result.html);
            setHasChanges(true);
          }
        }}
        tenantId={tenantId}
      />
      
      {/* AI Assistant Panel */}
      <AnimatePresence>
        {showAIAssistant && (
          <AIAssistantPanel
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            blocks={[]}
            selectedBlockId={null}
            onUpdateBlock={() => {}}
            onUpdateAllBlocks={(changes) => {
              // Per GrapesJS, l'AI può generare HTML
              if (changes?.html && editor) {
                editor.setComponents(changes.html);
                setHasChanges(true);
              }
            }}
            onAddBlock={() => {}}
            onDeleteBlock={() => {}}
            onReorderBlocks={() => {}}
            onReplaceAllBlocks={(newContent) => {
              if (newContent?.html && editor) {
                editor.setComponents(newContent.html);
                setHasChanges(true);
              }
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Leads Modal */}
      <LandingPageLeads
        isOpen={showLeads}
        onClose={() => setShowLeads(false)}
        pageId={pageId}
        tenantId={tenantId}
      />
      
      {/* Page Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <PageSettingsModal
            page={page}
            tenantId={tenantId}
            onSave={async (settings) => {
              if (onUpdateSettings) {
                await onUpdateSettings(settings);
              }
              setShowSettings(false);
            }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Modal per le impostazioni della pagina
const PageSettingsModal = ({ page, tenantId, onSave, onClose }) => {
  const [title, setTitle] = useState(page?.title || '');
  const [slug, setSlug] = useState(page?.slug || '');
  const [description, setDescription] = useState(page?.description || '');
  const [seoTitle, setSeoTitle] = useState(page?.settings?.seo?.title || '');
  const [seoDescription, setSeoDescription] = useState(page?.settings?.seo?.description || '');
  const [facebookPixel, setFacebookPixel] = useState(page?.settings?.tracking?.facebookPixel || '');
  const [googleAnalytics, setGoogleAnalytics] = useState(page?.settings?.tracking?.googleAnalytics || '');
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!page?.slug);

  // Genera slug automaticamente dal titolo
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      const autoSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(autoSlug);
    }
  }, [title, slugManuallyEdited]);

  const previewUrl = `${window.location.origin}/site/${tenantId}/${slug || 'your-page-slug'}`;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title,
        slug,
        description,
        settings: {
          ...page?.settings,
          seo: {
            title: seoTitle || title,
            description: seoDescription || description,
          },
          tracking: {
            facebookPixel,
            googleAnalytics,
          },
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Impostazioni Pagina</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'general', label: 'Generale', icon: '📝' },
            { id: 'seo', label: 'SEO', icon: '🔍' },
            { id: 'tracking', label: 'Tracking', icon: '📊' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id 
                  ? 'text-sky-400 border-b-2 border-sky-400 bg-slate-700/50' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'general' && (
            <>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Titolo</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es: Trasformazione Fisica in 90 Giorni"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Slug URL</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="trasformazione-fisica-90-giorni"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  {previewUrl}
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Descrizione</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Breve descrizione della landing page..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            </>
          )}

          {activeTab === 'seo' && (
            <>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || 'Titolo per i motori di ricerca'}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">{(seoTitle || title).length}/60 caratteri</p>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Meta Description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  placeholder="Descrizione per i motori di ricerca..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">{seoDescription.length}/160 caratteri</p>
              </div>
            </>
          )}

          {activeTab === 'tracking' && (
            <>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Facebook Pixel ID</label>
                <input
                  type="text"
                  value={facebookPixel}
                  onChange={(e) => setFacebookPixel(e.target.value)}
                  placeholder="123456789012345"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Google Analytics ID</label>
                <input
                  type="text"
                  value={googleAnalytics}
                  onChange={(e) => setGoogleAnalytics(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-sky-500/30 transition-all disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GrapesEditor;