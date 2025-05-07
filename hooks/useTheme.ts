import { useSettings } from './useSettings';
import { lightColors, darkColors } from '@/constants/colors';

export function useTheme() {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  
  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}