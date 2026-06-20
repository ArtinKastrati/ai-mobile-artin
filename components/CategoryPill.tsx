import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Category } from '@/data/mockData';
import { haptics } from '@/lib/haptics';
import { usePreferences } from '@/context/PreferencesContext';

type Props = {
  category: Category;
  selected: boolean;
  onPress: () => void;
};

export function CategoryPill({ category, selected, onPress }: Props) {
  const colors = useColors();
  const { t } = usePreferences();

  const handlePress = () => {
    haptics.selection();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Ionicons
        name={category.icon as any}
        size={16}
        color={selected ? '#fff' : colors.muted}
      />
      <Text style={[styles.label, { color: selected ? '#fff' : colors.foreground }]}>
        {t(`home.categories.${category.id}`)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 10,
  },
  label: { fontSize: 13, fontWeight: '600' },
});
