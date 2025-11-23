// src/hooks/useTenantBranding.js
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { defaultBranding } from '../config/tenantBranding';

/**
 * Hook per caricare il branding del tenant corrente
 * @returns {{ branding: Object, loading: boolean }}
 */
export function useTenantBranding() {
  const [branding, setBranding] = useState(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadBranding = async () => {
      const user = auth.currentUser;
      if (!user) {
        if (mounted) {
          setBranding(defaultBranding);
          setLoading(false);
        }
        return;
      }

      try {
        // Ottieni tenantId dal localStorage (più affidabile)
        const storedTenantId = localStorage.getItem('tenantId');
        
        let tenantId = storedTenantId;
        
        // Se non c'è nel localStorage, prova a recuperarlo dal documento utente
        if (!tenantId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              tenantId = userDoc.data()?.tenantId;
              if (tenantId) {
                localStorage.setItem('tenantId', tenantId);
              }
            }
          } catch (err) {
            // Ignora errori di permesso su users collection
            console.debug('Could not access users collection, using default branding');
          }
        }

        if (tenantId && mounted) {
          // Carica branding del tenant
          try {
            const brandingDoc = await getDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'));
            
            if (brandingDoc.exists() && mounted) {
              const loadedBranding = { ...defaultBranding, ...brandingDoc.data() };
              setBranding(loadedBranding);
              // Salva in localStorage per manifest dinamico
              localStorage.setItem('tenantBranding', JSON.stringify(loadedBranding));
              // Aggiorna manifest PWA se disponibile
              if (window.updatePWAManifest) {
                window.updatePWAManifest();
              }
            } else if (mounted) {
              setBranding(defaultBranding);
              localStorage.setItem('tenantBranding', JSON.stringify(defaultBranding));
            }
          } catch (brandingError) {
            console.debug('Could not load branding, using defaults:', brandingError.message);
            if (mounted) {
              setBranding(defaultBranding);
            }
          }
        } else if (mounted) {
          setBranding(defaultBranding);
        }
      } catch (error) {
        console.debug('Error loading tenant branding:', error.message);
        if (mounted) {
          setBranding(defaultBranding);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBranding();

    // Ricarica quando cambia l'utente
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadBranding();
      } else if (mounted) {
        setBranding(defaultBranding);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { branding, loading };
}
