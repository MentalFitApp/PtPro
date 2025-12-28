// src/components/ErrorBoundary.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home, HeartHandshake } from 'lucide-react';
import * as Sentry from '@sentry/react';

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
    
    // Invia errore a Sentry
    if (typeof Sentry !== 'undefined' && Sentry.captureException) {
      Sentry.captureException(error, { extra: errorInfo });
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
            <div className="bg-slate-900 border-2 border-amber-500/30 rounded-2xl p-8 shadow-2xl">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center"
              >
                <HeartHandshake size={40} className="text-amber-400" />
              </motion.div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-center mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Ops! Si è verificato un errore
              </h1>
              
              {/* Main Message */}
              <div className="text-center mb-6 space-y-3">
                <p className="text-slate-300 text-lg">
                  Ci scusiamo per il disagio! 🙏
                </p>
                <p className="text-slate-400">
                  Il nostro team tecnico è stato <strong className="text-amber-400">avvisato automaticamente</strong> e risolverà il problema entro <strong className="text-amber-400">24-48 ore</strong>.
                </p>
                <p className="text-slate-500 text-sm">
                  Nel frattempo, prova a ricaricare la pagina o torna alla home.
                </p>
              </div>

              {/* Error Details (Dev Mode Only) */}
              {import.meta.env.DEV && this.state.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-slate-800/50 border border-red-500/20 rounded-xl overflow-auto max-h-64"
                >
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Dettagli errore (solo sviluppo):</p>
                  <p className="text-sm font-mono text-red-400 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-slate-500 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/30"
                >
                  <RefreshCw size={20} />
                  Ricarica Pagina
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                >
                  <Home size={20} />
                  Torna alla Home
                </button>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <p className="text-xs text-center text-slate-500">
                  Grazie per la pazienza! Il problema è stato registrato automaticamente.
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
