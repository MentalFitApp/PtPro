// src/components/FormLayout.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedStars = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const container = document.createElement('div');
    container.className = 'stars';
    document.body.appendChild(container);

    // Crea 50 stelle con stile CEO dashboard premium
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';

      // Posizionamento random
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;

      container.appendChild(star);
    }

    setInitialized(true);
  }, [initialized]);

  return null;
};

export default function FormLayout({ children }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* SFONDO STELLATO */}
      <div className="starry-background"></div>
      <AnimatedStars />

      {/* FORM CON 2 LINEE DORATE + SFUMATURA ROTANTE */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-2xl mx-auto p-4 pt-8"
      >
        <div className="relative p-2">
          {/* 2 LINEE DORATE FISSE + SFUMATURA ROTANTE */}
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            {/* LINEA 1 */}
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-glow-line-1"></div>
            {/* LINEA 2 */}
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-glow-line-2"></div>
          </div>

          {/* BOX TRASPARENTE – STELLE VISIBILI DIETRO */}
          <div className="relative bg-slate-900/45 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}