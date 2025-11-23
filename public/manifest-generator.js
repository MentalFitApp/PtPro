// manifest-generator.js
// Genera manifest.json dinamico basato sul tenant

(function() {
  'use strict';

  // Funzione per generare manifest dinamico
  function generateDynamicManifest() {
    // Recupera tenantId e branding dal localStorage
    const tenantId = localStorage.getItem('tenantId');
    const brandingStr = localStorage.getItem('tenantBranding');
    
    let appName = 'FitFlow';
    let shortName = 'FitFlow';
    let logoUrl = null;

    if (brandingStr) {
      try {
        const branding = JSON.parse(brandingStr);
        appName = branding.appName || 'FitFlow';
        shortName = branding.appName?.substring(0, 12) || 'FitFlow';
        logoUrl = branding.logoUrl;
      } catch (e) {
        console.debug('Could not parse branding:', e);
      }
    }

    // Crea manifest dinamico
    const manifest = {
      name: appName,
      short_name: shortName,
      description: `${appName} - Gestionale Fitness & Wellness`,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0f172a',
      theme_color: '#06b6d4',
      orientation: 'portrait-primary',
      icons: logoUrl ? [
        // Se c'è logo personalizzato, usalo come icona PWA
        {
          src: logoUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: logoUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ] : [
        // Fallback ai loghi predefiniti
        {
          src: '/logo192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/logo512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any'
        }
      ]
    };

    return manifest;
  }

  // Aggiorna il link al manifest con uno dinamico
  function updateManifestLink() {
    const manifest = generateDynamicManifest();
    const manifestJson = JSON.stringify(manifest);
    const blob = new Blob([manifestJson], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);

    // Trova e aggiorna il link al manifest
    let link = document.querySelector('link[rel="manifest"]');
    if (link) {
      link.href = manifestURL;
    } else {
      link = document.createElement('link');
      link.rel = 'manifest';
      link.href = manifestURL;
      document.head.appendChild(link);
    }

    // Aggiorna anche il titolo del documento
    document.title = manifest.name;
  }

  // Esegui quando il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateManifestLink);
  } else {
    updateManifestLink();
  }

  // Ri-genera manifest quando cambiano i dati del tenant
  window.addEventListener('storage', function(e) {
    if (e.key === 'tenantBranding' || e.key === 'tenantId') {
      updateManifestLink();
    }
  });

  // Esponi funzione globale per aggiornamento manuale
  window.updatePWAManifest = updateManifestLink;
})();
