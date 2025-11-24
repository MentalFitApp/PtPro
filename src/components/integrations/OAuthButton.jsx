// Component riusabile per OAuth di qualsiasi servizio
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function OAuthButton({ 
  provider, // 'google', 'stripe', 'calendly', etc.
  onSuccess,
  onError,
  className = ''
}) {
  const [loading, setLoading] = useState(false);

  const providerConfig = {
    google: {
      name: 'Google',
      icon: '🔵',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
    },
    stripe: {
      name: 'Stripe',
      icon: '💳',
      authUrl: 'https://connect.stripe.com/oauth/authorize',
      scopes: ['read_write']
    },
    calendly: {
      name: 'Calendly',
      icon: '📅',
      authUrl: 'https://auth.calendly.com/oauth/authorize',
      scopes: ['default']
    },
    zoom: {
      name: 'Zoom',
      icon: '📹',
      authUrl: 'https://zoom.us/oauth/authorize',
      scopes: ['meeting:write', 'meeting:read']
    },
    instagram: {
      name: 'Instagram',
      icon: '📷',
      authUrl: 'https://api.instagram.com/oauth/authorize',
      scopes: ['user_profile', 'user_media']
    }
  };

  const config = providerConfig[provider];
  if (!config) {
    console.error(`Provider ${provider} non configurato`);
    return null;
  }

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      // Ottieni tenant ID
      const tenantId = localStorage.getItem('tenantId');
      if (!tenantId) {
        throw new Error('Tenant ID non trovato');
      }

      // Genera state per CSRF protection
      const state = btoa(JSON.stringify({
        tenantId,
        provider,
        timestamp: Date.now()
      }));

      // Costruisci URL OAuth
      const params = new URLSearchParams({
        client_id: import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_ID`],
        redirect_uri: `${window.location.origin}/oauth/callback`,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state,
        access_type: 'offline', // Per refresh token
        prompt: 'consent' // Forza consenso per refresh token
      });

      // Salva stato in localStorage per verifica
      localStorage.setItem('oauth_state', state);
      localStorage.setItem('oauth_provider', provider);

      // Redirect a provider OAuth
      window.location.href = `${config.authUrl}?${params.toString()}`;
      
    } catch (error) {
      console.error('Errore OAuth:', error);
      setLoading(false);
      onError?.(error);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleConnect}
      disabled={loading}
      className={`flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span className="text-2xl">{config.icon}</span>
      <span>
        {loading ? 'Connessione...' : `Collega ${config.name}`}
      </span>
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      )}
    </motion.button>
  );
}
