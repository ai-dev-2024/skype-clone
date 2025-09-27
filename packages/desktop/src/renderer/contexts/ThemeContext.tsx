import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      if (window.electronAPI) {
        const storedTheme = await window.electronAPI.storeGet('theme');
        if (storedTheme !== undefined) {
          setIsDarkTheme(storedTheme);
        }
      } else {
        // Fallback for development
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
          setIsDarkTheme(JSON.parse(storedTheme));
        }
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newThemeValue = !isDarkTheme;
      setIsDarkTheme(newThemeValue);

      if (window.electronAPI) {
        await window.electronAPI.storeSet('theme', newThemeValue);
      } else {
        // Fallback for development
        localStorage.setItem('theme', JSON.stringify(newThemeValue));
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const value: ThemeContextType = {
    isDarkTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
