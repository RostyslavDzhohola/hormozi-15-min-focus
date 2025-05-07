import React from 'react';
import { Switch, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <Switch
      value={theme === 'dark'}
      onValueChange={toggleTheme}
      trackColor={{ 
        false: colors.border.default, 
        true: colors.primary.light 
      }}
      thumbColor={theme === 'dark' ? colors.primary.main : colors.border.subtle}
      ios_backgroundColor={colors.border.default}
    />
  );
}