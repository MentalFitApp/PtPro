import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw, Crop, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * ImageCropper - Componente per ritagliare immagini prima dell'upload
 */
export default function ImageCropper({ 
  imageUrl, 
  onCropComplete, 
  onCancel,
  aspectRatio = null, // null = libero, 1 = quadrato, 16/9 = landscape, etc.
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

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Salva contesto
    ctx.save();

    // Applica trasformazioni
    ctx.translate(canvas.width / 2 / pixelRatio, canvas.height / 2 / pixelRatio);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2 / pixelRatio, -canvas.height / 2 / pixelRatio);

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth / pixelRatio,
      cropHeight / pixelRatio
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  }, [completedCrop, scale, rotate]);

  const handleConfirm = async () => {
    const croppedBlob = await getCroppedImg();
    if (croppedBlob) {
      // Crea un file dal blob
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
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
