import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useCart, SelectedModifier } from '@/context/CartContext';
import { MenuItem, Restaurant, OptionChoice } from '@/data/mockData';
import { haptics } from '@/lib/haptics';
import { usePreferences } from '@/context/PreferencesContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: MenuItem | null;
  restaurant: Restaurant;
};

export function CustomizationSheet({ visible, onClose, item, restaurant }: Props) {
  if (!item) return null;

  const colors = useColors();
  const { t } = usePreferences();
  const insets = useSafeAreaInsets();
  const { addItem, clearAndAddItem, restaurant: cartRestaurant } = useCart();

  // Selection states
  // Key: groupTitle, Value: array of selected choice names
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [focusedInput, setFocusedInput] = useState(false);

  // Initialize selections with default or empty
  useEffect(() => {
    if (visible && item) {
      const initialSelections: Record<string, string[]> = {};
      item.modifierGroups?.forEach((group) => {
        // Pre-select first option if required and not multi-select
        if (group.required && !group.multiSelect && group.choices.length > 0) {
          initialSelections[group.title] = [group.choices[0].name];
        } else {
          initialSelections[group.title] = [];
        }
      });
      setSelections(initialSelections);
      setInstructions('');
      setQuantity(1);
    }
  }, [visible, item]);

  const handleSelectChoice = (groupTitle: string, choice: OptionChoice, multiSelect: boolean) => {
    haptics.light();
    setSelections((prev) => {
      const current = prev[groupTitle] || [];
      if (multiSelect) {
        if (current.includes(choice.name)) {
          return { ...prev, [groupTitle]: current.filter((c) => c !== choice.name) };
        } else {
          return { ...prev, [groupTitle]: [...current, choice.name] };
        }
      } else {
        return { ...prev, [groupTitle]: [choice.name] };
      }
    });
  };

  // Flatten selections to SelectedModifier[]
  const selectedModifiers = useMemo<SelectedModifier[]>(() => {
    const list: SelectedModifier[] = [];
    if (!item.modifierGroups) return list;

    item.modifierGroups.forEach((group) => {
      const selectedNames = selections[group.title] || [];
      selectedNames.forEach((name) => {
        const choice = group.choices.find((c) => c.name === name);
        if (choice) {
          list.push({
            groupTitle: group.title,
            choiceName: choice.name,
            price: choice.price,
          });
        }
      });
    });
    return list;
  }, [selections, item]);

  // Pricing calculations
  const modifiersPrice = useMemo(() => {
    return selectedModifiers.reduce((sum, m) => sum + m.price, 0);
  }, [selectedModifiers]);

  const singleItemPrice = item.price + modifiersPrice;
  const totalPrice = singleItemPrice * quantity;

  const handleAdd = () => {
    // 1. Validation check for required modifiers
    if (item.modifierGroups) {
      for (const group of item.modifierGroups) {
        const selected = selections[group.title] || [];
        if (group.required && selected.length === 0) {
          haptics.notificationError();
          Alert.alert(
            t('common.error') || 'Selection Required',
            `Please make a selection for "${group.title}".`
          );
          return;
        }
      }
    }

    haptics.heavy();

    const executeAdd = (isClear: boolean) => {
      if (isClear) {
        clearAndAddItem(item, restaurant, selectedModifiers, instructions, quantity);
      } else {
        addItem(item, restaurant, selectedModifiers, instructions, quantity);
      }
      onClose();
    };

    // 2. Conflict Guard checks
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      Alert.alert(
        t('cart.conflictTitle') || 'Start a new basket?',
        (t('cart.conflictBody') || 'Adding items from {newRest} will clear your current basket from {oldRest}.')
          .replace('{newRest}', restaurant.name)
          .replace('{oldRest}', cartRestaurant.name),
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          { 
            text: t('cart.conflictConfirm') || 'Yes, start new basket', 
            style: 'destructive',
            onPress: () => executeAdd(true)
          }
        ]
      );
    } else {
      executeAdd(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.modalPrice, { color: colors.primary }]}>Base Price: ${item.price.toFixed(2)}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  haptics.light();
                  onClose();
                }} 
                style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="close" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Details Scroll */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
              {/* Food item Image & Info */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="cover" />
                <View style={styles.overlayTextContainer}>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </View>
              </View>

              {/* Modifier Groups */}
              {item.modifierGroups?.map((group) => {
                const selectedChoices = selections[group.title] || [];
                return (
                  <View key={group.title} style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.groupHeader}>
                      <Text style={[styles.groupTitle, { color: colors.foreground }]}>{group.title}</Text>
                      <View style={[
                        styles.reqBadge, 
                        { backgroundColor: group.required ? `${colors.primary}12` : `${colors.muted}15` }
                      ]}>
                        <Text style={[styles.reqText, { color: group.required ? colors.primary : colors.muted }]}>
                          {group.required ? 'Required' : 'Optional'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.choicesList}>
                      {group.choices.map((choice) => {
                        const isActive = selectedChoices.includes(choice.name);
                        return (
                          <TouchableOpacity
                            key={choice.name}
                            onPress={() => handleSelectChoice(group.title, choice, group.multiSelect)}
                            activeOpacity={0.7}
                            style={[styles.choiceRow, { borderBottomColor: colors.border }]}
                          >
                            <View style={styles.choiceLeft}>
                              <Ionicons
                                name={
                                  group.multiSelect
                                    ? isActive ? 'checkbox' : 'square-outline'
                                    : isActive ? 'radio-button-on' : 'radio-button-off'
                                }
                                size={20}
                                color={isActive ? colors.primary : colors.muted}
                              />
                              <Text style={[styles.choiceName, { color: colors.foreground }]}>{choice.name}</Text>
                            </View>
                            {choice.price > 0 && (
                              <Text style={[styles.choicePrice, { color: colors.primary }]}>
                                +${choice.price.toFixed(2)}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              {/* Special Instructions */}
              <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.groupTitle, { color: colors.foreground, marginBottom: 8 }]}>
                  Special Instructions
                </Text>
                <TextInput
                  style={[
                    styles.instructionsInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.background,
                      borderColor: focusedInput ? colors.primary : colors.border,
                    }
                  ]}
                  placeholder="No onions, extra dressing, etc."
                  placeholderTextColor={colors.muted}
                  value={instructions}
                  onChangeText={setInstructions}
                  onFocus={() => setFocusedInput(true)}
                  onBlur={() => setFocusedInput(false)}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <View style={styles.footerRow}>
                {/* Quantity Counter */}
                <View style={[styles.qtySelector, { borderColor: colors.border }]}>
                  <TouchableOpacity 
                    onPress={() => {
                      haptics.light();
                      if (quantity > 1) setQuantity(quantity - 1);
                    }}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="remove" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.foreground }]}>{quantity}</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      haptics.light();
                      setQuantity(quantity + 1);
                    }}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="add" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                {/* Submit Add to Basket */}
                <TouchableOpacity
                  onPress={handleAdd}
                  activeOpacity={0.88}
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.addBtnText}>
                    Add to Basket · ${totalPrice.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '90%',
    paddingTop: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
  },
  modalPrice: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 180,
  },
  overlayTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 16,
  },
  groupCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reqBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reqText: {
    fontSize: 10,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'uppercase',
  },
  choicesList: {
    gap: 4,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  choiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  choiceName: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
  },
  choicePrice: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
  instructionsInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    textAlignVertical: 'top',
    height: 60,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 -2px 10px rgba(0,0,0,0.06)' },
    }),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  qtyBtn: {
    paddingHorizontal: 12,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    minWidth: 20,
    textAlign: 'center',
  },
  addBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
  },
});
