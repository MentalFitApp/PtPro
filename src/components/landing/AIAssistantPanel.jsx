import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Image,
  Link2,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Copy,
  Palette,
  Type,
  Layout,
  Zap,
  Check,
  XCircle,
  Eye,
  Edit3,
  Shuffle,
  Target,
  MessageSquare,
  Star,
  Award,
} from 'lucide-react';
import { analyzeScreenshot, analyzeCompetitorURL, extractPDFText } from '../../services/openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * AIAssistantPanel - Assistente AI integrato nell'editor landing pages
 * Può analizzare immagini, URL, PDF e fare modifiche automatiche ai blocchi
 * POTENZIATO: Preview modifiche, conferma, azioni batch, delete, reorder
 */
export default function AIAssistantPanel({ 
  isOpen, 
  onClose, 
  blocks = [], 
  selectedBlockId = null,
  onUpdateBlock,
  onUpdateAllBlocks,
  onAddBlock,
  onDeleteBlock,
  onReorderBlocks,
  onReplaceAllBlocks,
}) {
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🤖 Ciao! Sono il tuo assistente AI per le landing pages.\n\nPosso modificare **direttamente** la tua pagina:\n\n• ✏️ Modificare testi, titoli, CTA\n• 🎨 Cambiare colori, gradienti, stili\n• 📦 Aggiungere/rimuovere blocchi\n• 🔄 Riordinare la struttura\n• 🖼️ Analizzare screenshot/competitor\n\n**Dimmi cosa vuoi fare e lo applico subito!**\n(Ti mostrerò un\'anteprima prima di confermare)',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Pending changes state - per conferma
  const [pendingAction, setPendingAction] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Attachments
  const [attachments, setAttachments] = useState([]); // { type: 'image'|'pdf'|'url', content, name }
  
  // Quick actions expanded
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  // Auto-apply mode
  const [autoApply, setAutoApply] = useState(false);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Aggiungi messaggio alla chat
  const addMessage = (role, content, extra = {}) => {
    setMessages(prev => [...prev, { role, content, timestamp: Date.now(), ...extra }]);
    setTimeout(scrollToBottom, 100);
  };

  // Handle file upload
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          type: 'image',
          content: reader.result,
          name: file.name,
        }]);
      };
      reader.readAsDataURL(file);
    } else if (type === 'pdf') {
      try {
        const text = await extractPDFText(file);
        setAttachments(prev => [...prev, {
          type: 'pdf',
          content: text,
          name: file.name,
        }]);
      } catch (err) {
        addMessage('assistant', `❌ Errore lettura PDF: ${err.message}`);
      }
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  // Handle URL input
  const handleAddUrl = () => {
    const url = prompt('Inserisci URL da analizzare:');
    if (url && url.startsWith('http')) {
      setAttachments(prev => [...prev, {
        type: 'url',
        content: url,
        name: url,
      }]);
    }
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Applica le modifiche pendenti
  const applyPendingAction = () => {
    if (!pendingAction) return;
    
    const { action, response } = pendingAction;
    
    try {
      switch (action) {
        case 'update_block':
          if (response.blockId && response.changes) {
            onUpdateBlock(response.blockId, response.changes);
            addMessage('assistant', `✅ Modifiche applicate al blocco!`);
          }
          break;
          
        case 'update_all':
          if (Array.isArray(response.changes)) {
            onUpdateAllBlocks(response.changes);
            addMessage('assistant', `✅ ${response.changes.length} blocchi modificati!`);
          }
          break;
          
        case 'add_block':
          if (response.newBlock) {
            onAddBlock(response.newBlock);
            addMessage('assistant', `✅ Nuovo blocco "${response.newBlock.type}" aggiunto!`);
          }
          break;
          
        case 'add_blocks':
          if (Array.isArray(response.newBlocks)) {
            response.newBlocks.forEach(block => onAddBlock(block));
            addMessage('assistant', `✅ ${response.newBlocks.length} nuovi blocchi aggiunti!`);
          }
          break;
          
        case 'delete_block':
          if (response.blockId && onDeleteBlock) {
            onDeleteBlock(response.blockId);
            addMessage('assistant', `✅ Blocco eliminato!`);
          }
          break;
          
        case 'delete_blocks':
          if (Array.isArray(response.blockIds) && onDeleteBlock) {
            response.blockIds.forEach(id => onDeleteBlock(id));
            addMessage('assistant', `✅ ${response.blockIds.length} blocchi eliminati!`);
          }
          break;
          
        case 'reorder':
          if (Array.isArray(response.newOrder) && onReorderBlocks) {
            onReorderBlocks(response.newOrder);
            addMessage('assistant', `✅ Blocchi riordinati!`);
          }
          break;
          
        case 'replace_all':
          if (Array.isArray(response.blocks) && onReplaceAllBlocks) {
            onReplaceAllBlocks(response.blocks);
            addMessage('assistant', `✅ Landing page completamente rigenerata con ${response.blocks.length} blocchi!`);
          }
          break;
      }
    } catch (err) {
      addMessage('assistant', `❌ Errore nell'applicare le modifiche: ${err.message}`);
    }
    
    setPendingAction(null);
    setShowPreview(false);
  };

  // Rifiuta le modifiche pendenti
  const rejectPendingAction = () => {
    addMessage('assistant', '❌ Modifiche annullate. Dimmi cosa vuoi cambiare.');
    setPendingAction(null);
    setShowPreview(false);
  };

  // Processa il messaggio con AI
  const handleSend = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Aggiungi messaggio utente
    if (userMessage) {
      addMessage('user', userMessage);
    }
    if (attachments.length > 0) {
      addMessage('user', `📎 ${attachments.length} allegati: ${attachments.map(a => a.name).join(', ')}`);
    }

    setIsProcessing(true);

    try {
      // Prepara contesto COMPLETO dei blocchi attuali
      const selectedBlock = blocks.find(b => b.id === selectedBlockId);
      const blocksContext = `BLOCCHI ATTUALI (${blocks.length} totali):
${blocks.map((b, i) => `[${i + 1}] ID: "${b.id}" | Tipo: ${b.type}
    Settings: ${JSON.stringify(b.settings, null, 2).split('\n').join('\n    ')}`).join('\n\n')}

${selectedBlock ? `\n⭐ BLOCCO SELEZIONATO: "${selectedBlock.id}" (${selectedBlock.type})` : '(Nessun blocco selezionato - modifica tutti)'}`;

      // Analizza allegati se presenti
      let attachmentAnalysis = '';
      for (const att of attachments) {
        if (att.type === 'image') {
          addMessage('assistant', '🔍 Analizzo immagine...');
          const base64 = att.content.split(',')[1];
          const analysis = await analyzeScreenshot(base64, { context: userMessage });
          attachmentAnalysis += `\n\nANALISI IMMAGINE "${att.name}":\n${JSON.stringify(analysis, null, 2)}`;
        } else if (att.type === 'url') {
          addMessage('assistant', '🔍 Analizzo URL...');
          try {
            const analysis = await analyzeCompetitorURL(att.content);
            attachmentAnalysis += `\n\nANALISI URL "${att.content}":\n${JSON.stringify(analysis, null, 2)}`;
          } catch (err) {
            attachmentAnalysis += `\n\nURL "${att.content}": impossibile analizzare`;
          }
        } else if (att.type === 'pdf') {
          attachmentAnalysis += `\n\nCONTENUTO PDF "${att.name}":\n${att.content}`;
        }
      }

      // Chiama OpenAI per elaborare la richiesta
      const response = await callAIAssistant(userMessage, blocksContext, attachmentAnalysis, blocks, selectedBlock);
      
      // Determina se serve conferma
      const actionNeedsConfirm = ['update_block', 'update_all', 'add_block', 'add_blocks', 'delete_block', 'delete_blocks', 'reorder', 'replace_all'].includes(response.action);
      
      if (actionNeedsConfirm && !autoApply) {
        // Mostra preview e chiedi conferma
        setPendingAction({ action: response.action, response });
        setShowPreview(true);
        
        // Genera descrizione delle modifiche
        const changesSummary = generateChangesSummary(response);
        addMessage('assistant', `📋 **Ecco cosa farò:**\n\n${changesSummary}\n\n${response.explanation || ''}\n\n👇 **Confermi le modifiche?**`, { 
          isPreview: true 
        });
      } else if (actionNeedsConfirm && autoApply) {
        // Auto-apply mode - applica direttamente
        setPendingAction({ action: response.action, response });
        applyPendingAction();
        addMessage('assistant', `✅ Modifiche applicate automaticamente!\n\n${response.explanation || ''}`);
      } else if (response.action === 'message') {
        addMessage('assistant', response.message || response.explanation || 'Come posso aiutarti?');
      } else {
        addMessage('assistant', response.message || 'Non ho capito cosa vuoi fare. Puoi essere più specifico?');
      }

      // Clear attachments dopo l'uso
      setAttachments([]);

    } catch (err) {
      console.error('AI Assistant error:', err);
      addMessage('assistant', `❌ Errore: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Genera un riassunto delle modifiche per la preview
  const generateChangesSummary = (response) => {
    switch (response.action) {
      case 'update_block':
        const changedProps = Object.keys(response.changes || {}).join(', ');
        return `• Modifico blocco \`${response.blockId}\`\n• Proprietà: ${changedProps}`;
        
      case 'update_all':
        if (!Array.isArray(response.changes)) return '• Modifiche multiple';
        return response.changes.map(c => 
          `• Blocco \`${c.blockId}\`: ${Object.keys(c.settings || {}).join(', ')}`
        ).join('\n');
        
      case 'add_block':
        return `• Aggiungo nuovo blocco: **${response.newBlock?.type}**\n• Titolo: "${response.newBlock?.settings?.title || 'N/A'}"`;
        
      case 'add_blocks':
        return response.newBlocks?.map(b => 
          `• Nuovo blocco **${b.type}**: "${b.settings?.title || 'N/A'}"`
        ).join('\n') || '• Nuovi blocchi';
        
      case 'delete_block':
        return `• ⚠️ Elimino blocco: \`${response.blockId}\``;
        
      case 'delete_blocks':
        return response.blockIds?.map(id => `• ⚠️ Elimino: \`${id}\``).join('\n') || '• Elimino blocchi';
        
      case 'reorder':
        return `• Riordino ${response.newOrder?.length || 0} blocchi`;
        
      case 'replace_all':
        return `• ⚠️ **Sostituisco TUTTA la landing page**\n• Nuovi blocchi: ${response.blocks?.length || 0}`;
        
      default:
        return '• Modifiche in corso...';
    }
  };

  // Quick actions - POTENZIATE
  const quickActions = [
    {
      icon: Wand2,
      label: 'Migliora tutto',
      action: () => setInputValue('Migliora tutti i testi della landing page: titoli più accattivanti, sottotitoli persuasivi, CTA più efficaci. Mantieni il tono professionale.'),
    },
    {
      icon: Palette,
      label: 'Cambia colori',
      action: () => setInputValue('Cambia la palette colori di tutta la landing page. Usa colori moderni e professionali che convertono bene. Aggiorna gradienti di hero, CTA e tutti i blocchi.'),
    },
    {
      icon: Target,
      label: 'CTA efficaci',
      action: () => setInputValue('Riscrivi tutti i pulsanti CTA per essere più persuasivi e action-oriented. Usa verbi forti e crea urgenza.'),
    },
    {
      icon: Layout,
      label: 'Riorganizza',
      action: () => setInputValue('Analizza la struttura della landing page e suggerisci un ordine migliore dei blocchi per massimizzare le conversioni.'),
    },
    {
      icon: Star,
      label: 'Aggiungi social proof',
      action: () => setInputValue('Aggiungi elementi di social proof: nuove testimonianze, badge di fiducia, numeri/statistiche. Genera contenuti realistici per un personal trainer.'),
    },
    {
      icon: MessageSquare,
      label: 'Aggiungi FAQ',
      action: () => setInputValue('Aggiungi un blocco FAQ con le 5 domande più comuni che i clienti fanno a un personal trainer. Risposte professionali e convincenti.'),
    },
    {
      icon: Award,
      label: 'Premium look',
      action: () => setInputValue('Trasforma la landing page in stile premium/luxury: gradienti eleganti, testi sofisticati, layout raffinato. Mantieni la struttura ma eleva il design.'),
    },
    {
      icon: Zap,
      label: 'Urgenza',
      action: () => setInputValue('Aggiungi elementi di urgenza e scarsità: badge "Posti limitati", countdown, offerta speciale. Modifica CTA per creare FOMO.'),
    },
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed right-0 top-0 h-full w-96 bg-slate-800 border-l border-slate-700 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
              <p className="text-xs text-slate-400">
                {selectedBlockId ? `Blocco selezionato` : `${blocks.length} blocchi`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Auto-apply toggle */}
        <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-2">
          <span className="text-xs text-slate-300 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Applica automaticamente
          </span>
          <button
            onClick={() => setAutoApply(!autoApply)}
            className={`w-10 h-5 rounded-full transition-colors relative ${autoApply ? 'bg-purple-500' : 'bg-slate-600'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoApply ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Confirm/Reject buttons when preview is active */}
      {showPreview && pendingAction && (
        <div className="p-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-slate-700 flex gap-2">
          <button
            onClick={applyPendingAction}
            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            Applica
          </button>
          <button
            onClick={rejectPendingAction}
            className="flex-1 py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Annulla
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-b border-slate-700">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-full p-3 flex items-center justify-between text-sm text-slate-300 hover:bg-slate-700/50"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Azioni Rapide
          </span>
          {showQuickActions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={action.action}
                    disabled={isProcessing}
                    className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <action.icon className="w-4 h-4 text-purple-400" />
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : msg.isPreview 
                    ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 text-slate-200'
                    : 'bg-slate-700 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-xl p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-sm text-slate-300">Elaboro la tua richiesta...</span>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-700">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-2 py-1 text-xs"
              >
                {att.type === 'image' && <Image className="w-3 h-3 text-blue-400" />}
                {att.type === 'url' && <Link2 className="w-3 h-3 text-green-400" />}
                {att.type === 'pdf' && <FileText className="w-3 h-3 text-orange-400" />}
                <span className="text-slate-300 max-w-[100px] truncate">{att.name}</span>
                <button onClick={() => removeAttachment(i)} className="text-slate-500 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700">
        {/* Attachment buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
            title="Aggiungi immagine"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={handleAddUrl}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
            title="Aggiungi URL"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => pdfInputRef.current?.click()}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
            title="Aggiungi PDF"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'image')}
          className="hidden"
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileUpload(e, 'pdf')}
          className="hidden"
        />

        {/* Text input */}
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Scrivi cosa vuoi modificare..."
            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={isProcessing || (!inputValue.trim() && attachments.length === 0)}
            className="px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Chiama OpenAI per elaborare la richiesta dell'utente
 * POTENZIATO: supporta tutte le azioni, prompt dettagliato
 */
async function callAIAssistant(userMessage, blocksContext, attachmentAnalysis, blocks, selectedBlock) {
  const systemPrompt = `Sei un assistente AI ESPERTO per la modifica di landing pages. Il tuo compito è modificare DIRETTAMENTE i blocchi della landing page.

══════════════════════════════════════════
TIPI DI BLOCCHI E TUTTE LE LORO PROPRIETÀ:
══════════════════════════════════════════

📌 HERO (sezione principale):
- title: string (titolo principale, max 60 caratteri)
- subtitle: string (sottotitolo, max 200 caratteri)
- ctaText: string (testo pulsante, max 30 caratteri)
- ctaLink: string (link pulsante, es: "#form")
- ctaAction: "scroll" | "redirect" | "whatsapp" | "calendly" | "phone" | "form_popup"
- variant: "centered" | "split" | "fullscreen" | "video"
- showBadge: boolean
- badgeText: string (es: "🔥 Offerta Limitata")
- backgroundGradient: string (es: "from-blue-600 to-cyan-500")
- showStats: boolean
- stats: array di { value: string, label: string }
- imageUrl: string (per variant split)

📌 FEATURES (caratteristiche):
- title: string
- subtitle: string
- items: array di { icon: string, title: string, description: string }
- variant: "grid" | "list" | "cards" | "icons"
- columns: 2 | 3 | 4

📌 TESTIMONIALS (testimonianze):
- title: string
- subtitle: string
- testimonials: array di { name: string, role: string, content: string, avatar: string, rating: number }
- variant: "cards" | "slider" | "grid"

📌 PRICING (prezzi):
- title: string
- subtitle: string
- plans: array di { name: string, price: string, period: string, features: string[], highlighted: boolean, ctaText: string }
- variant: "cards" | "table"

📌 CTA (call to action):
- title: string
- subtitle: string
- ctaText: string
- ctaAction: string
- backgroundGradient: string
- variant: "centered" | "banner" | "split"

📌 FAQ (domande frequenti):
- title: string
- faqs: array di { question: string, answer: string }
- variant: "accordion" | "grid"

📌 FORM (modulo contatto):
- title: string
- subtitle: string
- fields: "minimal" | "standard" | "full" | "custom"
- customFields: array di { name: string, label: string, type: string, required: boolean }
- submitText: string
- successMessage: string
- saveToLeads: boolean

📌 TEXT (testo libero):
- title: string
- content: string (HTML supportato)
- variant: "default" | "highlight"

📌 GALLERY (galleria):
- title: string
- images: array di { url: string, caption: string }
- variant: "grid" | "masonry" | "slider"

📌 VIDEO (video):
- title: string
- videoUrl: string (YouTube/Vimeo)
- autoplay: boolean

📌 COUNTDOWN (timer):
- title: string
- targetDate: string (ISO date)
- ctaText: string

📌 SOCIAL PROOF (badge fiducia):
- title: string
- items: array di { icon: string, value: string, label: string }
- logos: array di string (URL loghi)

══════════════════════════════════════════
GRADIENTI TAILWIND DISPONIBILI:
══════════════════════════════════════════
- "from-blue-600 to-cyan-500" (professionale)
- "from-purple-600 to-pink-500" (creativo)
- "from-emerald-600 to-teal-500" (fresco)
- "from-orange-500 to-red-500" (energico)
- "from-slate-800 to-slate-900" (elegante scuro)
- "from-amber-500 to-orange-500" (caldo)
- "from-rose-500 to-pink-500" (moderno)
- "from-indigo-600 to-purple-600" (tech)

══════════════════════════════════════════
AZIONI DISPONIBILI:
══════════════════════════════════════════

1️⃣ update_block - Modifica UN singolo blocco
{
  "action": "update_block",
  "blockId": "ID_DEL_BLOCCO",
  "changes": { "title": "Nuovo titolo", ... },
  "explanation": "Ho cambiato il titolo del hero"
}

2️⃣ update_all - Modifica PIÙ blocchi contemporaneamente
{
  "action": "update_all",
  "changes": [
    { "blockId": "hero-xxx", "settings": { "title": "..." } },
    { "blockId": "cta-xxx", "settings": { "ctaText": "..." } }
  ],
  "explanation": "Ho modificato 2 blocchi"
}

3️⃣ add_block - Aggiunge UN nuovo blocco
{
  "action": "add_block",
  "newBlock": {
    "type": "testimonials",
    "settings": { "title": "...", "testimonials": [...] }
  },
  "explanation": "Ho aggiunto testimonianze"
}

4️⃣ add_blocks - Aggiunge PIÙ blocchi
{
  "action": "add_blocks",
  "newBlocks": [
    { "type": "faq", "settings": {...} },
    { "type": "cta", "settings": {...} }
  ],
  "explanation": "Ho aggiunto FAQ e CTA"
}

5️⃣ delete_block - Elimina un blocco
{
  "action": "delete_block",
  "blockId": "ID_DA_ELIMINARE",
  "explanation": "Ho rimosso il blocco"
}

6️⃣ delete_blocks - Elimina più blocchi
{
  "action": "delete_blocks",
  "blockIds": ["id1", "id2"],
  "explanation": "Ho rimosso 2 blocchi"
}

7️⃣ reorder - Riordina i blocchi
{
  "action": "reorder",
  "newOrder": ["hero-xxx", "features-xxx", "testimonials-xxx", ...],
  "explanation": "Ho riordinato per ottimizzare il funnel"
}

8️⃣ replace_all - Rigenera TUTTA la landing (usa con cautela)
{
  "action": "replace_all",
  "blocks": [
    { "type": "hero", "settings": {...} },
    { "type": "features", "settings": {...} },
    ...
  ],
  "explanation": "Ho rigenerato completamente la landing"
}

9️⃣ message - Solo messaggio (nessuna modifica)
{
  "action": "message",
  "message": "Ecco cosa ti consiglio..."
}

══════════════════════════════════════════
REGOLE IMPORTANTI:
══════════════════════════════════════════
- Usa SEMPRE gli ID esatti dei blocchi forniti nel contesto
- Per update_all, "changes" DEVE essere un ARRAY
- Genera contenuti REALISTICI per un personal trainer italiano
- I gradienti usano classi Tailwind (from-X-Y to-X-Y)
- Sii PROATTIVO: se l'utente chiede miglioramenti, FALLI tutti
- Per modifiche ai colori, aggiorna TUTTI i blocchi con gradienti
- Rispondi SEMPRE in JSON valido

══════════════════════════════════════════
CONTESTO ATTUALE:
══════════════════════════════════════════`;

  const userPrompt = `${blocksContext}
${attachmentAnalysis}

══════════════════════════════════════════
RICHIESTA UTENTE: ${userMessage || 'Analizza e suggerisci miglioramenti'}
══════════════════════════════════════════

Rispondi con un JSON valido. Se devi modificare più cose, usa update_all con ARRAY di changes.`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Errore API OpenAI');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';

  // Parse JSON response
  try {
    return JSON.parse(content);
  } catch (e) {
    // Fallback: cerca JSON nel contenuto
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return { action: 'message', message: content };
  }
}
