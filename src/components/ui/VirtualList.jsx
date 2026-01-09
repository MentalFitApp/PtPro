// src/components/ui/VirtualList.jsx
// Componente per virtualizzazione liste lunghe - performance ottimale

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Lista virtualizzata per performance con liste lunghe
 * Rende solo gli elementi visibili nel viewport
 */
export function VirtualList({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calcola quali elementi sono visibili
  const { visibleStart, visibleEnd, offsetY } = React.useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    const offset = start * itemHeight;

    return {
      visibleStart: start,
      visibleEnd: end,
      offsetY: offset
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Handler scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);

    // Controlla se siamo vicini alla fine per lazy loading
    if (onEndReached) {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage >= endReachedThreshold) {
        onEndReached();
      }
    }
  }, [onEndReached, endReachedThreshold]);

  // Elementi visibili
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleStart + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Grid virtualizzata per card layout
 */
export function VirtualGrid({
  items,
  itemHeight,
  itemsPerRow,
  containerHeight,
  gap = 16,
  renderItem,
  overscan = 1,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calcola righe visibili
  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / itemsPerRow);

  const { visibleStart, visibleEnd, offsetY } = React.useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);
    const endRow = Math.min(totalRows, startRow + visibleRowCount + overscan * 2);
    const offset = startRow * rowHeight;

    return {
      visibleStart: startRow,
      visibleEnd: endRow,
      offsetY: offset
    };
  }, [scrollTop, rowHeight, containerHeight, totalRows, overscan]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);

    if (onEndReached) {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage >= endReachedThreshold) {
        onEndReached();
      }
    }
  }, [onEndReached, endReachedThreshold]);

  // Crea righe visibili
  const visibleRows = [];
  for (let row = visibleStart; row < visibleEnd; row++) {
    const rowItems = [];
    for (let col = 0; col < itemsPerRow; col++) {
      const index = row * itemsPerRow + col;
      if (index < items.length) {
        rowItems.push(items[index]);
      }
    }
    if (rowItems.length > 0) {
      visibleRows.push({ row, items: rowItems });
    }
  }

  const totalHeight = totalRows * rowHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleRows.map(({ row, items: rowItems }) => (
            <div
              key={row}
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
                gap: `${gap}px`,
                marginBottom: `${gap}px`
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={row * itemsPerRow + colIndex}>
                  {renderItem(item, row * itemsPerRow + colIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook per auto-sizing dell'altezza del container
 */
export function useContainerHeight(ref, defaultHeight = 600) {
  const [height, setHeight] = useState(defaultHeight);

  useEffect(() => {
    if (!ref.current) return;

    const updateHeight = () => {
      const rect = ref.current.getBoundingClientRect();
      const availableHeight = window.innerHeight - rect.top - 40; // 40px padding
      setHeight(Math.max(300, availableHeight));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [ref]);

  return height;
}

/**
 * Hook per calcolare dinamicamente items per riga in base alla larghezza
 */
export function useResponsiveColumns(breakpoints = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }) {
  const [columns, setColumns] = useState(breakpoints.md || 3);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      
      if (width < 640) setColumns(breakpoints.xs || 1);
      else if (width < 768) setColumns(breakpoints.sm || 2);
      else if (width < 1024) setColumns(breakpoints.md || 3);
      else if (width < 1280) setColumns(breakpoints.lg || 4);
      else setColumns(breakpoints.xl || 5);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [breakpoints]);

  return columns;
}

export default VirtualList;
