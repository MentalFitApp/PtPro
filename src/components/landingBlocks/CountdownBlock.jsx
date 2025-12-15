import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Countdown Block - Timer con conto alla rovescia
 * Varianti: banner, inline, floating
 */
const CountdownBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'banner',
    title = "L'offerta scade tra:",
    endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    showDays = true,
    showHours = true,
    showMinutes = true,
    showSeconds = true,
    expiredMessage = 'Offerta scaduta!',
    backgroundColor = 'bg-gradient-to-r from-red-600 to-orange-500',
    sticky = false,
  } = settings || {};

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px] md:min-w-[80px]">
        <span className="text-2xl md:text-4xl font-bold text-white">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs md:text-sm text-white/80 mt-1">{label}</span>
    </div>
  );

  const countdownContent = (
    <>
      {isExpired ? (
        <p className="text-xl font-semibold text-white">{expiredMessage}</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {title && (
            <p className="text-lg font-semibold text-white">{title}</p>
          )}
          <div className="flex gap-2 md:gap-4">
            {showDays && <TimeUnit value={timeLeft.days} label="Giorni" />}
            {showHours && <TimeUnit value={timeLeft.hours} label="Ore" />}
            {showMinutes && <TimeUnit value={timeLeft.minutes} label="Min" />}
            {showSeconds && <TimeUnit value={timeLeft.seconds} label="Sec" />}
          </div>
        </div>
      )}
    </>
  );

  // Variante Floating (angolo dello schermo)
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed bottom-4 right-4 z-50 ${backgroundColor} rounded-2xl p-4 shadow-2xl`}
      >
        {countdownContent}
      </motion.div>
    );
  }

  // Variante Inline (dentro il flusso)
  if (variant === 'inline') {
    return (
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`${backgroundColor} rounded-2xl p-6 md:p-8 flex justify-center`}
          >
            {countdownContent}
          </motion.div>
        </div>
      </section>
    );
  }

  // Default: Banner (full width)
  return (
    <section 
      className={`${backgroundColor} py-4 ${sticky ? 'sticky top-0 z-50' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        {countdownContent}
      </div>
    </section>
  );
};

export default CountdownBlock;
