import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Database } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

/**
 * Visualizzatore Alimenti Globali
 * Mostra gli alimenti dalla collezione platform_foods accessibili a tutti i tenant
 */
const GlobalFoodsViewer = ({ onBack }) => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadGlobalFoods();
  }, []);

  useEffect(() => {
    filterFoods();
  }, [searchTerm, selectedCategory, foods]);

  const loadGlobalFoods = async () => {
    setLoading(true);
    try {
      const foodsRef = collection(db, 'platform_foods');
      const q = query(foodsRef, orderBy('categoryName'), orderBy('name'));
      const snapshot = await getDocs(q);
      
      const foodsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFoods(foodsData);
      
      // Estrai categorie uniche
      const uniqueCategories = [...new Set(foodsData.map(f => f.category))].map(catId => {
        const food = foodsData.find(f => f.category === catId);
        return {
          id: catId,
          name: food.categoryName,
          icon: food.categoryIcon
        };
      });
      
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Errore nel caricamento alimenti globali:', error);
    }
    setLoading(false);
  };

  const filterFoods = () => {
    let filtered = foods;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredFoods(filtered);
  };

  const categoryStats = categories.map(cat => ({
    ...cat,
    count: foods.filter(f => f.category === cat.id).length
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Indietro</span>
            </button>
            <div className="flex items-center gap-2 text-slate-300">
              <Database size={20} className="text-blue-400" />
              <h1 className="text-xl font-bold">Alimenti Globali</h1>
            </div>
            <div className="w-24" />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca alimento..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-2xl font-bold text-blue-400">{foods.length}</div>
              <div className="text-xs text-slate-400">Totale Alimenti</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-2xl font-bold text-emerald-400">{categories.length}</div>
              <div className="text-xs text-slate-400">Categorie</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-2xl font-bold text-purple-400">{filteredFoods.length}</div>
              <div className="text-xs text-slate-400">Risultati</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-2xl font-bold text-rose-400">🌍</div>
              <div className="text-xs text-slate-400">Multi-Tenant</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Tutte ({foods.length})
            </button>
            {categoryStats.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white preserve-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {cat.icon} {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Foods Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400"></div>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">Nessun alimento trovato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoods.map(food => (
              <motion.div
                key={food.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-100 mb-1">{food.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{food.categoryIcon}</span>
                      <span>{food.categoryName}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-900/50 rounded p-2">
                    <div className="text-xs text-slate-400">Calorie</div>
                    <div className="font-bold text-slate-200">{food.calories} kcal</div>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <div className="text-xs text-slate-400">Proteine</div>
                    <div className="font-bold text-blue-400">{food.protein}g</div>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <div className="text-xs text-slate-400">Carboidrati</div>
                    <div className="font-bold text-amber-400">{food.carbs}g</div>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <div className="text-xs text-slate-400">Grassi</div>
                    <div className="font-bold text-rose-400">{food.fat}g</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-500">{food.unit}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalFoodsViewer;
