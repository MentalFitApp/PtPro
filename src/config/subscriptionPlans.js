import React from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Default subscription plans (fallback se Firestore non è disponibile)
export const DEFAULT_SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['5 Users', '20 Clients', 'Basic Support'],
    limits: { maxUsers: 5, maxClients: 20 }
  },
  starter: {
    name: 'Starter',
    price: 29,
    features: ['10 Users', '50 Clients', 'Priority Support', 'Basic Analytics'],
    limits: { maxUsers: 10, maxClients: 50 }
  },
  professional: {
    name: 'Professional',
    price: 79,
    features: ['25 Users', '200 Clients', 'Advanced Analytics', 'API Access', 'Custom Branding'],
    limits: { maxUsers: 25, maxClients: 200 }
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    features: ['Unlimited Users', 'Unlimited Clients', 'Dedicated Support', 'Custom Integrations', 'SLA'],
    limits: { maxUsers: -1, maxClients: -1 }
  }
};

// Cache per evitare troppi fetch
let cachedPlans = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

/**
 * Carica i subscription plans da Firestore con caching
 * @returns {Promise<Object>} - Subscription plans object
 */
export async function loadSubscriptionPlans() {
  // Usa cache se valida
  if (cachedPlans && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedPlans;
  }

  try {
    const configDoc = await getDoc(doc(db, 'platform_config', 'settings'));
    
    if (configDoc.exists()) {
      const data = configDoc.data();
      
      if (data.subscriptionPlans && Array.isArray(data.subscriptionPlans)) {
        // Converti array in object con id come chiave
        const plansObject = data.subscriptionPlans.reduce((acc, plan) => {
          acc[plan.id] = {
            name: plan.name,
            price: plan.price,
            features: plan.features,
            limits: {
              maxUsers: plan.maxUsers,
              maxClients: plan.maxClients
            }
          };
          return acc;
        }, {});
        
        cachedPlans = plansObject;
        cacheTimestamp = Date.now();
        return plansObject;
      }
    }
    
    // Fallback ai default
    console.log('Using default subscription plans');
    cachedPlans = DEFAULT_SUBSCRIPTION_PLANS;
    cacheTimestamp = Date.now();
    return DEFAULT_SUBSCRIPTION_PLANS;
    
  } catch (error) {
    console.error('Error loading subscription plans:', error);
    return DEFAULT_SUBSCRIPTION_PLANS;
  }
}

/**
 * Invalida la cache per forzare un refresh
 */
export function invalidateSubscriptionPlansCache() {
  cachedPlans = null;
  cacheTimestamp = null;
}

/**
 * Hook React per usare subscription plans con auto-refresh
 */
export function useSubscriptionPlans() {
  const [plans, setPlans] = React.useState(DEFAULT_SUBSCRIPTION_PLANS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    
    async function fetchPlans() {
      const loadedPlans = await loadSubscriptionPlans();
      if (mounted) {
        setPlans(loadedPlans);
        setLoading(false);
      }
    }
    
    fetchPlans();
    
    return () => {
      mounted = false;
    };
  }, []);

  return { plans, loading, refresh: invalidateSubscriptionPlansCache };
}

// Per retrocompatibilità - export diretto
export const SUBSCRIPTION_PLANS = DEFAULT_SUBSCRIPTION_PLANS;
