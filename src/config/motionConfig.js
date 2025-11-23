// Configurazioni Framer Motion ottimizzate per performance
// Easing functions ottimizzate
export const easings = {
  // Smooth e naturale per la maggior parte delle animazioni
  smooth: [0.4, 0, 0.2, 1],
  // Bounce delicato per hover effects
  bounce: [0.34, 1.56, 0.64, 1],
  // Rapido per uscite
  snappy: [0.4, 0, 1, 1],
  // Elastico per elementi enfatizzati
  elastic: [0.68, -0.55, 0.265, 1.55],
  // Linear per progress bars
  linear: [0, 0, 1, 1],
};

// Durate standard
export const durations = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
};

// Varianti per page transitions
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: durations.fast,
      ease: easings.snappy,
    },
  },
};

// Varianti per fade animations
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: durations.fast,
      ease: easings.snappy,
    },
  },
};

// Varianti per slide animations
export const slideVariants = {
  fromRight: {
    initial: { x: 50, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: durations.normal,
        ease: easings.smooth,
      },
    },
    exit: { 
      x: -50, 
      opacity: 0,
      transition: {
        duration: durations.fast,
        ease: easings.snappy,
      },
    },
  },
  fromLeft: {
    initial: { x: -50, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: durations.normal,
        ease: easings.smooth,
      },
    },
    exit: { 
      x: 50, 
      opacity: 0,
      transition: {
        duration: durations.fast,
        ease: easings.snappy,
      },
    },
  },
};

// Varianti per modali
export const modalVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: durations.fast,
      ease: easings.snappy,
    },
  },
};

// Varianti per backdrop
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: durations.fast,
    },
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: durations.fast,
    },
  },
};

// Varianti per lista con stagger
export const listVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

// Varianti per item di lista
export const listItemVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: durations.fast,
      ease: easings.snappy,
    },
  },
};

// Varianti per hover effects
export const hoverVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: {
      duration: durations.fast,
      ease: easings.bounce,
    },
  },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// Configurazioni spring ottimizzate
export const springs = {
  // Gentle spring per animazioni smooth
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 20,
    mass: 1,
  },
  // Bouncy spring per effetti playful
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 15,
    mass: 0.8,
  },
  // Snappy spring per transizioni rapide
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 0.5,
  },
  // Wobbly spring per effetti elastici
  wobbly: {
    type: 'spring',
    stiffness: 180,
    damping: 12,
    mass: 1,
  },
};

// Configurazione layout animations
export const layoutTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

// Tap gestures configurations
export const tapConfig = {
  scale: 0.98,
  transition: {
    duration: 0.1,
  },
};

// Sidebar animation config
export const sidebarVariants = {
  collapsed: { width: 80 },
  expanded: { width: 280 },
  transition: {
    duration: durations.normal,
    ease: easings.smooth,
  },
};

// Mobile menu variants
export const mobileMenuVariants = {
  closed: {
    x: -280,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
    },
  },
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};
