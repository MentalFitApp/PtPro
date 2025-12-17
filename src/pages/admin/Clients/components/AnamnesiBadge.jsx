// src/pages/admin/Clients/components/AnamnesiBadge.jsx
import React from 'react';
import { FileText } from 'lucide-react';

/**
 * Badge per indicare stato anamnesi cliente
 */
const AnamnesiBadge = ({ hasAnamnesi }) => (
  <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 border transition-all ${
    hasAnamnesi 
      ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/60' 
      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/70'
  }`}>
    <FileText size={12} /> {hasAnamnesi ? 'Inviata' : 'Non Inviata'}
  </span>
);

export default AnamnesiBadge;
