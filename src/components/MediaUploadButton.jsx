import React, { useState, useRef } from 'react';
import { Image, Video, Mic, FileText, X, Upload } from 'lucide-react';
import { uploadImage, uploadVideo, uploadAudio, VoiceRecorder, formatDuration } from '../utils/mediaUpload';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Componente riutilizzabile per upload media
 * Supporta: immagini, video, audio (registrazione vocale)
 */

export default function MediaUploadButton({ 
  userId, 
  onUploadComplete, 
  type = 'all', // 'all', 'image', 'video', 'audio'
  folder = 'media',
  showLabel = true,
  className = ''
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadImage(file, userId, folder, (progress) => {
        setUploadProgress(progress.percent);
      });
      
      onUploadComplete(result);
      setShowOptions(false);
    } catch (error) {
      alert(error.message || 'Errore durante il caricamento');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadVideo(file, userId, folder, (progress) => {
        setUploadProgress(progress.percent);
      });
      
      onUploadComplete(result);
      setShowOptions(false);
    } catch (error) {
      alert(error.message || 'Errore durante il caricamento');
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadAudio(file, userId, folder, (progress) => {
        setUploadProgress(progress.percent);
      });
      
      onUploadComplete(result);
      setShowOptions(false);
    } catch (error) {
      alert(error.message || 'Errore durante il caricamento');
    } finally {
      setUploading(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      recorderRef.current = new VoiceRecorder();
      await recorderRef.current.start();
      setRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      alert(error.message || 'Impossibile accedere al microfono');
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      const audioFile = await recorderRef.current.stop();
      setRecording(false);
      setRecordingTime(0);

      setUploading(true);
      setUploadProgress(0);

      const result = await uploadAudio(audioFile, userId, folder, (progress) => {
        setUploadProgress(progress.percent);
      });
      
      onUploadComplete(result);
      setShowOptions(false);
    } catch (error) {
      alert(error.message || 'Errore durante il salvataggio');
    } finally {
      setUploading(false);
    }
  };

  const cancelRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setRecording(false);
    setRecordingTime(0);
  };

  const canUpload = (mediaType) => {
    return type === 'all' || type === mediaType;
  };

  if (uploading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg">
        <Upload size={16} className="text-slate-400 animate-pulse" />
        <div className="flex-1 bg-slate-600 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-rose-600 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <span className="text-xs text-slate-400">{uploadProgress}%</span>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-900/40 border border-red-600/50 rounded-lg">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm text-slate-200 flex-1">
          Registrazione... {formatDuration(recordingTime)}
        </span>
        <button
          onClick={stopRecording}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-colors"
        >
          Salva
        </button>
        <button
          onClick={cancelRecording}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X size={16} className="text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        title="Allega media"
      >
        <Upload size={18} className="text-slate-400" />
        {showLabel && <span className="text-sm text-slate-300">Media</span>}
      </button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 space-y-1 min-w-[180px] z-50"
          >
            {canUpload('image') && (
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              >
                <Image size={18} className="text-cyan-400" />
                <span className="text-sm text-slate-200">Foto</span>
              </button>
            )}
            
            {canUpload('video') && (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              >
                <Video size={18} className="text-purple-400" />
                <span className="text-sm text-slate-200">Video</span>
              </button>
            )}
            
            {canUpload('audio') && (
              <>
                <button
                  onClick={startRecording}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
                >
                  <Mic size={18} className="text-red-400" />
                  <span className="text-sm text-slate-200">Vocale</span>
                </button>
                
                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
                >
                  <FileText size={18} className="text-amber-400" />
                  <span className="text-sm text-slate-200">File Audio</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />
    </div>
  );
}
