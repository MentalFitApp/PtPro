// src/hooks/useFormValidation.jsx
// Hook per validazione form centralizzata

import { useState, useCallback, useMemo } from 'react';

// Regole di validazione predefinite
const validators = {
  required: (value, message = 'Campo obbligatorio') => {
    if (value === undefined || value === null || value === '') {
      return message;
    }
    if (Array.isArray(value) && value.length === 0) {
      return message;
    }
    return null;
  },

  email: (value, message = 'Email non valida') => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
  },

  phone: (value, message = 'Numero di telefono non valido') => {
    if (!value) return null;
    
    // Validazione internazionale (standard E.164)
    // Supporta numeri globali: USA (+1), IT (+39), UK (+44), CN (+86), ecc.
    // Rimuovi spazi, trattini, punti, parentesi
    const cleanPhone = value.replace(/[\s.\-()]/g, '');
    
    // Estrai solo le cifre (e il + iniziale se presente)
    const hasPlus = cleanPhone.startsWith('+');
    const digitsOnly = cleanPhone.replace(/[^\d]/g, '');
    
    // Verifica lunghezza (E.164: minimo 7, massimo 15 cifre)
    if (digitsOnly.length < 7) {
      return message || 'Il numero deve avere almeno 7 cifre';
    }
    if (digitsOnly.length > 15) {
      return message || 'Il numero non può superare 15 cifre';
    }
    
    // Verifica che contenga solo cifre valide
    if (!/^\d+$/.test(digitsOnly)) {
      return message;
    }
    
    // Se ha prefisso internazionale, verifica formato
    if (hasPlus && !/^\+[1-9]\d{6,14}$/.test(cleanPhone)) {
      return message || 'Formato internazionale non valido';
    }
    
    return null;
  },

  minLength: (value, length, message) => {
    if (!value) return null;
    const msg = message || `Minimo ${length} caratteri`;
    return value.length >= length ? null : msg;
  },

  maxLength: (value, length, message) => {
    if (!value) return null;
    const msg = message || `Massimo ${length} caratteri`;
    return value.length <= length ? null : msg;
  },

  min: (value, minVal, message) => {
    if (value === undefined || value === null || value === '') return null;
    const msg = message || `Il valore minimo è ${minVal}`;
    return Number(value) >= minVal ? null : msg;
  },

  max: (value, maxVal, message) => {
    if (value === undefined || value === null || value === '') return null;
    const msg = message || `Il valore massimo è ${maxVal}`;
    return Number(value) <= maxVal ? null : msg;
  },

  pattern: (value, regex, message = 'Formato non valido') => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  },

  password: (value, message = 'La password deve avere almeno 6 caratteri') => {
    if (!value) return null;
    return value.length >= 6 ? null : message;
  },

  passwordStrong: (value) => {
    if (!value) return null;
    const errors = [];
    if (value.length < 8) errors.push('almeno 8 caratteri');
    if (!/[A-Z]/.test(value)) errors.push('una lettera maiuscola');
    if (!/[a-z]/.test(value)) errors.push('una lettera minuscola');
    if (!/[0-9]/.test(value)) errors.push('un numero');
    
    if (errors.length > 0) {
      return `La password deve contenere: ${errors.join(', ')}`;
    }
    return null;
  },

  match: (value, otherValue, message = 'I valori non coincidono') => {
    return value === otherValue ? null : message;
  },

  url: (value, message = 'URL non valido') => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return message;
    }
  },

  date: (value, message = 'Data non valida') => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? message : null;
  },

  futureDate: (value, message = 'La data deve essere nel futuro') => {
    if (!value) return null;
    const date = new Date(value);
    return date > new Date() ? null : message;
  },

  pastDate: (value, message = 'La data deve essere nel passato') => {
    if (!value) return null;
    const date = new Date(value);
    return date < new Date() ? null : message;
  },

  codiceFiscale: (value, message = 'Codice fiscale non valido') => {
    if (!value) return null;
    const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
    return cfRegex.test(value) ? null : message;
  },

  partitaIva: (value, message = 'Partita IVA non valida') => {
    if (!value) return null;
    const pivaRegex = /^[0-9]{11}$/;
    return pivaRegex.test(value) ? null : message;
  }
};

/**
 * Hook per validazione form
 * 
 * @param initialValues - Valori iniziali del form
 * @param validationRules - Regole di validazione per campo
 */
export function useFormValidation(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valida un singolo campo
  const validateField = useCallback((name, value, allValues = values) => {
    const rules = validationRules[name];
    if (!rules) return null;

    for (const rule of rules) {
      let error = null;

      if (typeof rule === 'string') {
        // Regola semplice (es: 'required', 'email')
        error = validators[rule]?.(value);
      } else if (typeof rule === 'function') {
        // Funzione custom
        error = rule(value, allValues);
      } else if (typeof rule === 'object') {
        // Oggetto con tipo e parametri
        const { type, param, message } = rule;
        if (type === 'match') {
          error = validators.match(value, allValues[param], message);
        } else if (validators[type]) {
          error = validators[type](value, param, message);
        }
      }

      if (error) return error;
    }

    return null;
  }, [validationRules, values]);

  // Valida tutto il form
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name], values);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values, validateField]);

  // Gestisce il cambio di un campo
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({ ...prev, [name]: newValue }));

    // Valida al volo se il campo è stato toccato
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Gestisce il blur (campo toccato)
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Imposta un valore programmaticamente
  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Imposta multipli valori
  const setMultipleValues = useCallback((newValues) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Gestisce il submit
  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e?.preventDefault();
    
    // Segna tutti i campi come toccati
    const allTouched = Object.keys(validationRules).reduce((acc, name) => {
      acc[name] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const isValid = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [validationRules, validateForm, values]);

  // Stato derivato
  const isValid = useMemo(() => {
    return Object.keys(errors).every((key) => !errors[key]);
  }, [errors]);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setMultipleValues,
    validateField,
    validateForm,
    reset,
    // Helper per i campi
    getFieldProps: (name) => ({
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
    }),
    getFieldError: (name) => touched[name] ? errors[name] : null,
  };
}

// Esporta anche i validatori per uso standalone
export { validators };

export default useFormValidation;
