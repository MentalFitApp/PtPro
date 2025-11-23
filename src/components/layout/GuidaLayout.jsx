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
        for (let j = 0; j < starsContainer.children.length; j++) {
          const existingStar = starsContainer.children[j];
          const existingTop = parseFloat(existingStar.style.top);
          const existingLeft = parseFloat(existingStar.style.left);
          const distance = Math.sqrt(Math.pow(top - existingTop, 2) + Math.pow(left - existingLeft, 2));
          
          if (distance < minDistance) {
            tooClose = true;
            break;
          }
        }
      } while (tooClose && starsContainer.children.length > 0);
      
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;
      
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

