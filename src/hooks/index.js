// src/hooks/index.js
// Export centralizzato degli hooks custom

// Debounce hooks
export { 
  useDebounce, 
  useDebouncedCallback, 
  useDebouncedValue 
} from './useDebounce';

// Online status
export { default as useOnlineStatus } from './useOnlineStatus';

// Keyboard shortcuts
export { 
  useKeyboardShortcut, 
  useEscapeKey, 
  useSaveShortcut, 
  useKeyboardShortcuts 
} from './useKeyboardShortcut';

// Form validation
export { 
  useFormValidation, 
  validators 
} from './useFormValidation';

// Document title & SEO
export { 
  useDocumentTitle, 
  useSEO 
} from './useDocumentTitle';
