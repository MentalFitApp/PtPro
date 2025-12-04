/**
 * Payment Constants - Valori standardizzati per pagamenti e clienti
 */

export const PAYMENT_METHODS = {
  BONIFICO: 'bonifico',
  RATEIZZATO: 'rateizzato',
  KLARNA: 'klarna',
  PAYPAL: 'paypal',
  CASH: 'cash',
  ALTRO: 'altro'
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.BONIFICO]: 'Bonifico',
  [PAYMENT_METHODS.RATEIZZATO]: 'Rateizzato',
  [PAYMENT_METHODS.KLARNA]: 'Klarna 3 rate',
  [PAYMENT_METHODS.PAYPAL]: 'PayPal',
  [PAYMENT_METHODS.CASH]: 'Contanti',
  [PAYMENT_METHODS.ALTRO]: 'Altro'
};

export const CLIENT_STATUS = {
  ACTIVE: 'attivo',
  RENEWED: 'rinnovato',
  NOT_RENEWED: 'non_rinnovato',
  NA: 'na'
};

export const CLIENT_STATUS_LABELS = {
  [CLIENT_STATUS.ACTIVE]: 'Attivo',
  [CLIENT_STATUS.RENEWED]: 'In Scadenza',
  [CLIENT_STATUS.NOT_RENEWED]: 'Scaduto',
  [CLIENT_STATUS.NA]: 'N/D'
};

export const CLIENT_STATUS_STYLES = {
  [CLIENT_STATUS.ACTIVE]: 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/30',
  [CLIENT_STATUS.RENEWED]: 'bg-amber-900/80 text-amber-300 border border-amber-500/30',
  [CLIENT_STATUS.NOT_RENEWED]: 'bg-red-900/80 text-red-400 border border-red-500/30',
  [CLIENT_STATUS.NA]: 'bg-slate-700/80 text-slate-300 border border-slate-500/30'
};

export const PAYMENT_TYPES = {
  NEW_CLIENT: 'Nuovo Cliente',
  RENEWAL: 'Rinnovo',
  INSTALLMENT: 'Rata'
};

export const DURATION_OPTIONS = [
  { value: 1, label: '1 mese' },
  { value: 3, label: '3 mesi' },
  { value: 6, label: '6 mesi' },
  { value: 12, label: '12 mesi' }
];
