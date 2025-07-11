
// File: ThemeContext.jsx
// Path: frontend/src/context/ThemeContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get from localStorage or default to 'light'
    return localStorage.getItem('theme') || 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  // Custom color schemes
  const colorSchemes = {
    primary: 'var(--color-primary-500)',
    secondary: 'var(--bg-secondary)',
    accent: {
      yellow: 'var(--gradient-yellow)',
      blue: 'var(--gradient-blue)', 
      pink: 'var(--gradient-pink)',
      teal: 'var(--gradient-teal)',
      green: 'var(--gradient-green)'
    }
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    colorSchemes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
