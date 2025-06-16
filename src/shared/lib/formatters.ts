// src/shared/lib/formatters.ts

export const formatNumber = (num: number, decimals: number = 0) =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);