import { View } from 'react-native';

import { useTheme } from '@/theme/tokens';
import { type AppIcon } from '@/components/icons';

/**
 * Monochrome line icon in a circle. Colour is not used to tell icons apart —
 * the shape does that — so the one accent stays meaningful.
 */
export function IconCircle({
  Icon,
  size = 40,
  on = 'surface',
}: {
  Icon: AppIcon;
  size?: number;
  /** Which surface the circle sits on, so it always contrasts. */
  on?: 'surface' | 'highlight' | 'sunken';
}) {
  const { colors, dark } = useTheme();
  const bg =
    on === 'surface' ? colors.surfaceSunken : on === 'highlight' ? (dark ? 'rgba(255,255,255,0.1)' : '#FFFFFF') : colors.surface;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.45} color={colors.text} />
    </View>
  );
}
