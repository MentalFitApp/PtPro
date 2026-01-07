// src/hooks/useTenantBranding.js
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { defaultBranding, colorPresets, uiDensityOptions } from '../config/tenantBranding';
import { backgroundPresets, defaultBackgroundSettings } from '../config/backgroundPresets';

/**
 * Applica i colori del tema come CSS custom properties
 * @param {Object} colors - Oggetto con i colori del tema
 */
export function applyThemeColors(colors) {
  if (!colors) return;
  
  const root = document.documentElement;
  
  // Applica i colori come CSS variables
  root.style.setProperty('--theme-primary', colors.primary);
  root.style.setProperty('--theme-primary-light', colors.primaryLight);
  root.style.setProperty('--theme-primary-dark', colors.primaryDark);
  root.style.setProperty('--theme-accent', colors.accent);
  root.style.setProperty('--theme-accent-light', colors.accentLight);
  root.style.setProperty('--theme-stars', colors.stars);
  root.style.setProperty('--theme-stars-secondary', colors.starsSecondary);
  
  // Aggiorna anche le variabili RGB per transparenze
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '59, 130, 246'; // fallback blu
  };
  
  root.style.setProperty('--theme-primary-rgb', hexToRgb(colors.primary));
  root.style.setProperty('--theme-accent-rgb', hexToRgb(colors.accent));
  
  console.log('🎨 Theme colors applied:', colors.primary);
}

/**
 * Applica la densità UI come attributo data sul document
 * @param {string} density - 'compact' | 'normal' | 'spacious'
 */
