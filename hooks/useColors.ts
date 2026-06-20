import { Colors, ColorScheme } from '@/constants/colors';
import { usePreferences } from '@/context/PreferencesContext';
import { useColorScheme } from 'react-native';

export function useColors(): ColorScheme {
  const systemScheme = useColorScheme();
  try {
    const { theme } = usePreferences();
    const activeTheme = theme === 'system' ? (systemScheme || 'light') : theme;
    return Colors[activeTheme] || Colors.light;
  } catch (e) {
    const activeTheme = systemScheme || 'light';
    return Colors[activeTheme] || Colors.light;
  }
}
