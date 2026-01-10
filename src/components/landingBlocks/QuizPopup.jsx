import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { incrementPageConversions } from '../../services/landingPageService';
import { quizIconMap } from './QuizIcons';

// Prefissi telefonici internazionali più comuni
const PHONE_PREFIXES = [
  { code: '+39', country: '🇮🇹 Italia', minLength: 9, maxLength: 10 },
  { code: '+41', country: '🇨🇭 Svizzera', minLength: 9, maxLength: 9 },
  { code: '+44', country: '🇬🇧 UK', minLength: 10, maxLength: 10 },
  { code: '+33', country: '🇫🇷 Francia', minLength: 9, maxLength: 9 },
  { code: '+49', country: '🇩🇪 Germania', minLength: 10, maxLength: 11 },
  { code: '+34', country: '🇪🇸 Spagna', minLength: 9, maxLength: 9 },
  { code: '+1', country: '🇺🇸 USA/Canada', minLength: 10, maxLength: 10 },
  { code: '+43', country: '🇦🇹 Austria', minLength: 10, maxLength: 11 },
  { code: '+32', country: '🇧🇪 Belgio', minLength: 9, maxLength: 9 },
  { code: '+351', country: '🇵🇹 Portogallo', minLength: 9, maxLength: 9 },
  { code: '+31', country: '🇳🇱 Olanda', minLength: 9, maxLength: 9 },
  { code: '+48', country: '🇵🇱 Polonia', minLength: 9, maxLength: 9 },
  { code: '+40', country: '🇷🇴 Romania', minLength: 9, maxLength: 10 },
  { code: '+385', country: '🇭🇷 Croazia', minLength: 8, maxLength: 9 },
  { code: '+386', country: '🇸🇮 Slovenia', minLength: 8, maxLength: 8 },
];

/**
 * QuizPopup - Quiz interattivo RIVOLUZIONARIO con animazioni fluide
 * Supporta: selezione singola, multipla, testo libero, email, telefono, instagram, ecc.
 */
