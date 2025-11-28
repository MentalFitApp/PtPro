import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ChevronLeft,
  BarChart3,
  PieChart,
  Calendar,
  Search
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getTenantCollection } from '../../config/tenant';

const FoodAnalytics = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    mostUsedFoods: [],
    leastUsedFoods: [],
    categoryDistribution: {},
    totalFoods: 0,
    totalSchede: 0,
    avgFoodsPerScheda: 0,
    topCategories: [],
    unusedFoods: []
  });
  const [timeRange, setTimeRange] = useState('all'); // all, month, week
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Carica tutte le schede alimentazione
      const schedeRef = getTenantCollection(db, 'schede_alimentazione');
      const schedeSnapshot = await getDocs(schedeRef);
      
      // 2. Carica tutti gli alimenti (tenant + globali)
      const alimentiMap = new Map();
      
      // Alimenti tenant
      const CATEGORIES = ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Pizze', 'Bevande', 
        'Carne', 'Condimenti', 'Formaggi', 'Frutta', 'Integratori', 'Latte', 
        'Pane', 'Pasta', 'Pesce', 'Salumi', 'Uova', 'Verdura'];
      
      for (const category of CATEGORIES) {
        const alimentiRef = collection(getTenantCollection(db, 'alimenti'), category, 'items');
        const snapshot = await getDocs(alimentiRef);
        snapshot.docs.forEach(doc => {
          alimentiMap.set(doc.id, {
            id: doc.id,
            nome: doc.data().nome,
            category,
            source: 'tenant',
            usageCount: 0
          });
        });
      }
      
      // Alimenti globali
      const globalFoodsRef = collection(db, 'platform_foods');
      const globalSnapshot = await getDocs(globalFoodsRef);
      globalSnapshot.docs.forEach(doc => {
        alimentiMap.set(doc.id, {
          id: doc.id,
          nome: doc.data().name,
          category: doc.data().categoryName,
          source: 'global',
          usageCount: 0
        });
      });

      // 3. Conta l'uso di ogni alimento nelle schede
      const foodUsageCount = new Map();
      const categoryCount = {};
      let totalFoodInstances = 0;

      schedeSnapshot.docs.forEach(schedaDoc => {
        const scheda = schedaDoc.data();
        
        // Applica filtro temporale
        if (timeRange !== 'all' && scheda.createdAt) {
          const createdDate = scheda.createdAt.toDate();
          const now = new Date();
          const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
          
          if (timeRange === 'week' && daysDiff > 7) return;
          if (timeRange === 'month' && daysDiff > 30) return;
        }

        // Itera sui pasti
        if (scheda.pasti) {
          Object.values(scheda.pasti).forEach(pasto => {
            if (pasto.alimenti) {
              pasto.alimenti.forEach(alimento => {
                const foodId = alimento.id || alimento.nome;
                const foodName = alimento.nome;
                
                // Incrementa conteggio
                const currentCount = foodUsageCount.get(foodId) || { nome: foodName, count: 0, category: alimento.category || 'N/A' };
                currentCount.count += 1;
                foodUsageCount.set(foodId, currentCount);
                
                // Conta per categoria
                const cat = alimento.category || 'Altro';
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
                
                totalFoodInstances++;
              });
            }
          });
        }
      });

      // 4. Converti in array e ordina
      const foodUsageArray = Array.from(foodUsageCount.entries()).map(([id, data]) => ({
        id,
        nome: data.nome,
        category: data.category,
        usageCount: data.count
      }));

      foodUsageArray.sort((a, b) => b.usageCount - a.usageCount);

      // 5. Trova alimenti mai usati
      const usedFoodIds = new Set(foodUsageArray.map(f => f.id));
      const unusedFoods = Array.from(alimentiMap.values())
        .filter(food => !usedFoodIds.has(food.id))
        .map(food => ({
          nome: food.nome,
          category: food.category,
          source: food.source
        }));

      // 6. Top categorie
      const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 7. Calcola medie
      const totalSchede = schedeSnapshot.size;
      const avgFoodsPerScheda = totalSchede > 0 ? (totalFoodInstances / totalSchede).toFixed(1) : 0;

      setAnalytics({
        mostUsedFoods: foodUsageArray.slice(0, 20),
        leastUsedFoods: foodUsageArray.filter(f => f.usageCount > 0).slice(-20).reverse(),
        categoryDistribution: categoryCount,
        totalFoods: alimentiMap.size,
        totalSchede,
        avgFoodsPerScheda,
        topCategories,
        unusedFoods: unusedFoods.slice(0, 50)
      });

    } catch (error) {
      console.error('Errore nel caricamento analytics:', error);
    }
    setLoading(false);
  };

  const filteredMostUsed = analytics.mostUsedFoods.filter(food =>
    food.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeastUsed = analytics.leastUsedFoods.filter(food =>
    food.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnused = analytics.unusedFoods.filter(food =>
    food.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all preserve-white"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">📊 Analytics Alimentazione</h1>
              <p className="text-gray-300 mt-1">Analisi statistica utilizzo alimenti nelle schede</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 bg-white/10 rounded-lg p-1 preserve-white">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-lg transition-all ${
                timeRange === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              7 giorni
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-lg transition-all ${
                timeRange === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              30 giorni
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                timeRange === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              Sempre
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white preserve-white"
          >
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8" />
              <span className="text-3xl font-bold">{analytics.totalFoods}</span>
            </div>
            <p className="text-blue-100">Alimenti Totali</p>
            <p className="text-xs text-blue-200 mt-1">Database completo</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white preserve-white"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8" />
              <span className="text-3xl font-bold">{analytics.totalSchede}</span>
            </div>
            <p className="text-emerald-100">Schede Attive</p>
            <p className="text-xs text-emerald-200 mt-1">Schede alimentazione totali</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white preserve-white"
          >
            <div className="flex items-center justify-between mb-2">
              <PieChart className="w-8 h-8" />
              <span className="text-3xl font-bold">{analytics.avgFoodsPerScheda}</span>
            </div>
            <p className="text-purple-100">Media Alimenti</p>
            <p className="text-xs text-purple-200 mt-1">Per scheda</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white preserve-white"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8" />
              <span className="text-3xl font-bold">{analytics.unusedFoods.length}</span>
            </div>
            <p className="text-orange-100">Mai Utilizzati</p>
            <p className="text-xs text-orange-200 mt-1">Alimenti inutilizzati</p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca alimento..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 preserve-white"
            />
          </div>
        </div>

        {/* Top Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8 preserve-white"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-6 h-6" />
            Top 10 Categorie Più Usate
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.topCategories.map((cat, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="text-2xl font-bold text-white">{cat.count}</div>
                <div className="text-sm text-gray-300 mt-1">{cat.category}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Most Used Foods */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 preserve-white"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              Alimenti Più Usati
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredMostUsed.map((food, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{food.nome}</div>
                      <div className="text-xs text-gray-400">{food.category}</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-bold text-lg">{food.usageCount}x</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Least Used Foods */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 preserve-white"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-orange-400" />
              Alimenti Meno Usati
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredLeastUsed.map((food, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{food.nome}</div>
                      <div className="text-xs text-gray-400">{food.category}</div>
                    </div>
                  </div>
                  <div className="text-orange-400 font-bold">{food.usageCount}x</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Unused Foods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mt-8 preserve-white"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-400" />
            Alimenti Mai Utilizzati ({analytics.unusedFoods.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {filteredUnused.map((food, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-3 border border-red-500/20 hover:bg-white/10 transition-all"
              >
                <div className="text-white font-medium text-sm">{food.nome}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{food.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    food.source === 'global' 
                      ? 'bg-blue-500/20 text-blue-300' 
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {food.source === 'global' ? 'Globale' : 'Tenant'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default FoodAnalytics;
