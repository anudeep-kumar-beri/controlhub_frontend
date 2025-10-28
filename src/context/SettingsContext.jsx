import React, { createContext, useContext, useMemo, useState } from 'react';

const DEFAULTS = {
  currencyCode: 'INR',
  locale: 'en-IN',
  fiscalYearStartMonth: 4, // April
  defaultPeriod: 'this_month'
};

const KEY = 'finance_settings_v1';

function loadSettings() {
  try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS; } catch { return DEFAULTS; }
}

function persistSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

const SettingsContext = createContext({ settings: DEFAULTS, setSettings: () => {} });

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(loadSettings());
  const setSettings = (updater) => {
    setSettingsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistSettings(next);
      return next;
    });
  };
  const value = useMemo(() => ({ settings, setSettings }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() { return useContext(SettingsContext); }
