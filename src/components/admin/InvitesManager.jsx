import React, { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { CURRENT_TENANT_ID } from '../../config/tenant';
import { useConfirm } from '../../contexts/ConfirmContext';
import { 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  MessageCircle,
  Link2,
  Trash2,
  MoreVertical,
  Mail,
  User,
  AlertCircle,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const functions = getFunctions(undefined, 'europe-west1');

// Status badge component
const StatusBadge = ({ status }) => {
  const configs = {
    pending: { 
      label: 'In attesa', 
      icon: Clock, 
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
    },
    sent: { 
      label: 'Inviato', 
      icon: Send, 
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
    },
    opened: { 
      label: 'Aperto', 
      icon: Eye, 
      className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
    },
    completed: { 
      label: 'Completato', 
      icon: CheckCircle2, 
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
    },
    expired: { 
      label: 'Scaduto', 
      icon: AlertCircle, 
      className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' 
    },
    cancelled: { 
      label: 'Annullato', 
      icon: XCircle, 
      className: 'bg-red-500/20 text-red-400 border-red-500/30' 
    },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

// Invite row component
const InviteRow = ({ invite, onResend, onCancel, onCopy }) => {
  const { confirmDelete } = useConfirm();
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    onCopy?.(type);
  };

  const handleResend = async () => {
    setIsResending(true);
    await onResend(invite.token);
    setIsResending(false);
    setShowActions(false);
  };

  const handleCancel = async () => {
    const confirmed = await confirmDelete('questo invito');
    if (confirmed) {
      setIsCancelling(true);
      await onCancel(invite.token);
      setIsCancelling(false);
      setShowActions(false);
    }
  };

  const isActive = ['pending', 'sent', 'opened'].includes(invite.status);
  const expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null;
  const isExpired = expiresAt && expiresAt < new Date();

  // URL dell'invito
  const inviteUrl = `https://www.flowfitpro.it/invite/${invite.token}`;

  return (
    <div className="bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 transition-colors relative">
      <div className="flex items-start justify-between gap-4">
        {/* Info principale */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Nome o email */}
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-500" />
              <span className="font-medium text-white truncate">
                {invite.clientData?.name || invite.clientData?.email || 'Cliente'}
              </span>
            </div>
            
            {/* Status */}
            <StatusBadge status={isExpired && isActive ? 'expired' : invite.status} />
          </div>

          {/* Dettagli */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {/* Codice */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Codice:</span>
              <code className="bg-slate-700/50 px-2 py-0.5 rounded font-mono text-blue-300">
                {invite.code}
              </code>
              <button
                onClick={() => handleCopy(invite.code, 'code')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {copied === 'code' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Email */}
            {invite.clientData?.email && (
              <div className="flex items-center gap-2 text-slate-400">
                <Mail size={14} />
                <span className="truncate">{invite.clientData.email}</span>
              </div>
            )}

            {/* Aperture */}
            {invite.openCount > 0 && (
              <div className="flex items-center gap-2 text-slate-400">
                <Eye size={14} />
                <span>{invite.openCount} {invite.openCount === 1 ? 'apertura' : 'aperture'}</span>
              </div>
            )}

            {/* Scadenza */}
            {expiresAt && (
              <div className={`flex items-center gap-2 ${isExpired ? 'text-red-400' : 'text-slate-400'}`}>
                <Clock size={14} />
                <span>
                  {isExpired ? 'Scaduto' : `Scade ${expiresAt.toLocaleDateString('it-IT')}`}
                </span>
              </div>
            )}
          </div>

          {/* Data creazione */}
          <p className="text-xs text-slate-500 mt-2">
            Creato il {invite.createdAt ? new Date(invite.createdAt).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'}
          </p>
        </div>

        {/* Azioni */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <MoreVertical size={18} />
          </button>

          <AnimatePresence>
            {showActions && (
              <>
                {/* Overlay per chiudere */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowActions(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
                >
                  {/* Copia link */}
                  <button
                    onClick={() => handleCopy(inviteUrl, 'url')}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                  >
                    <Link2 size={14} />
                    {copied === 'url' ? 'Link copiato!' : 'Copia link'}
                  </button>

                  {/* WhatsApp */}
                  {invite.clientData?.phone && (
                    <a
                      href={`https://wa.me/${invite.clientData.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Ecco il tuo link di invito: ${inviteUrl}\nCodice: ${invite.code}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                    >
                      <MessageCircle size={14} />
                      Invia su WhatsApp
                      <ExternalLink size={12} className="ml-auto" />
                    </a>
                  )}

                  {/* Rigenera (solo per attivi/scaduti) */}
                  {(isActive || invite.status === 'expired') && (
                    <button
                      onClick={handleResend}
                      disabled={isResending}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isResending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      Rigenera invito
                    </button>
                  )}

                  {/* Annulla (solo per attivi) */}
                  {isActive && (
                    <button
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isCancelling ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Annulla invito
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default function InvitesManager({ onInviteCompleted }) {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active'); // all, active, completed, expired
  const [isExpanded, setIsExpanded] = useState(false); // Espanso di default

  const loadInvites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const listInvitations = httpsCallable(functions, 'listInvitations');
      const result = await listInvitations({
        tenantId: CURRENT_TENANT_ID,
        limit: 50
      });

      if (result.data.success) {
        setInvites(result.data.invitations);
      } else {
        setError('Errore nel caricamento degli inviti');
      }
    } catch (err) {
      console.error('Errore caricamento inviti:', err);
      setError(err.message || 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleResend = async (token) => {
    try {
      const resendInvitation = httpsCallable(functions, 'resendInvitation');
      await resendInvitation({ token, expiryDays: 7 });
      await loadInvites();
    } catch (err) {
      console.error('Errore rigenerazione:', err);
    }
  };

  const handleCancel = async (token) => {
    try {
      const cancelInvitation = httpsCallable(functions, 'cancelInvitation');
      await cancelInvitation({ token });
      await loadInvites();
    } catch (err) {
      console.error('Errore cancellazione:', err);
    }
  };

  // Filtra inviti
  const filteredInvites = invites.filter(invite => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'sent', 'opened'].includes(invite.status);
    if (filter === 'completed') return invite.status === 'completed';
    if (filter === 'expired') return invite.status === 'expired' || invite.status === 'cancelled';
    return true;
  });

  // Conta per categoria
  const counts = {
    all: invites.length,
    active: invites.filter(i => ['pending', 'sent', 'opened'].includes(i.status)).length,
    completed: invites.filter(i => i.status === 'completed').length,
    expired: invites.filter(i => i.status === 'expired' || i.status === 'cancelled').length,
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header collapsabile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Send className="text-blue-400" size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Inviti in Sospeso</h3>
            <p className="text-sm text-slate-400">
              {counts.active} attivi • {counts.completed} completati
            </p>
          </div>
        </div>
        <ChevronDown 
          size={20} 
          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 sm:px-6 pb-4 border-t border-slate-700/50">
              {/* Filtri */}
              <div className="flex flex-wrap gap-2 py-4">
                {[
                  { key: 'all', label: 'Tutti' },
                  { key: 'active', label: 'Attivi' },
                  { key: 'completed', label: 'Completati' },
                  { key: 'expired', label: 'Scaduti' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filter === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    {label} ({counts[key]})
                  </button>
                ))}

                {/* Refresh */}
                <button
                  onClick={loadInvites}
                  disabled={loading}
                  className="ml-auto p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Lista inviti */}
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  <p className="text-slate-400 mt-2">Caricamento inviti...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                  <p className="text-red-400 mt-2">{error}</p>
                  <button
                    onClick={loadInvites}
                    className="mt-3 text-sm text-blue-400 hover:underline"
                  >
                    Riprova
                  </button>
                </div>
              ) : filteredInvites.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400">
                    {invites.length === 0 
                      ? 'Nessun invito ancora creato' 
                      : 'Nessun invito con questo filtro'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Clicca "Nuovo Cliente" per creare un invito
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredInvites.map(invite => (
                    <InviteRow
                      key={invite.token}
                      invite={invite}
                      onResend={handleResend}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
