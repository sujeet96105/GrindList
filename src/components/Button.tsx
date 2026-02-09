import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { paddingVertical: 8, paddingHorizontal: 12 }, text: { fontSize: 13 } },
  md: { container: { paddingVertical: 12, paddingHorizontal: 16 }, text: { fontSize: 15 } },
  lg: { container: { paddingVertical: 14, paddingHorizontal: 20 }, text: { fontSize: 17 } },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const backgroundColor = isPrimary
    ? colors.accent
    : isSecondary
    ? colors.surface
    : 'transparent';

  const borderColor = isSecondary ? colors.border : 'transparent';
  const textColor = isPrimary ? '#FFFFFF' : colors.textPrimary;

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size].container,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      <Text variant="body" style={[styles.text, sizeStyles[size].text, { color: textColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
