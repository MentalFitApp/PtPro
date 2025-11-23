import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Twitter
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Configurazione landing default (può essere sovrascritto da Firestore)
const defaultLandingConfig = {
  hero: {
    title: "Trasforma il Tuo Business Fitness",
    subtitle: "La piattaforma all-in-one per personal trainer che vogliono crescere e gestire i propri clienti professionalmente",
    ctaPrimary: "Inizia Gratis",
    ctaSecondary: "Guarda Demo",
    backgroundImage: null,
    showStats: true,
    stats: [
      { value: "500+", label: "Personal Trainer" },
      { value: "10K+", label: "Clienti Attivi" },
      { value: "98%", label: "Soddisfazione" }
    ]
  },
  features: [
    {
      icon: "users",
      title: "Gestione Clienti",
      description: "Database completo con anamnesi, schede e progressi. Tutto in un unico posto."
    },
    {
      icon: "calendar",
      title: "Calendario Intelligente",
      description: "Prenota appuntamenti, gestisci sessioni e sincronizza tutto il tuo workflow."
    },
    {
      icon: "chart",
      title: "Analytics Avanzate",
      description: "Monitora le performance del tuo business con dashboard e report dettagliati."
    },
    {
      icon: "message",
      title: "Chat in Real-Time",
      description: "Comunica con i tuoi clienti direttamente dalla piattaforma, sempre connesso."
    },
    {
      icon: "target",
      title: "Schede Personalizzate",
      description: "Crea programmi di allenamento e alimentazione su misura per ogni cliente."
    },
    {
      icon: "zap",
      title: "Automazioni",
      description: "Automatizza promemoria, follow-up e comunicazioni per risparmiare tempo."
    }
  ],
  pricing: {
    plans: [
      {
        name: "Starter",
        price: "29",
        period: "/mese",
        description: "Perfetto per iniziare",
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
        description: "Per professionisti in crescita",
        features: [
          "Clienti illimitati",
          "Calendario avanzato",
          "Chat + videochiamate",
          "Schede personalizzate",
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
          "Account manager dedicato",
          "Training on-site"
        ],
        highlighted: false
      }
    ]
  },
  testimonials: [
    {
      name: "Marco Rossi",
      role: "Personal Trainer",
      avatar: null,
      rating: 5,
      text: "FitFlow ha rivoluzionato il mio modo di lavorare. Risparmio 10 ore a settimana e i miei clienti sono più soddisfatti."
    },
    {
      name: "Sara Bianchi",
      role: "Fitness Coach",
      avatar: null,
      rating: 5,
      text: "Finalmente una piattaforma che capisce le esigenze dei personal trainer. Intuitiva e potentissima!"
    },
    {
      name: "Luca Verdi",
      role: "Studio Owner",
      avatar: null,
      rating: 5,
      text: "Gestiamo 5 trainer e 150+ clienti senza problemi. Il ROI è stato immediato."
    }
  ],
  cta: {
    title: "Pronto a Trasformare il Tuo Business?",
    subtitle: "Unisciti a centinaia di professionisti che stanno crescendo con FitFlow",
    buttonText: "Inizia Ora - È Gratis"
  },
  branding: {
    logoUrl: "/logo192.PNG",
    appName: "FitFlow",
    primaryColor: "#3b82f6",
    accentColor: "#60a5fa"
  }
};

// Icone dinamiche
const iconMap = {
  users: Users,
  calendar: Calendar,
  chart: BarChart3,
  message: MessageSquare,
  target: Target,
  zap: Zap
};

