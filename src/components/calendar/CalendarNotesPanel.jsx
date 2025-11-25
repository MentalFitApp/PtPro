// src/components/calendar/CalendarNotesPanel.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StickyNote, Plus, X, Trash2, Edit2, Save, Check, 
  AlertCircle, Calendar, Clock, ChevronDown, ChevronUp 
} from 'lucide-react';
import { 
  collection, query, where, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp, orderBy 
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantCollection, getTenantDoc } from '../../config/tenant';

// Colori per priorità
const PRIORITY_COLORS = {
  low: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', label: 'Bassa' },
  medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Media' },
  high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', label: 'Alta' },
  urgent: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Urgente' }
};

export default function CalendarNotesPanel({ currentDate }) {
  // Converti currentDate in formato string YYYY-MM-DD (fix fuso orario)
  const getDateString = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const initialDate = currentDate ? getDateString(currentDate) : getDateString(new Date());
  
  const [notes, setNotes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    date: initialDate,
    completed: false
  });

  // Carica note in real-time
  useEffect(() => {
    if (!auth.currentUser) return;

    const notesQuery = query(
      getTenantCollection(db, 'calendarNotes'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(notesData);
    });

    return () => unsubscribe();
  }, []);

  // Filtra note per data selezionata
  const filteredNotes = selectedDate 
    ? notes.filter(note => note.date === selectedDate)
    : notes;

  // Aggiorna selectedDate quando cambia currentDate dal calendario
  useEffect(() => {
    if (currentDate) {
      const newDateString = getDateString(currentDate);
      setSelectedDate(newDateString);
      setFormData(prev => ({ ...prev, date: newDateString }));
    }
  }, [currentDate]);
  
  // Reset form quando cambia selectedDate manualmente
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingNote) {
        // Aggiorna nota esistente
        await updateDoc(
          getTenantDoc(db, 'calendarNotes', editingNote.id),
          {
            ...formData,
            updatedAt: serverTimestamp()
          }
        );
        setEditingNote(null);
      } else {
        // Crea nuova nota
        await addDoc(getTenantCollection(db, 'calendarNotes'), {
          ...formData,
          createdBy: auth.currentUser.uid,
          createdByEmail: auth.currentUser.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Reset form
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        date: selectedDate || new Date().toISOString().split('T')[0],
        completed: false
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('❌ Errore nel salvataggio della nota');
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      priority: note.priority,
      date: note.date,
      completed: note.completed || false
    });
    setShowAddForm(true);
  };

  const handleDelete = async (noteId) => {
    if (!confirm('Eliminare questa nota?')) return;

    try {
      await deleteDoc(getTenantDoc(db, 'calendarNotes', noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('❌ Errore nell\'eliminazione');
    }
  };

  const toggleCompleted = async (note) => {
    try {
      await updateDoc(
        getTenantDoc(db, 'calendarNotes', note.id),
        {
          completed: !note.completed,
          updatedAt: serverTimestamp()
        }
      );
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setShowAddForm(false);
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      date: selectedDate || new Date().toISOString().split('T')[0],
      completed: false
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <StickyNote className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Note & Tasks</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Aggiungi nota"
            >
              <Plus className="w-5 h-5 text-purple-400" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              {collapsed ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>
        
        {/* Selettore data indipendente */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <button
            onClick={() => {
              const today = getDateString(new Date());
              setSelectedDate(today);
            }}
            className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-400 transition-colors"
          >
            Oggi
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Add/Edit Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSubmit}
                  className="p-4 border-b border-slate-700/50 bg-slate-900/30 space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Titolo nota/task"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  />

                  <textarea
                    placeholder="Descrizione (opzionale)"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Data</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Priorità</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        {Object.entries(PRIORITY_COLORS).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-medium text-sm transition-all"
                    >
                      <Save className="w-4 h-4" />
                      {editingNote ? 'Aggiorna' : 'Salva'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
                    >
                      Annulla
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Notes List */}
            <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8">
                  <StickyNote className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">
                    {selectedDate ? 'Nessuna nota per questo giorno' : 'Nessuna nota'}
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-3 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    Crea la prima nota
                  </button>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const priorityStyle = PRIORITY_COLORS[note.priority] || PRIORITY_COLORS.medium;
                  
                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-3 rounded-lg border ${priorityStyle.bg} ${priorityStyle.border} ${
                        note.completed ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox Completed */}
                        <button
                          onClick={() => toggleCompleted(note)}
                          className={`mt-0.5 p-1 rounded border-2 transition-all ${
                            note.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-slate-600 hover:border-purple-500'
                          }`}
                        >
                          {note.completed && <Check className="w-3 h-3 text-white" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium text-white text-sm ${
                              note.completed ? 'line-through' : ''
                            }`}>
                              {note.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleEdit(note)}
                                className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                                title="Modifica"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(note.id)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                title="Elimina"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>

                          {note.content && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {note.content}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityStyle.bg} ${priorityStyle.text} border ${priorityStyle.border}`}>
                              {priorityStyle.label}
                            </span>
                            
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(note.date + 'T00:00:00').toLocaleDateString('it-IT', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>

                            {note.createdByEmail && (
                              <span className="text-xs text-slate-500 truncate">
                                {note.createdByEmail.split('@')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
