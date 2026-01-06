/**
 * QuizPopupSettings - Componente per le impostazioni del Quiz Popup
 * Permette di configurare domande, campi contatto, stili e comportamento
 */
import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Copy, Sparkles } from 'lucide-react';
import { quizIconMap } from '../landingBlocks/QuizIcons';

// Icone disponibili per le opzioni
const AVAILABLE_ICONS = [
  { name: 'target', label: 'Obiettivo' },
  { name: 'muscle', label: 'Muscolo' },
  { name: 'energy', label: 'Energia' },
  { name: 'fire', label: 'Fuoco' },
  { name: 'diet', label: 'Dieta' },
  { name: 'cardio', label: 'Cardio' },
  { name: 'gym', label: 'Palestra' },
  { name: 'supplement', label: 'Integratore' },
  { name: 'sprout', label: 'Crescita' },
  { name: 'time', label: 'Tempo' },
  { name: 'motivation', label: 'Motivazione' },
  { name: 'question', label: 'Domanda' },
  { name: 'consistency', label: 'Costanza' },
  { name: 'rocket', label: 'Rocket' },
  { name: 'progress', label: 'Progresso' },
  { name: 'trophy', label: 'Trofeo' },
  { name: 'balance', label: 'Bilancia' },
  { name: 'form', label: 'Form' },
  { name: 'gift', label: 'Regalo' },
];

// Colori predefiniti
const PRESET_COLORS = [
  '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1',
  '#3b82f6', '#0ea5e9', '#14b8a6', '#22c55e', '#84cc16',
  '#eab308', '#f59e0b', '#64748b',
];

// Template domande predefinite
const QUESTION_TEMPLATES = [
  {
    name: '🎯 Problema Principale',
    question: {
      id: 'problema',
      question: 'Qual è il tuo problema principale?',
      type: 'single',
      options: [
        { value: 'opt1', label: 'Opzione 1', iconType: 'svg', iconName: 'target', color: '#f97316' },
        { value: 'opt2', label: 'Opzione 2', iconType: 'svg', iconName: 'muscle', color: '#ef4444' },
        { value: 'opt3', label: 'Opzione 3', iconType: 'svg', iconName: 'energy', color: '#8b5cf6' },
      ]
    }
  },
  {
    name: '📋 Selezione Multipla',
    question: {
      id: 'tentativi',
      question: 'Cosa hai già provato?',
      type: 'multiple',
      maxSelections: 3,
      options: [
        { value: 'opt1', label: 'Opzione 1', iconType: 'svg', iconName: 'diet', color: '#22c55e' },
        { value: 'opt2', label: 'Opzione 2', iconType: 'svg', iconName: 'cardio', color: '#3b82f6' },
        { value: 'opt3', label: 'Opzione 3', iconType: 'svg', iconName: 'gym', color: '#64748b' },
      ]
    }
  },
  {
    name: '📝 Testo Libero',
    question: {
      id: 'obiettivo',
      question: 'Descrivi il tuo obiettivo',
      type: 'textarea',
      placeholder: 'Scrivi qui...',
      maxLength: 500,
    }
  },
  {
    name: '⏱️ Timeline',
    question: {
      id: 'tempo',
      question: 'In quanto tempo vorresti vedere risultati?',
      type: 'single',
      options: [
        { value: '4-settimane', label: '4 settimane', iconType: 'svg', iconName: 'rocket', color: '#22c55e' },
        { value: '8-settimane', label: '8 settimane', iconType: 'svg', iconName: 'progress', color: '#3b82f6' },
        { value: '12-settimane', label: '12 settimane', iconType: 'svg', iconName: 'trophy', color: '#f97316' },
      ]
    }
  },
];

// Campi contatto disponibili
const CONTACT_FIELDS = [
  { id: 'nome', label: 'Nome', icon: '👤' },
  { id: 'cognome', label: 'Cognome', icon: '👤' },
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'phone', label: 'Telefono', icon: '📱' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'eta', label: 'Età', icon: '🎂' },
  { id: 'citta', label: 'Città', icon: '📍' },
];

/**
 * QuizPopupSettings Component
 */
