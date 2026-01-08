import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MicOff, Send } from 'lucide-react';

// Componente LiveWaveform per visualizzazione audio
const LiveWaveform = ({ isRecording, barCount = 20 }) => {
  const [bars, setBars] = useState(() => 
    Array.from({ length: barCount }, () => 20)
  );

  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 20 + Math.random() * 80));
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, barCount]);

  return (
    <div className="flex items-center gap-[3px] h-6 flex-1">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="w-1 rounded-full bg-red-400"
          animate={{ height: isRecording ? `${height}%` : '20%' }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      ))}
    </div>
  );
};

const AudioRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl border border-red-500/30 backdrop-blur-sm"
    >
      <motion.button
        onClick={onCancel}
        whileTap={{ scale: 0.9 }}
        className="p-2 hover:bg-slate-700 rounded-full transition-colors"
      >
        <X size={20} className="text-slate-400" />
      </motion.button>

      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2 min-w-[60px]">
          <motion.div 
            className="w-3 h-3 rounded-full bg-red-500"
            animate={isRecording ? { 
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-white font-mono text-sm">{formatTime(duration)}</span>
        </div>
        <LiveWaveform isRecording={isRecording} barCount={16} />
      </div>

      {isRecording ? (
        <motion.button
          onClick={stopRecording}
          whileTap={{ scale: 0.9 }}
          className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg shadow-red-500/30"
        >
          <MicOff size={20} className="text-white" />
        </motion.button>
      ) : (
        <motion.button
          onClick={handleSend}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors shadow-lg shadow-blue-500/30"
        >
          <Send size={20} className="text-white" />
        </motion.button>
      )}
    </motion.div>
  );
};

export default AudioRecorder;
