import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { 
  Dumbbell, 
  Users, 
  Calendar, 
  BarChart3, 
  MessageSquare, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  Target,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Play,
  Shield,
  Clock,
  Award,
  Rocket,
  Heart,
  ChevronRight,
  Globe,
  Lock
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { DynamicBlock } from '../../components/landingBlocks';
import PrivacyBanner from '../../components/PrivacyBanner';

// ==================== ANIMATED COUNTER COMPONENT ====================
const AnimatedCounter = ({ value, suffix = '', prefix = '', duration = 2 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);
  
  // Parse the numeric value
  const numericValue = parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;
  
  useEffect(() => {
    if (isInView) {
      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(easeOutQuart * numericValue));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, numericValue, duration]);
  
  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

// ==================== FLOATING PARTICLES ====================
const FloatingParticles = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: `radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ==================== ANIMATED GRADIENT ORB ====================
const GradientOrb = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
    animate={{
      scale: [1, 1.2, 1],
      x: [0, 50, 0],
      y: [0, 30, 0],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

// ==================== ANIMATED STARS BACKGROUND ====================
const AnimatedStars = ({ count = 150 }) => {
  const stars = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 3,
    opacity: Math.random() * 0.7 + 0.3,
    isGold: i % 8 === 0,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className={`absolute rounded-full ${star.isGold ? 'bg-yellow-400' : 'bg-blue-400'}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: star.isGold 
              ? '0 0 10px #fbbf24, 0 0 20px #fbbf24' 
              : '0 0 6px #60a5fa',
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 0.2, star.opacity],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ==================== GLOWING BUTTON ====================
const GlowingButton = ({ children, onClick, variant = 'primary', className = '' }) => (
  <motion.button
    onClick={onClick}
    className={`relative group overflow-hidden ${className}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.98 }}
  >
    {variant === 'primary' && (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 opacity-100"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ backgroundSize: '200% 200%' }}
      />
    )}
    <span className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </span>
    <motion.div
      className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"
    />
  </motion.button>
);

// ==================== DEFAULT CONFIG ====================
const defaultLandingConfig = {
  hero: {
    title: "Il Futuro del Fitness Management",
    subtitle: "La piattaforma AI-powered che trasforma personal trainer in imprenditori di successo. Gestisci clienti, crea programmi e scala il tuo business.",
    ctaPrimary: "Prova Gratis 14 Giorni",
    ctaSecondary: "Guarda Demo",
    backgroundImage: null,
    showStats: true,
    stats: [
      { value: "500", suffix: "+", label: "Personal Trainer Attivi" },
      { value: "15000", suffix: "+", label: "Clienti Gestiti" },
      { value: "98", suffix: "%", label: "Tasso Soddisfazione" },
      { value: "10", suffix: "h", label: "Risparmiate a Settimana" }
    ]
  },
  howItWorks: [
    {
      step: 1,
      icon: "rocket",
      title: "Registrati in 2 Minuti",
      description: "Crea il tuo account gratuito. Nessuna carta di credito richiesta per iniziare."
    },
    {
      step: 2,
      icon: "users",
      title: "Aggiungi i Tuoi Clienti",
      description: "Importa o crea profili clienti con anamnesi, obiettivi e preferenze."
    },
    {
      step: 3,
      icon: "target",
      title: "Crea Programmi Personalizzati",
      description: "Usa l'AI per generare schede allenamento e piani alimentari su misura."
    },
    {
      step: 4,
      icon: "chart",
      title: "Monitora i Progressi",
      description: "Traccia risultati, analizza dati e fai crescere il tuo business."
    }
  ],
  features: [
    {
      icon: "users",
      title: "Gestione Clienti Avanzata",
      description: "CRM completo con anamnesi dettagliate, storico progressi, foto before/after e note personalizzate."
    },
    {
      icon: "calendar",
      title: "Calendario Smart",
      description: "Pianifica sessioni, gestisci disponibilità e sincronizza con Google Calendar automaticamente."
    },
    {
      icon: "chart",
      title: "Analytics & Insights",
      description: "Dashboard interattive con KPI del business, retention clienti e previsioni di fatturato."
    },
    {
      icon: "message",
      title: "Chat & Video Call",
      description: "Comunica in tempo reale con chat integrata e videochiamate HD per coaching online."
    },
    {
      icon: "target",
      title: "Schede AI-Powered",
      description: "Genera programmi personalizzati con intelligenza artificiale in pochi secondi."
    },
    {
      icon: "zap",
      title: "Automazioni Intelligenti",
      description: "Reminder automatici, follow-up programmati e workflow personalizzabili."
    }
  ],
  pricing: {
    plans: [
      {
        name: "Starter",
        price: "29",
        period: "/mese",
        description: "Per chi inizia",
        features: [
          "Fino a 20 clienti",
          "Calendario base",
          "Chat illimitata",
          "Schede allenamento",
          "App mobile",
          "Supporto email"
        ],
        highlighted: false
      },
      {
        name: "Professional",
        price: "79",
        period: "/mese",
        description: "Il più scelto",
        features: [
          "Clienti illimitati",
          "Calendario avanzato",
          "Chat + videochiamate",
          "Schede AI-powered",
          "Analytics complete",
          "Automazioni",
          "Branding personalizzato",
          "Supporto prioritario"
        ],
        highlighted: true
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Per team e palestre",
        features: [
          "Tutto di Professional",
          "Multi-trainer",
          "API personalizzate",
          "White-label completo",
          "Dominio custom",
          "Account manager",
          "Training dedicato"
        ],
        highlighted: false
      }
    ]
  },
  testimonials: [
    {
      name: "Marco Rossi",
      role: "Personal Trainer, Milano",
      avatar: null,
      rating: 5,
      text: "FitFlows ha rivoluzionato il mio business. Risparmio 10 ore a settimana e i miei clienti sono entusiasti dell'esperienza professionale."
    },
    {
      name: "Sara Bianchi",
      role: "Fitness Coach Online",
      avatar: null,
      rating: 5,
      text: "Gestisco 80+ clienti da remoto senza stress. L'AI per le schede è incredibile, mi fa risparmiare ore ogni giorno!"
    },
    {
      name: "Luca Verdi",
      role: "Owner, FitStudio Roma",
      avatar: null,
      rating: 5,
      text: "Gestiamo 5 trainer e 200+ clienti con facilità. Il ROI è stato immediato: +40% fatturato in 6 mesi."
    }
  ],
  cta: {
    title: "Pronto a Rivoluzionare il Tuo Business?",
    subtitle: "Unisciti a centinaia di professionisti che stanno crescendo con FitFlows",
    buttonText: "Inizia la Prova Gratuita"
  },
  branding: {
    logoUrl: "/logo192.png",
    appName: "FitFlows",
    primaryColor: "#3b82f6",
    accentColor: "#06b6d4"
  }
};

// Icon mapping
const iconMap = {
  users: Users,
  calendar: Calendar,
  chart: BarChart3,
  message: MessageSquare,
  target: Target,
  zap: Zap,
  rocket: Rocket,
  shield: Shield,
  clock: Clock,
  award: Award,
  heart: Heart
};

// ==================== MAIN COMPONENT ====================
export default function LandingPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();
  const [config, setConfig] = useState(defaultLandingConfig);
  const [blocks, setBlocks] = useState([]); // Blocchi dal nuovo sistema editor
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Check if this is the main /landing route (CEO landing page)
  const isMainLanding = location.pathname === '/landing';

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const loadLandingConfig = async () => {
      try {
        // Se è la landing principale (/landing), usa solo i default senza query Firestore
        if (isMainLanding) {
          // Prova a caricare la config CEO dalla collection platform (opzionale)
          try {
            const mainLandingDoc = await getDoc(doc(db, 'platform', 'mainLanding'));
            if (mainLandingDoc.exists()) {
              const data = mainLandingDoc.data();
              // Se ci sono blocchi, li usa. Altrimenti usa la config legacy
              if (data.blocks && data.blocks.length > 0) {
                setBlocks(data.blocks);
              }
              setConfig({ ...defaultLandingConfig, ...data });
            }
          } catch (err) {
            // Se fallisce, usa semplicemente i default - nessun problema
            console.log('Using default landing config');
          }
          setLoading(false);
          return;
        }

        let targetTenantId = null;

        if (slug) {
          const tenantsRef = collection(db, 'tenants');
          const q = query(tenantsRef, where('siteSlug', '==', slug));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            targetTenantId = querySnapshot.docs[0].id;
            setTenantId(targetTenantId);
          } else {
            setNotFound(true);
            setLoading(false);
            return;
          }
        } else {
          // Cerca tenantId dal localStorage, ma NON usare fallback hard-coded
          targetTenantId = localStorage.getItem('tenantId');
          if (!targetTenantId) {
            // Se non c'è tenantId, mostra la landing generica
            setLoading(false);
            return;
          }
          setTenantId(targetTenantId);
        }

        const landingDoc = await getDoc(doc(db, 'tenants', targetTenantId, 'settings', 'landing'));
        
        if (landingDoc.exists() && landingDoc.data().enabled !== false) {
          setConfig({ ...defaultLandingConfig, ...landingDoc.data() });
        }
      } catch (error) {
        console.error('Error loading landing config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLandingConfig();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full" />
          <motion.div
            className="absolute inset-2 border-4 border-cyan-500/30 border-b-cyan-500 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center text-white">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">404</h1>
          <p className="text-slate-400 mb-8">Il sito che stai cercando non esiste.</p>
          <GlowingButton
            onClick={() => navigate('/')}
            className="px-8 py-4 rounded-xl font-semibold text-white"
          >
            Torna alla Home
          </GlowingButton>
        </motion.div>
      </div>
    );
  }

  // Se ci sono blocchi dal nuovo sistema, renderizza quelli
  if (blocks.length > 0) {
    return (
      <div className="bg-slate-900 min-h-screen">
        <PrivacyBanner />
        {blocks.map((block, index) => (
          <DynamicBlock
            key={block.id || index}
            type={block.type}
            settings={block.settings}
            isPreview={false}
            pageId="mainLanding"
            tenantId={null}
          />
        ))}
      </div>
    );
  }

  // Legacy rendering con config classica (hero, features, ecc.)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white overflow-x-hidden">
      {/* Cookie Banner - solo su landing pages */}
      <PrivacyBanner />
      
      {/* Background Effects */}
      <AnimatedStars count={150} />
      <FloatingParticles />
      <GradientOrb className="w-96 h-96 bg-blue-600 -top-48 -left-48" delay={0} />
      <GradientOrb className="w-80 h-80 bg-cyan-600 top-1/3 -right-40" delay={2} />
      <GradientOrb className="w-72 h-72 bg-purple-600 bottom-1/4 left-1/4" delay={4} />
      
      {/* ==================== NAVBAR ==================== */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900/70 backdrop-blur-xl border-b border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <motion.img 
                src={config.branding.logoUrl} 
                alt={config.branding.appName}
                className="w-10 h-10 rounded-xl"
                whileHover={{ rotate: 10 }}
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {config.branding.appName}
              </span>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Come Funziona', 'Prezzi', 'Testimonianze'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-slate-300 hover:text-white transition-colors relative group"
                  whileHover={{ y: -2 }}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors hidden sm:block"
                whileHover={{ scale: 1.05 }}
              >
                Accedi
              </motion.button>
              <GlowingButton
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 rounded-xl font-semibold text-white"
              >
                Inizia Gratis
                <ArrowRight size={18} />
              </GlowingButton>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-32 pb-24 px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">🚀 Nuovo: Generatore Schede con AI</span>
            </motion.div>

            {/* Title with parallax */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              style={{
                transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
              }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  {config.hero.title.split(' ').slice(0, 2).join(' ')}
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {config.hero.title.split(' ').slice(2).join(' ')}
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
            >
              {config.hero.subtitle}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <GlowingButton
                onClick={() => navigate('/login')}
                className="px-10 py-5 rounded-2xl font-bold text-lg text-white shadow-2xl shadow-blue-500/30"
              >
                {config.hero.ctaPrimary}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
              </GlowingButton>
              
              <motion.button
                onClick={() => {}}
                className="group px-10 py-5 bg-slate-800/50 border border-slate-600 rounded-2xl font-semibold text-lg hover:bg-slate-800 hover:border-slate-500 transition-all flex items-center justify-center gap-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Play size={18} className="ml-0.5" />
                </div>
                {config.hero.ctaSecondary}
              </motion.button>
            </motion.div>

            {/* Animated Stats */}
            {config.hero.showStats && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-20 max-w-5xl mx-auto"
              >
                {config.hero.stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    className="relative group"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl group-hover:border-blue-500/50 transition-colors">
                      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        <AnimatedCounter 
                          value={stat.value} 
                          suffix={stat.suffix || ''} 
                          duration={2.5}
                        />
                      </div>
                      <div className="text-slate-400 text-sm md:text-base">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Scroll indicator */}
            <motion.div
              className="absolute bottom-10 left-1/2 -translate-x-1/2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center pt-2">
                <motion.div
                  className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                  animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== BRANDS/TRUST SECTION ==================== */}
      <section className="py-12 px-6 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-slate-500 text-sm mb-8"
          >
            SCELTO DA PROFESSIONISTI IN TUTTA ITALIA
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
          >
            {[Shield, Award, Globe, Lock, Heart].map((Icon, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 text-slate-500"
                whileHover={{ scale: 1.1, color: '#60a5fa' }}
              >
                <Icon size={24} />
                <span className="font-medium">
                  {['Sicuro', 'Premiato', 'Cloud', 'GDPR', 'Supporto'][i]}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS SECTION ==================== */}
      <section id="come-funziona" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-blue-400 font-semibold text-sm tracking-wider uppercase">Come Funziona</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              Inizia in <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">4 Semplici Step</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Dalla registrazione al primo cliente gestito in meno di 10 minuti
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent -translate-y-1/2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(config.howItWorks || defaultLandingConfig.howItWorks).map((step, index) => {
                const Icon = iconMap[step.icon] || Rocket;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className="relative group"
                  >
                    <motion.div
                      className="relative p-8 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:border-blue-500/50 transition-all"
                      whileHover={{ y: -10, scale: 1.02 }}
                    >
                      {/* Step number */}
                      <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">
                        {step.step}
                      </div>
                      
                      {/* Icon */}
                      <motion.div
                        className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-colors"
                        whileHover={{ rotate: 5, scale: 1.1 }}
                      >
                        <Icon size={32} className="text-blue-400" />
                      </motion.div>
                      
                      <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                      <p className="text-slate-400">{step.description}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section id="features" className="py-24 px-6 relative bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-cyan-400 font-semibold text-sm tracking-wider uppercase">Funzionalità</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              Tutto Ciò di Cui Hai <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Bisogno</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Strumenti professionali per gestire ogni aspetto del tuo business fitness
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.features.map((feature, index) => {
              const Icon = iconMap[feature.icon] || Sparkles;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative"
                >
                  <motion.div
                    className="h-full p-8 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:border-cyan-500/50 transition-all overflow-hidden"
                    whileHover={{ y: -5 }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/0 to-blue-600/0 group-hover:from-cyan-600/5 group-hover:to-blue-600/5 transition-all" />
                    
                    <motion.div
                      className="relative w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                    >
                      <Icon size={28} className="text-white" />
                    </motion.div>
                    
                    <h3 className="relative text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="relative text-slate-400 leading-relaxed">{feature.description}</p>
                    
                    <motion.div
                      className="relative mt-6 flex items-center gap-2 text-cyan-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      Scopri di più <ChevronRight size={18} />
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== PRICING SECTION ==================== */}
      <section id="prezzi" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-purple-400 font-semibold text-sm tracking-wider uppercase">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              Prezzi <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Trasparenti</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Scegli il piano perfetto per il tuo business. Nessun costo nascosto.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {config.pricing.plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className={`relative ${plan.highlighted ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {plan.highlighted && (
                  <motion.div
                    className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-bold shadow-lg shadow-purple-500/30 z-10"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔥 Più Popolare
                  </motion.div>
                )}
                
                <motion.div
                  className={`h-full p-8 rounded-3xl border ${
                    plan.highlighted
                      ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/50 shadow-2xl shadow-purple-500/20'
                      : 'bg-slate-800/40 border-slate-700/50'
                  }`}
                  whileHover={{ scale: plan.highlighted ? 1.02 : 1.05, y: -5 }}
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                    <div className="flex items-end justify-center gap-1">
                      {plan.price !== "Custom" && <span className="text-2xl text-slate-400">€</span>}
                      <span className="text-6xl font-bold">{plan.price}</span>
                      <span className="text-slate-400 mb-2">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <CheckCircle2 className={`flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-purple-400' : 'text-blue-400'}`} size={20} />
                        <span className="text-slate-300">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <GlowingButton
                    onClick={() => navigate('/login')}
                    variant={plan.highlighted ? 'primary' : 'secondary'}
                    className={`w-full py-4 rounded-xl font-bold ${
                      plan.highlighted
                        ? 'text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {plan.price === "Custom" ? "Contattaci" : "Inizia Ora"}
                  </GlowingButton>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS SECTION ==================== */}
      <section id="testimonianze" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-yellow-400 font-semibold text-sm tracking-wider uppercase">Testimonianze</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              Cosa Dicono i <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Professionisti</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Storie di successo da chi usa FitFlows ogni giorno
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {config.testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <motion.div
                  className="h-full p-8 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl"
                  whileHover={{ y: -10, borderColor: 'rgba(250, 204, 21, 0.3)' }}
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star size={20} className="fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  
                  <p className="text-slate-300 mb-8 text-lg leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center font-bold text-xl text-white">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{testimonial.name}</div>
                      <div className="text-sm text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA SECTION ==================== */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAyYzUuNTIzIDAgMTAgNC40NzcgMTAgMTBzLTQuNDc3IDEwLTEwIDEwLTEwLTQuNDc3LTEwLTEwIDQuNDc3LTEwIDEwLTEweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMSIvPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <motion.h2
            className="text-4xl md:text-6xl font-bold mb-6"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {config.cta.title}
          </motion.h2>
          <p className="text-xl md:text-2xl mb-10 text-blue-100">
            {config.cta.subtitle}
          </p>
          
          <motion.button
            onClick={() => navigate('/login')}
            className="group px-12 py-5 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/30 transition-all inline-flex items-center gap-3"
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.98 }}
          >
            {config.cta.buttonText}
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight size={22} />
            </motion.div>
          </motion.button>
          
          <p className="mt-6 text-blue-200 text-sm">
            ✓ 14 giorni gratis &nbsp; ✓ Nessuna carta richiesta &nbsp; ✓ Cancella quando vuoi
          </p>
        </motion.div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src={config.branding.logoUrl} 
                  alt={config.branding.appName}
                  className="w-10 h-10 rounded-xl"
                />
                <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {config.branding.appName}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                La piattaforma all-in-one per personal trainer che vogliono trasformare il loro business.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-bold text-white mb-4">Prodotto</h3>
              <ul className="space-y-3 text-slate-400 text-sm">
                {['Features', 'Prezzi', 'Demo', 'Integrazioni'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Risorse</h3>
              <ul className="space-y-3 text-slate-400 text-sm">
                {['Blog', 'Guide', 'Supporto', 'API Docs'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Legale</h3>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Termini di Servizio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 {config.branding.appName}. Tutti i diritti riservati.
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Linkedin, Twitter].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
