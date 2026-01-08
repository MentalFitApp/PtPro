import React, { useEffect } from 'react';

// Genera le stelle una sola volta, fuori dal componente
const STARS_DATA = [...Array(50)].map((_, i) => ({
  id: i,
  width: Math.random() * 2 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  opacity: Math.random() * 0.5 + 0.2,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 2
}));

const AnimatedStars = React.memo(() => {
  // Aggiungi CSS per l'animazione una sola volta
  useEffect(() => {
    if (!document.getElementById('chat-stars-style')) {
      const style = document.createElement('style');
      style.id = 'chat-stars-style';
      style.textContent = `
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {STARS_DATA.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            width: `${star.width}px`,
            height: `${star.width}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            opacity: star.opacity,
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}
    </div>
  );
});

AnimatedStars.displayName = 'AnimatedStars';

export default AnimatedStars;
