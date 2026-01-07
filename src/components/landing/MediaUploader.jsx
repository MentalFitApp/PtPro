import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Image, 
  Video, 
  Music, 
  Check, 
  AlertCircle,
  Loader2,
  FileVideo,
  FileImage,
  Trash2,
  ExternalLink,
  Crop,
} from 'lucide-react';
import { 
  uploadLandingMedia, 
  validateMediaFile, 
  formatFileSize, 
  estimateUploadTime,
  MEDIA_TYPES 
} from '../../services/landingMediaUpload';
import ImageCropper from './ImageCropper';

/**
 * MediaUploader - Componente per upload immagini e video nelle landing pages
 * Supporta drag & drop, file multipli, progress tracking, crop immagini
 */
export default function MediaUploader({ 
  tenantId, 
  pageId, 
  blockId,
  onUpload, 
  accept = 'image/*,video/*',
  multiple = false,
  maxFiles = 10,
  currentMedia = null,
  label = 'Carica Media',
  hint = 'Trascina qui o clicca per caricare',
  compact = false,
  enableCrop = true, // Abilita crop per immagini
  cropAspectRatio = null, // null = libero, 1 = quadrato, 16/9, etc.
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // { id, file, progress, status, url, error }
  const [error, setError] = useState(null);
  const [cropImage, setCropImage] = useState(null); // { file, url } per il cropper
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = async (files) => {
    setError(null);
    
    // Limita numero file
    const filesToProcess = files.slice(0, maxFiles);
    
    // Valida e prepara upload
    const validFiles = [];
    for (const file of filesToProcess) {
      try {
        validateMediaFile(file);
        validFiles.push(file);
      } catch (err) {
        setError(err.message);
      }
    }

    if (validFiles.length === 0) return;

    // Se è un'immagine e crop è abilitato, mostra il cropper
    const firstFile = validFiles[0];
    if (enableCrop && firstFile.type.startsWith('image/') && !multiple) {
      const imageUrl = URL.createObjectURL(firstFile);
      setCropImage({ file: firstFile, url: imageUrl });
      setPendingFile(firstFile);
      return;
    }

    // Altrimenti procedi con l'upload diretto
    processUpload(validFiles);
  };

  const processUpload = (validFiles) => {
    // Aggiungi a lista upload
    const newUploads = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      url: null,
      error: null,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Esegui upload in parallelo (max 2 alla volta)
    for (const upload of newUploads) {
      uploadFile(upload);
    }
  };

  const handleCropComplete = (croppedFile, previewUrl) => {
    setCropImage(null);
    setPendingFile(null);
    processUpload([croppedFile]);
  };

  const handleCropCancel = () => {
    // Carica l'originale senza crop
    if (pendingFile) {
      processUpload([pendingFile]);
    }
    setCropImage(null);
    setPendingFile(null);
  };

  const handleSkipCrop = () => {
    // Carica l'originale senza crop
    if (pendingFile) {
      processUpload([pendingFile]);
    }
    setCropImage(null);
    setPendingFile(null);
  };

  const uploadFile = async (upload) => {
    console.log('[MediaUploader] Starting upload:', upload.file.name, { tenantId, pageId, blockId });
    
    setUploads(prev => prev.map(u => 
      u.id === upload.id ? { ...u, status: 'uploading' } : u
    ));

    try {
      const result = await uploadLandingMedia(
        upload.file,
        tenantId,
        pageId,
        blockId,
        ({ percent, message }) => {
          console.log('[MediaUploader] Progress:', percent, message);
          setUploads(prev => prev.map(u => 
            u.id === upload.id ? { ...u, progress: percent, message } : u
          ));
        }
      );

      console.log('[MediaUploader] Upload complete:', result);
      
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'complete', url: result.url, result } : u
      ));

      // Notifica parent
      onUpload?.(result);
    } catch (err) {
      console.error('[MediaUploader] Upload error:', err);
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'error', error: err.message } : u
      ));
    }
  };

  const removeUpload = (uploadId) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  const getMediaIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (file.type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <Upload className="w-5 h-5" />;
  };

  // Versione compatta per blocchi
  if (compact) {
    return (
      <>
        {/* Image Cropper Modal */}
        {cropImage && (
          <ImageCropper
            imageUrl={cropImage.url}
            onCropComplete={handleCropComplete}
            onCancel={handleSkipCrop}
            aspectRatio={cropAspectRatio}
            originalFileName={cropImage.file?.name}
          />
        )}
        
        <div className="space-y-2">
          {/* Errore globale */}
          {error && (
            <div className="p-2 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}
          
          {/* Upload in corso */}
          {uploads.length > 0 && (
            <div className="space-y-2">
              {uploads.map((upload) => (
                <div key={upload.id} className="p-2 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {upload.status === 'uploading' && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
                    {upload.status === 'complete' && <Check className="w-4 h-4 text-green-400" />}
                    {upload.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                    <span className="text-sm text-white truncate flex-1">{upload.file.name}</span>
                  </div>
                  {upload.status === 'uploading' && (
                    <div className="w-full bg-slate-600 rounded-full h-1.5">
                      <div 
                        className="bg-sky-500 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  {upload.status === 'error' && (
                    <p className="text-xs text-red-400 mt-1">{upload.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {currentMedia && (
            <div className="relative group">
              {currentMedia.startsWith('data:') || currentMedia.includes('video') ? (
                <video src={currentMedia} className="w-full h-32 object-cover rounded-lg" />
              ) : (
                <img src={currentMedia} alt="" className="w-full h-32 object-cover rounded-lg" />
              )}
              <button
                onClick={() => onUpload?.(null)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
          
          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-600 rounded-lg hover:border-sky-500 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">{label}</span>
            <input
              type="file"
              accept={accept}
              onChange={(e) => handleFiles(Array.from(e.target.files))}
              className="hidden"
            />
          </label>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Image Cropper Modal */}
      {cropImage && (
        <ImageCropper
          imageUrl={cropImage.url}
          onCropComplete={handleCropComplete}
          onCancel={handleSkipCrop}
          aspectRatio={cropAspectRatio}
          originalFileName={cropImage.file?.name}
        />
      )}
      
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all
          ${isDragging 
            ? 'border-sky-500 bg-sky-500/10' 
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(Array.from(e.target.files))}
          className="hidden"
        />

        <div className="text-center">
          <div className={`
            w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors
            ${isDragging ? 'bg-sky-500/20' : 'bg-slate-700'}
          `}>
            {isDragging ? (
              <Upload className="w-8 h-8 text-sky-400 animate-bounce" />
            ) : (
              <div className="flex gap-1">
                <FileImage className="w-6 h-6 text-slate-400" />
                <FileVideo className="w-6 h-6 text-slate-400" />
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-medium text-white mb-1">{label}</h3>
          <p className="text-sm text-slate-400 mb-4">{hint}</p>
          
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-1 bg-slate-700 rounded">Immagini fino a 50MB</span>
            <span className="px-2 py-1 bg-slate-700 rounded">Video fino a 5GB</span>
            <span className="px-2 py-1 bg-slate-700 rounded">MP4, MOV, WEBM</span>
          </div>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload List */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg"
              >
                {/* Icon */}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${upload.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                    upload.status === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-600 text-slate-400'}
                `}>
                  {upload.status === 'uploading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : upload.status === 'complete' ? (
                    <Check className="w-5 h-5" />
                  ) : upload.status === 'error' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    getMediaIcon(upload.file)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{upload.file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{formatFileSize(upload.file.size)}</span>
                    {upload.status === 'pending' && (
                      <span>• {estimateUploadTime(upload.file.size)}</span>
                    )}
                    {upload.status === 'uploading' && upload.message && (
                      <span>• {upload.message}</span>
                    )}
                    {upload.status === 'error' && (
                      <span className="text-red-400">• {upload.error}</span>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {upload.status === 'uploading' && (
                    <div className="mt-2 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${upload.progress}%` }}
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {upload.status === 'complete' && upload.url && (
                    <a
                      href={upload.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </a>
                  )}
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