const QuizPopupSettings = ({ 
  localSettings, 
  handleChange, 
  renderField, 
  FieldGroup,
  tenantId 
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Parse delle domande esistenti
  const questions = localSettings.quizQuestions || [];
  const contactFields = localSettings.quizContactFields || ['nome', 'email', 'phone'];

  // Aggiorna le domande
  const updateQuestions = (newQuestions) => {
    handleChange('quizQuestions', newQuestions);
  };

  // Aggiunge una nuova domanda
  const addQuestion = (template = null) => {
    const newQuestion = template || {
      id: `q_${Date.now()}`,
      question: 'Nuova domanda',
      type: 'single',
      options: [
        { value: 'opt1', label: 'Opzione 1', iconType: 'svg', iconName: 'target', color: '#f97316' },
        { value: 'opt2', label: 'Opzione 2', iconType: 'svg', iconName: 'muscle', color: '#3b82f6' },
      ]
    };
    
    // Assicura ID univoco
    newQuestion.id = `q_${Date.now()}`;
    
    updateQuestions([...questions, newQuestion]);
    setExpandedQuestion(questions.length);
    setShowTemplates(false);
  };

  // Rimuove una domanda
  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    updateQuestions(newQuestions);
    setExpandedQuestion(null);
  };

  // Aggiorna una domanda specifica
  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    updateQuestions(newQuestions);
  };

  // Aggiunge un'opzione a una domanda
  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    const options = newQuestions[questionIndex].options || [];
    options.push({
      value: `opt_${Date.now()}`,
      label: 'Nuova opzione',
      iconType: 'svg',
      iconName: 'target',
      color: PRESET_COLORS[options.length % PRESET_COLORS.length],
    });
    newQuestions[questionIndex].options = options;
    updateQuestions(newQuestions);
  };

  // Rimuove un'opzione
  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    updateQuestions(newQuestions);
  };

  // Aggiorna un'opzione
  const updateOption = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value,
    };
    updateQuestions(newQuestions);
  };

  // Toggle campo contatto
  const toggleContactField = (fieldId) => {
    const current = [...contactFields];
    const index = current.indexOf(fieldId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(fieldId);
    }
    handleChange('quizContactFields', current);
  };

  // Muove domanda su/giù
  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    updateQuestions(newQuestions);
    setExpandedQuestion(newIndex);
  };

  // Duplica domanda
  const duplicateQuestion = (index) => {
    const newQuestions = [...questions];
    const duplicate = JSON.parse(JSON.stringify(questions[index]));
    duplicate.id = `q_${Date.now()}`;
    newQuestions.splice(index + 1, 0, duplicate);
    updateQuestions(newQuestions);
    setExpandedQuestion(index + 1);
  };

  // Render icon preview
  const renderIconPreview = (iconName, color) => {
    const IconComponent = quizIconMap[iconName];
    if (!IconComponent) return null;
    return (
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <IconComponent className="w-5 h-5" style={{ color }} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Quiz */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">Quiz Interattivo</span>
        </div>
        <p className="text-sm text-slate-400">
          Crea un quiz coinvolgente con domande personalizzate, icone vettoriali e raccolta lead.
        </p>
      </div>

      {/* Titolo e Sottotitolo Quiz */}
      <FieldGroup label="Titolo Quiz">
        {renderField('quizTitle', localSettings.quizTitle || 'Scopri il tuo profilo')}
      </FieldGroup>
      
      <FieldGroup label="Sottotitolo Quiz">
        {renderField('quizSubtitle', localSettings.quizSubtitle || 'Rispondi a poche domande per ricevere un piano personalizzato')}
      </FieldGroup>

      {/* Colori */}
      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Colore Principale">
          {renderField('quizAccentColor', localSettings.quizAccentColor || '#f97316', 'color')}
        </FieldGroup>
        <FieldGroup label="Colore Secondario">
          {renderField('quizGradientTo', localSettings.quizGradientTo || '#dc2626', 'color')}
        </FieldGroup>
      </div>

      {/* Sezione Domande */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-white/5 px-4 py-3 flex items-center justify-between">
          <span className="font-medium text-white">Domande ({questions.length})</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Template
            </button>
            <button
              onClick={() => addQuestion()}
              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Aggiungi
            </button>
          </div>
        </div>

        {/* Template Modal */}
        {showTemplates && (
          <div className="p-4 bg-purple-500/10 border-b border-white/10">
            <p className="text-sm text-slate-400 mb-3">Scegli un template:</p>
            <div className="grid grid-cols-2 gap-2">
              {QUESTION_TEMPLATES.map((template, i) => (
                <button
                  key={i}
                  onClick={() => addQuestion(template.question)}
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <span className="text-sm text-white">{template.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista Domande */}
        <div className="divide-y divide-white/10">
          {questions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>Nessuna domanda. Aggiungi la prima domanda!</p>
            </div>
          ) : (
            questions.map((question, qIndex) => (
              <div key={question.id} className="bg-slate-900/50">
                {/* Header Domanda */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5"
                  onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? null : qIndex)}
                >
                  <GripVertical className="w-4 h-4 text-slate-500" />
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center">
                    {qIndex + 1}
                  </span>
                  <span className="flex-1 text-white truncate">{question.question}</span>
                  <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">
                    {question.type === 'single' ? 'Singola' : question.type === 'multiple' ? 'Multipla' : 'Testo'}
                  </span>
                  {expandedQuestion === qIndex ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* Contenuto Espanso */}
                {expandedQuestion === qIndex && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Azioni */}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => moveQuestion(qIndex, -1)}
                        disabled={qIndex === 0}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Sposta su"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveQuestion(qIndex, 1)}
                        disabled={qIndex === questions.length - 1}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Sposta giù"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateQuestion(qIndex)}
                        className="p-1.5 text-slate-400 hover:text-blue-400"
                        title="Duplica"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="p-1.5 text-slate-400 hover:text-red-400"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Testo Domanda */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Testo Domanda</label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    {/* Tipo Domanda */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="single">Selezione Singola</option>
                        <option value="multiple">Selezione Multipla</option>
                        <option value="text">Testo Breve</option>
                        <option value="textarea">Testo Lungo</option>
                      </select>
                    </div>

                    {/* Opzioni per single/multiple */}
                    {(question.type === 'single' || question.type === 'multiple') && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-slate-400">Opzioni</label>
                          <button
                            onClick={() => addOption(qIndex)}
                            className="text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            + Aggiungi Opzione
                          </button>
                        </div>
                        
                        {question.type === 'multiple' && (
                          <div className="mb-3">
                            <label className="block text-xs text-slate-500 mb-1">Max selezioni</label>
                            <input
                              type="number"
                              min="1"
                              value={question.maxSelections || ''}
                              onChange={(e) => updateQuestion(qIndex, 'maxSelections', parseInt(e.target.value) || undefined)}
                              placeholder="Illimitato"
                              className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          {(question.options || []).map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                              {/* Icon Preview */}
                              {renderIconPreview(option.iconName, option.color)}
                              
                              {/* Label */}
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) => updateOption(qIndex, oIndex, 'label', e.target.value)}
                                className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                placeholder="Etichetta"
                              />
                              
                              {/* Icon Select */}
                              <select
                                value={option.iconName || 'target'}
                                onChange={(e) => updateOption(qIndex, oIndex, 'iconName', e.target.value)}
                                className="w-28 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                              >
                                {AVAILABLE_ICONS.map(icon => (
                                  <option key={icon.name} value={icon.name}>{icon.label}</option>
                                ))}
                              </select>
                              
                              {/* Color Picker */}
                              <input
                                type="color"
                                value={option.color || '#f97316'}
                                onChange={(e) => updateOption(qIndex, oIndex, 'color', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer"
                              />
                              
                              {/* Remove */}
                              <button
                                onClick={() => removeOption(qIndex, oIndex)}
                                className="p-1 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Placeholder per text/textarea */}
                    {(question.type === 'text' || question.type === 'textarea') && (
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={question.placeholder || ''}
                          onChange={(e) => updateQuestion(qIndex, 'placeholder', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                          placeholder="Es: Scrivi qui la tua risposta..."
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Campi Contatto */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-white/5 px-4 py-3">
          <span className="font-medium text-white">Campi Contatto</span>
          <p className="text-xs text-slate-400 mt-1">Seleziona i dati da raccogliere</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          {CONTACT_FIELDS.map(field => (
            <label
              key={field.id}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                contactFields.includes(field.id)
                  ? 'bg-purple-500/20 border border-purple-500/50'
                  : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={contactFields.includes(field.id)}
                onChange={() => toggleContactField(field.id)}
                className="sr-only"
              />
              <span>{field.icon}</span>
              <span className="text-sm text-white">{field.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Testi Form Contatto */}
      <FieldGroup label="Titolo Form Contatto">
        {renderField('quizContactTitle', localSettings.quizContactTitle || 'Ultimo passaggio!')}
      </FieldGroup>
      
      <FieldGroup label="Sottotitolo Form Contatto">
        {renderField('quizContactSubtitle', localSettings.quizContactSubtitle || 'Inserisci i tuoi dati per ricevere i risultati')}
      </FieldGroup>

      {/* Messaggio Successo */}
      <FieldGroup label="Messaggio Successo">
        {renderField('quizSuccessMessage', localSettings.quizSuccessMessage || 'Grazie! Ti contatteremo presto con un piano personalizzato.', 'textarea')}
      </FieldGroup>

      {/* Testi Risultati */}
      <FieldGroup label="Titolo Risultati">
        {renderField('quizResultsTitle', localSettings.quizResultsTitle || '✅ Quiz completato!')}
      </FieldGroup>
      
      <FieldGroup label="Sottotitolo Risultati">
        {renderField('quizResultsSubtitle', localSettings.quizResultsSubtitle || 'Le tue risposte sono state registrate')}
      </FieldGroup>
    </div>
  );
};

export default QuizPopupSettings;
