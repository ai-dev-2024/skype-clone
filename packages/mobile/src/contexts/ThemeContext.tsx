import React, {createContext, useContext, useState, useEffect} from 'react';
import {MD3LightTheme, MD3DarkTheme, adaptNavigationTheme} from 'react-native-paper';
import {
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {LightTheme: AdaptedLightTheme, DarkTheme: AdaptedDarkTheme} = adaptNavigationTheme({
  reactNavigationLight: NavigationLightTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedLightTheme = {
  ...MD3LightTheme,
  ...AdaptedLightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...AdaptedLightTheme.colors,
  },
};

const CombinedDarkTheme = {
  ...MD3DarkTheme,
  ...AdaptedDarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...AdaptedDarkTheme.colors,
  },
};

interface ThemeContextType {
  isDarkTheme: boolean;
  theme: typeof CombinedLightTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        setIsDarkTheme(JSON.parse(storedTheme));
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newThemeValue = !isDarkTheme;
      setIsDarkTheme(newThemeValue);
      await AsyncStorage.setItem('theme', JSON.stringify(newThemeValue));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkTheme ? CombinedDarkTheme : CombinedLightTheme;

  const value: ThemeContextType = {
    isDarkTheme,
    theme,
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
