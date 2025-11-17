import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// AnimatedBackground globale
const AnimatedBackground = () => {
  useEffect(() => {
    // Crea un container unico per evitare conflitti
    let starryBackground = document.querySelector('.starry-background');
    if (!starryBackground) {
      starryBackground = document.createElement('div');
      starryBackground.className = 'starry-background';
      document.body.appendChild(starryBackground);
    }

    let starsContainer = document.querySelector('.stars');
    if (!starsContainer) {
      starsContainer = document.createElement('div');
      starsContainer.className = 'stars';
      starryBackground.appendChild(starsContainer);
    }

    // Crea 50 stelle
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.setProperty('--top-offset', `${Math.random() * 100}vh`);
      star.style.setProperty('--fall-duration', `${8 + Math.random() * 6}s`); // 8-14s
      star.style.setProperty('--fall-delay', `${Math.random() * 5}s`);
      star.style.setProperty('--star-width', `${1 + Math.random() * 2}px`); // 1-3px
      starsContainer.appendChild(star);
    }
  }, []);

  return (
    <div className="starry-background">
      <div className="stars"></div>
    </div>
  );
};

export default function ClientLayout() { 
  try {
    return (
      <div className="relative min-h-screen flex flex-col">
        <AnimatedBackground />
        <Outlet />
      </div>
    );
  } catch (error) {
    console.error('Errore in ClientLayout:', error);
    return <div className="min-h-screen bg-slate-900 text-red-400 flex justify-center items-center">Errore di caricamento: {error.message}</div>;
  }
}