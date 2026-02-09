import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../theme';

type Variant = 'heading' | 'title' | 'body' | 'caption';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function Text({
  variant = 'body',
  color,
  style,
  ...rest
}: Props) {
  const { colors, typography } = useTheme();
  const baseStyle = typography[variant] as TextStyle;
  const textColor = color ?? colors.textPrimary;

  return (
    <RNText
      {...rest}
      allowFontScaling
      style={[baseStyle, { color: textColor }, style]}
    />
  );
}
