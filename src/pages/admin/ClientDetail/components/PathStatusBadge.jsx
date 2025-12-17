import React from 'react';
import { CLIENT_STATUS, CLIENT_STATUS_STYLES, CLIENT_STATUS_LABELS } from '../../../../constants/payments';

/**
 * Normalizza e mostra lo stato del percorso cliente
 */
export default function PathStatusBadge({ status }) {
  const normalizeStatus = (value) => {
    if (!value) return CLIENT_STATUS.NA;
    if (CLIENT_STATUS_STYLES[value]) return value;
    const lowered = String(value).toLowerCase();
    if (lowered.includes('scad') && !lowered.includes('in ')) return CLIENT_STATUS.NOT_RENEWED;
    if (lowered.includes('scaden')) return CLIENT_STATUS.RENEWED;
    if (lowered.includes('attiv')) return CLIENT_STATUS.ACTIVE;
    return CLIENT_STATUS.NA;
  };
  
  const key = normalizeStatus(status);
  
  return (
    <span 
      className={`px-2.5 py-1 text-xs font-medium rounded-full ${CLIENT_STATUS_STYLES[key] || CLIENT_STATUS_STYLES.na}`}
    >
      {CLIENT_STATUS_LABELS[key] || 'N/D'}
    </span>
  );
}
