import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { formatDuration } from '../utils/mediaUpload';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Componente per visualizzare media (immagini, video, audio)
 */

export function ImageViewer({ url, alt = 'Image', className = '', onClick = null }) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  return (
    <>
      <img
        src={url}
        alt={alt}
        className={`cursor-pointer ${className}`}
        onClick={() => onClick ? onClick() : setShowFullscreen(true)}
        loading="lazy"
      />
      
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowFullscreen(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              onClick={() => setShowFullscreen(false)}
            >
              <X size={24} className="text-white" />
            </button>
            <img
              src={url}
              alt={alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function VideoPlayer({ url, thumbnail = null, className = '', autoPlay = false }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
        setShowFullscreen(true);
      } else {
        document.exitFullscreen();
        setShowFullscreen(false);
      }
    }
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={url}
        poster={thumbnail}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
        autoPlay={autoPlay}
      />
      
      {/* Controls overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 hover:opacity-100 transition-opacity">
        {/* Top controls */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
          >
            <Maximize2 size={18} className="text-white" />
          </button>
        </div>

        {/* Center play button */}
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all"
        >
          {playing ? (
            <Pause size={32} className="text-white" />
          ) : (
            <Play size={32} className="text-white ml-1" />
          )}
        </button>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          {/* Progress bar */}
          <div
            onClick={handleSeek}
            className="h-1 bg-white/30 rounded-full cursor-pointer"
          >
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="text-white hover:text-rose-400 transition-colors">
                {playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={toggleMute} className="text-white hover:text-rose-400 transition-colors">
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <span className="text-xs text-white">
                {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AudioPlayer({ url, duration = null, className = '' }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioDuration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-lg ${className}`}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
      />
      
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 bg-rose-600 hover:bg-rose-700 rounded-full flex items-center justify-center transition-colors"
      >
        {playing ? (
          <Pause size={18} className="text-white" />
        ) : (
          <Play size={18} className="text-white ml-0.5" />
        )}
      </button>

      <div className="flex-1 space-y-1">
        <div
          onClick={handleSeek}
          className="h-1.5 bg-slate-700 rounded-full cursor-pointer overflow-hidden"
        >
          <div
            className="h-full bg-rose-500 rounded-full transition-all"
            style={{ width: `${(currentTime / audioDuration) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span>{formatDuration(Math.floor(audioDuration))}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente principale che sceglie automaticamente il viewer corretto
 */
export default function MediaViewer({ media, className = '' }) {
  if (!media || !media.url) return null;

  switch (media.type) {
    case 'image':
      return <ImageViewer url={media.url} className={className} />;
    case 'video':
      return <VideoPlayer url={media.url} thumbnail={media.thumbnail} className={className} />;
    case 'audio':
      return <AudioPlayer url={media.url} duration={media.duration} className={className} />;
    default:
      return null;
  }
}
