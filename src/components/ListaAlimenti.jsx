import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Plus, Search, Edit2, Trash2, X, Save } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getTenantSubcollection } from '../config/tenant';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

const CATEGORIES = [
  'Antipasti',
  'Primi',
  'Secondi',
  'Dolci',
  'Pizze',
  'Bevande',
  'Carne',
  'Condimenti',
  'Formaggi',
  'Frutta',
  'Integratori',
  'Latte',
  'Pane',
  'Pasta',
  'Pesce',
  'Salumi',
  'Uova',
  'Verdura'
];

const ListaAlimenti = ({ onBack }) => {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    kcal: '',
    proteine: '',
    carboidrati: '',
    grassi: ''
  });

  const loadFoods = useCallback(async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      // Carica alimenti tenant-specific
      const foodsRef = getTenantSubcollection(db, 'alimenti', selectedCategory, 'items');
      const snapshot = await getDocs(foodsRef);
      const tenantFoods = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        source: 'tenant' 
      }));

      // Carica alimenti globali dalla collezione platform_foods
      const globalFoodsRef = collection(db, 'platform_foods');
      const globalSnapshot = await getDocs(globalFoodsRef);
      const globalFoods = globalSnapshot.docs
        .map(doc => ({
          id: doc.id,
          nome: doc.data().name,
          kcal: doc.data().calories,
          proteine: doc.data().protein,
          carboidrati: doc.data().carbs,
          grassi: doc.data().fat,
          category: doc.data().category,
          categoryName: doc.data().categoryName,
          source: 'global'
        }))
        .filter(food => {
          // Mappa le categorie globali a quelle locali (14 categorie globali → 18 categorie locali)
          const categoryMap = {
            'carni-bianche': ['Carne', 'Secondi'],
            'carni-rosse': ['Carne', 'Secondi'],
            'pesce': ['Pesce', 'Secondi'],
            'frutti-mare': ['Pesce', 'Secondi'],
            'salumi': ['Salumi', 'Antipasti'],
            'uova-latticini': ['Latte', 'Formaggi', 'Uova'],
            'cereali-pasta': ['Pasta', 'Pane', 'Primi'],
            'legumi': ['Primi', 'Secondi'],
            'frutta-fresca': ['Frutta'],
            'frutta-secca': ['Frutta'],
            'verdure': ['Verdura', 'Antipasti'],
            'patate-tuberi': ['Verdura', 'Primi'],
            'grassi-condimenti': ['Condimenti'],
            'integratori-snack': ['Integratori'],
            'antipasti': ['Antipasti'],
            'primi': ['Primi'],
            'dolci': ['Dolci'],
            'pizze': ['Pizze', 'Primi'],
            'bevande': ['Bevande'],
            'condimenti': ['Condimenti'],
            'formaggi': ['Formaggi'],
            'latte': ['Latte'],
            'pane': ['Pane', 'Primi'],
            'uova': ['Uova', 'Secondi']
          };

          // Trova le categorie locali corrispondenti
          const mappedCategories = categoryMap[food.category] || [];
          return mappedCategories.includes(selectedCategory);
        });

      // Combina gli alimenti tenant e globali
      const allFoods = [...tenantFoods, ...globalFoods].sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );
      
      setFoods(allFoods);
    } catch (error) {
      console.error('Errore nel caricamento degli alimenti:', error);
    }
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory) {
      loadFoods();
    }
  }, [selectedCategory, loadFoods]);

  const handleAddFood = async () => {
    if (!formData.nome || !formData.kcal || !formData.proteine || !formData.carboidrati || !formData.grassi) {
      toast.warning('Compila tutti i campi');
      return;
    }

    try {
      const foodsRef = getTenantSubcollection(db, 'alimenti', selectedCategory, 'items');
      await addDoc(foodsRef, {
        nome: formData.nome,
        kcal: parseFloat(formData.kcal),
        proteine: parseFloat(formData.proteine),
        carboidrati: parseFloat(formData.carboidrati),
        grassi: parseFloat(formData.grassi),
        createdAt: new Date()
      });
      
      resetForm();
      loadFoods();
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'alimento:', error);
      toast.error('Errore nell\'aggiunta dell\'alimento');
    }
  };

  const handleUpdateFood = async () => {
    if (!formData.nome || !formData.kcal || !formData.proteine || !formData.carboidrati || !formData.grassi) {
      toast.warning('Compila tutti i campi');
      return;
    }

    try {
      const foodRef = doc(getTenantSubcollection(db, 'alimenti', selectedCategory, 'items'), editingFood.id);
      await updateDoc(foodRef, {
        nome: formData.nome,
        kcal: parseFloat(formData.kcal),
        proteine: parseFloat(formData.proteine),
        carboidrati: parseFloat(formData.carboidrati),
        grassi: parseFloat(formData.grassi),
        updatedAt: new Date()
      });
      
      resetForm();
      loadFoods();
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'alimento:', error);
      toast.error('Errore nell\'aggiornamento dell\'alimento');
    }
  };

  const handleDeleteFood = async (foodId) => {
    const confirmed = await confirmDelete('questo alimento');
    if (!confirmed) return;

    try {
      const foodRef = doc(getTenantSubcollection(db, 'alimenti', selectedCategory, 'items'), foodId);
      await deleteDoc(foodRef);
      loadFoods();
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'alimento:', error);
      toast.error('Errore nell\'eliminazione dell\'alimento');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      kcal: '',
      proteine: '',
      carboidrati: '',
      grassi: ''
    });
    setIsAddingFood(false);
    setEditingFood(null);
  };

  const startEdit = (food) => {
    setEditingFood(food);
    setFormData({
      nome: food.nome,
      kcal: food.kcal.toString(),
      proteine: food.proteine.toString(),
      carboidrati: food.carboidrati.toString(),
      grassi: food.grassi.toString()
    });
  };

  const filteredFoods = foods.filter(food =>
    food.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedCategory) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 max-w-full overflow-x-hidden"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedCategory(null);
              resetForm();
            }}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Torna alle categorie
          </button>
          <h2 className="text-2xl font-bold text-slate-100">{selectedCategory}</h2>
        </div>

        {/* Stats */}
        {foods.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-xs text-slate-400">Totali</div>
              <div className="text-xl font-bold text-slate-200">{foods.length}</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
              <div className="text-xs text-blue-300">Globali</div>
              <div className="text-xl font-bold text-blue-400">{foods.filter(f => f.source === 'global').length}</div>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-lg p-3">
              <div className="text-xs text-emerald-300">Tuoi</div>
              <div className="text-xl font-bold text-emerald-400">{foods.filter(f => f.source === 'tenant').length}</div>
            </div>
          </div>
        )}

        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cerca alimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => setIsAddingFood(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white preserve-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Aggiungi Alimento
          </button>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {(isAddingFood || editingFood) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">
                  {editingFood ? 'Modifica Alimento' : 'Nuovo Alimento'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome Alimento
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                    placeholder="Es. Petto di pollo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Kcal (per 100g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.kcal}
                    onChange={(e) => setFormData({ ...formData, kcal: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Proteine (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.proteine}
                    onChange={(e) => setFormData({ ...formData, proteine: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Carboidrati (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.carboidrati}
                    onChange={(e) => setFormData({ ...formData, carboidrati: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Grassi (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.grassi}
                    onChange={(e) => setFormData({ ...formData, grassi: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={editingFood ? handleUpdateFood : handleAddFood}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  {editingFood ? 'Salva Modifiche' : 'Aggiungi'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Foods List */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              Caricamento...
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {searchTerm ? 'Nessun alimento trovato' : 'Nessun alimento in questa categoria'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Kcal</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Proteine</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Carboidrati</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Grassi</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredFoods.map((food) => (
                    <tr key={food.id} className={`hover:bg-slate-800/50 transition-colors ${food.source === 'global' ? 'bg-blue-900/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200">{food.nome}</span>
                          {food.source === 'global' && (
                            <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs rounded">
                              Globale
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{food.kcal}</td>
                      <td className="px-4 py-3 text-slate-300">{food.proteine}g</td>
                      <td className="px-4 py-3 text-slate-300">{food.carboidrati}g</td>
                      <td className="px-4 py-3 text-slate-300">{food.grassi}g</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {food.source === 'tenant' ? (
                            <>
                              <button
                                onClick={() => startEdit(food)}
                                className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
                                title="Modifica"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteFood(food.id)}
                                className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                                title="Elimina"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Solo lettura</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Torna indietro
        </button>
        <h2 className="text-2xl font-bold text-slate-100">Lista Alimenti</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((category) => (
          <motion.button
            key={category}
            onClick={() => setSelectedCategory(category)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-6 bg-emerald-900/10 border border-emerald-600/30 hover:bg-emerald-900/20 hover:border-emerald-500/50 rounded-lg transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-100 font-medium">{category}</span>
              <ChevronRight size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ListaAlimenti;
