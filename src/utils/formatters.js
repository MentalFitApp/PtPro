// src/utils/formatters.js
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return "€0,00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "€0,00";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(num);
};
