// src/components/admin/MessageTemplates.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Save, Trash2, Edit2, Copy, Send, Plus, X,
  Mail, Clock, Calendar, User, DollarSign, CheckCircle
} from 'lucide-react';

/**
 * Template di Messaggi Predefiniti
 * Permette di creare e riutilizzare template per email/SMS
 */

// Variabili disponibili per i template
const templateVariables = [
  { key: '{nome}', label: 'Nome Cliente', example: 'Mario' },
  { key: '{cognome}', label: 'Cognome', example: 'Rossi' },
  { key: '{email}', label: 'Email', example: 'mario.rossi@email.com' },
  { key: '{telefono}', label: 'Telefono', example: '+39 333 1234567' },
  { key: '{scadenza}', label: 'Data Scadenza', example: '15/03/2024' },
  { key: '{giorni_rimanenti}', label: 'Giorni alla Scadenza', example: '7' },
  { key: '{importo}', label: 'Importo', example: '50€' },
  { key: '{tenant_name}', label: 'Nome Palestra/Studio', example: 'FitFlow Studio' },
  { key: '{data_oggi}', label: 'Data Odierna', example: '25/11/2025' },
];

// Template predefiniti
const defaultTemplates = [
  {
    id: 'reminder-expiring',
    name: 'Promemoria Scadenza',
    category: 'reminder',
    subject: 'Il tuo abbonamento sta per scadere',
    body: `Ciao {nome},

Ti ricordiamo che il tuo abbonamento scadrà tra {giorni_rimanenti} giorni, precisamente il {scadenza}.

Per rinnovare il tuo percorso con noi, contattaci al più presto!

A presto,
Team {tenant_name}`,
    isDefault: true,
  },
  {
    id: 'welcome-new-client',
    name: 'Benvenuto Nuovo Cliente',
    category: 'welcome',
    subject: 'Benvenuto in {tenant_name}!',
    body: `Ciao {nome},

Benvenuto/a nel nostro team! Siamo entusiasti di iniziare questo percorso insieme a te.

Ricordati di compilare l'anamnesi il prima possibile per permetterci di personalizzare al meglio il tuo programma.

Per qualsiasi dubbio, siamo sempre a disposizione.

A presto,
Team {tenant_name}`,
    isDefault: true,
  },
  {
    id: 'check-reminder',
    name: 'Promemoria Check Programmato',
    category: 'reminder',
    subject: 'Check Programmato - {tenant_name}',
    body: `Ciao {nome},

Ti ricordiamo che hai un check programmato per {data_oggi}.

Ti aspettiamo!

Team {tenant_name}`,
    isDefault: true,
  },
  {
    id: 'payment-reminder',
    name: 'Promemoria Pagamento',
    category: 'payment',
    subject: 'Promemoria Pagamento',
    body: `Ciao {nome},

Ti ricordiamo che hai un pagamento in sospeso di {importo}.

Per qualsiasi informazione, non esitare a contattarci.

Grazie,
Team {tenant_name}`,
    isDefault: true,
  },
  {
    id: 'anamnesi-reminder',
    name: 'Promemoria Anamnesi',
    category: 'reminder',
    subject: 'Completa la tua Anamnesi',
    body: `Ciao {nome},

Non hai ancora completato l'anamnesi. È fondamentale per personalizzare il tuo percorso!

Compilala il prima possibile dalla tua area riservata.

Grazie,
Team {tenant_name}`,
    isDefault: true,
  },
];

