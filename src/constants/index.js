/**
 * App-wide Constants
 */

// Time ranges for dashboard filters
export const TIME_RANGES = {
  WEEK: '7',
  MONTH: '30',
  QUARTER: '90',
  YEAR: '365'
};

export const TIME_RANGE_LABELS = {
  [TIME_RANGES.WEEK]: 'Ultimi 7 giorni',
  [TIME_RANGES.MONTH]: 'Ultimi 30 giorni',
  [TIME_RANGES.QUARTER]: 'Ultimi 3 mesi',
  [TIME_RANGES.YEAR]: 'Ultimo anno'
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  CLIENT: 'client',
  COLLABORATOR: 'collaboratore',
  SUPER_ADMIN: 'superadmin'
};

// Activity types for feed
export const ACTIVITY_TYPES = {
  RENEWAL: 'renewal',
  NEW_PAYMENT: 'new_payment',
  NEW_CHECK: 'new_check',
  NEW_ANAMNESI: 'new_anamnesi',
  EXPIRING: 'expiring'
};

// Storage paths
export const STORAGE_PATHS = {
  PROFILE_PHOTOS: 'profile_photos',
  CHECK_PHOTOS: 'check_photos',
  ANAMNESI_PHOTOS: 'anamnesi_photos',
  BRANDING: 'branding'
};

// Default values
export const DEFAULTS = {
  MONTHS_RENEWAL: 3,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
  CACHE_TTL: 300000 // 5 minutes
};
