import { CURRENCY } from './constants';

// Format currency value for display
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return `0 ${CURRENCY.symbol}`;
  }
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
};

// Format currency value with symbol only
export const formatCurrencySymbol = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return `0 ${CURRENCY.symbol}`;
  }
  return `${value.toLocaleString(CURRENCY.locale)} ${CURRENCY.symbol}`;
};

// Format large currency values (K, M)
export const formatCurrencyCompact = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return `0 ${CURRENCY.symbol}`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ${CURRENCY.symbol}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K ${CURRENCY.symbol}`;
  } else {
    return `${value.toFixed(0)} ${CURRENCY.symbol}`;
  }
};

// Get currency symbol
export const getCurrencySymbol = (): string => {
  return CURRENCY.symbol;
};

// Get currency code
export const getCurrencyCode = (): string => {
  return CURRENCY.code;
};
