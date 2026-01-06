import React from 'react';

/**
 * Icone SVG vettoriali per il Quiz Popup
 * Design moderno e professionale
 */

// Icona Target/Obiettivo
export const TargetIcon = ({ size = 48, color = '#f97316' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2" opacity="0.2"/>
    <circle cx="24" cy="24" r="14" stroke={color} strokeWidth="2" opacity="0.4"/>
    <circle cx="24" cy="24" r="8" stroke={color} strokeWidth="2" opacity="0.6"/>
    <circle cx="24" cy="24" r="4" fill={color}/>
    <path d="M24 4V12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 36V44" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 24H12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M36 24H44" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icona Muscolo/Forza
export const MuscleIcon = ({ size = 48, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path 
      d="M10 34C8 32 6 28 6 24C6 18 10 14 14 14C16 14 18 15 19 16L24 22L29 16C30 15 32 14 34 14C38 14 42 18 42 24C42 28 40 32 38 34L34 38C32 40 28 42 24 42C20 42 16 40 14 38L10 34Z" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={`${color}20`}
    />
    <path d="M19 24L24 30L29 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="15" cy="22" r="2" fill={color}/>
    <circle cx="33" cy="22" r="2" fill={color}/>
  </svg>
);

// Icona Fulmine/Energia
export const EnergyIcon = ({ size = 48, color = '#8b5cf6' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path 
      d="M26 6L10 26H22L18 42L38 20H26L30 6H26Z" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={`${color}20`}
    />
    <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="4 4"/>
  </svg>
);

// Icona Fuoco/Bruciare
export const FireIcon = ({ size = 48, color = '#ec4899' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path 
      d="M24 6C24 6 28 14 28 20C28 24 26 26 24 26C22 26 20 24 20 20C20 14 24 6 24 6Z" 
      fill={`${color}40`}
    />
    <path 
      d="M24 42C32 42 38 36 38 28C38 20 32 14 28 10C28 18 24 22 20 22C16 22 14 18 14 14C10 18 8 22 8 28C8 36 14 42 24 42Z" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={`${color}20`}
    />
    <path 
      d="M24 42C20 42 16 38 16 34C16 30 20 28 24 28C28 28 32 30 32 34C32 38 28 42 24 42Z" 
      fill={color} 
      opacity="0.4"
    />
  </svg>
);

// Icona Insalata/Dieta
export const DietIcon = ({ size = 48, color = '#22c55e' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="32" rx="16" ry="10" stroke={color} strokeWidth="2" fill={`${color}10`}/>
    <path d="M16 28C14 24 14 20 18 16C22 12 26 14 28 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 28C34 24 36 18 32 14C28 10 24 12 22 16" stroke="#86efac" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="20" cy="30" r="2" fill="#ef4444"/>
    <circle cx="28" cy="32" r="2" fill="#f97316"/>
    <circle cx="24" cy="28" r="1.5" fill="#fbbf24"/>
    <path d="M24 6V12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 12C24 12 20 14 20 18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Icona Corsa/Cardio
export const CardioIcon = ({ size = 48, color = '#3b82f6' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="10" r="5" stroke={color} strokeWidth="2" fill={`${color}20`}/>
    <path 
      d="M16 42L20 32L24 36L28 28L34 42" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M18 20L22 24L26 18L32 26" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M14 26H10" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <path d="M38 22H42" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

// Icona Palestra/Manubrio
export const GymIcon = ({ size = 48, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="18" y="20" width="12" height="8" rx="2" stroke={color} strokeWidth="2" fill={`${color}20`}/>
    <rect x="6" y="16" width="6" height="16" rx="2" stroke={color} strokeWidth="2" fill={`${color}10`}/>
    <rect x="36" y="16" width="6" height="16" rx="2" stroke={color} strokeWidth="2" fill={`${color}10`}/>
    <path d="M12 24H18" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <path d="M30 24H36" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <rect x="2" y="18" width="4" height="12" rx="1" fill={color} opacity="0.4"/>
    <rect x="42" y="18" width="4" height="12" rx="1" fill={color} opacity="0.4"/>
  </svg>
);

// Icona Pillola/Integratori
export const SupplementIcon = ({ size = 48, color = '#a855f7' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="14" y="8" width="20" height="32" rx="10" stroke={color} strokeWidth="2" fill={`${color}10`}/>
    <path d="M14 24H34" stroke={color} strokeWidth="2"/>
    <rect x="14" y="8" width="20" height="16" rx="10" fill={color} opacity="0.3"/>
    <circle cx="24" cy="16" r="2" fill="white" opacity="0.6"/>
    <circle cx="20" cy="32" r="1.5" fill={color} opacity="0.4"/>
    <circle cx="28" cy="30" r="1.5" fill={color} opacity="0.4"/>
    <circle cx="24" cy="34" r="1.5" fill={color} opacity="0.4"/>
  </svg>
);

// Icona Germoglio/Nuovo Inizio
export const SproutIcon = ({ size = 48, color = '#10b981' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path 
      d="M24 42V26" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <path 
      d="M24 26C24 26 16 26 12 20C8 14 12 8 20 8C24 8 26 12 26 16C26 20 24 26 24 26Z" 
      stroke={color} 
      strokeWidth="2" 
      fill={`${color}20`}
    />
    <path 
      d="M24 30C24 30 32 28 36 22C40 16 36 10 28 10C24 10 22 14 22 18C22 22 24 30 24 30Z" 
      stroke={color} 
      strokeWidth="2" 
      fill={`${color}30`}
    />
    <ellipse cx="24" cy="44" rx="6" ry="2" fill={color} opacity="0.2"/>
  </svg>
);

// Icona Orologio/Tempo
export const TimeIcon = ({ size = 48, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="2" fill={`${color}10`}/>
    <circle cx="24" cy="24" r="14" stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity="0.3"/>
    <path d="M24 14V24L30 28" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="24" cy="24" r="2" fill={color}/>
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
      <circle 
        key={i}
        cx={24 + 16 * Math.cos((angle - 90) * Math.PI / 180)} 
        cy={24 + 16 * Math.sin((angle - 90) * Math.PI / 180)} 
        r={i % 3 === 0 ? 2 : 1} 
        fill={color}
        opacity={i % 3 === 0 ? 0.8 : 0.4}
      />
    ))}
  </svg>
);

// Icona Motivazione/Cuore
export const MotivationIcon = ({ size = 48, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path 
      d="M24 42L8 26C4 22 4 14 10 10C14 6 20 8 24 14C28 8 34 6 38 10C44 14 44 22 40 26L24 42Z" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={`${color}20`}
    />
    <path d="M14 20L18 24L26 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
  </svg>
);

// Icona Domanda
export const QuestionIcon = ({ size = 48, color = '#6366f1' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="2" fill={`${color}10`}/>
    <path 
      d="M18 18C18 14 20 12 24 12C28 12 30 14 30 18C30 22 26 22 26 28" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <circle cx="26" cy="34" r="2" fill={color}/>
  </svg>
);

// Icona Costanza/Grafico
export const ConsistencyIcon = ({ size = 48, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M8 40L8 12" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    <path d="M8 40H40" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    <path 
      d="M12 32L18 28L24 30L30 22L36 18" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 32L18 28L24 30L30 22L36 18L36 32L12 32Z" 
      fill={color} 
      opacity="0.15"
    />
    <circle cx="12" cy="32" r="3" fill={color}/>
    <circle cx="18" cy="28" r="3" fill={color}/>
    <circle cx="24" cy="30" r="3" fill={color}/>
    <circle cx="30" cy="22" r="3" fill={color}/>
    <circle cx="36" cy="18" r="3" fill={color}/>
    <path d="M36 18L42 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/>
  </svg>
);

// Icona Razzo/Veloce
export const RocketIcon = ({ size = 48, color = '#22c55e' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path 
      d="M24 6C24 6 36 10 36 26L30 32L18 32L12 26C12 10 24 6 24 6Z" 
      stroke={color} 
      strokeWidth="2" 
      fill={`${color}15`}
    />
    <circle cx="24" cy="18" r="4" stroke={color} strokeWidth="2" fill={`${color}30`}/>
    <path d="M18 32L14 42L22 36" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={`${color}20`}/>
    <path d="M30 32L34 42L26 36" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={`${color}20`}/>
    <path d="M20 38L24 34L28 38" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 20C8 20 10 24 12 26" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <path d="M40 20C40 20 38 24 36 26" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

// Icona Grafico/Progressi
export const ProgressIcon = ({ size = 48, color = '#3b82f6' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="8" y="28" width="8" height="14" rx="2" fill={color} opacity="0.3"/>
    <rect x="20" y="20" width="8" height="22" rx="2" fill={color} opacity="0.5"/>
    <rect x="32" y="10" width="8" height="32" rx="2" fill={color} opacity="0.7"/>
    <path d="M6 8L14 16L24 12L34 6L42 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14" cy="16" r="2" fill={color}/>
    <circle cx="24" cy="12" r="2" fill={color}/>
    <circle cx="34" cy="6" r="2" fill={color}/>
  </svg>
);

// Icona Trofeo/Successo
export const TrophyIcon = ({ size = 48, color = '#f97316' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path 
      d="M16 8H32V20C32 26 28 32 24 32C20 32 16 26 16 20V8Z" 
      stroke={color} 
      strokeWidth="2" 
      fill={`${color}20`}
    />
    <path d="M16 12H8V16C8 20 10 22 14 22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 12H40V16C40 20 38 22 34 22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 32V36H28V32" stroke={color} strokeWidth="2"/>
    <rect x="16" y="36" width="16" height="4" rx="1" fill={color}/>
    <rect x="14" y="40" width="20" height="2" rx="1" fill={color} opacity="0.5"/>
    <path d="M22 16L24 12L26 16L24 14L22 16Z" fill={color}/>
  </svg>
);

// Icona Bilancia/Equilibrio
export const BalanceIcon = ({ size = 48, color = '#3b82f6' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M24 8V40" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 12L8 20V24L24 18L40 24V20L24 12Z" stroke={color} strokeWidth="2" fill={`${color}10`}/>
    <ellipse cx="8" cy="26" rx="6" ry="4" stroke={color} strokeWidth="2" fill={`${color}20`}/>
    <ellipse cx="40" cy="26" rx="6" ry="4" stroke={color} strokeWidth="2" fill={`${color}20`}/>
    <circle cx="24" cy="8" r="3" fill={color}/>
    <rect x="18" y="38" width="12" height="4" rx="2" fill={color}/>
  </svg>
);

// Icona Documentazione/Modulo
export const FormIcon = ({ size = 48, color = '#6366f1' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="10" y="6" width="28" height="36" rx="3" stroke={color} strokeWidth="2" fill={`${color}10`}/>
    <path d="M16 16H32" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 24H28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 32H24" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="34" cy="34" r="8" fill={color}/>
    <path d="M31 34L33 36L37 32" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icona Regalo
export const GiftIcon = ({ size = 48, color = '#ec4899' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="8" y="20" width="32" height="22" rx="3" stroke={color} strokeWidth="2" fill={`${color}10`}/>
    <rect x="6" y="14" width="36" height="8" rx="2" stroke={color} strokeWidth="2" fill={`${color}20`}/>
    <path d="M24 14V42" stroke={color} strokeWidth="2"/>
    <path d="M24 14C24 14 20 14 16 10C12 6 16 2 20 4C24 6 24 14 24 14Z" stroke={color} strokeWidth="2" fill={`${color}30`}/>
    <path d="M24 14C24 14 28 14 32 10C36 6 32 2 28 4C24 6 24 14 24 14Z" stroke={color} strokeWidth="2" fill={`${color}30`}/>
  </svg>
);

// Mappa icone per uso nel quiz
export const quizIconMap = {
  target: TargetIcon,
  muscle: MuscleIcon,
  energy: EnergyIcon,
  fire: FireIcon,
  diet: DietIcon,
  cardio: CardioIcon,
  gym: GymIcon,
  supplement: SupplementIcon,
  sprout: SproutIcon,
  time: TimeIcon,
  motivation: MotivationIcon,
  question: QuestionIcon,
  consistency: ConsistencyIcon,
  rocket: RocketIcon,
  progress: ProgressIcon,
  trophy: TrophyIcon,
  balance: BalanceIcon,
  form: FormIcon,
  gift: GiftIcon,
};

export default quizIconMap;
