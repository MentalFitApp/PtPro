import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  CreditCard, 
  Database,
  Inbox,
  Search,
  AlertCircle,
  TrendingUp,
  CheckSquare,
  Plus,
  Sparkles
} from 'lucide-react';

/**
 * Empty State - Componente per mostrare stati vuoti con illustrazioni e CTA
 * Redesigned con effetti moderni glassmorphism
 */

const iconMap = {
  users: Users,
  calendar: Calendar,
  fileText: FileText,
  messages: MessageSquare,
  payments: CreditCard,
  database: Database,
  inbox: Inbox,
  search: Search,
  alert: AlertCircle,
  trending: TrendingUp,
  checks: CheckSquare,
};

const EmptyState = ({
  icon = 'database',
  title = 'Nessun dato disponibile',
  description = 'Inizia aggiungendo il tuo primo elemento.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  illustration,
  variant = 'default', // 'default', 'compact', 'card'
  accentColor = 'blue',
}) => {
  const IconComponent = typeof icon === 'string' ? iconMap[icon] || Database : icon;

  const accentColors = {
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      buttonBg: 'from-blue-500 via-blue-600 to-cyan-500',
      glow: 'shadow-blue-500/25',
    },
    emerald: {
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      buttonBg: 'from-emerald-500 via-emerald-600 to-teal-500',
      glow: 'shadow-emerald-500/25',
    },
    purple: {
      gradient: 'from-purple-500 to-indigo-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      buttonBg: 'from-purple-500 via-purple-600 to-indigo-500',
      glow: 'shadow-purple-500/25',
    },
    amber: {
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      buttonBg: 'from-amber-500 via-amber-600 to-orange-500',
      glow: 'shadow-amber-500/25',
    },
    rose: {
      gradient: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      buttonBg: 'from-rose-500 via-rose-600 to-pink-500',
      glow: 'shadow-rose-500/25',
    },
  };

  const color = accentColors[accentColor] || accentColors.blue;

  const isCompact = variant === 'compact';
  const isCard = variant === 'card';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`
        flex flex-col items-center justify-center text-center
        ${isCompact ? 'p-6' : isCard ? 'p-8 bg-theme-bg-secondary/40 backdrop-blur-xl rounded-2xl border border-theme/50' : 'p-8 sm:p-12'}
        ${className}
      `}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <img src={illustration} alt="Empty state" className="w-48 h-48 sm:w-64 sm:h-64 mb-6 opacity-70" />
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
          className="relative mb-6"
        >
          {/* Glow effect behind icon */}
          <div className={`absolute inset-0 ${color.bg} blur-2xl rounded-full scale-150 opacity-50`} />
          
          {/* Icon container with glassmorphism */}
          <div className={`
            relative ${isCompact ? 'p-5' : 'p-6 sm:p-8'} 
            bg-theme-bg-secondary/60 backdrop-blur-xl 
            rounded-full border-2 ${color.border}
            shadow-xl ${color.glow}
          `}>
            <IconComponent 
              size={isCompact ? 40 : 56} 
              className={color.text} 
              strokeWidth={1.5}
            />
          </div>
          
          {/* Floating decorative elements */}
          <motion.div
            animate={{ y: [-4, 4, -4], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute -top-2 -right-2 p-1.5 rounded-full bg-gradient-to-br ${color.gradient} shadow-lg`}
          >
            <Sparkles size={14} className="text-white" />
          </motion.div>
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${isCompact ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold text-theme-text-primary mb-3`}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${isCompact ? 'text-sm' : 'text-base'} text-theme-text-secondary max-w-md mb-6 leading-relaxed`}
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {actionLabel && onAction && (
            <motion.button
              onClick={onAction}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
                inline-flex items-center gap-2 px-6 py-3 
                bg-gradient-to-r ${color.buttonBg} 
                text-white font-semibold rounded-xl 
                shadow-lg ${color.glow}
                hover:shadow-xl transition-shadow duration-300
              `}
            >
              <Plus size={18} />
              {actionLabel}
            </motion.button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <motion.button
              onClick={onSecondaryAction}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                px-6 py-3 
                bg-theme-bg-secondary/60 backdrop-blur-sm
                text-theme-text-primary font-semibold rounded-xl 
                border border-theme hover:border-theme-text-tertiary
                transition-all duration-300
              "
            >
              {secondaryActionLabel}
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// Empty States Pre-configurati con nuovo design
export const EmptyClients = ({ onAddClient }) => (
  <EmptyState
    icon="users"
    title="Nessun cliente ancora"
    description="Inizia ad aggiungere i tuoi clienti per gestire anamnesi, schede e progressi."
    actionLabel="Aggiungi Primo Cliente"
    onAction={onAddClient}
    accentColor="blue"
  />
);

export const EmptyChecks = ({ onAddCheck }) => (
  <EmptyState
    icon="checks"
    title="Nessun check-in registrato"
    description="Traccia i progressi dei tuoi clienti con check-in regolari per monitorare peso, misure e obiettivi."
    actionLabel="Registra Check-in"
    onAction={onAddCheck}
    accentColor="emerald"
  />
);

export const EmptyPayments = ({ onAddPayment }) => (
  <EmptyState
    icon="payments"
    title="Nessun pagamento registrato"
    description="Tieni traccia dei pagamenti dei clienti per una gestione finanziaria ottimale."
    actionLabel="Aggiungi Pagamento"
    onAction={onAddPayment}
    accentColor="amber"
  />
);

export const EmptyMessages = ({ onSendMessage }) => (
  <EmptyState
    icon="messages"
    title="Nessun messaggio"
    description="Inizia una conversazione per comunicare con il tuo coach o i tuoi clienti."
    actionLabel="Invia Messaggio"
    onAction={onSendMessage}
    accentColor="purple"
  />
);

export const EmptyPosts = ({ onCreatePost }) => (
  <EmptyState
    icon="fileText"
    title="Nessun post nella community"
    description="Condividi i tuoi progressi, consigli o storie di successo con la community."
    actionLabel="Crea Primo Post"
    onAction={onCreatePost}
    accentColor="blue"
  />
);

export const EmptySchedules = ({ onCreateSchedule }) => (
  <EmptyState
    icon="calendar"
    title="Nessuna scheda creata"
    description="Crea schede di allenamento e alimentazione personalizzate per i tuoi clienti."
    actionLabel="Crea Scheda"
    onAction={onCreateSchedule}
    accentColor="emerald"
  />
);

export const EmptySearch = ({ searchTerm }) => (
  <EmptyState
    icon="search"
    title="Nessun risultato trovato"
    description={searchTerm ? `Nessun risultato per "${searchTerm}". Prova con altri termini di ricerca.` : 'Prova a modificare i filtri o i termini di ricerca.'}
    variant="compact"
    accentColor="purple"
  />
);

export const EmptyAnamnesi = ({ onCreateAnamnesi }) => (
  <EmptyState
    icon="fileText"
    title="Anamnesi non completata"
    description="Compila l'anamnesi iniziale per aiutare il tuo coach a creare un percorso personalizzato."
    actionLabel="Compila Anamnesi"
    onAction={onCreateAnamnesi}
    accentColor="blue"
  />
);

export const ErrorState = ({ title, description, onRetry }) => (
  <EmptyState
    icon="alert"
    title={title || 'Ops! Qualcosa è andato storto'}
    description={description || 'Si è verificato un errore durante il caricamento dei dati.'}
    actionLabel={onRetry ? 'Riprova' : undefined}
    onAction={onRetry}
    accentColor="rose"
  />
);

export default EmptyState;
