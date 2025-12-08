// src/hooks/useKeyboardShortcut.jsx
// Hook per gestire scorciatoie da tastiera

import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook per registrare una scorciatoia da tastiera
 * 
 * @param keys - Combinazione di tasti (es: 'ctrl+s', 'escape', 'ctrl+shift+p')
 * @param callback - Funzione da eseguire
 * @param options - Opzioni aggiuntive
 */
export function useKeyboardShortcut(keys, callback, options = {}) {
  const {
    enabled = true,
    preventDefault = true,
    enableOnInputs = false,
    target = document
  } = options;

  const callbackRef = useRef(callback);

  // Mantieni il callback aggiornato
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Non eseguire se siamo in un input e enableOnInputs è false
    if (!enableOnInputs) {
      const tagName = event.target.tagName.toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      const isContentEditable = event.target.isContentEditable;
      
      if (isInput || isContentEditable) {
        // Permetti comunque Escape
        if (event.key !== 'Escape') {
          return;
        }
      }
    }

    // Parsa la combinazione di tasti
    const keyCombo = keys.toLowerCase().split('+');
    const key = keyCombo[keyCombo.length - 1];
    const modifiers = keyCombo.slice(0, -1);

    // Verifica i modificatori
    const ctrlRequired = modifiers.includes('ctrl') || modifiers.includes('control');
    const shiftRequired = modifiers.includes('shift');
    const altRequired = modifiers.includes('alt');
    const metaRequired = modifiers.includes('meta') || modifiers.includes('cmd');

    const ctrlPressed = event.ctrlKey || event.metaKey; // Supporta sia Ctrl che Cmd (Mac)
    const shiftPressed = event.shiftKey;
    const altPressed = event.altKey;
    const metaPressed = event.metaKey;

    // Mappa tasti speciali
    const keyMap = {
      'escape': 'Escape',
      'esc': 'Escape',
      'enter': 'Enter',
      'space': ' ',
      'backspace': 'Backspace',
      'delete': 'Delete',
      'tab': 'Tab',
      'arrowup': 'ArrowUp',
      'arrowdown': 'ArrowDown',
      'arrowleft': 'ArrowLeft',
      'arrowright': 'ArrowRight',
    };

    const targetKey = keyMap[key] || key;
    const pressedKey = event.key.toLowerCase();
    const matchesKey = pressedKey === targetKey.toLowerCase() || event.code.toLowerCase() === `key${key}`;

    // Verifica se tutti i modificatori e il tasto corrispondono
    const matchesModifiers = 
      (ctrlRequired === ctrlPressed || (ctrlRequired && metaPressed)) &&
      shiftRequired === shiftPressed &&
      altRequired === altPressed &&
      (!metaRequired || metaPressed);

    if (matchesKey && matchesModifiers) {
      if (preventDefault) {
        event.preventDefault();
      }
      callbackRef.current(event);
    }
  }, [keys, enabled, preventDefault, enableOnInputs]);

  useEffect(() => {
    const targetElement = target === document ? document : target;
    targetElement.addEventListener('keydown', handleKeyDown);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, target]);
}

/**
 * Hook per chiudere modali con Escape
 */
export function useEscapeKey(callback, enabled = true) {
  useKeyboardShortcut('escape', callback, { 
    enabled, 
    preventDefault: false,
    enableOnInputs: true 
  });
}

/**
 * Hook per salvare con Ctrl+S
 */
export function useSaveShortcut(callback, enabled = true) {
  useKeyboardShortcut('ctrl+s', callback, { enabled });
}

/**
 * Hook per registrare multiple scorciatoie
 */
export function useKeyboardShortcuts(shortcuts, options = {}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!options.enabled && options.enabled !== undefined) return;

      // Non eseguire se siamo in un input
      if (!options.enableOnInputs) {
        const tagName = event.target.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
        const isContentEditable = event.target.isContentEditable;
        
        if ((isInput || isContentEditable) && event.key !== 'Escape') {
          return;
        }
      }

      for (const { keys, callback, preventDefault = true } of shortcuts) {
        const keyCombo = keys.toLowerCase().split('+');
        const key = keyCombo[keyCombo.length - 1];
        const modifiers = keyCombo.slice(0, -1);

        const ctrlRequired = modifiers.includes('ctrl') || modifiers.includes('control');
        const shiftRequired = modifiers.includes('shift');
        const altRequired = modifiers.includes('alt');

        const ctrlPressed = event.ctrlKey || event.metaKey;
        const shiftPressed = event.shiftKey;
        const altPressed = event.altKey;

        const keyMap = {
          'escape': 'Escape',
          'esc': 'Escape',
          'enter': 'Enter',
          'space': ' ',
        };

        const targetKey = keyMap[key] || key;
        const pressedKey = event.key.toLowerCase();
        const matchesKey = pressedKey === targetKey.toLowerCase();

        const matchesModifiers = 
          ctrlRequired === ctrlPressed &&
          shiftRequired === shiftPressed &&
          altRequired === altPressed;

        if (matchesKey && matchesModifiers) {
          if (preventDefault) {
            event.preventDefault();
          }
          callback(event);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, options]);
}

export default useKeyboardShortcut;
