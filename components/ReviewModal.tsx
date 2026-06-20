import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { haptics } from '@/lib/haptics';
import { usePreferences } from '@/context/PreferencesContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  restaurantId: string;
  restaurantName: string;
};

export function ReviewModal({ visible, onClose, orderId, restaurantId, restaurantName }: Props) {
  const colors = useColors();
  const { t } = usePreferences();
  const insets = useSafeAreaInsets();
  const { submitReview, markOrderReviewed } = useData();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    haptics.notificationSuccess();
    submitReview(restaurantId, rating, comment);
    markOrderReviewed(orderId);
    onClose();
    setComment('');
    setRating(5);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.content, { backgroundColor: colors.background }]}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t('reviews.title')}
              </Text>
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

            {/* Restaurant Info */}
            <View style={styles.infoBlock}>
              <Text style={[styles.restPrompt, { color: colors.muted }]}>
                {t('reviews.prompt')}
              </Text>
              <Text style={[styles.restName, { color: colors.foreground }]}>
                {restaurantName}
              </Text>
            </View>

            {/* Stars Row */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  activeOpacity={0.7}
                  onPress={() => {
                    haptics.selection();
                    setRating(star);
                  }}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= rating ? colors.accent : colors.muted}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.card,
                    borderColor: focused ? colors.primary : colors.border,
                  },
                ]}
                placeholder={t('reviews.placeholder')}
                placeholderTextColor={colors.muted}
                value={comment}
                onChangeText={setComment}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.88}
              style={[styles.submitBtn, { backgroundColor: colors.primary, marginBottom: insets.bottom + 16 }]}
            >
              <Text style={styles.submitBtnText}>
                {t('reviews.submit')}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  restPrompt: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
  },
  restName: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  starBtn: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    textAlignVertical: 'top',
    height: 80,
  },
  submitBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
  },
});
