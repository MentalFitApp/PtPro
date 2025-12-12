// src/components/ui/index.js
// Export centralizzato dei componenti UI - Design System V4

// Loading spinners
export {
  LoadingSpinner,
  CenteredSpinner,
  FullPageLoader,
  InlineSpinner,
  ContentLoader,
  LoadingDots,
  PulseLoader
} from './LoadingSpinner';

// Skeleton loaders
export {
  SkeletonLine,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonTable,
  SkeletonList,
  SkeletonForm,
  SkeletonDashboard,
  SkeletonStats
} from './SkeletonLoader';

// Copy button
export { default as CopyButton, CopyField, CopyLink } from './CopyButton';

// Cards
export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  CardWithIcon 
} from './Card';

// Unified Cards
export { 
  UnifiedCard, 
  CardHeaderSimple,
  InfoField,
  DataCard,
  ListItemCard,
  CardGrid,
  SkeletonCard as UnifiedSkeletonCard
} from './UnifiedCard';

// Buttons
export { 
  Button, 
  IconButton as ModernIconButton, 
  ButtonGroup as ModernButtonGroup 
} from './Button';

// Animated components (legacy support)
export { 
  AnimatedButton, 
  ButtonGroup, 
  IconButton, 
  FloatingButton 
} from './AnimatedButton';

export { 
  AnimatedCard, 
  StaggeredCards, 
  AnimatedStatCard, 
  GradientBorderCard,
  FlipCard 
} from './AnimatedCard';

// Badges
export { 
  Badge, 
  StatusBadge, 
  CounterBadge, 
  RoleBadge 
} from './Badge';

// Stats
export { StatCard, MiniStatCard } from './StatCard';

// Empty states
export { 
  default as EmptyState,
  EmptyClients,
  EmptyChecks,
  EmptyPayments,
  EmptyMessages,
  EmptyPosts,
  EmptySchedules,
  EmptySearch,
  EmptyAnamnesi,
  ErrorState
} from './EmptyState';

// Page headers
export { PageHeader, SectionHeader, Divider } from './PageHeader';

// Theme
export { default as ThemeToggle } from './ThemeToggle';

// Inputs
export { 
  Input, 
  SearchInput, 
  TextArea, 
  Select, 
  Checkbox, 
  Toggle 
} from './Input';

// Modals
export { Modal, ConfirmModal, Drawer } from './Modal';

// Tables
export {
  ProTable,
  ProTableHead,
  ProTableHeaderRow,
  ProTableHeaderCell,
  ProTableBody,
  ProTableRow,
  ProTableCell,
  ProTableActionsCell,
  ProTableEmpty,
  ProTablePagination,
  ProTableCheckbox,
  StatusBadge as TableStatusBadge,
  TagBadge
} from './ProTable';

// Feedback
export { default as Toast } from './Toast';

// Media
export { default as LazyImage } from './LazyImage';

// Tooltips
export { Tooltip, InfoTooltip, HelpTooltip } from './Tooltip';

// Progress
export { 
  ProgressBar, 
  CircularProgress, 
  StepProgress, 
  ProgressRing 
} from './Progress';

// Avatars
export { Avatar, AvatarGroup, AvatarWithText } from './Avatar';

// Alerts
export { Alert, Banner, InlineMessage } from './Alert';