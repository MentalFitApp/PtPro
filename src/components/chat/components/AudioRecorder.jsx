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
    <div className="flex items-center gap-[4px] h-8 flex-1">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-purple-500"
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl border border-cyan-500/30 backdrop-blur-2xl shadow-xl"
    >
      <motion.button
        onClick={onCancel}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
      >
        <X size={22} className="text-slate-400" />
      </motion.button>

      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2.5 min-w-[70px]">
          <motion.div 
            className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50"
            animate={isRecording ? { 
              scale: [1, 1.3, 1],
              opacity: [1, 0.5, 1]
            } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-white font-mono text-base font-semibold">{formatTime(duration)}</span>
        </div>
        <LiveWaveform isRecording={isRecording} barCount={18} />
      </div>

      {isRecording ? (
        <motion.button
          onClick={stopRecording}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          className="p-3.5 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-xl transition-colors shadow-xl shadow-red-500/40"
        >
          <MicOff size={22} className="text-white" />
        </motion.button>
      ) : (
        <motion.button
          onClick={handleSend}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="p-3.5 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl transition-colors shadow-xl shadow-cyan-500/40"
        >
          <Send size={22} className="text-white" />
        </motion.button>
      )}
    </motion.div>
  );
};

export default AudioRecorder;
