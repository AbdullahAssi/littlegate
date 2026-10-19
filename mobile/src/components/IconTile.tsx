import { View } from 'react-native';

import { tint } from '@/lib/visuals';
import { type AppIcon } from '@/components/icons';

/**
 * An icon on a tinted squircle of its own hue (iOS Settings-style).
 * The tint is the same hue at low alpha, so it reads in light and dark.
 */
export function IconTile({
  Icon,
  hue,
  size = 36,
  solid,
}: {
  Icon: AppIcon;
  hue: string;
  size?: number;
  /** White icon on a solid fill instead of a tint. */
  solid?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: solid ? hue : tint(hue, 0.14),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon size={size * 0.52} color={solid ? '#FFFFFF' : hue} />
    </View>
  );
}
