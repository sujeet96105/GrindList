import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export type Theme = {
  colors: typeof lightColors;
  spacing: typeof spacing;
  typography: typeof typography;
};

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  typography,
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  typography,
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
