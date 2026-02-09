import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../theme';

type Props = TextInputProps;

export function Input({ style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <TextInput
      {...rest}
      allowFontScaling
      placeholderTextColor={colors.textSecondary}
      style={[
        styles.input,
        {
          borderBottomColor: colors.border,
          color: colors.textPrimary,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    fontSize: 15,
  },
});
