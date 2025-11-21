import { useState, useEffect, useRef } from 'react';

export const useLazyLoad = (options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef(null);

  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);

        if (inView && !hasBeenInView) {
          setHasBeenInView(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasBeenInView]);

  return { ref, isInView, hasBeenInView };
};

// Hook per lazy loading di dati
export const useLazyData = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { ref, hasBeenInView } = useLazyLoad();

  useEffect(() => {
    if (hasBeenInView && !data && !loading) {
      setLoading(true);
      fetchFunction()
        .then(setData)
        .catch(setError)
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBeenInView, data, loading, fetchFunction, ...dependencies]);

  return { ref, data, loading, error };
};