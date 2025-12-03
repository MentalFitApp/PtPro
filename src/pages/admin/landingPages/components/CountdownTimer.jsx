// src/pages/admin/landingPages/components/CountdownTimer.jsx
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ 
  type, 
  duration, 
  endDate, 
  message, 
  onComplete,
  className = '' 
}) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    let targetTime;
    
    if (type === 'countdown') {
      // Timer fisso dalla durata
      const savedStart = localStorage.getItem('timer_start');
      const startTime = savedStart ? parseInt(savedStart) : Date.now();
      if (!savedStart) {
        localStorage.setItem('timer_start', startTime.toString());
      }
      targetTime = startTime + (duration * 1000);
    } else if (type === 'deadline') {
      // Data specifica
      targetTime = new Date(endDate).getTime();
    } else if (type === 'evergreen') {
      // Timer personale per utente
      const savedStart = localStorage.getItem('timer_evergreen_start');
      const startTime = savedStart ? parseInt(savedStart) : Date.now();
      if (!savedStart) {
        localStorage.setItem('timer_evergreen_start', startTime.toString());
      }
      targetTime = startTime + (duration * 1000);
    }

    const difference = targetTime - Date.now();
    
    if (difference <= 0) {
      if (onComplete) onComplete();
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [type, duration, endDate]);

  if (timeLeft.expired) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 ${className}`}>
      <div className="container mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock size={24} />
          <span className="text-lg font-medium">{message}</span>
        </div>
        
        <div className="flex justify-center gap-4 md:gap-8">
          {timeLeft.days > 0 && (
            <div className="flex flex-col items-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 md:px-6 md:py-4 min-w-[70px]">
                <div className="text-3xl md:text-5xl font-bold">{timeLeft.days}</div>
              </div>
              <div className="text-xs md:text-sm mt-2 font-medium">Giorni</div>
            </div>
          )}
          
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 md:px-6 md:py-4 min-w-[70px]">
              <div className="text-3xl md:text-5xl font-bold">
                {timeLeft.hours.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="text-xs md:text-sm mt-2 font-medium">Ore</div>
          </div>
          
          <div className="text-3xl md:text-5xl font-bold self-center mb-6">:</div>
          
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 md:px-6 md:py-4 min-w-[70px]">
              <div className="text-3xl md:text-5xl font-bold">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="text-xs md:text-sm mt-2 font-medium">Minuti</div>
          </div>
          
          <div className="text-3xl md:text-5xl font-bold self-center mb-6">:</div>
          
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 md:px-6 md:py-4 min-w-[70px]">
              <div className="text-3xl md:text-5xl font-bold">
                {timeLeft.seconds.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="text-xs md:text-sm mt-2 font-medium">Secondi</div>
          </div>
        </div>
      </div>
    </div>
  );
}
