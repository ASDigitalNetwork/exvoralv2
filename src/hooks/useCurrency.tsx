// src/hooks/useCurrency.ts
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Currency = 'CHF' | 'EUR' | 'USD';

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (amount: number, opts?: Intl.NumberFormatOptions) => string;
};

const STORAGE_KEY = 'currency';
const CurrencyContext = createContext<Ctx | null>(null);

export const CurrencyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
    return saved ?? 'CHF';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  const format = useMemo(
    () => (amount: number, opts: Intl.NumberFormatOptions = {}) =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
        ...opts,
      }).format(amount),
    [currency]
  );

  const value = useMemo(() => ({ currency, setCurrency, format }), [currency, format]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within <CurrencyProvider>');
  return ctx;
};
