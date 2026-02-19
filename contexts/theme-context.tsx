import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  colors: typeof lightColors;
}

const lightColors = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceElevated: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  primary: '#111827',
  primaryText: '#FFFFFF',
  success: '#00C805',
  warning: '#F59E0B',
  danger: '#EF4444',
  tint: '#0EA5E9',
  accent: '#00C805',
  accentSecondary: '#00E676',
  tabIconDefault: '#9CA3AF',
  tabIconSelected: '#111827',
  glow: 'rgba(0, 200, 5, 0.12)',
};

const darkColors = {
  background: '#000000', // Pure black background
  surface: '#0B0B0B', // Very dark gray surfaces
  surfaceElevated: '#121212', // Elevated cards
  border: '#1F1F1F', // Subtle borders
  text: '#FFFFFF', // High-contrast white text
  textSecondary: '#9E9E9E', // Subtext gray
  textTertiary: '#6E6E6E', // Dimmer gray
  primary: '#00C805', // Adjusted Accent Green rgb(0,200,5)
  primaryText: '#000000', // Dark text on bright green when needed
  success: '#00FF66', // Graph Green for positive values
  warning: '#FFB800', // Warning amber
  danger: '#FF3B30', // Negative Red
  tint: '#00C805', // Accent tint
  accent: '#00C805', // Accent Green
  accentSecondary: '#00E676', // Lighter green for gradients/accents
  tabIconDefault: '#6E6E6E',
  tabIconSelected: '#FFFFFF',
  glow: 'rgba(0, 200, 5, 0.2)', // Soft green glow adjusted
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    AsyncStorage.getItem('theme').then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
      }
    });
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    AsyncStorage.setItem('theme', newTheme);
  };

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemScheme ?? 'light') : theme;

  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
