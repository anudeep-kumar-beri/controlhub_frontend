import { useSettings } from '../context/SettingsContext.jsx';

export function formatCurrencyValue(n, { locale = 'en-IN', currencyCode = 'INR' } = {}) {
  const num = Number(n) || 0;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }).format(num);
  } catch {
    return `${num.toLocaleString(locale)} ${currencyCode}`;
  }
}

export function todayISO() { return new Date().toISOString().slice(0,10); }

// Small React hook for convenience in components
export function useCurrencyFormatter() {
  const { settings } = useSettings();
  return (n) => formatCurrencyValue(n, settings);
}
