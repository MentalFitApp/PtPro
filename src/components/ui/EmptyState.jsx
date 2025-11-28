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
  CheckSquare
} from 'lucide-react';

/**
 * Empty State - Componente per mostrare stati vuoti con illustrazioni e CTA
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
}) => {
  const IconComponent = typeof icon === 'string' ? iconMap[icon] || Database : icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center ${className}`}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <img src={illustration} alt="Empty state" className="w-64 h-64 mb-6 opacity-60" />
      ) : (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-6 p-6 bg-slate-800/40 rounded-full border-2 border-slate-700/50"
        >
          <IconComponent size={64} className="text-slate-500" />
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-slate-200 mb-3"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-slate-400 max-w-md mb-6"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white preserve-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-600 transition-all"
            >
              {secondaryActionLabel}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// Empty States Pre-configurati
export const EmptyClients = ({ onAddClient }) => (
  <EmptyState
    icon="users"
    title="Nessun cliente ancora"
    description="Inizia ad aggiungere i tuoi clienti per gestire anamnesi, schede e progressi."
    actionLabel="Aggiungi Primo Cliente"
    onAction={onAddClient}
  />
);

export const EmptyChecks = ({ onAddCheck }) => (
  <EmptyState
    icon="checks"
    title="Nessun check-in registrato"
    description="Traccia i progressi dei tuoi clienti con check-in regolari per monitorare peso, misure e obiettivi."
    actionLabel="Registra Check-in"
    onAction={onAddCheck}
  />
);

export const EmptyPayments = ({ onAddPayment }) => (
  <EmptyState
    icon="payments"
    title="Nessun pagamento registrato"
    description="Tieni traccia dei pagamenti dei clienti per una gestione finanziaria ottimale."
    actionLabel="Aggiungi Pagamento"
    onAction={onAddPayment}
  />
);

export const EmptyMessages = ({ onSendMessage }) => (
  <EmptyState
    icon="messages"
    title="Nessun messaggio"
    description="Inizia una conversazione per comunicare con il tuo coach o i tuoi clienti."
    actionLabel="Invia Messaggio"
    onAction={onSendMessage}
  />
);

export const EmptyPosts = ({ onCreatePost }) => (
  <EmptyState
    icon="fileText"
    title="Nessun post nella community"
    description="Condividi i tuoi progressi, consigli o storie di successo con la community."
    actionLabel="Crea Primo Post"
    onAction={onCreatePost}
  />
);

export const EmptySchedules = ({ onCreateSchedule }) => (
  <EmptyState
    icon="calendar"
    title="Nessuna scheda creata"
    description="Crea schede di allenamento e alimentazione personalizzate per i tuoi clienti."
    actionLabel="Crea Scheda"
    onAction={onCreateSchedule}
  />
);

export const EmptySearch = ({ searchTerm }) => (
  <EmptyState
    icon="search"
    title="Nessun risultato trovato"
    description={searchTerm ? `Nessun risultato per "${searchTerm}". Prova con altri termini di ricerca.` : 'Prova a modificare i filtri o i termini di ricerca.'}
  />
);

export const EmptyAnamnesi = ({ onCreateAnamnesi }) => (
  <EmptyState
    icon="fileText"
    title="Anamnesi non completata"
    description="Compila l'anamnesi iniziale per aiutare il tuo coach a creare un percorso personalizzato."
    actionLabel="Compila Anamnesi"
    onAction={onCreateAnamnesi}
  />
);

export const ErrorState = ({ title, description, onRetry }) => (
  <EmptyState
    icon="alert"
    title={title || 'Ops! Qualcosa è andato storto'}
    description={description || 'Si è verificato un errore durante il caricamento dei dati.'}
    actionLabel={onRetry ? 'Riprova' : undefined}
    onAction={onRetry}
  />
);

export default EmptyState;
