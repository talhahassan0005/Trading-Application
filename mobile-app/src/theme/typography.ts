import { TextStyle } from 'react-native';

export const typography = {
  title: { fontSize: 28, fontWeight: '800' } as TextStyle,
  heading: { fontSize: 20, fontWeight: '700' } as TextStyle,
  subheading: { fontSize: 16, fontWeight: '600' } as TextStyle,
  body: { fontSize: 15, fontWeight: '400' } as TextStyle,
  label: { fontSize: 13, fontWeight: '500' } as TextStyle,
  caption: { fontSize: 11, fontWeight: '500' } as TextStyle,
  /** Numbers that change live; tabular so digits don't jitter. */
  mono: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] } as TextStyle,
};
