import { Shield, UserCog, User } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { getTenantId } from '../../../hooks/useChat';

// Helper per ottenere il ruolo dell'utente corrente
export const getCurrentUserRole = async (userId) => {
  try {
    const tenantId = getTenantId();
    
    // Check if admin
    const adminDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/admins`));
    if (adminDoc.exists() && adminDoc.data().uids?.includes(userId)) {
      return 'admin';
    }
    
    // Check if coach
    const coachDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/coaches`));
    if (coachDoc.exists() && coachDoc.data().uids?.includes(userId)) {
      return 'coach';
    }
    
    return 'client';
  } catch (err) {
    console.error('Error getting user role:', err);
    return 'client';
  }
};

// Helper per formattare il ruolo
export const formatRole = (role) => {
  switch (role) {
    case 'admin': return 'Admin';
    case 'coach': return 'Coach';
    case 'client': return 'Cliente';
    default: return role;
  }
};

// Helper per icona del ruolo
export const RoleIcon = ({ role, size = 12 }) => {
  switch (role) {
    case 'admin':
      return <Shield size={size} className="text-purple-400" />;
    case 'coach':
      return <UserCog size={size} className="text-blue-400" />;
    default:
      return <User size={size} className="text-slate-400" />;
  }
};

// Formato testo con stili (markdown-like)
export const formatTextWithStyles = (text) => {
  if (!text) return '';
  
  // Split by code blocks first to preserve them
  const parts = text.split(/(`[^`]+`)/g);
  
  return parts.map((part, i) => {
    // Code blocks
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-700/50 px-1.5 py-0.5 rounded text-sm font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    
    // Bold
    part = part.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    part = part.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
  });
};

// Estrai URL da testo
export const extractUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Quick Reply Templates per ruolo
export const QUICK_REPLY_TEMPLATES = {
  admin: [
    { label: '👋 Benvenuto', text: 'Ciao! Benvenuto nel team. Sono qui per qualsiasi domanda!' },
    { label: '📅 Appuntamento', text: 'Perfetto! Ti confermo l\'appuntamento. Ti aspetto!' },
    { label: '✅ Ricevuto', text: 'Ricevuto, grazie! Ti rispondo al più presto.' },
    { label: '💪 Motivazione', text: 'Ottimo lavoro! Continua così, stai facendo progressi incredibili! 💪🔥' },
    { label: '📋 Scheda pronta', text: 'La tua nuova scheda è pronta! Trovi tutto nella sezione dedicata.' },
    { label: '⏰ Promemoria', text: 'Ricordati di completare il check settimanale! È importante per monitorare i progressi.' },
  ],
  coach: [
    { label: '👋 Saluto', text: 'Ciao! Come posso aiutarti oggi?' },
    { label: '✅ Visto', text: 'Ho visto, perfetto! Continua così! 💪' },
    { label: '📊 Feedback', text: 'Ottimi progressi! Vedo miglioramenti rispetto alla settimana scorsa.' },
    { label: '🏋️ Allenamento', text: 'Ricordati di fare stretching prima e dopo l\'allenamento!' },
    { label: '🥗 Alimentazione', text: 'Come sta andando con il piano alimentare? Hai dubbi?' },
  ],
  client: [
    { label: '👋 Ciao', text: 'Ciao! Avrei una domanda...' },
    { label: '✅ Fatto', text: 'Fatto! Ho completato l\'allenamento di oggi 💪' },
    { label: '❓ Domanda', text: 'Avrei bisogno di un chiarimento...' },
    { label: '🙏 Grazie', text: 'Grazie mille per la disponibilità!' },
  ]
};
