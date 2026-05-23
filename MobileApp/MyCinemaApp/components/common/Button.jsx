import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Colors, Shadows } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const Button = ({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const variantStyles = {
    primary: {
      bg: Colors.primary,
      text: '#FFFFFF',
    },
    danger: {
      bg: Colors.brandRed,
      text: '#FFFFFF',
    },
    outline: {
      bg: 'transparent',
      text: Colors.primary,
    },
    ghost: {
      bg: 'transparent',
      text: Colors.textSecondary,
    },
    detail: {
      bg: Colors.textSubtle,
      text: '#FFFFFF',
    },
  };

  const v = variantStyles[variant] || variantStyles.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg },
        variant === 'outline' && styles.btnOutline,
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
        style,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.btnText, { color: v.text }, textStyle]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Touch target ≥ 48dp
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    ...Typography.button,
    fontSize: 15,
  },
});

export default Button;
