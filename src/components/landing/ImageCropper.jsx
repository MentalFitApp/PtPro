import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw, Crop, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * ImageCropper - Componente per ritagliare immagini prima dell'upload
 * Supporta PNG con trasparenza
 */
export default function ImageCropper({ 
  imageUrl, 
  onCropComplete, 
  onCancel,
  aspectRatio = null, // null = libero, 1 = quadrato, 16/9 = landscape, etc.
  originalFileName = 'image', // Nome file originale per determinare il tipo
}) {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef(null);
  
  // Determina se l'immagine è PNG (per preservare trasparenza)
  const isPng = imageUrl?.toLowerCase().includes('.png') || 
                originalFileName?.toLowerCase().endsWith('.png') ||
                imageUrl?.startsWith('blob:'); // Per sicurezza, tratta blob come PNG

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    
    // Imposta crop iniziale centrato
    const cropWidth = Math.min(80, (height / width) * 80);
    const cropHeight = aspectRatio 
      ? cropWidth / aspectRatio 
      : Math.min(80, (width / height) * 80);
    
    setCrop({
      unit: '%',
      width: cropWidth,
      height: cropHeight,
      x: (100 - cropWidth) / 2,
      y: (100 - cropHeight) / 2,
    });
  }, [aspectRatio]);

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calcola dimensioni finali del crop
    const outputWidth = Math.floor(completedCrop.width * scaleX);
    const outputHeight = Math.floor(completedCrop.height * scaleY);

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Per PNG: sfondo trasparente, per altri: sfondo bianco
    if (!isPng) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Disegna l'immagine ritagliata
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    // Usa PNG per preservare trasparenza, JPEG per altri
    const mimeType = isPng ? 'image/png' : 'image/jpeg';
    const quality = isPng ? undefined : 0.95;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(blob);
        },
        mimeType,
        quality
      );
    });
  }, [completedCrop, isPng]);

  const handleConfirm = async () => {
    const croppedBlob = await getCroppedImg();
    if (croppedBlob) {
      // Crea un file dal blob con estensione corretta
      const extension = isPng ? 'png' : 'jpg';
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      const file = new File([croppedBlob], `cropped-image.${extension}`, { type: mimeType });
      onCropComplete(file, URL.createObjectURL(croppedBlob));
    }
  };

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    setCrop({
      unit: '%',
      width: 80,
      height: 80,
      x: 10,
      y: 10,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Crop className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-semibold text-white">Ritaglia Immagine</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Crop Area */}
          <div className="p-6 flex flex-col items-center">
            <div className="max-h-[50vh] overflow-auto rounded-lg">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    maxWidth: '100%',
                    maxHeight: '50vh',
                  }}
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mt-6">
              {/* Zoom */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </button>
                <span className="text-sm text-slate-400 w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale(s => Math.min(3, s + 0.1))}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Rotate */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRotate(r => r - 90)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  title="Ruota sinistra"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
                <span className="text-sm text-slate-400 w-12 text-center">
                  {rotate}°
                </span>
                <button
                  onClick={() => setRotate(r => r + 90)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  title="Ruota destra"
                >
                  <RotateCcw className="w-4 h-4 text-white transform -scale-x-100" />
                </button>
              </div>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm text-white"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-900/50">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors text-white flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Applica
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
