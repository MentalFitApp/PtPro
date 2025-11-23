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

    // Crea 50 stelle con stile CEO dashboard premium
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      
      // Posizionamento random
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      
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

