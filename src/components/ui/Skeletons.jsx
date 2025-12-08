// src/components/ui/Skeletons.jsx
// Skeleton loaders riutilizzabili per loading states
import React from 'react';
import { motion } from 'framer-motion';

// Skeleton base animato
const SkeletonBase = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
);

// Skeleton per card cliente
export const ClientCardSkeleton = () => (
  <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <SkeletonBase className="w-12 h-12 rounded-full flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        {/* Nome */}
        <SkeletonBase className="h-5 w-32 mb-2" />
        {/* Email */}
        <SkeletonBase className="h-4 w-48 mb-3" />
        
        {/* Badges */}
        <div className="flex gap-2">
          <SkeletonBase className="h-6 w-20 rounded-full" />
          <SkeletonBase className="h-6 w-24 rounded-full" />
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <SkeletonBase className="w-8 h-8 rounded-lg" />
        <SkeletonBase className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  </div>
);

// Skeleton per lista clienti
export const ClientListSkeleton = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <ClientCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton per stat card
export const StatCardSkeleton = () => (
  <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
    <div className="flex items-center gap-3">
      <SkeletonBase className="w-10 h-10 rounded-lg" />
      <div className="flex-1">
        <SkeletonBase className="h-4 w-20 mb-2" />
        <SkeletonBase className="h-6 w-16" />
      </div>
    </div>
  </div>
);

// Skeleton per dashboard stats
export const DashboardStatsSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton per tabella
export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="border-b border-slate-700/50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonBase className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <table className="w-full">
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </tbody>
  </table>
);

// Skeleton per chat message
export const ChatMessageSkeleton = ({ isOwn = false }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
    <div className={`max-w-[70%] ${isOwn ? 'bg-blue-600/20' : 'bg-slate-700/50'} rounded-xl p-3`}>
      <SkeletonBase className="h-4 w-48 mb-2" />
      <SkeletonBase className="h-4 w-32" />
    </div>
  </div>
);

// Skeleton per notification item
export const NotificationSkeleton = () => (
  <div className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-lg">
    <SkeletonBase className="w-8 h-8 rounded-full flex-shrink-0" />
    <div className="flex-1">
      <SkeletonBase className="h-4 w-40 mb-2" />
      <SkeletonBase className="h-3 w-24" />
    </div>
  </div>
);

// Skeleton per integration card
export const IntegrationCardSkeleton = () => (
  <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
    <div className="flex items-start gap-4 mb-4">
      <SkeletonBase className="w-14 h-14 rounded-xl" />
      <div className="flex-1">
        <SkeletonBase className="h-5 w-32 mb-2" />
        <SkeletonBase className="h-4 w-full" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <SkeletonBase className="h-4 w-48" />
      <SkeletonBase className="h-4 w-40" />
      <SkeletonBase className="h-4 w-44" />
    </div>
    <SkeletonBase className="h-10 w-full rounded-lg" />
  </div>
);

// Skeleton generico con pulse
export const PulseSkeleton = ({ width = '100%', height = '1rem', className = '' }) => (
  <SkeletonBase 
    className={className}
    style={{ width, height }}
  />
);

// Loading spinner alternativo
export const LoadingDots = () => (
  <div className="flex gap-1 justify-center items-center">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-blue-500 rounded-full"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.1
        }}
      />
    ))}
  </div>
);

export default {
  ClientCardSkeleton,
  ClientListSkeleton,
  StatCardSkeleton,
  DashboardStatsSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  ChatMessageSkeleton,
  NotificationSkeleton,
  IntegrationCardSkeleton,
  PulseSkeleton,
  LoadingDots
};
