// src/components/ui/Skeleton.jsx
// Skeleton loaders per stati di caricamento eleganti
import React from 'react';
import { motion } from 'framer-motion';

// Skeleton base con animazione shimmer
export const Skeleton = ({ className = '', variant = 'rectangular', animation = 'shimmer' }) => {
  const baseClass = `bg-slate-700/50 rounded ${className}`;
  
  const variants = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
    button: 'rounded-xl h-10',
    avatar: 'rounded-full w-10 h-10',
    card: 'rounded-2xl',
  };

  const animationClass = animation === 'shimmer' 
    ? 'animate-shimmer bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 bg-[length:200%_100%]'
    : animation === 'pulse' 
    ? 'animate-pulse'
    : '';

  return (
    <div className={`${baseClass} ${variants[variant]} ${animationClass}`} />
  );
};

// Skeleton per card statistiche
export const SkeletonStatCard = () => (
  <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="circular" className="w-12 h-12" />
      <Skeleton className="w-16 h-6" />
    </div>
    <Skeleton className="w-20 h-8 mb-2" />
    <Skeleton variant="text" className="w-24" />
  </div>
);

// Skeleton per lista clienti
export const SkeletonClientRow = () => (
  <div className="flex items-center gap-4 p-4 border-b border-slate-700/30">
    <Skeleton variant="avatar" className="w-12 h-12" />
    <div className="flex-1 space-y-2">
      <Skeleton className="w-32 h-5" />
      <Skeleton className="w-48 h-4" />
    </div>
    <Skeleton className="w-20 h-6 rounded-full" />
    <Skeleton className="w-24 h-8" />
  </div>
);

// Skeleton per card cliente
export const SkeletonClientCard = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5"
  >
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="avatar" className="w-14 h-14" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-32 h-5" />
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-12 h-4" />
      </div>
    </div>
    <div className="flex gap-2 mt-4">
      <Skeleton className="flex-1 h-9 rounded-lg" />
      <Skeleton className="w-9 h-9 rounded-lg" />
    </div>
  </motion.div>
);

// Skeleton per dashboard
export const SkeletonDashboard = () => (
  <div className="space-y-6 p-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-32 h-4" />
      </div>
      <Skeleton variant="avatar" className="w-12 h-12" />
    </div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
    </div>
    
    {/* Chart placeholder */}
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
      <Skeleton className="w-40 h-6 mb-4" />
      <Skeleton className="w-full h-64 rounded-xl" />
    </div>
    
    {/* Recent activity */}
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
      <Skeleton className="w-32 h-6 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="avatar" className="w-10 h-10" />
            <div className="flex-1 space-y-1">
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton per lista clienti
export const SkeletonClientList = ({ count = 5 }) => (
  <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
    <div className="p-4 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-9 rounded-lg" />
      </div>
    </div>
    <div className="divide-y divide-slate-700/30">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonClientRow key={i} />
      ))}
    </div>
  </div>
);

// Skeleton per griglia cards
export const SkeletonCardGrid = ({ count = 6, cols = 3 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonClientCard key={i} />
    ))}
  </div>
);

// Skeleton per form
export const SkeletonForm = () => (
  <div className="space-y-6">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="space-y-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-full h-12 rounded-xl" />
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <Skeleton className="flex-1 h-12 rounded-xl" />
      <Skeleton className="w-32 h-12 rounded-xl" />
    </div>
  </div>
);

// Skeleton per dettaglio cliente
export const SkeletonClientDetail = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" className="w-20 h-20" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-48 h-7" />
          <Skeleton className="w-32 h-5" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="w-20 h-6 rounded-full" />
            <Skeleton className="w-24 h-6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <Skeleton className="w-16 h-4 mb-2" />
          <Skeleton className="w-12 h-7" />
        </div>
      ))}
    </div>
    
    {/* Tabs */}
    <div className="flex gap-2 border-b border-slate-700/50 pb-2">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="w-24 h-10 rounded-lg" />
      ))}
    </div>
    
    {/* Content */}
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
      <SkeletonForm />
    </div>
  </div>
);

export default Skeleton;
