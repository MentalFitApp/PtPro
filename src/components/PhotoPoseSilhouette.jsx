import React from 'react';
import { User, UserCircle } from 'lucide-react';

/**
 * Componente PhotoPoseSilhouette - Guida visiva per le foto check/anamnesi
 * Usa icone riconoscibili + testo chiaro per indicare la posa
 */

const poseConfig = {
  front: { 
    label: 'Frontale', 
    hint: 'Di fronte',
    emoji: '🧍',
    rotation: 0
  },
  right: { 
    label: 'Lat. Destro', 
    hint: '← Gira a SX',
    emoji: '🧍',
    rotation: -90
  },
  left: { 
    label: 'Lat. Sinistro', 
    hint: 'Gira a DX →',
    emoji: '🧍',
    rotation: 90
  },
  back: { 
    label: 'Posteriore', 
    hint: 'Di spalle',
    emoji: '🧍',
    rotation: 180
  }
};

/**
 * Componente principale PhotoPoseSilhouette
 */
export const PhotoPoseSilhouette = ({ 
  position = 'front', 
  size = 80, 
  showHint = true,
  className = '' 
}) => {
  const config = poseConfig[position] || poseConfig.front;
  const iconSize = Math.max(32, size * 0.6);
  
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {/* Contenitore icona con indicatore direzione */}
      <div 
        className="relative flex items-center justify-center rounded-lg bg-slate-700/30 border border-slate-600/50"
        style={{ width: size, height: size * 1.3 }}
      >
        {/* Icona persona */}
        <div 
          className="flex items-center justify-center"
          style={{ 
            transform: position === 'back' ? 'scaleX(-1)' : 'none',
            opacity: position === 'back' ? 0.6 : 1
          }}
        >
          <User 
            size={iconSize} 
            className="text-slate-400"
            strokeWidth={1.5}
          />
        </div>
        
        {/* Indicatori di direzione per laterali */}
        {position === 'right' && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-cyan-400 text-lg font-bold animate-pulse">
            ←
          </div>
        )}
        {position === 'left' && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-cyan-400 text-lg font-bold animate-pulse">
            →
          </div>
        )}
        
        {/* Badge posizione */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-800 rounded text-[9px] font-medium text-slate-300 whitespace-nowrap border border-slate-600/50">
          {config.label}
        </div>
        
        {/* Indicatore schiena */}
        {position === 'back' && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">
            (schiena)
          </div>
        )}
        
        {/* Indicatore fronte - occhi stilizzati */}
        {position === 'front' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
          </div>
        )}
      </div>
      
      {/* Hint testuale */}
      {showHint && (
        <p className="text-[10px] text-slate-500 text-center font-medium">
          {config.hint}
        </p>
      )}
    </div>
  );
};

export default PhotoPoseSilhouette;
