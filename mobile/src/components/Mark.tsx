import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme/tokens';

// Littlegate symbol on a 256 grid, from branding/logo/final/build_kit.py.
// The open arch is the gate; the dot is the kid on the safe side of it.
// Light-on-colour uses the reversed cut (thinned ~6% against irradiation).
const ARCH =
  'M40 124 A88 88 0 0 1 216 124 V203 A17 17 0 0 1 182 203 V124 A54 54 0 0 0 74 124 V203 A17 17 0 0 1 40 203 Z M159 176 A31 31 0 1 0 97 176 A31 31 0 1 0 159 176 Z';
const ARCH_REVERSED =
  'M40.5 124 A87.5 87.5 0 0 1 215.5 124 V204 A16 16 0 0 1 183.5 204 V124 A55.5 55.5 0 0 0 72.5 124 V204 A16 16 0 0 1 40.5 204 Z M158 176 A30 30 0 1 0 98 176 A30 30 0 1 0 158 176 Z';

/**
 * The Littlegate mark in its round tile, the same as the Android app icon: the
 * arch fills 58% of the circle. `inverse` swaps to the soft lilac tile.
 */
export function Mark({ size = 44, inverse }: { size?: number; inverse?: boolean }) {
  const { colors } = useTheme();
  const ground = inverse ? colors.kidSoft : colors.kid;
  const ink = inverse ? colors.kidText : colors.onKid;
  // The View keeps the mark above absolutely positioned siblings (the onboarding
  // halo): on web a bare <svg> isn't positioned and would paint underneath.
  return (
    <View accessibilityLabel="Littlegate" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 256 256">
        <Circle cx={128} cy={128} r={128} fill={ground} />
        <Path
          d={inverse ? ARCH : ARCH_REVERSED}
          fill={ink}
          fillRule="evenodd"
          transform="translate(53.76 53.76) scale(0.58)"
        />
      </Svg>
    </View>
  );
}