// Animated Stars Background
const AnimatedStars = ({ count = 100 }) => {
  const stars = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.5 + 0.3
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [config, setConfig] = useState(defaultLandingConfig);
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadLandingConfig = async () => {
      try {
        let targetTenantId = null;

        // Se c'è uno slug, cerca il tenant tramite lo slug
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
          // Nessuno slug = usa tenant dal localStorage (tenant principale)
          targetTenantId = localStorage.getItem('tenantId') || 'mentalfit-default';
          setTenantId(targetTenantId);
        }

        const landingDoc = await getDoc(doc(db, 'tenants', targetTenantId, 'settings', 'landing'));
        
        if (landingDoc.exists() && landingDoc.data().enabled !== false) {
          setConfig({ ...defaultLandingConfig, ...landingDoc.data() });
        } else if (!landingDoc.exists()) {
          // Se non esiste configurazione, usa quella di default
          setConfig(defaultLandingConfig);
        }
      } catch (error) {
        console.error('Error loading landing config:', error);
        setConfig(defaultLandingConfig);
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
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 - Sito Non Trovato</h1>
          <p className="text-slate-400 mb-8">Il sito che stai cercando non esiste.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white overflow-x-hidden">
      <AnimatedStars count={100} />
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={config.branding.logoUrl} 
                alt={config.branding.appName}
                className="w-10 h-10 rounded-xl"
              />
              <span className="text-xl font-bold">{config.branding.appName}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Accedi
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Inizia Gratis
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent leading-tight">
                {config.hero.title}
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                {config.hero.subtitle}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => navigate('/login')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                {config.hero.ctaPrimary}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button
                className="px-8 py-4 bg-slate-800/50 border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all"
              >
                {config.hero.ctaSecondary}
              </button>
            </motion.div>

            {config.hero.showStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto"
              >
                {config.hero.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tutto Quello che Ti Serve
            </h2>
            <p className="text-xl text-slate-400">
              Una piattaforma completa per gestire e far crescere il tuo business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {config.features.map((feature, index) => {
              const Icon = iconMap[feature.icon] || Sparkles;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:bg-slate-800 hover:border-blue-500/50 transition-all hover:scale-105"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Prezzi Semplici e Trasparenti
            </h2>
            <p className="text-xl text-slate-400">
              Scegli il piano perfetto per il tuo business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {config.pricing.plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl border ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500 scale-105'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full text-sm font-semibold">
                    Più Popolare
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end justify-center gap-1">
                    {plan.price !== "Custom" && <span className="text-2xl">€</span>}
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-slate-400 mb-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-xl hover:shadow-blue-500/50'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {plan.price === "Custom" ? "Contattaci" : "Inizia Ora"}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Dicono di Noi
            </h2>
            <p className="text-xl text-slate-400">
              La voce dei professionisti che usano FitFlow ogni giorno
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {config.testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {config.cta.title}
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            {config.cta.subtitle}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="group px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 mx-auto"
          >
            {config.cta.buttonText}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Colonna 1 - Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src={config.branding.logoUrl} 
                  alt={config.branding.appName}
                  className="w-8 h-8 rounded-lg"
                />
                <span className="font-bold text-white">{config.branding.appName}</span>
              </div>
              <p className="text-slate-400 text-sm">
                {config.footer?.description || "La piattaforma completa per personal trainer professionisti"}
              </p>
            </div>

            {/* Colonna 2 - Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Link Utili</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Prezzi</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Recensioni</a></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Accedi</button></li>
              </ul>
            </div>

            {/* Colonna 3 - Contatti */}
            {config.contact && (
              <div>
                <h3 className="font-semibold text-white mb-4">Contatti</h3>
                <ul className="space-y-2 text-slate-400 text-sm">
                  {config.contact.email && (
                    <li className="flex items-center gap-2">
                      <Mail size={14} />
                      <a href={`mailto:${config.contact.email}`} className="hover:text-white transition-colors">
                        {config.contact.email}
                      </a>
                    </li>
                  )}
                  {config.contact.phone && (
                    <li className="flex items-center gap-2">
                      <Phone size={14} />
                      <a href={`tel:${config.contact.phone}`} className="hover:text-white transition-colors">
                        {config.contact.phone}
                      </a>
                    </li>
                  )}
                  {config.contact.address && (
                    <li className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{config.contact.address}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Colonna 4 - Social */}
            {config.social && (
              <div>
                <h3 className="font-semibold text-white mb-4">Seguici</h3>
                <div className="flex gap-3">
                  {config.social.facebook && (
                    <a 
                      href={config.social.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <Facebook size={18} />
                    </a>
                  )}
                  {config.social.instagram && (
                    <a 
                      href={config.social.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors"
                    >
                      <Instagram size={18} />
                    </a>
                  )}
                  {config.social.linkedin && (
                    <a 
                      href={config.social.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      <Linkedin size={18} />
                    </a>
                  )}
                  {config.social.twitter && (
                    <a 
                      href={config.social.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-sky-500 transition-colors"
                    >
                      <Twitter size={18} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
            <p>&copy; 2025 {config.branding.appName}. Tutti i diritti riservati.</p>
            {config.footer?.links && (
              <div className="flex justify-center gap-6 mt-4">
                {config.footer.links.map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
