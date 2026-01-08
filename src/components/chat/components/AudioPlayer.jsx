import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import clsx from 'clsx';

const cn = (...classes) => clsx(...classes);

// Waveform visualization
const AudioWaveform = ({ isPlaying, progress, barCount = 32 }) => {
  // Generate pseudo-random but consistent bar heights based on index
  const getBarHeight = (index) => {
    const seed = Math.sin(index * 12.9898) * 43758.5453;
    return 20 + (seed - Math.floor(seed)) * 80; // 20-100%
  };
  
  const bars = Array.from({ length: barCount }, (_, i) => ({
    height: getBarHeight(i),
    isPlayed: (i / barCount) * 100 <= progress
  }));

  return (
    <div className="flex items-center gap-[2px] h-8 flex-1">
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          className={cn(
            "w-1 rounded-full transition-colors duration-200",
            bar.isPlayed ? "bg-white/80" : "bg-white/30"
          )}
          style={{ height: `${bar.height}%` }}
          animate={isPlaying && bar.isPlayed ? {
            scaleY: [1, 1.2, 0.8, 1],
          } : {}}
          transition={{
            duration: 0.5,
            repeat: isPlaying ? Infinity : 0,
            delay: index * 0.02
          }}
        />
      ))}
    </div>
  );
};

const AudioPlayer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(percent);
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleWaveformClick = (e) => {
    if (!audioRef.current || !waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    audioRef.current.currentTime = percent * audioRef.current.duration;
    setProgress(percent * 100);
    setCurrentTime(audioRef.current.currentTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[220px] max-w-[300px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <motion.button
        onClick={togglePlay}
        whileTap={{ scale: 0.9 }}
        className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full 
                   hover:bg-white/20 transition-colors flex-shrink-0"
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="pause"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Pause size={18} />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Play size={18} className="ml-0.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      <div className="flex-1 min-w-0">
        <div 
          ref={waveformRef}
          onClick={handleWaveformClick}
          className="cursor-pointer"
        >
          <AudioWaveform isPlaying={isPlaying} progress={progress} barCount={24} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs opacity-60">{formatTime(currentTime)}</span>
          <span className="text-xs opacity-60">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
