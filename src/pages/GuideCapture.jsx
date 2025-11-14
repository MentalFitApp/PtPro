// src/pages/GuideCapture.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, Loader2, Star, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import FormLayout from '../components/FormLayout';

export default function GuideCapture() {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [form, setForm] = useState({ nome: '', telefono: '', email: '', instagram: '' });
  const [loading, setLoading] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [wantsPromo, setWantsPromo] = useState(null);
  const [currentLeadId, setCurrentLeadId] = useState(null);

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

  const handleSubmit = async () => {
    if (!form.nome || !form.telefono || !form.email) {
      return alert('Compila Nome, Telefono ed Email');
    }

    setLoading(true);
    try {
      const leadRef = await addDoc(collection(db, 'guideLeads'), {
        guideId,
        nome: form.nome.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        instagram: form.instagram?.trim() || '',
        wantsPromo: false,
        timestamp: new Date(),
        dialed: false,
        showUp: false,
        chiuso: false,
        importo: 0
      });

      setCurrentLeadId(leadRef.id);
      setShowPromo(true);
    } catch (error) {
      console.error("Errore salvataggio lead:", error);
      alert('Errore salvataggio. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (wantsPromo === null) {
      return alert('Devi scegliere un\'opzione');
    }

    if (!currentLeadId) {
      console.error("currentLeadId mancante");
      alert("Errore interno. Riprova.");
      return;
    }

    try {
      await updateDoc(doc(db, 'guideLeads', currentLeadId), { wantsPromo });
      
      // REDIRECT SICURO
      const url = guide?.redirectUrl;
      if (url && typeof url === 'string' && url.startsWith('http')) {
        window.location.href = url;
      } else {
        console.error("redirectUrl non valido:", url);
        alert("Link non valido. Contatta l'amministratore.");
      }
    } catch (err) {
      console.error("Errore updateDoc:", err);
      alert('Errore aggiornamento. Riprova.');
    }
  };

  // Countdown Component
  const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
      if (!targetDate) return;

      const interval = setInterval(() => {
        const now = new Date();
        const target = new Date(targetDate);
        const diff = target - now;

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

    return <p className="text-2xl font-bold text-rose-400 mt-2">{timeLeft}</p>;
  };

  if (!guide) {
    return (
      <FormLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white flex items-center gap-3">
            <Loader2 className="animate-spin" size={24} />
            <span>Caricamento...</span>
          </div>
        </div>
      </FormLayout>
    );
  }

  // DOPO SUBMIT: PROMO + COUNTDOWN + POSTMESSAGE
  if (showPromo) {
    return (
      <FormLayout>
        <div className="max-w-2xl mx-auto mt-16">

          {/* POST-MESSAGE */}
          {guide.postMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/50 rounded-xl p-5 mb-6 text-center"
            >
              <p className="text-white text-lg leading-relaxed">{guide.postMessage}</p>
            </motion.div>
          )}

          {/* COUNTDOWN */}
          {guide.countdownDate && new Date(guide.countdownDate) > new Date() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-rose-600/30 to-amber-600/30 border border-rose-500/50 rounded-xl p-5 text-center mb-6"
            >
              <p className="text-rose-300 font-bold flex items-center justify-center gap-2">
                <Clock size={18} />
                {guide.urgencyText || "Offerta a tempo limitato!"}
              </p>
              <CountdownTimer targetDate={guide.countdownDate} />
            </motion.div>
          )}

          {/* POPUP PROMO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="guide-form-box p-6"
          >
            <h3 className="text-2xl font-bold text-emerald-400 text-center mb-4">Offerta Esclusiva Sbloccata!</h3>
            <p className="text-slate-200 text-center mb-6">
              Vuoi ricevere <strong>maggiori informazioni</strong> sulla promozione via <strong>telefono</strong> o <strong>Instagram</strong>?
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="promo"
                  checked={wantsPromo === true}
                  onChange={() => setWantsPromo(true)}
                  className="w-5 h-5 text-emerald-500"
                />
                <span className="text-white font-medium">Sì, contattatemi!</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="promo"
                  checked={wantsPromo === false}
                  onChange={() => setWantsPromo(false)}
                  className="w-5 h-5 text-rose-500"
                />
                <span className="text-white font-medium">No, grazie</span>
              </label>
            </div>

            <button
              onClick={handleConfirm}
              className="guide-form-button w-full flex items-center justify-center gap-2"
            >
              <Star size={18} />
              Vai alla Guida
            </button>
          </motion.div>
        </div>
      </FormLayout>
    );
  }

  // PRIMA DEL SUBMIT
  return (
    <FormLayout>
      <div className="max-w-2xl mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 mt-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Ricevi la guida <span className="text-cyan-400">“{guide.name}”</span>
          </h1>
        </motion.div>

        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="guide-form-box p-6 mb-16"
        >
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nome *"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              className="guide-form-input w-full"
              disabled={loading}
            />
            <input
              type="tel"
              placeholder="Telefono *"
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
              className="guide-form-input w-full"
              disabled={loading}
            />
            <input
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="guide-form-input w-full"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Instagram (opzionale)"
              value={form.instagram}
              onChange={e => setForm({ ...form, instagram: e.target.value })}
              className="guide-form-input w-full"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="guide-form-button w-full mt-6 flex items-center justify-center gap-2"
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

        {/* TRASFORMAZIONI */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Ecco alcune trasformazioni</h2>
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
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="block bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400 text-2xl font-bold">{t.kg}</p>
                  <p className="text-white font-semibold">in {t.mesi} mesi</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 group-hover:text-emerald-300">
                  <span className="text-sm font-medium">Clicca qui per vedere la trasformazione</span>
                  <ChevronRight size={20} />
                </div>
              </div>
            </motion.a>
          ))}
        </div>

      </div>
    </FormLayout>
  );
}