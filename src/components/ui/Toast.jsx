import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react';

const Toast = ({
  message,
  type = 'info',
  onClose,
  duration = 5000,
  position = 'top-right'
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    warning: <AlertCircle size={20} className="text-yellow-500" />,
    info: <Info size={20} className="text-blue-500" />
  };

  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div
      className={`fixed z-50 max-w-sm w-full ${positionClasses[position]} animate-fade-in`}
    >
      <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${backgrounds[type]}`}>
        <div className="flex-shrink-0 mt-0.5">
          {icons[type]}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default Toast;