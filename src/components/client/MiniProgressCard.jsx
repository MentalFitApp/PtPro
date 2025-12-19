// src/components/client/MiniProgressCard.jsx
// Card compatta con trend peso/misure ultimi check
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantSubcollection } from '../../config/tenant';
import { TrendingUp, TrendingDown, Minus, Scale, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function MiniProgressCard() {
  const [weightChange, setWeightChange] = useState(null);
  const [lastWeight, setLastWeight] = useState(null);
  const [checksCount, setChecksCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      const checksRef = getTenantSubcollection(db, 'clients', auth.currentUser.uid, 'checks');
      const q = query(checksRef, orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setLoading(false);
        return;
      }

      const checks = snapshot.docs.map(doc => doc.data()).filter(c => c.weight);
      setChecksCount(snapshot.docs.length);

      if (checks.length >= 1) {
        setLastWeight(parseFloat(checks[0].weight));
      }

      if (checks.length >= 2) {
        const latest = parseFloat(checks[0].weight);
        const previous = parseFloat(checks[checks.length - 1].weight);
        setWeightChange(latest - previous);
      }

      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento progressi:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 animate-pulse">
        <div className="h-16 bg-slate-700/30 rounded-lg" />
      </div>
    );
  }

  if (checksCount === 0) {
    // Non mostrare nulla - già c'è CheckReminderCard sopra
    return null;
  }

  const TrendIcon = weightChange === null ? Minus : weightChange > 0 ? TrendingUp : TrendingDown;
  const trendColor = weightChange === null 
    ? 'text-slate-400' 
    : weightChange > 0 
      ? 'text-orange-400' 
      : 'text-emerald-400';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/client/checks')}
      className="w-full bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 hover:border-slate-600/50 transition-all text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <Scale size={18} className="text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                {lastWeight?.toFixed(1)} kg
              </span>
              {weightChange !== null && (
                <span className={`text-xs font-medium flex items-center gap-0.5 ${trendColor}`}>
                  <TrendIcon size={12} />
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              {checksCount} check totali
            </p>
          </div>
        </div>
        
        {/* Mini sparkline placeholder */}
        <div className="flex items-end gap-0.5 h-6">
          {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
            <div 
              key={i} 
              className="w-1 bg-blue-500/40 rounded-full" 
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </motion.button>
  );
}