const QuizPopup = ({
  isOpen,
  onClose,
  settings = {},
  pageId = null,
  tenantId = null,
  isPreview = false
}) => {
  const {
    title = 'Scopri il tuo profilo',
    subtitle = 'Rispondi a poche domande per ricevere un piano personalizzato',
    questions = [],
    // Contact form settings
    collectContactInfo = true,
    contactTitle = 'Ultimo passaggio!',
    contactSubtitle = 'Inserisci i tuoi dati per ricevere i risultati',
    contactFields = ['nome', 'cognome', 'email', 'phone'],
    // Results settings
    showResults = true,
    resultsTitle = 'Ecco il tuo profilo',
    resultsSubtitle = 'Un nostro esperto analizzerà le tue risposte',
    resultsVideoUrl = '', // Video URL (esterno o caricato)
    resultsVideoIsUploaded = false, // true se il video è stato caricato direttamente
    // Style
    accentColor = '#f97316',
    gradientFrom = '#f97316',
    gradientTo = '#dc2626',
    // After submit
    afterSubmit = 'message',
    successMessage = 'Grazie! Ti contatteremo presto con un piano personalizzato.',
    redirectUrl = '',
    whatsappNumber = '',
    whatsappMessage = '',
    // Intro stats personalizzabili
    introStats = null, // Array di { icon, value, label }
    // Performance
    enableParticles = true,
    particleCount = 8, // Ridotto da 20 per performance
  } = settings;

  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [contactData, setContactData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [direction, setDirection] = useState(1);
  const containerRef = useRef(null);

  // Mouse tracking for glow effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Default questions with various types (using SVG icons)
  const defaultQuestions = [
    {
      id: 'problema',
      question: 'Qual è il tuo problema principale?',
      type: 'single',
      options: [
        { value: 'pancetta', label: 'Pancetta che non va via', iconType: 'svg', iconName: 'target', color: '#f97316' },
        { value: 'maniglie', label: 'Maniglie dell\'amore', iconType: 'svg', iconName: 'muscle', color: '#ef4444' },
        { value: 'entrambi', label: 'Entrambi i problemi', iconType: 'svg', iconName: 'energy', color: '#8b5cf6' },
        { value: 'altro', label: 'Altro grasso localizzato', iconType: 'svg', iconName: 'fire', color: '#ec4899' },
      ]
    },
    {
      id: 'tentativi',
      question: 'Cosa hai già provato senza successo?',
      type: 'multiple',
      maxSelections: 3,
      options: [
        { value: 'diete', label: 'Diete restrittive', iconType: 'svg', iconName: 'diet', color: '#22c55e' },
        { value: 'cardio', label: 'Ore di cardio', iconType: 'svg', iconName: 'cardio', color: '#3b82f6' },
        { value: 'palestra', label: 'Palestra senza guida', iconType: 'svg', iconName: 'gym', color: '#64748b' },
        { value: 'integratori', label: 'Integratori', iconType: 'svg', iconName: 'supplement', color: '#a855f7' },
        { value: 'nulla', label: 'Non ho ancora provato nulla', iconType: 'svg', iconName: 'sprout', color: '#10b981' },
      ]
    },
    {
      id: 'obiettivo',
      question: 'Descrivi brevemente il tuo obiettivo',
      type: 'textarea',
      placeholder: 'Es: Voglio perdere 5kg di grasso addominale in 3 mesi...',
      maxLength: 500,
    }
  ];

  // Contact field configurations - Supporta nome, cognome, email, telefono, instagram, età, città
  const contactFieldConfig = {
    nome: { id: 'nome', label: 'Nome', type: 'text', placeholder: 'Il tuo nome', required: true, icon: '👤' },
    cognome: { id: 'cognome', label: 'Cognome', type: 'text', placeholder: 'Il tuo cognome', required: true, icon: '👤' },
    name: { id: 'name', label: 'Nome Completo', type: 'text', placeholder: 'Nome e Cognome', required: true, icon: '👤' },
    email: { id: 'email', label: 'Email', type: 'email', placeholder: 'La tua email', required: true, icon: '📧' },
    phone: { id: 'phone', label: 'Telefono', type: 'phone', placeholder: '333 1234567', required: true, icon: '📱' },
    telefono: { id: 'telefono', label: 'Telefono', type: 'phone', placeholder: '333 1234567', required: true, icon: '📱' },
    instagram: { id: 'instagram', label: 'Instagram', type: 'text', placeholder: '@tuoprofilo', required: true, icon: '📸' },
    eta: { id: 'eta', label: 'Età', type: 'number', placeholder: 'La tua età', required: false, icon: '🎂' },
    citta: { id: 'citta', label: 'Città', type: 'text', placeholder: 'La tua città', required: false, icon: '📍' },
  };
  
  // State per prefisso telefono
  const [phonePrefix, setPhonePrefix] = useState('+39');
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  
  // Detect mobile/touch device and iOS
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Disabilita animazioni pesanti su iOS per performance
  const reduceAnimations = isIOS || isTouchDevice;

  const activeQuestions = questions && questions.length > 0 ? questions : defaultQuestions;
  const totalSteps = activeQuestions.length + (collectContactInfo ? 1 : 0) + 1;
  const progress = Math.min((currentStep / totalSteps) * 100, 100);

  // Handle mouse move for glow effect - disabled on touch devices
  const handleMouseMove = (e) => {
    if (isTouchDevice || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // Handle answer for different question types
  const handleAnswer = useCallback((questionId, value, questionType, maxSelections) => {
    if (questionType === 'multiple') {
      setAnswers(prev => {
        const currentAnswers = prev[questionId] || [];
        if (currentAnswers.includes(value)) {
          return { ...prev, [questionId]: currentAnswers.filter(v => v !== value) };
        }
        if (maxSelections && currentAnswers.length >= maxSelections) {
          return prev;
        }
        return { ...prev, [questionId]: [...currentAnswers, value] };
      });
    } else if (questionType === 'single') {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
      // Auto advance for single selection
      setTimeout(() => {
        setDirection(1);
        setCurrentStep(prev => prev + 1);
      }, 400);
    } else {
      // Text/textarea - just update the value
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  }, []);

  // Handle contact form change
  const handleContactChange = (field, value) => {
    // Per il telefono, rimuovi caratteri non numerici
    if (field === 'phone' || field === 'telefono') {
      value = value.replace(/\D/g, '');
    }
    setContactData(prev => ({ ...prev, [field]: value }));
  };
  
  // Ottieni la configurazione del prefisso corrente
  const getCurrentPrefixConfig = () => {
    return PHONE_PREFIXES.find(p => p.code === phonePrefix) || PHONE_PREFIXES[0];
  };

  // Validate contact form
  const validateContact = () => {
    const errors = {};
    const activeFields = contactFields.map(f => contactFieldConfig[f]).filter(Boolean);
    const prefixConfig = getCurrentPrefixConfig();
    
    activeFields.forEach(field => {
      if (field.required && !contactData[field.id]?.trim()) {
        errors[field.id] = 'Campo obbligatorio';
      }
      if (field.type === 'email' && contactData[field.id]) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData[field.id])) {
          errors[field.id] = 'Email non valida';
        }
      }
      // Validazione telefono
      if (field.type === 'phone' && contactData[field.id]) {
        const phoneNumber = contactData[field.id].replace(/\D/g, '');
        if (phoneNumber.length < prefixConfig.minLength || phoneNumber.length > prefixConfig.maxLength) {
          errors[field.id] = `Il numero deve avere ${prefixConfig.minLength === prefixConfig.maxLength ? prefixConfig.minLength : `${prefixConfig.minLength}-${prefixConfig.maxLength}`} cifre per ${prefixConfig.country}`;
        }
      }
      // Validazione Instagram
      if (field.id === 'instagram' && contactData[field.id]) {
        const ig = contactData[field.id].trim();
        if (ig && !ig.startsWith('@')) {
          // Auto-aggiungi @ se mancante
          setContactData(prev => ({ ...prev, instagram: '@' + ig }));
        }
      }
    });
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Submit quiz - Salva su leads collection per landing pages
  const handleSubmit = async () => {
    if (isPreview) {
      toast?.showToast?.('Quiz in preview - invio disabilitato', 'info');
      setIsCompleted(true);
      setDirection(1);
      setCurrentStep(totalSteps);
      return;
    }

    if (collectContactInfo) {
      const { isValid } = validateContact();
      if (!isValid) {
        toast?.showToast?.('Compila tutti i campi obbligatori', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Save quiz lead - SALVA SU tenants/{tenantId}/leads per sezione Landing Pages Leads
      if (tenantId) {
        // Flatten quiz answers per una migliore visualizzazione nei leads
        const flattenedAnswers = {};
        Object.entries(answers).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            flattenedAnswers[`quiz_${key}`] = value.join(', ');
          } else {
            flattenedAnswers[`quiz_${key}`] = value;
          }
        });

        // Normalizza il campo name per la visualizzazione in Leads
        const normalizedName = contactData.name || 
          (contactData.nome && contactData.cognome 
            ? `${contactData.nome} ${contactData.cognome}` 
            : contactData.nome || contactData.cognome || '');

        // Normalizza il telefono con prefisso
        const phoneField = contactData.phone || contactData.telefono;
        const fullPhone = phoneField ? `${phonePrefix}${phoneField.replace(/\D/g, '')}` : '';

        const leadData = {
          // Campo name normalizzato per la lista leads
          name: normalizedName,
          // Dati contatto (nome, cognome, email, telefono, instagram, ecc.)
          ...contactData,
          // Telefono con prefisso completo
          phone: fullPhone,
          telefono: fullPhone,
          phonePrefix: phonePrefix,
          // Risposte quiz flatten per visualizzazione
          ...flattenedAnswers,
          // Risposte quiz originali
          quizAnswers: answers,
          // Metadata
          source: 'quiz_popup',
          landingPageId: pageId,
          status: 'new',
          createdAt: serverTimestamp(),
          tenantId,
        };

        // Salva nella collection leads - visibile in Landing Pages > Leads
        await addDoc(collection(db, `tenants/${tenantId}/leads`), leadData);
      }

      // Increment conversions
      if (pageId && tenantId) {
        await incrementPageConversions(db, pageId);
      }

      setIsCompleted(true);
      setDirection(1);
      setCurrentStep(totalSteps);
      handleAfterSubmitAction();

    } catch (error) {
      console.error('Errore invio quiz:', error);
      toast?.showToast?.('Errore durante l\'invio. Riprova.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAfterSubmitAction = () => {
    switch (afterSubmit) {
      case 'redirect':
        if (redirectUrl) {
          setTimeout(() => { window.location.href = redirectUrl; }, 3000);
        }
        break;
      case 'whatsapp':
        if (whatsappNumber) {
          setTimeout(() => {
            let message = whatsappMessage || `Ciao! Ho completato il quiz:\n`;
            Object.entries(answers).forEach(([key, value]) => {
              message += `${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
            });
            const cleanNumber = whatsappNumber.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
          }, 2000);
        }
        break;
      default:
        break;
    }
  };

  // Navigation
  const handleClose = () => {
    setCurrentStep(0);
    setAnswers({});
    setContactData({});
    setIsCompleted(false);
    setDirection(1);
    onClose();
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const goNext = () => {
    setDirection(1);
    setCurrentStep(prev => prev + 1);
  };

  // Check if can proceed from current question
  const canProceed = () => {
    if (currentStep === 0) return true;
    const questionIndex = currentStep - 1;
    if (questionIndex < activeQuestions.length) {
      const question = activeQuestions[questionIndex];
      const answer = answers[question.id];
      if (question.type === 'multiple') {
        return answer && answer.length > 0;
      }
      if (question.type === 'text' || question.type === 'textarea') {
        return answer && answer.trim().length > 0;
      }
      return !!answer;
    }
    return true;
  };

  // Animation variants - più leggere su dispositivi mobili/iOS
  const slideVariants = reduceAnimations ? {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  } : {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  const springConfig = reduceAnimations 
    ? { duration: 0.15 }
    : { type: 'spring', stiffness: 300, damping: 30 };

  // Helper per renderizzare icona (SVG o emoji)
  const renderOptionIcon = (option) => {
    if (option.iconType === 'svg' && option.iconName) {
      const IconComponent = quizIconMap[option.iconName];
      if (IconComponent) {
        return (
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              background: `${option.color || accentColor}20`,
            }}
          >
            <IconComponent 
              className="w-6 h-6" 
              style={{ color: option.color || accentColor }}
            />
          </div>
        );
      }
    }
    // Fallback a emoji se presente
    if (option.icon) {
      return <span className="text-2xl flex-shrink-0">{option.icon}</span>;
    }
    return null;
  };

  // Particle effect component - OTTIMIZZATO con CSS animations, disabilitato su mobile
  const FloatingParticles = React.memo(() => {
    if (!enableParticles || reduceAnimations) return null;
    
    // Genera posizioni fisse per evitare re-render
    const particles = React.useMemo(() => 
      [...Array(Math.min(particleCount, 12))].map((_, i) => ({
        id: i,
        left: `${10 + (i * 73) % 80}%`,
        top: `${15 + (i * 61) % 70}%`,
        delay: `${(i * 0.5) % 3}s`,
        duration: `${3 + (i % 3)}s`,
        color: i % 2 === 0 ? gradientFrom : gradientTo,
      })), [particleCount, gradientFrom, gradientTo]
    );
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes floatParticle {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
            50% { transform: translateY(-20px) scale(1.3); opacity: 0.7; }
          }
        `}</style>
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 rounded-full will-change-transform"
            style={{
              background: p.color,
              left: p.left,
              top: p.top,
              animation: `floatParticle ${p.duration} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>
    );
  });

  // Render intro screen
  const renderIntro = () => (
    <motion.div
      key="intro"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={springConfig}
      className="text-center py-6"
    >
      {/* Animated logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="w-28 h-28 mx-auto mb-8 relative"
      >
        {/* Rotating rings - CSS animation per performance */}
        <style>{`
          @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes spinSlowReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        `}</style>
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed will-change-transform"
          style={{ 
            borderColor: `${accentColor}40`,
            animation: 'spinSlow 20s linear infinite',
          }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-dashed will-change-transform"
          style={{ 
            borderColor: `${gradientTo}40`,
            animation: 'spinSlowReverse 15s linear infinite',
          }}
        />
        
        {/* Center glow */}
        <div 
          className="absolute inset-4 rounded-full blur-xl opacity-60"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        />
        <div 
          className="absolute inset-4 rounded-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          <motion.span 
            className="text-4xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎯
          </motion.span>
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight"
      >
        {title}
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-slate-400 mb-8 max-w-sm mx-auto text-lg"
      >
        {subtitle}
      </motion.p>

      {/* Stats with animations - PERSONALIZZABILI */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-8 mb-10"
      >
        {(introStats && introStats.length > 0 ? introStats : [
          { value: activeQuestions.length, label: 'Domande', icon: '❓' },
          { value: '2 min', label: 'Tempo', icon: '⏱️' },
          { value: '100%', label: 'Gratuito', icon: '🎁' },
        ]).map((stat, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
            className="text-center"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.03, boxShadow: `0 20px 60px -15px ${accentColor}80` }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { setDirection(1); setCurrentStep(1); }}
        className="w-full py-5 px-8 text-white font-bold text-xl rounded-2xl shadow-2xl transition-all relative overflow-hidden group"
        style={{ 
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }}
      >
        {/* Shine effect - CSS */}
        <style>{`
          @keyframes btnShine { 0% { transform: translateX(-200%); } 100% { transform: translateX(200%); } }
        `}</style>
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent will-change-transform"
          style={{ animation: 'btnShine 4s ease-in-out infinite' }}
        />
        <span className="relative flex items-center justify-center gap-3">
          Inizia il Quiz
          <span className="inline-block animate-[pulse_1s_ease-in-out_infinite]">→</span>
        </span>
      </motion.button>
    </motion.div>
  );

  // Render question based on type
  const renderQuestion = (questionIndex) => {
    const question = activeQuestions[questionIndex];
    if (!question) return null;

    return (
      <motion.div
        key={`question-${questionIndex}`}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={springConfig}
        className="py-4"
      >
        {/* Question number badge */}
        <motion.div
          initial={reduceAnimations ? { opacity: 0 } : { scale: 0, rotate: -180 }}
          animate={reduceAnimations ? { opacity: 1 } : { scale: 1, rotate: 0 }}
          transition={reduceAnimations ? { duration: 0.15 } : { type: 'spring', stiffness: 300 }}
          className="w-14 h-14 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white font-bold text-xl relative"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          <span className="relative z-10">{questionIndex + 1}</span>
          {!reduceAnimations && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ 
                background: `conic-gradient(from 0deg, transparent, ${accentColor}40, transparent)`,
              }}
            />
          )}
        </motion.div>

        <motion.h3
          initial={reduceAnimations ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceAnimations ? { duration: 0.1 } : { delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-tight"
        >
          {question.question}
        </motion.h3>

        {/* Render based on question type */}
        {(question.type === 'single' || question.type === 'multiple') && (
          <div className="space-y-3">
            {question.type === 'multiple' && (
              <p className="text-slate-400 text-center text-sm mb-4">
                Seleziona {question.maxSelections ? `fino a ${question.maxSelections}` : 'tutte le'} opzioni che si applicano
              </p>
            )}
            {question.options?.map((option, idx) => {
              const isSelected = question.type === 'multiple'
                ? (answers[question.id] || []).includes(option.value)
                : answers[question.id] === option.value;

              return (
                <motion.button
                  key={option.value}
                  initial={reduceAnimations ? { opacity: 0 } : { opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={reduceAnimations ? { duration: 0.1, delay: idx * 0.03 } : { delay: 0.15 + idx * 0.08 }}
                  whileHover={reduceAnimations ? undefined : { scale: 1.02, x: 8 }}
                  whileTap={reduceAnimations ? { scale: 0.98 } : { scale: 0.98 }}
                  onClick={() => handleAnswer(question.id, option.value, question.type, question.maxSelections)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 relative overflow-hidden ${
                    isSelected
                      ? 'border-transparent text-white'
                      : 'border-white/10 bg-white/5 hover:border-white/20 text-white'
                  }`}
                  style={isSelected ? {
                    background: `linear-gradient(135deg, ${option.color || gradientFrom}30, ${gradientTo}30)`,
                    borderColor: option.color || accentColor,
                  } : {}}
                >
                  {/* Selection indicator */}
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'border-transparent' : 'border-white/30'
                  }`}
                  style={isSelected ? { background: option.color || accentColor } : {}}>
                    {isSelected && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </div>
                  
                  {/* Icona SVG o Emoji */}
                  {renderOptionIcon(option)}
                  <span className="font-medium text-lg">{option.label}</span>
                  
                  {/* Glow effect on selected */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 opacity-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.2 }}
                      style={{ background: `radial-gradient(circle at 30% 50%, ${option.color || accentColor}, transparent 70%)` }}
                    />
                  )}
                </motion.button>
              );
            })}

            {/* Continue button for multiple selection */}
            {question.type === 'multiple' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: canProceed() ? 1 : 0.5 }}
                whileHover={canProceed() ? { scale: 1.02 } : {}}
                whileTap={canProceed() ? { scale: 0.98 } : {}}
                onClick={goNext}
                disabled={!canProceed()}
                className="w-full mt-6 py-4 px-8 text-white font-bold text-lg rounded-xl transition-all"
                style={{ 
                  background: canProceed() 
                    ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
                    : 'rgba(255,255,255,0.1)',
                }}
              >
                Continua →
              </motion.button>
            )}
          </div>
        )}

        {/* Text input */}
        {question.type === 'text' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <input
              type="text"
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value, 'text')}
              placeholder={question.placeholder || 'Scrivi la tua risposta...'}
              className="w-full px-5 py-4 bg-slate-800 border-2 border-white/10 rounded-2xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-opacity-100 transition-all appearance-none"
              style={{ 
                borderColor: answers[question.id] ? accentColor : undefined,
                WebkitAppearance: 'none',
                backgroundColor: '#1e293b' // slate-800 solid for iOS
              }}
            />
            <motion.button
              whileHover={canProceed() ? { scale: 1.02 } : {}}
              whileTap={canProceed() ? { scale: 0.98 } : {}}
              onClick={goNext}
              disabled={!canProceed()}
              className="w-full py-4 px-8 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50"
              style={{ 
                background: canProceed() 
                  ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
                  : 'rgba(255,255,255,0.1)',
              }}
            >
              Continua →
            </motion.button>
          </motion.div>
        )}

        {/* Textarea */}
        {question.type === 'textarea' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="relative">
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value, 'textarea')}
                placeholder={question.placeholder || 'Descrivi in dettaglio...'}
                maxLength={question.maxLength || 500}
                rows={4}
                className="w-full px-5 py-4 bg-slate-800 border-2 border-white/10 rounded-2xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-opacity-100 transition-all resize-none appearance-none"
                style={{ 
                  borderColor: answers[question.id] ? accentColor : undefined,
                  WebkitAppearance: 'none',
                  backgroundColor: '#1e293b' // slate-800 solid for iOS
                }}
              />
              {question.maxLength && (
                <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                  {(answers[question.id] || '').length}/{question.maxLength}
                </div>
              )}
            </div>
            <motion.button
              whileHover={canProceed() ? { scale: 1.02 } : {}}
              whileTap={canProceed() ? { scale: 0.98 } : {}}
              onClick={goNext}
              disabled={!canProceed()}
              className="w-full py-4 px-8 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50"
              style={{ 
                background: canProceed() 
                  ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
                  : 'rgba(255,255,255,0.1)',
              }}
            >
              Continua →
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Render contact form - Supporta tutti i campi richiesti
  const renderContactForm = () => {
    const activeFields = contactFields.map(f => contactFieldConfig[f]).filter(Boolean);
    const prefixConfig = getCurrentPrefixConfig();
    const { errors } = validateContact();

    return (
      <motion.div
        key="contact"
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={springConfig}
        className="py-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center relative"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          <span className="text-4xl">📝</span>
        </motion.div>

        <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">{contactTitle}</h3>
        <p className="text-slate-400 text-center mb-8">{contactSubtitle}</p>

        <div className="space-y-4">
          {activeFields.map((field, idx) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
            >
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <span>{field.icon}</span>
                {field.label}
                {field.required && <span className="text-red-400">*</span>}
              </label>
              
              {/* Campo telefono con selettore prefisso */}
              {field.type === 'phone' ? (
                <div className="flex gap-2">
                  {/* Selettore Prefisso */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
                      className="h-full px-3 py-4 bg-slate-800 border-2 border-white/10 rounded-xl text-white flex items-center gap-2 min-w-[100px] justify-between"
                      style={{ backgroundColor: '#1e293b' }}
                    >
                      <span>{phonePrefix}</span>
                      <svg className={`w-4 h-4 transition-transform ${showPrefixDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown prefissi */}
                    <AnimatePresence>
                      {showPrefixDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 mt-1 w-56 max-h-60 overflow-y-auto bg-slate-800 border border-white/20 rounded-xl shadow-2xl z-50"
                          style={{ backgroundColor: '#1e293b' }}
                        >
                          {PHONE_PREFIXES.map((prefix) => (
                            <button
                              key={prefix.code}
                              type="button"
                              onClick={() => {
                                setPhonePrefix(prefix.code);
                                setShowPrefixDropdown(false);
                              }}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors flex items-center justify-between ${
                                phonePrefix === prefix.code ? 'bg-white/10 text-orange-400' : 'text-white'
                              }`}
                            >
                              <span>{prefix.country}</span>
                              <span className="text-slate-400">{prefix.code}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Input numero */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={contactData[field.id] || ''}
                    onChange={(e) => handleContactChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={prefixConfig.maxLength}
                    className="flex-1 px-5 py-4 bg-slate-800 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all appearance-none"
                    style={{ 
                      borderColor: contactData[field.id] ? `${accentColor}50` : undefined,
                      WebkitAppearance: 'none',
                      backgroundColor: '#1e293b'
                    }}
                  />
                </div>
              ) : (
                /* Altri campi standard */
                <input
                  type={field.type === 'phone' ? 'tel' : field.type}
                  value={contactData[field.id] || ''}
                  onChange={(e) => handleContactChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-5 py-4 bg-slate-800 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all appearance-none"
                  style={{ 
                    borderColor: contactData[field.id] ? `${accentColor}50` : undefined,
                    WebkitAppearance: 'none',
                    backgroundColor: '#1e293b'
                  }}
                />
              )}
              
              {/* Errore validazione */}
              {errors[field.id] && contactData[field.id] && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors[field.id]}
                </motion.p>
              )}
              
              {/* Helper per telefono */}
              {field.type === 'phone' && contactData[field.id] && (
                <p className="text-slate-500 text-xs mt-1">
                  {contactData[field.id].length}/{prefixConfig.minLength === prefixConfig.maxLength ? prefixConfig.maxLength : `${prefixConfig.minLength}-${prefixConfig.maxLength}`} cifre
                </p>
              )}
            </motion.div>
          ))}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, boxShadow: `0 20px 60px -15px ${accentColor}60` }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-5 px-8 text-white font-bold text-xl rounded-xl shadow-xl transition-all disabled:opacity-50 relative overflow-hidden mt-6"
            style={{ 
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
                />
                Invio in corso...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🚀 Scopri il tuo profilo
              </span>
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  };

  // Render results/success
  const renderResults = () => (
    <motion.div
      key="results"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={springConfig}
      className="text-center py-8"
    >
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-28 h-28 mx-auto mb-8 relative"
      >
        {/* Celebration rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: i % 2 === 0 ? '#22c55e' : '#10b981' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5 + i * 0.3, opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
        
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/30">
          <motion.svg
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-14 h-14 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        </div>

        {/* Confetti */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{ 
              background: ['#f97316', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6'][i % 5],
              top: '50%',
              left: '50%',
            }}
            initial={{ x: 0, y: 0, scale: 0 }}
            animate={{ 
              x: Math.cos(i * 30 * Math.PI / 180) * 100,
              y: Math.sin(i * 30 * Math.PI / 180) * 100,
              scale: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          />
        ))}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-3xl md:text-4xl font-bold text-white mb-4"
      >
        {resultsTitle}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-slate-400 mb-8 max-w-sm mx-auto text-lg"
      >
        {resultsSubtitle}
      </motion.p>

      {/* Video dopo completamento quiz */}
      {resultsVideoUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="w-full mb-8 rounded-2xl overflow-hidden border border-white/10"
        >
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            {resultsVideoIsUploaded ? (
              // Video caricato direttamente - usa tag video HTML
              <video
                src={resultsVideoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                controls
                playsInline
              />
            ) : (
              // Video esterno (YouTube/Vimeo) - usa iframe
              <iframe
                src={resultsVideoUrl.includes('youtube.com') || resultsVideoUrl.includes('youtu.be') 
                  ? resultsVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                  : resultsVideoUrl.includes('vimeo.com')
                    ? resultsVideoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')
                    : resultsVideoUrl
                }
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video risultati quiz"
              />
            )}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 mb-8"
      >
        <p className="text-slate-200 text-lg">{successMessage}</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClose}
        className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all text-lg"
      >
        Chiudi
      </motion.button>
    </motion.div>
  );

  // Determine current content
  const getCurrentContent = () => {
    if (currentStep === 0) return renderIntro();
    
    const questionIndex = currentStep - 1;
    if (questionIndex < activeQuestions.length) {
      return renderQuestion(questionIndex);
    }
    
    if (collectContactInfo && questionIndex === activeQuestions.length) {
      return renderContactForm();
    }
    
    return renderResults();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="quiz-popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overscroll-none"
          style={{ touchAction: 'none' }}
          onClick={handleClose}
          onMouseMove={handleMouseMove}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: `radial-gradient(circle at 50% 50%, ${gradientFrom}20 0%, transparent 50%), 
                           radial-gradient(circle at 0% 100%, ${gradientTo}20 0%, transparent 50%),
                           rgba(0,0,0,0.95)`,
            }}
          />
          
          {/* Floating particles */}
          <FloatingParticles />

          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-b from-slate-800/95 to-slate-900/98 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden"
            style={{ 
              boxShadow: `0 25px 100px -20px ${accentColor}30, 0 0 0 1px ${accentColor}10`,
            }}
          >
            {/* Progress bar - CSS shimmer per performance */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 overflow-hidden rounded-t-3xl">
              <style>{`
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
              `}</style>
              <motion.div
                className="h-full relative overflow-hidden"
                style={{ background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})` }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {/* Shimmer effect - CSS */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent will-change-transform"
                  style={{ animation: 'shimmer 2.5s ease-in-out infinite' }}
                />
              </motion.div>
            </div>

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-xl"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            {/* Back button */}
            <AnimatePresence>
              {currentStep > 0 && currentStep < totalSteps && !isCompleted && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  whileHover={{ scale: 1.1, x: -3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goBack}
                  className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-xl flex items-center gap-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Content */}
            <div className="mt-6 overflow-hidden">
              <AnimatePresence mode={reduceAnimations ? "sync" : "wait"} custom={direction}>
                {getCurrentContent()}
              </AnimatePresence>
            </div>

            {/* Step dots */}
            <AnimatePresence>
              {currentStep > 0 && currentStep <= activeQuestions.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center gap-2 mt-6"
                >
                  {activeQuestions.map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="h-2 rounded-full transition-all duration-500"
                      animate={{
                        width: idx < currentStep ? 24 : 8,
                        background: idx < currentStep 
                          ? `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`
                          : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default React.memo(QuizPopup);
