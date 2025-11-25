// src/components/admin/ResizableCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * Card Ridimensionabile con drag handles
 */
export default function ResizableCard({ 
  children, 
  minWidth = 300, 
  minHeight = 200,
  maxWidth = 1200,
  maxHeight = 800,
  defaultWidth,
  defaultHeight,
  storageKey,
  className = '',
  isCustomizing = false
}) {
  const [size, setSize] = useState({ 
    width: defaultWidth || minWidth, 
    height: defaultHeight || minHeight 
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const cardRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  // Carica dimensioni salvate
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`resize_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSize(parsed);
      }
    }
  }, [storageKey]);

  // Salva dimensioni
  const saveSize = (newSize) => {
    if (storageKey) {
      localStorage.setItem(`resize_${storageKey}`, JSON.stringify(newSize));
    }
  };

  // Inizio resize
  const handleMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };

    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Durante resize
  const handleMouseMove = (e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;

    let newWidth = startSize.current.width;
    let newHeight = startSize.current.height;

    // Calcola nuove dimensioni in base alla direzione
    if (resizeDirection.includes('right')) {
      newWidth = Math.min(maxWidth, Math.max(minWidth, startSize.current.width + deltaX));
    }
    if (resizeDirection.includes('left')) {
      newWidth = Math.min(maxWidth, Math.max(minWidth, startSize.current.width - deltaX));
    }
    if (resizeDirection.includes('bottom')) {
      newHeight = Math.min(maxHeight, Math.max(minHeight, startSize.current.height + deltaY));
    }
    if (resizeDirection.includes('top')) {
      newHeight = Math.min(maxHeight, Math.max(minHeight, startSize.current.height - deltaY));
    }

    setSize({ width: newWidth, height: newHeight });
  };

  // Fine resize
  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      setResizeDirection(null);
      saveSize(size);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (size.width === maxWidth && size.height === maxHeight) {
      // Restore to default
      const newSize = { 
        width: defaultWidth || minWidth, 
        height: defaultHeight || minHeight 
      };
      setSize(newSize);
      saveSize(newSize);
    } else {
      // Go fullscreen
      const newSize = { width: maxWidth, height: maxHeight };
      setSize(newSize);
      saveSize(newSize);
    }
  };

  // Resize handles configuration
  const handles = [
    { position: 'top', cursor: 'ns-resize', className: 'top-0 left-0 right-0 h-2' },
    { position: 'bottom', cursor: 'ns-resize', className: 'bottom-0 left-0 right-0 h-2' },
    { position: 'left', cursor: 'ew-resize', className: 'left-0 top-0 bottom-0 w-2' },
    { position: 'right', cursor: 'ew-resize', className: 'right-0 top-0 bottom-0 w-2' },
    { position: 'top-left', cursor: 'nwse-resize', className: 'top-0 left-0 w-4 h-4' },
    { position: 'top-right', cursor: 'nesw-resize', className: 'top-0 right-0 w-4 h-4' },
    { position: 'bottom-left', cursor: 'nesw-resize', className: 'bottom-0 left-0 w-4 h-4' },
    { position: 'bottom-right', cursor: 'nwse-resize', className: 'bottom-0 right-0 w-4 h-4' },
  ];

  return (
    <motion.div
      ref={cardRef}
      style={{ 
        width: size.width, 
        height: size.height,
        maxWidth: '100%' // Responsive
      }}
      className={`relative group ${className}`}
      animate={{ 
        scale: isResizing ? 1.02 : 1,
        boxShadow: isResizing ? '0 20px 25px -5px rgba(0, 0, 0, 0.3)' : '0 0 0 0 rgba(0, 0, 0, 0)'
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Content */}
      <div className="w-full h-full overflow-hidden">
        {children}
      </div>

      {/* Fullscreen Toggle Button */}
      {isCustomizing && (
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
          onClick={toggleFullscreen}
          title={size.width === maxWidth ? 'Ripristina' : 'Schermo intero'}
        >
          {size.width === maxWidth && size.height === maxHeight ? (
            <Minimize2 size={16} />
          ) : (
            <Maximize2 size={16} />
          )}
        </motion.button>
      )}

      {/* Resize Handles */}
      {isCustomizing && handles.map(handle => (
        <div
          key={handle.position}
          className={`absolute ${handle.className} opacity-0 group-hover:opacity-100 transition-opacity z-20`}
          style={{ cursor: handle.cursor }}
          onMouseDown={(e) => handleMouseDown(e, handle.position)}
        >
          {/* Visual indicator for corners */}
          {handle.position.includes('-') && (
            <div className={`w-full h-full border-2 border-blue-500/50 rounded-full ${
              isResizing && resizeDirection === handle.position ? 'bg-blue-500/30' : 'bg-transparent'
            }`} />
          )}
        </div>
      ))}

      {/* Resize Guide (visible durante resize) */}
      {isResizing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-xl pointer-events-none bg-blue-500/5 z-30"
        >
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-mono rounded">
            {Math.round(size.width)} × {Math.round(size.height)}
          </div>
        </motion.div>
      )}

      {/* Guide hints */}
      <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-xs text-slate-500">
          💡 Trascina i bordi per ridimensionare
        </p>
      </div>
    </motion.div>
  );
}
