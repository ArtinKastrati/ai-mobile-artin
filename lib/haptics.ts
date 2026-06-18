import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  selection: () => {
    if (Platform.OS === 'web') return;
    Haptics.selectionAsync();
  },
};
