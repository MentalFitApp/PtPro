// src/pages/admin/landingPages/components/SectionLibraryModal.jsx
import React from 'react';
import { X, Sparkles, Upload, Mail, Grid3x3, DollarSign, MessageCircle, Megaphone, HelpCircle } from 'lucide-react';

const SECTION_TEMPLATES = [
  {
    type: 'hero',
    icon: Sparkles,
    name: 'Hero',
    description: 'Sezione principale con titolo, CTA e background',
    defaultProps: {
      title: 'Benvenuto',
      subtitle: 'La tua descrizione qui',
      ctaText: 'Inizia Ora',
      ctaAction: 'scroll',
      ctaTarget: '#contact',
      showOverlay: true,
    }
  },
  {
    type: 'videoUpload',
    icon: Upload,
    name: 'Upload Video',
    description: 'Form per caricare video fino a 1GB',
    defaultProps: {
      title: 'Carica il tuo video',
      description: 'Condividi il tuo contenuto con noi',
      maxSize: 1024,
      requireName: true,
      requireEmail: true,
      requirePhone: false,
      successMessage: 'Video caricato con successo!',
      buttonText: 'Carica Video',
    }
  },
  {
    type: 'contactForm',
    icon: Mail,
    name: 'Form Contatto',
    description: 'Form contatti con notifiche email',
    defaultProps: {
      title: 'Contattaci',
      description: 'Compila il form e ti risponderemo presto',
      showName: true,
      showEmail: true,
      showPhone: true,
      showMessage: true,
      submitText: 'Invia',
      successMessage: 'Messaggio inviato!',
    }
  },
  {
    type: 'features',
    icon: Grid3x3,
    name: 'Caratteristiche',
    description: 'Griglia di features con icone',
    defaultProps: {
      title: 'Le nostre caratteristiche',
      columns: 3,
      items: [
        { icon: '⚡', title: 'Veloce', description: 'Performance ottimizzate' },
        { icon: '🔒', title: 'Sicuro', description: 'Protezione dati garantita' },
        { icon: '🎯', title: 'Preciso', description: 'Risultati accurati' },
      ]
    }
  },
  {
    type: 'pricing',
    icon: DollarSign,
    name: 'Prezzi',
    description: 'Tabelle di prezzi e piani',
    defaultProps: {
      title: 'I nostri piani',
      plans: [
        {
          name: 'Base',
          price: '29',
          period: 'mese',
          features: ['Feature 1', 'Feature 2'],
          ctaText: 'Inizia',
          ctaUrl: '#',
          highlighted: false
        },
        {
          name: 'Pro',
          price: '79',
          period: 'mese',
          features: ['Tutte le feature Base', 'Feature Premium'],
          ctaText: 'Inizia',
          ctaUrl: '#',
          highlighted: true
        }
      ]
    }
  },
  {
    type: 'testimonials',
    icon: MessageCircle,
    name: 'Testimonianze',
    description: 'Recensioni clienti',
    defaultProps: {
      title: 'Cosa dicono di noi',
      layout: 'grid',
      items: [
        {
          name: 'Mario Rossi',
          role: 'CEO',
          text: 'Servizio eccellente!',
          rating: 5,
        }
      ]
    }
  },
  {
    type: 'cta',
    icon: Megaphone,
    name: 'Call to Action',
    description: 'Invito all\'azione',
    defaultProps: {
      title: 'Pronto a iniziare?',
      subtitle: 'Unisciti a noi oggi stesso',
      buttonText: 'Contattaci',
      buttonAction: 'scroll',
      buttonTarget: '#contact',
      style: 'gradient',
      size: 'large'
    }
  },
  {
    type: 'faq',
    icon: HelpCircle,
    name: 'FAQ',
    description: 'Domande frequenti',
    defaultProps: {
      title: 'Domande Frequenti',
      items: [
        { question: 'Domanda 1?', answer: 'Risposta 1' },
        { question: 'Domanda 2?', answer: 'Risposta 2' },
      ]
    }
  }
];

export default function SectionLibraryModal({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Aggiungi Sezione</h2>
            <p className="text-sm text-slate-400">Scegli una sezione dalla libreria</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Grid sezioni */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTION_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.type}
                  onClick={() => {
                    const newSection = {
                      id: `section_${Date.now()}`,
                      type: template.type,
                      props: template.defaultProps
                    };
                    onSelect(newSection);
                    onClose();
                  }}
                  className="group p-6 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-700 hover:border-blue-500 rounded-xl transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <Icon size={24} className="text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-white">{template.name}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{template.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
