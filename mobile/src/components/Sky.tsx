import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

export type Period = 'dawn' | 'day' | 'dusk' | 'night';

export function periodOf(d: Date): Period {
  const h = d.getHours();
  if (h >= 5 && h < 9) return 'dawn';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

// Each sky is one flat field with its own ink, so text stays readable whatever
// the system theme. The hills are a single tone step, not a fade.
export const SKY = {
  dawn: { field: '#FFE3CB', hill: '#FFF1E4', body: '#FF9F5A', ink: '#3A2416', inkSoft: '#7A5440', greeting: 'Good morning' },
  day: { field: '#CDE9FF', hill: '#E6F4FF', body: '#FFC93C', ink: '#11314D', inkSoft: '#4A6A86', greeting: 'Hi there' },
  dusk: { field: '#FBC3AE', hill: '#FDDCCF', body: '#FF7A59', ink: '#2B1838', inkSoft: '#5E4870', greeting: 'Good evening' },
  night: { field: '#181E45', hill: '#232A58', body: '#F4EFD0', ink: '#F2F0FF', inkSoft: '#B7B4DA', greeting: 'Hello, night owl' },
} as const;

// Fixed star field (fractions of width/height) — no randomness, so it never jumps on re-render.
const STARS = [
  [0.08, 0.06, 1.4], [0.22, 0.14, 1], [0.35, 0.05, 1.6], [0.52, 0.11, 1], [0.66, 0.04, 1.3],
  [0.78, 0.16, 1], [0.9, 0.08, 1.5], [0.14, 0.27, 1], [0.44, 0.24, 1.2], [0.6, 0.3, 1], [0.86, 0.28, 1.2],
] as const;

/** Static, time-of-day backdrop for the kid launcher. Colour carries the mood; nothing moves. */
export function Sky({ period }: { period: Period }) {
  const { width, height } = useWindowDimensions();
  const s = SKY[period];
  const night = period === 'night';
  // Tucked into a top corner, clear of the clock.
  const bodyX = width * (period === 'dawn' ? 0.12 : 0.88);
  const bodyY = Math.max(36, height * 0.045);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Rect width={width} height={height} fill={s.field} />
        {night
          ? STARS.map(([x, y, r], i) => <Circle key={i} cx={x * width} cy={y * height} r={r} fill="#FFFFFF" opacity={0.7} />)
          : null}
        <Circle cx={bodyX} cy={bodyY} r={night ? 22 : 28} fill={s.body} />
        {/* Crescent: a sky-coloured disc offset over the moon. */}
        {night ? <Circle cx={bodyX + 10} cy={bodyY - 7} r={19} fill={s.field} /> : null}
        {/* Rolling hills at the bottom anchor the grid. */}
        <Circle cx={width * 0.15} cy={height + 130} r={240} fill={s.hill} />
        <Circle cx={width * 0.95} cy={height + 160} r={260} fill={s.hill} />
      </Svg>
    </View>
  );
}
