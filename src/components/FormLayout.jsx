// src/components/FormLayout.jsx
import React, { useEffect } from 'react';

export default function FormLayout({ children }) {
  useEffect(() => {
    // Forza creazione stelle se non esistono
    let starsContainer = document.querySelector('.stars');
    if (!starsContainer) {
      const div = document.createElement('div');
      div.className = 'stars';
      document.body.appendChild(div);
      starsContainer = div;
    }

    if (starsContainer.children.length === 0) {
      for (let i = 0; i < 40; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.setProperty('--top-offset', `${Math.random() * 100}vh`);
        star.style.setProperty('--fall-duration', `${8 + Math.random() * 7}s`);
        star.style.setProperty('--fall-delay', `${Math.random() * 5}s`);
        star.style.setProperty('--star-width', `${1 + Math.random() * 2}px`);
        starsContainer.appendChild(star);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-900 via-zinc-900 to-rose-950 relative overflow-hidden">
      {/* SFONDO STELLATO */}
      <div className="starry-background">
        <div className="stars"></div>
      </div>

      {/* CONTENUTO */}
      <div className="relative z-10 p-4">
        {children}
      </div>
    </div>
  );
}