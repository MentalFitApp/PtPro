import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// Componente per lo sfondo animato
const AnimatedBackground = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    let starsContainer = document.querySelector('.stars');
    if (!starsContainer) {
      starsContainer = document.createElement('div');
      starsContainer.className = 'stars';
      const starryBackground = document.querySelector('.starry-background');
      if (!starryBackground) {
        const bg = document.createElement('div');
        bg.className = 'starry-background';
        document.body.appendChild(bg);
        bg.appendChild(starsContainer);
      } else {
        starryBackground.appendChild(starsContainer);
      }
    } else {
        // Pulisci le stelle esistenti se il componente si rimonta
        starsContainer.innerHTML = '';
    }

    for (let i = 0; i < 30; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.setProperty('--top-offset', `${Math.random() * 100}vh`);
      star.style.setProperty('--fall-duration', `${8 + Math.random() * 6}s`);
      star.style.setProperty('--fall-delay', `${Math.random() * 5}s`);
      star.style.setProperty('--star-width', `${1 + Math.random() * 2}px`);
      starsContainer.appendChild(star);
    }

    setIsInitialized(true);
  }, [isInitialized]);

  return null;
};


export default function GuidaLayout() {
  return (
    <div className="overflow-x-hidden w-full min-h-screen">
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <AnimatedBackground />
        <main className="w-full flex-1 flex flex-col items-center justify-center p-4 z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

