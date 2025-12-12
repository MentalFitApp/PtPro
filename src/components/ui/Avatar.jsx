// src/components/ui/Avatar.jsx
// Modern Avatar component with status indicators and groups
import React from 'react';
import { motion } from 'framer-motion';

/**
 * Avatar - User avatar component
 */
export const Avatar = ({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  status,
  rounded = 'full',
  border = false,
  className = '',
  onClick
}) => {
  const sizes = {
    xs: { container: 'w-6 h-6', text: 'text-[10px]', status: 'w-2 h-2' },
    sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2.5 h-2.5' },
    md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-3 h-3' },
    lg: { container: 'w-12 h-12', text: 'text-base', status: 'w-3.5 h-3.5' },
    xl: { container: 'w-16 h-16', text: 'text-lg', status: 'w-4 h-4' },
    '2xl': { container: 'w-20 h-20', text: 'text-xl', status: 'w-5 h-5' },
    '3xl': { container: 'w-24 h-24', text: 'text-2xl', status: 'w-6 h-6' }
  };
  
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full'
  };
  
  const statusColors = {
    online: 'bg-emerald-400',
    offline: 'bg-slate-400',
    busy: 'bg-rose-400',
    away: 'bg-amber-400'
  };
  
  const sizeConfig = sizes[size] || sizes.md;
  const roundedClass = roundedStyles[rounded] || roundedStyles.full;
  
  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };
  
  // Generate fallback URL
  const fallbackUrl = name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`
    : null;

  const content = src || fallbackUrl ? (
    <img
      src={src || fallbackUrl}
      alt={alt}
      className={`${sizeConfig.container} ${roundedClass} object-cover`}
      onError={(e) => {
        e.target.onerror = null;
        if (fallbackUrl && e.target.src !== fallbackUrl) {
          e.target.src = fallbackUrl;
        }
      }}
    />
  ) : (
    <div className={`${sizeConfig.container} ${roundedClass} flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold ${sizeConfig.text}`}>
      {getInitials(name)}
    </div>
  );

  const Wrapper = onClick ? motion.button : 'div';
  const wrapperProps = onClick ? {
    onClick,
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  } : {};

  return (
    <Wrapper
      className={`relative inline-flex ${border ? 'ring-2 ring-theme' : ''} ${roundedClass} ${className}`}
      {...wrapperProps}
    >
      {content}
      
      {/* Status indicator */}
      {status && (
        <span className={`absolute bottom-0 right-0 ${sizeConfig.status} ${statusColors[status] || statusColors.offline} rounded-full border-2 border-theme-bg-secondary`} />
      )}
    </Wrapper>
  );
};

/**
 * AvatarGroup - Stack of avatars
 */
export const AvatarGroup = ({
  avatars = [],
  max = 4,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    xs: { container: 'w-6 h-6', text: 'text-[8px]', overlap: '-ml-2' },
    sm: { container: 'w-8 h-8', text: 'text-[10px]', overlap: '-ml-2.5' },
    md: { container: 'w-10 h-10', text: 'text-xs', overlap: '-ml-3' },
    lg: { container: 'w-12 h-12', text: 'text-sm', overlap: '-ml-4' },
    xl: { container: 'w-16 h-16', text: 'text-base', overlap: '-ml-5' }
  };
  
  const sizeConfig = sizes[size] || sizes.md;
  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={`flex items-center ${className}`}>
      {displayed.map((avatar, index) => (
        <motion.div
          key={avatar.id || index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`${index > 0 ? sizeConfig.overlap : ''} ring-2 ring-theme-bg-secondary rounded-full`}
          style={{ zIndex: displayed.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.name}
            size={size}
          />
        </motion.div>
      ))}
      
      {remaining > 0 && (
        <div 
          className={`${sizeConfig.overlap} ${sizeConfig.container} rounded-full flex items-center justify-center bg-theme-bg-tertiary/80 text-theme-text-secondary font-semibold ${sizeConfig.text} ring-2 ring-theme-bg-secondary`}
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

/**
 * AvatarWithText - Avatar with name and subtitle
 */
export const AvatarWithText = ({
  src,
  name,
  subtitle,
  size = 'md',
  status,
  onClick,
  className = ''
}) => {
  const Wrapper = onClick ? motion.button : 'div';
  const wrapperProps = onClick ? {
    onClick,
    whileHover: { scale: 1.01 },
    className: `flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-theme-bg-tertiary/40 transition-colors ${className}`
  } : {
    className: `flex items-center gap-3 ${className}`
  };

  return (
    <Wrapper {...wrapperProps}>
      <Avatar
        src={src}
        name={name}
        size={size}
        status={status}
      />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-theme-text-primary truncate">
          {name}
        </p>
        {subtitle && (
          <p className="text-xs text-theme-text-tertiary truncate">
            {subtitle}
          </p>
        )}
      </div>
    </Wrapper>
  );
};

export default Avatar;
