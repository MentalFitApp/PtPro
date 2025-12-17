// src/pages/admin/Clients/utils/exportToCSV.js
import Papa from 'papaparse';
import { toDate, calcolaStatoPercorso } from '../../../../firebase';

/**
 * Esporta lista clienti in CSV
 */
export const exportToCSV = (clients) => {
  const data = clients.map(client => ({
    Nome: client.name || 'N/D',
    Email: client.email || 'N/D',
    Telefono: client.phone || 'N/D',
    Scadenza: toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D',
    Stato: client.statoPercorso || calcolaStatoPercorso(client.scadenza),
    Pagamenti: client.payments ? client.payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0,
    'Data Inizio': toDate(client.startDate)?.toLocaleDateString('it-IT') || 'N/D',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'clienti.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
