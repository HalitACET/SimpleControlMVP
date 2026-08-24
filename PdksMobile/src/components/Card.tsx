import React from 'react';
import {View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {colors, spacing, radius} from '../theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'dark' | 'success';
  style?: StyleProp<ViewStyle>;
}

export default function Card({children, variant = 'default', style}: CardProps) {
  const getCardStyle = () => {
    switch (variant) {
      case 'dark':
        return styles.cardDark;
      case 'success':
        return styles.cardSuccess;
      case 'default':
      default:
        return styles.cardDefault;
    }
  };

  return (
    <View style={[styles.baseCard, getCardStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cardDefault: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    // Hafif gölge efekti
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: colors.dark,
  },
  cardSuccess: {
    backgroundColor: colors.success,
  },
});
