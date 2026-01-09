// src/components/shared/SchedaOptimizer.jsx
// Wrapper ottimizzato per Schede Alimentazione/Allenamento
// Usa virtualization per alimenti/esercizi, lazy loading per sezioni

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { VirtualList } from '../ui/VirtualList';
import { useCachedQuery } from '../../hooks/useDataCache';
import { getDocs } from 'firebase/firestore';

/**
 * Lista virtualizzata di alimenti con search ottimizzato
 */
export function VirtualizedFoodList({
  foods,
  selectedFoods = [],
  onSelectFood,
  searchQuery = '',
  containerHeight = 500
}) {
  // Filtra foods con search (memoizzato)
  const filteredFoods = useMemo(() => {
    if (!searchQuery) return foods;
    
    const query = searchQuery.toLowerCase();
    return foods.filter(food =>
      food.name?.toLowerCase().includes(query) ||
      food.category?.toLowerCase().includes(query)
    );
  }, [foods, searchQuery]);

  // Render single food item
  const renderFoodItem = useCallback((food, index) => {
    const isSelected = selectedFoods.some(f => f.id === food.id);
    
    return (
      <div
        key={food.id || index}
        onClick={() => onSelectFood(food)}
        className={`p-3 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-blue-600/20 border-2 border-blue-500'
            : 'bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{food.name}</p>
            <p className="text-xs text-slate-400 truncate">{food.category || 'Alimento'}</p>
          </div>
          <div className="text-right ml-3">
            <p className="text-sm font-bold text-white">{food.calories || 0} kcal</p>
            <p className="text-xs text-slate-400">per 100g</p>
          </div>
        </div>
      </div>
    );
  }, [selectedFoods, onSelectFood]);

  return (
    <VirtualList
      items={filteredFoods}
      itemHeight={72}
      containerHeight={containerHeight}
      renderItem={renderFoodItem}
      className="space-y-2"
    />
  );
}

/**
 * Lista virtualizzata di esercizi con filtri
 */
export function VirtualizedExerciseList({
  exercises,
  selectedExercises = [],
  onSelectExercise,
  searchQuery = '',
  muscleFilter = '',
  containerHeight = 500
}) {
  // Filtra exercises (memoizzato)
  const filteredExercises = useMemo(() => {
    let filtered = exercises;
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name?.toLowerCase().includes(query) ||
        ex.muscleGroup?.toLowerCase().includes(query)
      );
    }
    
    // Muscle filter
    if (muscleFilter) {
      filtered = filtered.filter(ex =>
        ex.muscleGroup?.toLowerCase() === muscleFilter.toLowerCase()
      );
    }
    
    return filtered;
  }, [exercises, searchQuery, muscleFilter]);

  // Render single exercise
  const renderExerciseItem = useCallback((exercise, index) => {
    const isSelected = selectedExercises.some(e => e.id === exercise.id);
    
    return (
      <div
        key={exercise.id || index}
        onClick={() => onSelectExercise(exercise)}
        className={`p-3 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-cyan-600/20 border-2 border-cyan-500'
            : 'bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{exercise.name}</p>
            <p className="text-xs text-slate-400 truncate">
              {exercise.muscleGroup || 'Esercizio'} • {exercise.difficulty || 'Medio'}
            </p>
          </div>
          {exercise.videoUrl && (
            <div className="ml-2 px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
              Video
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedExercises, onSelectExercise]);

  return (
    <VirtualList
      items={filteredExercises}
      itemHeight={72}
      containerHeight={containerHeight}
      renderItem={renderExerciseItem}
      className="space-y-2"
    />
  );
}

/**
 * Hook per caricare alimenti con caching
 */
export function useCachedFoods(tenantId, includeGlobal = true) {
  return useCachedQuery(
    `foods-${tenantId}-${includeGlobal}`,
    async () => {
      const { getTenantCollection } = await import('../../config/tenant');
      const { db } = await import('../../firebase');
      const { collection } = await import('firebase/firestore');
      
      const promises = [];
      
      // Alimenti tenant
      const tenantRef = getTenantCollection(db, 'foods');
      promises.push(getDocs(tenantRef));
      
      // Alimenti globali
      if (includeGlobal) {
        const globalRef = collection(db, 'globalFoods');
        promises.push(getDocs(globalRef));
      }
      
      const [tenantSnap, globalSnap] = await Promise.all(promises);
      
      const foods = [
        ...tenantSnap.docs.map(d => ({ id: d.id, source: 'tenant', ...d.data() })),
        ...(globalSnap?.docs.map(d => ({ id: d.id, source: 'global', ...d.data() })) || [])
      ];
      
      return foods.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minuti
      cacheTime: 30 * 60 * 1000 // 30 minuti
    }
  );
}

/**
 * Hook per caricare esercizi con caching
 */
export function useCachedExercises(includeGlobal = true) {
  return useCachedQuery(
    `exercises-${includeGlobal}`,
    async () => {
      const { db } = await import('../../firebase');
      const { collection } = await import('firebase/firestore');
      
      const promises = [];
      
      // Esercizi globali
      if (includeGlobal) {
        const globalRef = collection(db, 'exercises');
        promises.push(getDocs(globalRef));
      }
      
      const results = await Promise.all(promises);
      
      const exercises = results.flatMap(snap =>
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      );
      
      return exercises.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    {
      staleTime: 15 * 60 * 1000, // 15 minuti
      cacheTime: 60 * 60 * 1000 // 1 ora
    }
  );
}

/**
 * Componente lazy-loaded per preview PDF
 * Nota: PDFPreview è un placeholder, implementare se necessario
 */
export const LazyPDFPreview = React.lazy(() => 
  Promise.resolve({
    default: () => <div className="text-slate-400 p-4 text-center">Preview PDF non disponibile</div>
  })
);

/**
 * Componente lazy-loaded per editor ricco
 * Nota: RichTextEditor è un placeholder, usa textarea standard
 */
export const LazyRichTextEditor = React.lazy(() => 
  Promise.resolve({
    default: (props) => (
      <textarea
        {...props}
        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
      />
    )
  })
);

/**
 * Ottimizzatore generico per form con molti campi
 * Usa debouncing e validazione lazy
 */
export function useOptimizedForm(initialValues, validationSchema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation
  const validateField = useMemo(() => {
    let timeoutId;
    
    return (fieldName, value) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        if (!validationSchema) return;
        
        setIsValidating(true);
        try {
          await validationSchema.validateAt(fieldName, { [fieldName]: value });
          setErrors(prev => ({ ...prev, [fieldName]: undefined }));
        } catch (err) {
          setErrors(prev => ({ ...prev, [fieldName]: err.message }));
        } finally {
          setIsValidating(false);
        }
      }, 300);
    };
  }, [validationSchema]);

  const handleChange = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    validateField(fieldName, value);
  }, [validateField]);

  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  return {
    values,
    errors,
    touched,
    isValidating,
    handleChange,
    handleBlur,
    setValues,
    setErrors
  };
}
