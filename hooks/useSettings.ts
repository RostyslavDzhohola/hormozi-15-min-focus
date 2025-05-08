import { useState, useEffect } from 'react';
import { getSettings, saveSettings, clearAllData } from '@/utils/storage';
import { Platform } from 'react-native';
import { useCallback, useContext } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';

interface Settings {
  theme: 'light' | 'dark';
}

export function useSettings() {
  const { setTheme } = useContext(ThemeContext);
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
  });

  const loadSettings = useCallback(async () => {
    const savedSettings = await getSettings();

    if (savedSettings) {
      const newSettings = {
        ...settings,
        ...savedSettings,
      };
      setSettings(newSettings);
      setTheme(newSettings.theme || 'light');
    }
  }, [setTheme]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Reset all data
  const resetAllData = async () => {
    await clearAllData();
    setSettings({
      theme: 'light',
    });
    setTheme('light');
  };

  // Toggle theme with transition
  const toggleTheme = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    const updatedSettings: Settings = {
      ...settings,
      theme: newTheme,
    };
    await saveSettings(updatedSettings);
    setSettings(updatedSettings);
    setTheme(newTheme);
  };

  return {
    settings,
    resetAllData,
    toggleTheme,
  };
}
