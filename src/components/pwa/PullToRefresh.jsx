// src/components/pwa/PullToRefresh.jsx
// Componente Pull-to-Refresh per mobile

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

/**
 * Wrapper Pull-to-Refresh per contenuti scrollabili
 * 
 * @example
 * <PullToRefresh onRefresh={async () => await loadData()}>
 *   <YourContent />
 * </PullToRefresh>
 */
export default function PullToRefresh({ 
  children, 
  onRefresh,
  threshold = 80, // px da trascinare per attivare refresh
  resistance = 2.5, // resistenza al pull (più alto = più resistenza)
  refreshingText = 'Aggiornamento...',
  pullText = 'Tira per aggiornare',
  releaseText = 'Rilascia per aggiornare',
  disabled = false
}) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [canRelease, setCanRelease] = useState(false);
  
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const controls = useAnimation();

  // Verifica se siamo in cima allo scroll
  const isAtTop = useCallback(() => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop <= 0;
  }, []);

  // Touch Start
  const handleTouchStart = useCallback((e) => {
    if (disabled || refreshing || !isAtTop()) return;
    
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [disabled, refreshing, isAtTop]);

  // Touch Move
  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || disabled || refreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = (currentY.current - startY.current) / resistance;
    
    if (distance > 0 && isAtTop()) {
      setPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));
      setCanRelease(distance >= threshold);
      
      // Previeni scroll normale quando stiamo facendo pull
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, refreshing, isAtTop, threshold, resistance]);

  // Touch End
  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    if (canRelease && onRefresh && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold / 2); // Mantieni indicatore visibile
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Errore durante il refresh:', error);
      } finally {
        setRefreshing(false);
      }
    }
    
    // Reset
    setPulling(false);
    setPullDistance(0);
    setCanRelease(false);
  }, [canRelease, onRefresh, refreshing, threshold]);

  // Mouse events per desktop (opzionale)
  const handleMouseDown = useCallback((e) => {
    if (disabled || refreshing || !isAtTop()) return;
    
    startY.current = e.clientY;
    isDragging.current = true;
    
    // Aggiungi listener globali per mouse
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [disabled, refreshing, isAtTop]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || disabled || refreshing) return;
    
    const distance = (e.clientY - startY.current) / resistance;
    
    if (distance > 0) {
      setPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));
      setCanRelease(distance >= threshold);
    }
  }, [disabled, refreshing, threshold, resistance]);

  const handleMouseUp = useCallback(async () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    isDragging.current = false;
    
    if (canRelease && onRefresh && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold / 2);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Errore durante il refresh:', error);
      } finally {
        setRefreshing(false);
      }
    }
    
    setPulling(false);
    setPullDistance(0);
    setCanRelease(false);
  }, [canRelease, onRefresh, refreshing, threshold, handleMouseMove]);

  // Cleanup listener
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Calcola opacità e scala dell'indicatore
  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const indicatorScale = 0.5 + (Math.min(pullDistance / threshold, 1) * 0.5);
  const rotation = refreshing ? 360 : (pullDistance / threshold) * 180;

  return (
    <div 
      ref={containerRef}
      className="relative h-full overflow-y-auto overflow-x-hidden overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{ touchAction: pulling ? 'none' : 'auto' }}
    >
      {/* Indicatore Pull-to-Refresh */}
      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10"
        style={{ 
          top: -60,
          height: 60,
          transform: `translateY(${pullDistance}px)`
        }}
        animate={{ opacity: indicatorOpacity }}
      >
        <motion.div
          className={`
            p-3 rounded-full shadow-lg
            ${canRelease || refreshing 
              ? 'bg-indigo-500 text-white' 
              : 'bg-slate-700 text-slate-300'
            }
          `}
          style={{ scale: indicatorScale }}
          animate={{ rotate: refreshing ? [0, 360] : rotation }}
          transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
        >
          {refreshing ? (
            <RefreshCw className="w-5 h-5" />
          ) : (
            <ArrowDown className={`w-5 h-5 transition-transform ${canRelease ? 'rotate-180' : ''}`} />
          )}
        </motion.div>
        
        <span className={`
          mt-2 text-xs font-medium transition-colors
          ${canRelease || refreshing ? 'text-indigo-400' : 'text-slate-500'}
        `}>
          {refreshing ? refreshingText : canRelease ? releaseText : pullText}
        </span>
      </motion.div>

      {/* Contenuto con offset durante il pull */}
      <motion.div
        style={{ 
          transform: pulling || refreshing ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: pulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Hook per usare pull-to-refresh manualmente
 */
export function usePullToRefresh(onRefresh, { threshold = 80, resistance = 2.5 } = {}) {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  return { refreshing, refresh };
}
