import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        // Simple preview - extract domain and show link
        const urlObj = new URL(url);
        setPreview({
          title: urlObj.hostname,
          description: url,
          domain: urlObj.hostname,
          favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
        });
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [url]);

  if (loading || error || !preview) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block p-3 bg-slate-600/30 rounded-lg border border-slate-600/50 
                 hover:bg-slate-600/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <img 
          src={preview.favicon} 
          alt="" 
          className="w-8 h-8 rounded"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-400 truncate">{preview.domain}</span>
            <ExternalLink size={12} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">{url}</p>
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
