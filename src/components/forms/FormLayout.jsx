// src/components/FormLayout.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedStars = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    // Verifica se esiste già un container stelle
    const existingContainer = document.querySelector('.stars');
    if (existingContainer) {
      setInitialized(true);
      return;
    }

    const container = document.createElement('div');
    container.className = 'stars';
    document.body.appendChild(container);

    // Crea 30 stelle distribuite su tutta la schermata
    for (let i = 0; i < 30; i++) {
      const star = document.createElement('div');
      star.className = 'star';

      // Distribuzione più ampia e uniforme
      const minDistance = 8; // Distanza minima tra stelle in %
      let top, left, tooClose;
      
      do {
        top = Math.random() * 100;
        left = Math.random() * 100;
        tooClose = false;
        
        // Verifica distanza dalle altre stelle già create
        for (let j = 0; j < container.children.length; j++) {
          const existingStar = container.children[j];
          const existingTop = parseFloat(existingStar.style.top);
          const existingLeft = parseFloat(existingStar.style.left);
          const distance = Math.sqrt(Math.pow(top - existingTop, 2) + Math.pow(left - existingLeft, 2));
          
          if (distance < minDistance) {
            tooClose = true;
            break;
          }
        }
      } while (tooClose && container.children.length > 0);
      
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;

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