import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

/**
 * SidebarDetailLayout - Layout con sidebar fissa per pagine dettaglio
 * 
 * @param {React.ReactNode} sidebar - Contenuto sidebar (info, azioni)
 * @param {React.ReactNode} children - Contenuto principale
 * @param {string} title - Titolo pagina (mobile)
 * @param {function} onBack - Callback per tornare indietro
 * @param {React.ReactNode} headerActions - Azioni header (mobile)
 */
export default function SidebarDetailLayout({
  sidebar,
  children,
  title,
  onBack,
  headerActions,
  sidebarWidth = "320px"
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1b2735] to-[#090a0f]">
      {/* Header Mobile */}
      <div className="lg:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-400" />
              </button>
            )}
            <h1 className="text-lg font-bold text-slate-100 truncate">{title}</h1>
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      </div>

      {/* Layout Desktop: Sidebar + Content */}
      <div className="lg:flex lg:h-screen">
        {/* Sidebar Desktop - Sticky */}
        <aside 
          className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bg-slate-900/50 border-r border-slate-700"
          style={{ width: sidebarWidth }}
        >
          <div className="p-6">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 mb-6 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-slate-100"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Indietro</span>
              </button>
            )}
            {sidebar}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:h-screen lg:overflow-y-auto">
          <div className="p-4 lg:p-6 xl:p-8">
            {/* Sidebar Mobile - Collapsible */}
            <div className="lg:hidden mb-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                {sidebar}
              </div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * SidebarSection - Sezione della sidebar
 */
export function SidebarSection({ title, children, icon: Icon, className = "" }) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
          {Icon && <Icon size={18} className="text-slate-400" />}
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

/**
 * SidebarInfoRow - Riga informazioni nella sidebar
 */
export function SidebarInfoRow({ label, value, icon: Icon, valueClassName = "text-slate-200" }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        {Icon && <Icon size={16} />}
        <span>{label}</span>
      </div>
      <div className={`text-sm font-medium ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}

/**
 * SidebarButton - Pulsante full-width per sidebar
 */
export function SidebarButton({ 
  children, 
  onClick, 
  variant = "primary", 
  icon: Icon,
  disabled = false 
}) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

/**
 * SidebarBadge - Badge di stato nella sidebar
 */
export function SidebarBadge({ label, variant = "default" }) {
  const variants = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
    info: "bg-blue-500/20 text-blue-400 border border-blue-500/30"
  };

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
