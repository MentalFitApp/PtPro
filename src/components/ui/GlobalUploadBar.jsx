import React, { useEffect, useState } from 'react';

export default function GlobalUploadBar() {
  const [progress, setProgress] = useState(null); // {percent, message, stage}
  const [visible, setVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail;
      setProgress(detail);
      setVisible(true);
      setLastUpdate(Date.now());
      if (detail.stage === 'complete') {
        setTimeout(() => setVisible(false), 1200);
      }
    };
    window.addEventListener('global-upload-progress', handler);
    return () => window.removeEventListener('global-upload-progress', handler);
  }, []);

  // Auto-hide if nothing arrives for 10s
  useEffect(() => {
    const id = setInterval(() => {
      if (visible && Date.now() - lastUpdate > 10000) {
        setVisible(false);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [visible, lastUpdate]);

  if (!visible || !progress) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[2000] pointer-events-none">
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="mt-2 overflow-hidden rounded-md bg-slate-800/80 backdrop-blur border border-slate-700 shadow">
          <div className="h-1 w-full bg-slate-700 relative">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-400 transition-all duration-200"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="px-3 py-2 flex items-center justify-between text-xs text-slate-200">
            <span className="font-medium">
              {progress.message || 'Caricamento...'}
            </span>
            <span className="text-slate-400">
              {progress.percent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
