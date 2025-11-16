// src/pages/GuideCapture.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, Loader2, Star, ChevronRight, Clock, ArrowRight, User, Phone, Mail, Instagram, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import FormLayout from '../components/FormLayout';

export default function GuideCapture() {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [form, setForm] = useState({ nome: '', telefono: '', email: '', instagram: '' });
  const [loading, setLoading] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [contactMethod, setContactMethod] = useState(null); // 'instagram', 'whatsapp', 'no'
  const [currentLeadId, setCurrentLeadId] = useState(null); // ID del lead appena creato

  // === CARICA GUIDA ===
  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const docRef = doc(db, 'guides', guideId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().active) {
          setGuide({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/not-found');
        }
      } catch (error) {
        console.error("Errore caricamento guida:", error);
        navigate('/not-found');
      }
    };
    fetchGuide();
  }, [guideId, navigate]);

  // === INVIO FORM ===
  const handleSubmit = async () => {
    if (!form.nome || !form.telefono || !form.email) {
      return alert('Compila Nome, Telefono ed Email');
    }

    setLoading(true);
    try {
      // 1. Crea il lead
      const leadRef = await addDoc(collection(db, 'guideLeads'), {
        guideId,
        nome: form.nome.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        instagram: form.instagram?.trim() || '',
        wantsPromo: false,
        contactMethod: null,
        timestamp: new Date(),
        dialed: false,
        showUp: false,
        chiuso: false,
        importo: 0
      });

      // 2. ASPETTA E PRENDI L'ID
      const leadId = leadRef.id;
      setCurrentLeadId(leadId);

      // 3. Mostra promo o redirect
      const hasOffer = guide.postMessage || guide.countdownDate;
      if (hasOffer) {
        setShowPromo(true);
      } else {
        redirectToGuide();
      }
    } catch (error) {
      console.error("Errore salvataggio lead:", error);
      alert('Errore salvataggio. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  // === REDIRECT ALLA GUIDA ===
  const redirectToGuide = () => {
    const url = guide?.redirectUrl;
    if (url && /^https?:\/\//.test(url)) {
      window.location.href = url;
    } else {
      alert("Link non valido.");
    }
  };

  // === CONFERMA SCELTA PROMO ===
  const handleConfirm = async () => {
    if (contactMethod === null) return alert('Scegli un\'opzione');

    // SICUREZZA: se ID mancante, vai avanti
    if (!currentLeadId) {
      console.warn("Lead ID mancante, procedo senza aggiornare");
      redirectToGuide();
      return;
    }

    try {
      await updateDoc(doc(db, 'guideLeads', currentLeadId), {
        wantsPromo: contactMethod !== 'no',
        contactMethod
      });
    } catch (err) {
      console.error("Errore updateDoc (non bloccante):", err);
      // NON BLOCCARE L'UTENTE
    } finally {
      redirectToGuide();
    }
  };

  // === COUNTDOWN TIMER ===
  const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
      if (!targetDate) return;
      const interval = setInterval(() => {
        const diff = new Date(targetDate) - new Date();
        if (diff <= 0) {
          setTimeLeft('SCADUTO');
          clearInterval(interval);
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${days}g ${hours}h ${minutes}m`);
      }, 1000);
      return () => clearInterval(interval);
    }, [targetDate]);
    return (
      <div className="flex items-center gap-2 text-amber-300 font-mono text-sm">
        <Clock size={16} />
        <span className="font-bold">{timeLeft}</span>
      </div>
    );
  };

  // === CARICAMENTO ===
  if (!guide) {
    return (
      <FormLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white flex items-center gap-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-lg font-medium">Caricamento guida...</span>
          </div>
        </div>
      </FormLayout>
    );
  }

  // === POPUP OMAGGIO ===
  if (showPromo) {
    return (
      <FormLayout>
        <div className="max-w-lg mx-auto mt-8 space-y-6 px-4">
          {guide.postMessage && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-rose-600/20 to-purple-600/20 backdrop-blur-xl border border-rose-500/30 rounded-xl p-5 text-center shadow-xl"
            >
              <p className="text-white text-sm leading-relaxed font-bold">{guide.postMessage}</p>
            </motion.div>
          )}

          {guide.countdownDate && new Date(guide.countdownDate) > new Date() && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 backdrop-blur-xl border border-amber-500/30 rounded-xl p-4 text-center shadow-lg"
            >
              <p className="text-amber-300 text-xs font-bold flex items-center justify-center gap-1">
                <Clock size={14} />
                {guide.urgencyText || "Offerta a tempo limitato!"}
              </p>
              <CountdownTimer targetDate={guide.countdownDate} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-emerald-400 text-center mb-3 flex items-center justify-center gap-2">
              <Star size={20} className="text-amber-300" />
              Offerta Esclusiva
            </h3>
            <p className="text-white text-sm text-center mb-5 font-medium">
              Vuoi ricevere <strong className="text-emerald-300">maggiori informazioni</strong> via:
            </p>

            <div className="space-y-3 mb-5">
              <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 cursor-pointer transition-all border border-purple-500/30">
                <input
                  type="radio"
                  name="contact"
                  checked={contactMethod === 'instagram'}
                  onChange={() => setContactMethod('instagram')}
                  className="w-5 h-5 text-purple-500"
                />
                <Instagram size={18} className="text-purple-400" />
                <span className="text-white text-sm font-medium">Instagram</span>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-lg hover:from-green-600/30 hover:to-emerald-600/30 cursor-pointer transition-all border border-green-500/30">
                <input
                  type="radio"
                  name="contact"
                  checked={contactMethod === 'whatsapp'}
                  onChange={() => setContactMethod('whatsapp')}
                  className="w-5 h-5 text-emerald-500"
                />
                <MessageCircle size={18} className="text-emerald-400" />
                <span className="text-white text-sm font-medium">WhatsApp</span>
              </label>

              <label className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg hover:bg-white/10 cursor-pointer transition-all border border-white/10">
                <input
                  type="radio"
                  name="contact"
                  checked={contactMethod === 'no'}
                  onChange={() => setContactMethod('no')}
                  className="w-5 h-5 text-red-400"
                />
                <span className="text-white text-sm font-medium">No, grazie</span>
              </label>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold py-3 rounded-lg hover:from-emerald-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Star size={18} />
              Vai alla Guida
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </FormLayout>
    );
  }

  // === FORM PRINCIPALE ===
  return (
    <FormLayout>
      <div className="max-w-lg mx-auto mt-8 space-y-6 px-4">

        {/* TITOLO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Ricevi la guida <span className="text-cyan-400">“{guide.name}”</span>
          </h1>
        </motion.div>

        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-slate-300" size={18} />
            <input
              type="text"
              placeholder="Nome *"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/30 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:border-cyan-400 transition-all font-medium"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 text-slate-300" size={18} />
            <input
              type="tel"
              placeholder="Telefono *"
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/30 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:border-cyan-400 transition-all font-medium"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-300" size={18} />
            <input
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/30 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:border-cyan-400 transition-all font-medium"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <Instagram className="absolute left-3 top-3.5 text-slate-300" size={18} />
            <input
              type="text"
              placeholder="Instagram (opzionale)"
              value={form.instagram}
              onChange={e => setForm({ ...form, instagram: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/30 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:border-cyan-400 transition-all font-medium"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-5 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold py-3 rounded-lg hover:from-emerald-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Salvataggio...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Ricevi la Guida Ora
              </>
            )}
          </button>
        </motion.div>

        {/* TESTIMONIANZE */}
        <div className="space-y-4 mt-8">
          <h2 className="text-lg font-bold text-white text-center">Ecco alcune trasformazioni ottenute da chi si è affidato al team MentalFit!</h2>
          {[
            { kg: "-27 kg", mesi: "9", link: "https://mauriziobiondopt.it/#testimonianza1" },
            { kg: "Fisico Nuovo", mesi: "6", link: "https://mauriziobiondopt.it/#testimonianza2" },
            { kg: "-10 kg", mesi: "5", link: "https://mauriziobiondopt.it/#testimonianza3" },
            { kg: "-26 kg", mesi: "8", link: "https://mauriziobiondopt.it/#testimonianza4" },
          ].map((t, i) => (
            <motion.a
              key={i}
              href={t.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                const win = window.open(t.link, '_blank');
                if (!win) {
                  e.preventDefault();
                  alert('Popup bloccato. Copia il link: ' + t.link);
                }
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="block bg-white/10 backdrop-blur-xl rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all group shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400 font-bold text-lg">{t.kg}</p>
                  <p className="text-white text-sm font-medium">in {t.mesi} mesi</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 group-hover:text-emerald-300 text-xs font-medium">
                  <span>Vedi trasformazione</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </FormLayout>
  );
}