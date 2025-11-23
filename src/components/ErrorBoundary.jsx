// src/components/ErrorBoundary.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // Log to external service (Sentry, LogRocket, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-slate-900 border-2 border-red-500/30 rounded-2xl p-8 shadow-2xl">
              {/* Error Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center"
              >
                <AlertCircle size={40} className="text-red-400" />
              </motion.div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-center mb-3 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                Oops! Qualcosa è andato storto
              </h1>
              
              <p className="text-center text-slate-400 mb-6">
                Si è verificato un errore imprevisto. Il team è stato notificato automaticamente.
              </p>

              {/* Error Details (Dev Mode) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-slate-800/50 border border-red-500/20 rounded-xl overflow-auto max-h-64"
                >
                  <p className="text-sm font-mono text-red-400 mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-slate-500 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-yellow-500/50"
                >
                  <RefreshCw size={20} />
                  Ricarica Pagina
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                >
                  <Home size={20} />
                  Vai alla Home
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-xs text-center text-slate-500">
                  Se il problema persiste, contatta il supporto tecnico con questo codice:
                  <code className="ml-2 px-2 py-1 bg-slate-800 rounded text-red-400">
                    ERR-{Date.now()}
                  </code>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
