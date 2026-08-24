import React from 'react';
import {Text, StyleSheet, StyleProp, TextStyle} from 'react-native';
import {colors, typography, spacing} from '../theme';

interface SectionLabelProps {
  text: string;
  onDark?: boolean;
  style?: StyleProp<TextStyle>;
}

export default function SectionLabel({
  text,
  onDark = false,
  style,
}: SectionLabelProps) {
  return (
    <Text
      style={[
        styles.text,
        onDark ? styles.textOnDark : styles.textOnLight,
        style,
      ]}>
      {text.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  textOnLight: {
    color: colors.textSecondary,
  },
  textOnDark: {
    color: colors.textOnDarkMuted,
  },
});
