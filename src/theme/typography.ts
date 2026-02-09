import { Platform, TextStyle } from 'react-native';

const fontFamily =
  Platform.OS === 'android' ? 'Roboto' : ('System' as TextStyle['fontFamily']);

export const typography = {
  heading: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
  } as TextStyle,
  title: {
    fontFamily,
    fontSize: 17,
    fontWeight: '400',
  } as TextStyle,
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
  } as TextStyle,
  caption: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
  } as TextStyle,
};
