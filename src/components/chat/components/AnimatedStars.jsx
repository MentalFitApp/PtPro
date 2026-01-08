import React, { useEffect } from 'react';

// Genera le stelle una sola volta, fuori dal componente
// Ridotto da 50 a 35 per performance
const STARS_DATA = [...Array(35)].map((_, i) => ({
  id: i,
  width: Math.random() * 2.5 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  opacity: Math.random() * 0.6 + 0.2,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 3,
  // Aggiungi varianti di colore Nebula
  color: Math.random() > 0.7 ? 'cyan' : Math.random() > 0.5 ? 'blue' : 'white'
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
          50% { opacity: 0.9; transform: scale(1.3); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const getStarColor = (color) => {
    switch(color) {
      case 'cyan': return 'rgb(6, 182, 212)'; // cyan-500
      case 'blue': return 'rgb(59, 130, 246)'; // blue-500
      default: return 'white';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {STARS_DATA.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            width: `${star.width}px`,
            height: `${star.width}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            opacity: star.opacity,
            backgroundColor: getStarColor(star.color),
            boxShadow: star.color !== 'white' ? `0 0 ${star.width * 2}px ${getStarColor(star.color)}` : 'none',
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
