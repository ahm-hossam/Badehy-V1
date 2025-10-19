'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // Force light theme on mount and ensure no 'dark' class is present
  useEffect(() => {
    setTheme('light');
    try {
      localStorage.setItem('theme', 'light');
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // No-op toggle to keep API surface while enforcing light mode only
  const toggleTheme = () => {
    setTheme('light');
    try {
      localStorage.setItem('theme', 'light');
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 