export function applyUiDensity(density) {
  const validDensity = ['compact', 'normal', 'spacious'].includes(density) ? density : 'normal';
  document.documentElement.setAttribute('data-density', validDensity);
  
  // Applica anche le variabili CSS specifiche
  const densityConfig = uiDensityOptions[validDensity];
  if (densityConfig?.values) {
    const root = document.documentElement;
    Object.entries(densityConfig.values).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
  
  console.log('📐 UI density applied:', validDensity);
}

/**
 * Applica il preset sfondo
 * @param {string} preset - ID del preset sfondo
 * @param {string} solidColor - Colore per sfondo solido (opzionale)
 * @param {string[]} gradientColors - Colori per gradiente (opzionale)
 */
export function applyBackgroundPreset(preset, solidColor, gradientColors) {
  const root = document.documentElement;
  const validPreset = backgroundPresets[preset] ? preset : 'aurora';
  
  root.setAttribute('data-bg-preset', validPreset);
  
  if (solidColor) {
    root.style.setProperty('--bg-solid-color', solidColor);
  }
  
  if (gradientColors && gradientColors.length >= 2) {
    root.style.setProperty('--bg-gradient', `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`);
  }
  
  console.log('🌌 Background preset applied:', validPreset);
}

/**
 * Applica la luminosità delle stelle
 * @param {number} transparency - Valore da 0 a 1 (0 = stelle luminose, 1 = stelle spente)
 */
export function applyCardTransparency(transparency) {
  const root = document.documentElement;
  
  // Determina il livello
  let level = 'medium';
  if (transparency >= 0.95) level = 'none';       // Stelle spente
  else if (transparency >= 0.85) level = 'subtle';
  else if (transparency >= 0.6) level = 'medium';
  else if (transparency >= 0.4) level = 'strong';
  else level = 'glass';                           // Stelle luminose
  
  // Opacità stelle (inverso: slider alto = stelle meno visibili)
  const starsOpacity = 1 - transparency;
  
  root.setAttribute('data-card-transparency', level);
  root.style.setProperty('--stars-opacity', starsOpacity.toFixed(2));
  
  console.log('✨ Stars brightness:', level, `(opacity: ${Math.round(starsOpacity * 100)}%)`);
}

/**
 * Hook per caricare il branding del tenant corrente
 * I colori sono personalizzabili per singolo utente
 * @returns {{ branding: Object, loading: boolean, userColors: Object, userDensity: string }}
 */
export function useTenantBranding() {
  const [branding, setBranding] = useState(defaultBranding);
  const [userColors, setUserColors] = useState(null);
  const [userDensity, setUserDensity] = useState('normal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubscribeUser = null;

    const loadBranding = async () => {
      const user = auth.currentUser;
      if (!user) {
        if (mounted) {
          setBranding(defaultBranding);
          applyThemeColors(defaultBranding.colors);
          applyUiDensity('normal');
          setLoading(false);
        }
        return;
      }

      try {
        // Prima carica i colori personalizzati dell'utente (in tempo reale)
        const userRef = doc(db, 'users', user.uid);
        unsubscribeUser = onSnapshot(userRef, (userSnap) => {
          if (!mounted) return;
          
          let colors = defaultBranding.colors;
          let density = 'normal';
          let bgPreset = 'starryNight';
          let bgSolidColor = '#0f172a';
          let bgGradientColors = ['#0f172a', '#1e1b4b'];
          let cardTransparency = 0.5; // Default 50%
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Colori personalizzati utente
            if (userData.colorPreset === 'custom' && userData.customColors) {
              // Colori completamente personalizzati
              colors = userData.customColors;
            } else if (userData.colorPreset && colorPresets[userData.colorPreset]) {
              colors = colorPresets[userData.colorPreset];
            }
            if (userData.colors) {
              colors = { ...colors, ...userData.colors };
            }
            
            // Densità UI
            density = userData.uiDensity || 'normal';
            
            // Sfondo
            bgPreset = userData.bgPreset || 'starryNight';
            bgSolidColor = userData.bgSolidColor || '#0f172a';
            bgGradientColors = userData.bgGradientColors || ['#0f172a', '#1e1b4b'];
            
            // Trasparenza card (default 50%)
            cardTransparency = userData.cardTransparency !== undefined ? userData.cardTransparency : 0.5;
            
            setUserColors({
              colorPreset: userData.colorPreset || 'blue',
              colors,
              customColors: userData.customColors || null
            });
            setUserDensity(density);
          }
          
          // Applica i colori, densità, sfondo e trasparenza
          applyThemeColors(colors);
          applyUiDensity(density);
          applyBackgroundPreset(bgPreset, bgSolidColor, bgGradientColors);
          applyCardTransparency(cardTransparency);
        }, (err) => {
          console.debug('Error listening to user colors:', err.message);
        });

        // Ottieni tenantId dal localStorage
        const storedTenantId = localStorage.getItem('tenantId');
        let tenantId = storedTenantId;
        
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
            console.debug('Could not access users collection');
          }
        }

        if (tenantId && mounted) {
          // Carica branding del tenant (logo, nomi aree)
          try {
            const brandingDoc = await getDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'));
            
            if (brandingDoc.exists() && mounted) {
              const data = brandingDoc.data();
              
              const loadedBranding = { 
                ...defaultBranding, 
                ...data,
                // I colori vengono dall'utente, non dal tenant
              };
              
              setBranding(loadedBranding);
              localStorage.setItem('tenantBranding', JSON.stringify(loadedBranding));
              
              if (window.updatePWAManifest) {
                window.updatePWAManifest();
              }
            } else if (mounted) {
              setBranding(defaultBranding);
              localStorage.setItem('tenantBranding', JSON.stringify(defaultBranding));
            }
          } catch (brandingError) {
            console.debug('Could not load branding:', brandingError.message);
            if (mounted) {
              setBranding(defaultBranding);
            }
          }
        } else if (mounted) {
          setBranding(defaultBranding);
        }
      } catch (error) {
        console.debug('Error loading branding:', error.message);
        if (mounted) {
          setBranding(defaultBranding);
          applyThemeColors(defaultBranding.colors);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBranding();

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        loadBranding();
      } else if (mounted) {
        setBranding(defaultBranding);
        setUserColors(null);
        applyThemeColors(defaultBranding.colors);
        setLoading(false);
      }
    });

    const handleTenantBrandingUpdated = (event) => {
      if (!mounted) return;
      const detail = event?.detail;
      const updatedTenantId = detail?.tenantId;
      const updatedBranding = detail?.branding;
      if (!updatedTenantId || !updatedBranding) return;

      try {
        const currentTenantId = localStorage.getItem('tenantId');
        if (currentTenantId && currentTenantId !== updatedTenantId) return;
      } catch {
        // ignore
      }

      const merged = { ...defaultBranding, ...updatedBranding };
      setBranding(merged);
      try {
        localStorage.setItem('tenantBranding', JSON.stringify(merged));
      } catch {
        // ignore
      }
    };
    window.addEventListener('tenantBrandingUpdated', handleTenantBrandingUpdated);

    return () => {
      mounted = false;
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      window.removeEventListener('tenantBrandingUpdated', handleTenantBrandingUpdated);
    };
  }, []);

  return { branding, loading, userColors, userDensity };
}
