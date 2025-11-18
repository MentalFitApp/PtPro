import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// Layout completo per CLIENT - Con stelle animate e effetti, SENZA sidebar
export default function SimpleLayout() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    // Crea container stelle
    const container = document.createElement('div');
    container.className = 'stars';
    document.body.appendChild(container);

    // Crea 25 stelle (5 dorate)
    for (let i = 0; i < 25; i++) {
      const star = document.createElement('div');
      star.className = 'star';

      const size = i % 5 === 0 ? 1 : i % 3 === 0 ? 2 : 3;
      star.style.setProperty('--star-width', `${size}px`);
      star.style.setProperty('--top-offset', `${Math.random() * 100}vh`);
      star.style.setProperty('--fall-duration', `${10 + Math.random() * 10}s`);
      star.style.setProperty('--fall-delay', `${Math.random() * 8}s`);

      if (i % 5 === 0) star.classList.add('gold');

      container.appendChild(star);
    }

    setInitialized(true);
  }, [initialized]);

  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      <div className="relative min-h-screen flex flex-col">
        {/* Background con gradiente */}
        <div className="starry-background"></div>
        
        {/* Contenuto con effetto trasparenza */}
        <div className="relative z-10 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
