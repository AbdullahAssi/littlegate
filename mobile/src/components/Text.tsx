import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';

import { font, type as typeScale, useTheme } from '@/theme/tokens';

type Variant = keyof typeof typeScale;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'kid' | 'danger' | 'onKid' | 'onHero';

export function Text({
  variant = 'body',
  tone = 'primary',
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const { colors } = useTheme();
  const color = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    kid: colors.kidText,
    danger: colors.danger,
    onKid: colors.onKid,
    onHero: colors.onHero,
  }[tone];

  // Resolve the final weight, then swap it for the matching Figtree family.
  const flat: TextStyle = StyleSheet.flatten([typeScale[variant] as TextStyle, { color }, style]) ?? {};
  const { fontWeight, ...restStyle } = flat;
  // An explicit family wins.
  return <RNText {...rest} style={[restStyle, { fontFamily: flat.fontFamily ?? font(fontWeight) }]} />;
}
