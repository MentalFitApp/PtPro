// src/hooks/useUserPreferences.js
// Hook per gestire le preferenze utente (unità di misura, timezone, etc.)
import { useState, useEffect, useContext, createContext } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getTenantDoc } from '../config/tenant';

// Contesto per le preferenze utente
const UserPreferencesContext = createContext(null);

// Conversioni
const KG_TO_LB = 2.20462;
const CM_TO_INCH = 0.393701;

export const UserPreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    weightUnit: 'kg',
    lengthUnit: 'cm',
    timezone: 'Europe/Rome',
    country: 'IT',
    loading: true
  });

  useEffect(() => {
    if (!auth.currentUser) {
      setPreferences(prev => ({ ...prev, loading: false }));
      return;
    }

    const userRef = getTenantDoc(db, 'users', auth.currentUser.uid);
    const unsub = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setPreferences({
          weightUnit: data.weightUnit || 'kg',
          lengthUnit: data.lengthUnit || 'cm',
          timezone: data.timezone || 'Europe/Rome',
          country: data.country || 'IT',
          loading: false
        });
      } else {
        setPreferences(prev => ({ ...prev, loading: false }));
      }
    }, (error) => {
      console.error('Error loading user preferences:', error);
      setPreferences(prev => ({ ...prev, loading: false }));
    });

    return () => unsub();
  }, []);

  // Funzioni di conversione
  const formatWeight = (valueInKg, showUnit = true) => {
    if (valueInKg === null || valueInKg === undefined || valueInKg === '') return 'N/D';
    
    const numValue = parseFloat(valueInKg);
    if (isNaN(numValue)) return 'N/D';
    
    if (preferences.weightUnit === 'lb') {
      const lbs = numValue * KG_TO_LB;
      return showUnit ? `${lbs.toFixed(1)} lb` : lbs.toFixed(1);
    }
    return showUnit ? `${numValue.toFixed(1)} kg` : numValue.toFixed(1);
  };

  const formatLength = (valueInCm, showUnit = true) => {
    if (valueInCm === null || valueInCm === undefined || valueInCm === '') return 'N/D';
    
    const numValue = parseFloat(valueInCm);
    if (isNaN(numValue)) return 'N/D';
    
    if (preferences.lengthUnit === 'inch') {
      const inches = numValue * CM_TO_INCH;
      return showUnit ? `${inches.toFixed(1)}"` : inches.toFixed(1);
    }
    return showUnit ? `${numValue.toFixed(1)} cm` : numValue.toFixed(1);
  };

  // Converti da unità utente a kg/cm per salvare
  const toKg = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    
    if (preferences.weightUnit === 'lb') {
      return numValue / KG_TO_LB;
    }
    return numValue;
  };

  const toCm = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    
    if (preferences.lengthUnit === 'inch') {
      return numValue / CM_TO_INCH;
    }
    return numValue;
  };

  const value = {
    ...preferences,
    formatWeight,
    formatLength,
    toKg,
    toCm,
    weightLabel: preferences.weightUnit === 'lb' ? 'lb' : 'kg',
    lengthLabel: preferences.lengthUnit === 'inch' ? 'inch' : 'cm'
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Hook per usare le preferenze
export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    // Fallback se usato fuori dal provider
    return {
      weightUnit: 'kg',
      lengthUnit: 'cm',
      timezone: 'Europe/Rome',
      country: 'IT',
      loading: false,
      formatWeight: (v) => v ? `${v} kg` : 'N/D',
      formatLength: (v) => v ? `${v} cm` : 'N/D',
      toKg: (v) => parseFloat(v),
      toCm: (v) => parseFloat(v),
      weightLabel: 'kg',
      lengthLabel: 'cm'
    };
  }
  return context;
};

export default useUserPreferences;
