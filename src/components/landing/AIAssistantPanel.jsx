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
} from 'lucide-react';
import { analyzeScreenshot, analyzeCompetitorURL, extractPDFText } from '../../services/openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * AIAssistantPanel - Assistente AI integrato nell'editor landing pages
 * Può analizzare immagini, URL, PDF e fare modifiche automatiche ai blocchi
 */
export default function AIAssistantPanel({ 
  isOpen, 
  onClose, 
  blocks = [], 
  selectedBlockId = null,
  onUpdateBlock,
  onUpdateAllBlocks,
  onAddBlock,
}) {
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Ciao! Sono il tuo assistente AI per le landing pages. Posso:\n\n• 📝 Modificare testi e copy\n• 🎨 Cambiare colori e stili\n• 📷 Analizzare screenshot per ispirarti\n• 🔗 Analizzare URL competitor\n• 📄 Leggere PDF con info\n\nCosa vuoi fare?',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Attachments
  const [attachments, setAttachments] = useState([]); // { type: 'image'|'pdf'|'url', content, name }
  
  // Quick actions expanded
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Aggiungi messaggio alla chat
  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: Date.now() }]);
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
      // Prepara contesto dei blocchi attuali
      const selectedBlock = blocks.find(b => b.id === selectedBlockId);
      const blocksContext = selectedBlock 
        ? `BLOCCO SELEZIONATO (${selectedBlock.type}):\n${JSON.stringify(selectedBlock.settings, null, 2)}`
        : `TUTTI I BLOCCHI (${blocks.length}):\n${blocks.map(b => `- ${b.type}: ${b.settings?.title || 'senza titolo'}`).join('\n')}`;

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
      
      // Processa la risposta
      if (response.action === 'update_block' && response.blockId && response.changes) {
        onUpdateBlock(response.blockId, response.changes);
        addMessage('assistant', `✅ Ho modificato il blocco!\n\n${response.explanation || ''}`);
      } else if (response.action === 'update_all' && response.changes) {
        onUpdateAllBlocks(response.changes);
        addMessage('assistant', `✅ Ho modificato ${response.changes.length} blocchi!\n\n${response.explanation || ''}`);
      } else if (response.action === 'add_block' && response.newBlock) {
        onAddBlock(response.newBlock);
        addMessage('assistant', `✅ Ho aggiunto un nuovo blocco ${response.newBlock.type}!\n\n${response.explanation || ''}`);
      } else {
        addMessage('assistant', response.message || response.explanation || 'Non ho capito cosa vuoi fare.');
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

  // Quick actions
  const quickActions = [
    {
      icon: Type,
      label: 'Riscrivi titoli',
      action: () => setInputValue('Riscrivi tutti i titoli in modo più accattivante e persuasivo'),
    },
    {
      icon: Palette,
      label: 'Suggerisci colori',
      action: () => setInputValue('Suggerisci una palette colori moderna e professionale'),
    },
    {
      icon: Zap,
      label: 'CTA più efficaci',
      action: () => setInputValue('Rendi i pulsanti CTA più persuasivi e action-oriented'),
    },
    {
      icon: Layout,
      label: 'Migliora struttura',
      action: () => setInputValue('Analizza la struttura e suggerisci miglioramenti'),
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
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
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
                    className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-2 transition-colors"
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
              <span className="text-sm text-slate-300">Elaboro...</span>
            </div>
          </div>
        )}
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
 */
async function callAIAssistant(userMessage, blocksContext, attachmentAnalysis, blocks, selectedBlock) {
  const systemPrompt = `Sei un assistente AI per la modifica di landing pages. Il tuo compito è aiutare l'utente a modificare i blocchi della landing page.

BLOCCHI DISPONIBILI E LE LORO PROPRIETÀ:
- hero: title, subtitle, ctaText, ctaLink, ctaAction, variant (centered/split/fullscreen), showBadge, badgeText, backgroundGradient
- features: title, subtitle, items (array di {icon, title, description}), variant (grid/list)
- testimonials: title, testimonials (array di {name, role, content, avatar})
- pricing: title, plans (array di {name, price, features, highlighted})
- cta: title, subtitle, ctaText, backgroundGradient
- faq: title, faqs (array di {question, answer})
- form: title, subtitle, fields, submitText, saveToLeads
- text: title, content

REGOLE:
1. Se l'utente vuole modificare un blocco specifico, rispondi con action: "update_block"
2. Se vuole modificare più blocchi, rispondi con action: "update_all"
3. Se vuole aggiungere un blocco, rispondi con action: "add_block"
4. Se non è chiaro o è una domanda, rispondi con action: "message"

Rispondi SEMPRE in JSON valido con questa struttura:
{
  "action": "update_block" | "update_all" | "add_block" | "message",
  "blockId": "id del blocco (se update_block)",
  "changes": { ... modifiche da applicare alle settings },
  "newBlock": { type, settings } (se add_block),
  "explanation": "spiegazione di cosa hai fatto",
  "message": "messaggio per l'utente (se action=message)"
}`;

  const userPrompt = `${blocksContext}
${attachmentAnalysis}

RICHIESTA UTENTE: ${userMessage || 'Analizza gli allegati e suggerisci modifiche'}

Rispondi in JSON.`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
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
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (e) {
    // Se non è JSON, ritorna come messaggio
    return { action: 'message', message: content };
  }
}
