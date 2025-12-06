// src/components/layout/ProHeader.jsx
// Header professionale con tabs contestuali
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Search, Bell, Plus } from 'lucide-react';

// === BREADCRUMB ===
const Breadcrumb = ({ items }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-2 text-sm">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight size={14} className="text-slate-600" />}
          {item.to ? (
            <button
              onClick={() => navigate(item.to)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              {item.icon && <item.icon size={16} className="inline mr-1.5" />}
              {item.label}
            </button>
          ) : (
            <span className="text-slate-200 font-medium">
              {item.icon && <item.icon size={16} className="inline mr-1.5" />}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// === TABS ===
const Tabs = ({ tabs, activeTab, onTabChange }) => {
  if (!tabs || tabs.length === 0) return null;
  
  return (
    <div className="flex items-center gap-1 border-b border-slate-700/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          )}
        </button>
      ))}
    </div>
  );
};

// === ACTION BUTTON ===
const ActionButton = ({ icon: Icon, label, onClick, variant = 'primary' }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    ghost: 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
  };
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]}`}
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );
};

// === MAIN HEADER ===
export const ProHeader = ({
  title,
  subtitle,
  breadcrumb = [],
  tabs = [],
  activeTab,
  onTabChange,
  actions = [],
  showSearch = false,
  onSearch,
  className = ''
}) => {
  return (
    <header className={`bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 ${className}`}>
      {/* Top bar con breadcrumb e azioni */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {breadcrumb.length > 0 && (
              <Breadcrumb items={breadcrumb} />
            )}
            
            <div className="mt-2 flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
              {subtitle && (
                <span className="text-sm text-slate-400">{subtitle}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showSearch && (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cerca..."
                  onChange={(e) => onSearch?.(e.target.value)}
                  className="w-64 pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}
            
            {actions.map((action, idx) => (
              <ActionButton key={idx} {...action} />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="px-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      )}
    </header>
  );
};

// === PAGE HEADER SEMPLIFICATO ===
export const SimplePageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions = [],
  className = ''
}) => {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <Icon size={24} className="text-blue-400" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          {subtitle && (
            <p className="text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      
      {actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action, idx) => (
            <ActionButton key={idx} {...action} />
          ))}
        </div>
      )}
    </div>
  );
};

// === CLIENT DETAIL HEADER ===
export const ClientDetailHeader = ({
  client,
  tabs = [],
  activeTab,
  onTabChange,
  actions = [],
  onBack
}) => {
  return (
    <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-30">
      {/* Client info bar */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
            )}
            
            <img
              src={client?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(client?.name || 'C')}&background=3b82f6&color=fff`}
              alt={client?.name}
              className="w-12 h-12 rounded-full ring-2 ring-slate-700"
            />
            
            <div>
              <h1 className="text-xl font-bold text-slate-100">{client?.name}</h1>
              <p className="text-sm text-slate-400">{client?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actions.map((action, idx) => (
              <ActionButton key={idx} {...action} />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="px-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      )}
    </header>
  );
};

export default ProHeader;