export default function MessageTemplates({ 
  onSelectTemplate, 
  storageKey = 'admin_message_templates',
  mode = 'panel' // 'panel' o 'inline'
}) {
  const [templates, setTemplates] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Tutti', icon: <MessageSquare size={14} /> },
    { id: 'welcome', label: 'Benvenuto', icon: <User size={14} /> },
    { id: 'reminder', label: 'Promemoria', icon: <Clock size={14} /> },
    { id: 'payment', label: 'Pagamenti', icon: <DollarSign size={14} /> },
    { id: 'custom', label: 'Personalizzati', icon: <Edit2 size={14} /> },
  ];

  // Carica template salvati
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const userTemplates = JSON.parse(saved);
        setTemplates([...defaultTemplates, ...userTemplates]);
      } catch (error) {
        setTemplates(defaultTemplates);
      }
    } else {
      setTemplates(defaultTemplates);
    }
  }, [storageKey]);

  // Salva template
  const saveTemplate = (template) => {
    const userTemplates = templates.filter(t => !t.isDefault);
    const newTemplate = {
      ...template,
      id: template.id || `custom-${Date.now()}`,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    let updated;
    if (template.id && userTemplates.find(t => t.id === template.id)) {
      updated = userTemplates.map(t => t.id === template.id ? newTemplate : t);
    } else {
      updated = [...userTemplates, newTemplate];
    }

    localStorage.setItem(storageKey, JSON.stringify(updated));
    setTemplates([...defaultTemplates, ...updated]);
    setEditingTemplate(null);
    setShowEditor(false);
  };

  // Elimina template
  const deleteTemplate = (id) => {
    const userTemplates = templates.filter(t => !t.isDefault && t.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(userTemplates));
    setTemplates([...defaultTemplates, ...userTemplates]);
  };

  // Duplica template
  const duplicateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: undefined,
      name: `${template.name} (Copia)`,
      isDefault: false,
    };
    setEditingTemplate(newTemplate);
    setShowEditor(true);
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  // Template Editor Form
  const TemplateEditor = () => {
    const [formData, setFormData] = useState(
      editingTemplate || {
        name: '',
        category: 'custom',
        subject: '',
        body: '',
      }
    );

    const insertVariable = (variable) => {
      setFormData({
        ...formData,
        body: formData.body + variable,
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">
            {editingTemplate?.id ? 'Modifica Template' : 'Nuovo Template'}
          </h3>
          <button
            onClick={() => {
              setShowEditor(false);
              setEditingTemplate(null);
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nome Template */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Nome Template</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="es. Promemoria Personalizzato"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Categoria</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.filter(c => c.id !== 'all').map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Oggetto */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Oggetto (Email)</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="es. Promemoria importante"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Variabili Disponibili */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Variabili Disponibili</label>
          <div className="flex flex-wrap gap-2">
            {templateVariables.map((variable) => (
              <button
                key={variable.key}
                onClick={() => insertVariable(variable.key)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
                title={`${variable.label}: ${variable.example}`}
              >
                {variable.key}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">Clicca per inserire nel messaggio</p>
        </div>

        {/* Corpo Messaggio */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Messaggio</label>
          <textarea
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="Scrivi il tuo messaggio qui..."
            rows={10}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Azioni */}
        <div className="flex gap-3">
          <motion.button
            onClick={() => saveTemplate(formData)}
            disabled={!formData.name || !formData.body}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium"
          >
            <Save size={18} />
            Salva Template
          </motion.button>
          <button
            onClick={() => {
              setShowEditor(false);
              setEditingTemplate(null);
            }}
            className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
          >
            Annulla
          </button>
        </div>
      </motion.div>
    );
  };

  // Template List
  const TemplateList = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates */}
      <div className="space-y-2">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              layout
              className="group bg-slate-800/50 hover:bg-slate-800 rounded-lg p-4 border border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">{template.name}</h4>
                    {template.isDefault && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  {template.subject && (
                    <p className="text-sm text-slate-400 mb-2">
                      <Mail size={12} className="inline mr-1" />
                      {template.subject}
                    </p>
                  )}
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {template.body.substring(0, 100)}...
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => onSelectTemplate?.(template)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Usa Template"
                  >
                    <Send size={16} />
                  </motion.button>
                  <motion.button
                    onClick={() => duplicateTemplate(template)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
                    title="Duplica"
                  >
                    <Copy size={16} />
                  </motion.button>
                  {!template.isDefault && (
                    <>
                      <motion.button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowEditor(true);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
                        title="Modifica"
                      >
                        <Edit2 size={16} />
                      </motion.button>
                      <motion.button
                        onClick={() => deleteTemplate(template.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nessun template in questa categoria</p>
          </div>
        )}
      </div>
    </div>
  );

  if (mode === 'inline') {
    return (
      <div className="space-y-4">
        {showEditor ? <TemplateEditor /> : <TemplateList />}
        {!showEditor && (
          <motion.button
            onClick={() => setShowEditor(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
          >
            <Plus size={18} />
            Nuovo Template
          </motion.button>
        )}
      </div>
    );
  }

  // Panel mode (default)
  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all border border-slate-600"
      >
        <MessageSquare size={16} />
        <span className="text-sm font-medium">Template Messaggi</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed right-6 top-6 bottom-6 w-[500px] max-w-[calc(100vw-3rem)] bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-blue-400" size={20} />
                  <h3 className="text-white font-semibold">Template Messaggi</h3>
                </div>
                <div className="flex items-center gap-2">
                  {!showEditor && (
                    <motion.button
                      onClick={() => setShowEditor(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                      title="Nuovo Template"
                    >
                      <Plus size={20} />
                    </motion.button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {showEditor ? <TemplateEditor /> : <TemplateList />}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
