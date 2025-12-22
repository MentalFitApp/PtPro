// src/components/layout/PageHeader.jsx
// Header contestuale per le pagine con breadcrumbs e azioni
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageContext } from '../../contexts/PageContext';

/**
 * PageHeader - Header contestuale leggero per le pagine
 * Mostra breadcrumbs, titolo e pulsante indietro quando definiti nel PageContext
 */
const PageHeader = ({ 
  className = '',
  showBreadcrumbs = true,
  showBackButton = true,
  showTitle = false, // Di default non mostra titolo (è già nella pagina)
  compact = false
}) => {
  const navigate = useNavigate();
  const { pageTitle, breadcrumbs, backButton } = usePageContext();

  // Se non ci sono breadcrumbs e non c'è back button, non mostrare nulla
  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;
  const hasBackButton = backButton && backButton.onClick;
  
  if (!hasBreadcrumbs && !hasBackButton && !showTitle) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 ${compact ? 'mb-3' : 'mb-4 lg:mb-6'} ${className}`}
    >
      {/* Back Button */}
      {showBackButton && hasBackButton && (
        <motion.button
          onClick={backButton.onClick}
          whileHover={{ x: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 text-theme-text-secondary hover:text-theme-text-primary transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium hidden sm:inline">{backButton.label || 'Indietro'}</span>
        </motion.button>
      )}

      {/* Breadcrumbs */}
      {showBreadcrumbs && hasBreadcrumbs && (
        <nav className="flex items-center gap-1.5 text-sm overflow-hidden">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight size={14} className="text-theme-text-tertiary flex-shrink-0" />
              )}
              {index === 0 && crumb.to && (
                <Home size={14} className="text-theme-text-tertiary mr-1 flex-shrink-0" />
              )}
              {crumb.to ? (
                <motion.button
                  onClick={() => navigate(crumb.to)}
                  whileHover={{ scale: 1.02 }}
                  className="text-theme-text-secondary hover:text-theme-text-primary transition-colors truncate max-w-[120px] sm:max-w-none"
                >
                  {crumb.label}
                </motion.button>
              ) : (
                <span className="text-theme-text-primary font-medium truncate max-w-[150px] sm:max-w-none">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title (opzionale) */}
      {showTitle && pageTitle && (
        <h1 className="text-lg font-semibold text-theme-text-primary ml-auto">
          {pageTitle}
        </h1>
      )}
    </motion.div>
  );
};

/**
 * InlineBackButton - Pulsante indietro standalone
 * Da usare inline nelle pagine
 */
export const InlineBackButton = ({ 
  label = 'Indietro', 
  onClick, 
  to,
  className = '' 
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ x: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 text-theme-text-secondary hover:text-theme-text-primary transition-all group ${className}`}
    >
      <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
};

export default PageHeader;
