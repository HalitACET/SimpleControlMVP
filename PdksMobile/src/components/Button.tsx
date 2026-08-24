import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {colors, typography, spacing, radius} from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const getStyles = () => {
    let buttonBg = colors.primary;
    let textColor = colors.textOnPrimary;
    let borderWidth = 0;
    let borderColor = 'transparent';

    switch (variant) {
      case 'dark':
        buttonBg = colors.dark;
        textColor = colors.textOnDark;
        break;
      case 'outline':
        buttonBg = 'transparent';
        textColor = colors.textPrimary;
        borderWidth = 1;
        borderColor = colors.border;
        break;
      case 'danger':
        buttonBg = colors.danger;
        textColor = colors.textOnDark;
        break;
      case 'primary':
      default:
        buttonBg = colors.primary;
        textColor = colors.textOnPrimary;
        break;
    }

    if (disabled) {
      buttonBg = variant === 'outline' ? 'transparent' : colors.border;
      textColor = colors.textSecondary;
      if (variant === 'outline') {
        borderColor = colors.border;
      }
    }

    return {
      button: {
        backgroundColor: buttonBg,
        borderWidth,
        borderColor,
      },
      text: {
        color: textColor,
      },
    };
  };

  const dynamicStyles = getStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.baseButton,
        dynamicStyles.button,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'outline' ? colors.textPrimary : colors.textOnDark}
        />
      ) : (
        <Text
          style={[
            styles.baseText,
            dynamicStyles.text,
            textStyle,
          ]}>
          {title.toUpperCase()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    minHeight: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
  },
  baseText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
