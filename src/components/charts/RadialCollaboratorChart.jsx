import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Trophy } from 'lucide-react';

const RadialCollaboratorChart = ({ collaboratori = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // Configurazione colori
  const colors = [
    '#f43f5e', // rose
    '#f59e0b', // amber
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#0ea5e9', // sky
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  
  // Determina il giorno corrente della settimana (0=Dom, 1=Lun, ... 6=Sab)
  const today = new Date().getDay();
  const currentDayIndex = today === 0 ? 6 : today - 1; // Converti: Lun=0, Mar=1, ... Dom=6
  
  // Prepara dati per Recharts - progressione cumulativa fino ad oggi incluso
  const chartData = days.map((day, dayIndex) => {
    const dayData = { day };
    collaboratori.forEach(collab => {
      if (dayIndex <= currentDayIndex) {
        // Giorni passati fino a oggi: somma progressiva includendo il giorno stesso
        let cumulative = 0;
        for (let i = 0; i <= dayIndex; i++) {
          cumulative += collab.weekCalls?.[i] || 0;
        }
        dayData[collab.name] = cumulative;
      } else {
        // Giorni futuri: null (non mostrare la linea)
        dayData[collab.name] = null;
      }
    });
    return dayData;
  });

  // Calcola totali settimanali per posizionamento foto
  const collaboratorsWithTotals = collaboratori.map((collab, index) => {
    const total = (collab.weekCalls || []).reduce((sum, val) => sum + val, 0);
    return {
      ...collab,
      total,
      color: colors[index % colors.length]
    };
  }).sort((a, b) => b.total - a.total); // Ordina per totale (primo in alto)

  const maxTotal = Math.max(...collaboratorsWithTotals.map(c => c.total), 1);
  const maxCalls = Math.ceil(maxTotal * 1.1); // +10% padding

  if (collaboratori.length === 0) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-10 border border-slate-700/50 text-center">
        <p className="text-slate-400">Nessun collaboratore trovato</p>
      </div>
    );
  }

  const winner = collaboratorsWithTotals[0];

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-slate-700/50">
      <div className="text-center mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
          🏆 Gara Settimanale
        </h2>
        <p className="text-slate-400 text-[10px] sm:text-xs">Chiamate prenotate</p>
      </div>

      {/* GRAFICO CON LINEE - Progressione Cumulativa */}
      <div className="h-[280px] sm:h-[320px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#334155" strokeOpacity={0.3} />
            <XAxis 
              dataKey="day" 
              stroke="#94a3b8" 
              fontSize={13}
              fontWeight={600}
              tick={{ fill: '#cbd5e1' }}
            />
            <YAxis 
              domain={[0, maxCalls]} 
              stroke="#94a3b8" 
              fontSize={12}
              fontWeight={600}
              tick={{ fill: '#cbd5e1' }}
              label={{ 
                value: 'Chiamate Totali', 
                angle: -90, 
                position: 'insideLeft',
                fill: '#cbd5e1',
                fontSize: 13,
                fontWeight: 600
              }}
            />

            {collaboratorsWithTotals.map((collab) => (
              <Line
                key={collab.name}
                type="monotone"
                dataKey={collab.name}
                stroke={collab.color}
                strokeWidth={hoveredIndex === collab.name ? 5 : 3}
                dot={{ r: 4, fill: collab.color, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ 
                  r: 7,
                  fill: collab.color,
                  stroke: '#fff',
                  strokeWidth: 3
                }}
                connectNulls={false}
                style={{
                  opacity: hoveredIndex && hoveredIndex !== collab.name ? 0.25 : 1,
                  filter: hoveredIndex === collab.name ? `drop-shadow(0 0 10px ${collab.color})` : 'none',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={() => setHoveredIndex(collab.name)}
                onMouseLeave={() => setHoveredIndex(null)}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* PODIO CON MEDAGLIE */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-2 sm:p-3 mb-3">
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
          {collaboratorsWithTotals.map((collab, index) => {
            const isHovered = hoveredIndex === collab.name;
            
            // Medaglie per le posizioni
            const medals = ['💎', '🥇', '🥈', '🥉'];
            const medal = medals[index] || '🏅';

            return (
              <motion.div
                key={collab.name}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1,
                  scale: isHovered ? 1.08 : 1
                }}
                transition={{ 
                  duration: 0.4,
                  delay: index * 0.08
                }}
                style={{
                  backgroundColor: isHovered ? `${collab.color}25` : 'rgba(30, 41, 59, 0.6)',
                  border: `2px solid ${collab.color}`,
                  boxShadow: isHovered ? `0 0 12px ${collab.color}70` : 'none'
                }}
                onMouseEnter={() => setHoveredIndex(collab.name)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Medaglia */}
                <motion.span 
                  className="text-lg sm:text-xl"
                  animate={index === 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                >
                  {medal}
                </motion.span>

                {/* Foto piccola */}
                <motion.img
                  src={collab.photoURL || '/default-avatar.png'}
                  alt={collab.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-lg"
                  style={{
                    border: `2px solid ${collab.color}`,
                    filter: isHovered ? `drop-shadow(0 0 6px ${collab.color})` : 'none'
                  }}
                  whileHover={{ scale: 1.15 }}
                />

                {/* Nome breve + Totale */}
                <div className="flex flex-col">
                  <p className="text-[10px] sm:text-xs font-bold text-white leading-tight">{collab.name}</p>
                  <p 
                    className="text-xs sm:text-sm font-bold leading-tight"
                    style={{ color: collab.color }}
                  >
                    {collab.total}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 text-center text-slate-500 text-[10px]">
        Medaglie: 💎 Diamante | 🥇 Oro | 🥈 Argento | 🥉 Bronzo
      </div>
    </div>
  );
};

export default RadialCollaboratorChart;
