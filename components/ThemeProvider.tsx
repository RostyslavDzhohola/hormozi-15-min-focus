import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';

interface ThemeContextProps {
  theme: 'light' | 'dark';
  colors: typeof lightColors;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: 'light' | 'dark';
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    setThemeState(initialTheme || systemColorScheme || 'light');
  }, [initialTheme, systemColorScheme]);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  }, []);
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
  }, [theme]);

  const colors = theme === 'light' ? lightColors : darkColors;

  const value = {
    theme,
    colors,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  return useContext(ThemeContext);
};

export { ThemeContext }