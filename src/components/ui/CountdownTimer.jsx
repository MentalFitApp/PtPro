// src/components/ui/CountdownTimer.jsx
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * Countdown Timer component
 * Displays time remaining until a target date
 */
export default function CountdownTimer({ 
  targetDate, 
  className = '',
  showIcon = true,
  size = 'default', // 'sm', 'default', 'lg'
  variant = 'default' // 'default', 'minimal', 'badge'
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const target = new Date(targetDate);
      const now = new Date();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  const sizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-lg'
  };

  const iconSizes = {
    sm: 14,
    default: 16,
    lg: 20
  };

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-rose-400 font-mono ${sizeClasses[size]} ${className}`}>
        {showIcon && <Clock size={iconSizes[size]} />}
        <span className="font-bold">SCADUTO</span>
      </div>
    );
  }

  // Minimal variant - just the time
  if (variant === 'minimal') {
    return (
      <span className={`font-mono font-bold ${sizeClasses[size]} ${className}`}>
        {timeLeft.days > 0 && `${timeLeft.days}g `}
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    );
  }

  // Badge variant - compact badge style
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 ${className}`}>
        {showIcon && <Clock size={iconSizes[size]} className="text-amber-400" />}
        <span className={`font-mono font-bold text-amber-300 ${sizeClasses[size]}`}>
          {timeLeft.days > 0 && `${timeLeft.days}g `}
          {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-2 text-amber-300 font-mono ${sizeClasses[size]} ${className}`}>
      {showIcon && <Clock size={iconSizes[size]} />}
      <span className="font-bold">
        {timeLeft.days > 0 && `${timeLeft.days}g `}
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </div>
  );
}

// Named exports for different presets
export function CountdownBadge(props) {
  return <CountdownTimer {...props} variant="badge" />;
}

export function CountdownMinimal(props) {
  return <CountdownTimer {...props} variant="minimal" showIcon={false} />;
}
