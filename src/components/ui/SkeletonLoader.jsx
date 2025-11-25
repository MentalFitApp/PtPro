import React from 'react';
import { motion } from 'framer-motion';

/**
 * Skeleton Loader - Componente riutilizzabile per stati di caricamento
 * Mostra placeholder animati mentre i dati vengono caricati
 */

// Skeleton Base
export const Skeleton = ({ className = '', width = 'w-full', height = 'h-4' }) => (
  <div className={`${width} ${height} bg-slate-700/50 rounded-lg animate-pulse ${className}`} />
);

// Skeleton per Card
export const SkeletonCard = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 shadow-xl"
  >
    <div className="flex items-center justify-between mb-3">
      <Skeleton width="w-12" height="h-12" className="rounded-lg" />
      <Skeleton width="w-8" height="h-8" className="rounded-full" />
    </div>
    <Skeleton width="w-20" height="h-8" className="mb-2" />
    <Skeleton width="w-32" height="h-4" className="mb-1" />
    <Skeleton width="w-24" height="h-3" />
  </motion.div>
);

// Skeleton per Lista
export const SkeletonList = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50"
      >
        <div className="flex items-center gap-3">
          <Skeleton width="w-12" height="h-12" className="rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton width="w-48" height="h-4" className="mb-2" />
            <Skeleton width="w-64" height="h-3" />
          </div>
          <Skeleton width="w-16" height="h-8" className="rounded-lg" />
        </div>
      </motion.div>
    ))}
  </div>
);

// Skeleton per Tabella
export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
    {/* Header */}
    <div className="bg-slate-900/60 p-4 border-b border-slate-700/50 flex gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} width="flex-1" height="h-4" />
      ))}
    </div>
    {/* Rows */}
    <div className="divide-y divide-slate-700/30">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="p-4 flex gap-4"
        >
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} width="flex-1" height="h-4" />
          ))}
        </motion.div>
      ))}
    </div>
  </div>
);

// Skeleton per Profilo
export const SkeletonProfile = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50"
  >
    <div className="flex items-start gap-4 mb-6">
      <Skeleton width="w-24" height="h-24" className="rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton width="w-48" height="h-6" className="mb-2" />
        <Skeleton width="w-64" height="h-4" className="mb-2" />
        <Skeleton width="w-32" height="h-4" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton width="w-24" height="h-3" className="mb-2" />
          <Skeleton width="w-full" height="h-4" />
        </div>
      ))}
    </div>
  </motion.div>
);

// Skeleton per Dashboard
export const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    
    {/* Chart Placeholder */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50"
    >
      <Skeleton width="w-48" height="h-6" className="mb-4" />
      <Skeleton width="w-full" height="h-64" />
    </motion.div>

    {/* Recent Activity */}
    <SkeletonList count={3} />
  </div>
);

// Skeleton per Post Community
export const SkeletonPost = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50"
  >
    <div className="flex items-center gap-3 mb-4">
      <Skeleton width="w-10" height="h-10" className="rounded-full" />
      <div className="flex-1">
        <Skeleton width="w-32" height="h-4" className="mb-1" />
        <Skeleton width="w-24" height="h-3" />
      </div>
    </div>
    <Skeleton width="w-full" height="h-4" className="mb-2" />
    <Skeleton width="w-5/6" height="h-4" className="mb-2" />
    <Skeleton width="w-4/6" height="h-4" className="mb-4" />
    <Skeleton width="w-full" height="h-48" className="mb-4" />
    <div className="flex gap-4">
      <Skeleton width="w-16" height="h-8" className="rounded-lg" />
      <Skeleton width="w-16" height="h-8" className="rounded-lg" />
      <Skeleton width="w-16" height="h-8" className="rounded-lg" />
    </div>
  </motion.div>
);

// Skeleton per Form
export const SkeletonForm = ({ fields = 5 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50 space-y-4"
  >
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i}>
        <Skeleton width="w-32" height="h-4" className="mb-2" />
        <Skeleton width="w-full" height="h-10" className="rounded-lg" />
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <Skeleton width="w-24" height="h-10" className="rounded-lg" />
      <Skeleton width="w-24" height="h-10" className="rounded-lg" />
    </div>
  </motion.div>
);

export default {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonProfile,
  SkeletonDashboard,
  SkeletonPost,
  SkeletonForm,
};
