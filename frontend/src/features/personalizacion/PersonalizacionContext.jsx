import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PersonalizacionToggle from './PersonalizacionToggle';
import PersonalizacionContext from './personalizacionContextValue';

const STORAGE_KEY = 'cte-personalizacion-theme';
const DEFAULT_THEME = 'light';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;

  return DEFAULT_THEME;
};

export function PersonalizacionProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      isDarkMode: theme === 'dark',
      setTheme,
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  return (
    <PersonalizacionContext.Provider value={value}>
      {children}
      <PersonalizacionToggle isDarkMode={theme === 'dark'} onToggle={toggleTheme} />
    </PersonalizacionContext.Provider>
  );
}
