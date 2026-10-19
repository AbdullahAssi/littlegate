import { useColorScheme } from 'react-native';

// One accent on cool neutrals. Iris is the only interactive colour; lilac is the
// single highlight surface; leaf is reserved for the live "protected" signal.
// Every colour that goes through `tint()` / IconTile must stay #RRGGBB.
const light = {
  bg: '#ECECF1', // mist
  surface: '#FFFFFF', // paper
  surfaceSunken: '#F3F3F7',
  border: 'rgba(34, 31, 43, 0.06)',
  text: '#221F2B', // plum-ink
  textSecondary: '#6F6C7A',
  textTertiary: '#858290', // ≥3:1: icons, outlines, placeholders only. Small text uses textSecondary (4.5:1).

  /** Iris — the one accent: rings, selection, switches, links. */
  kid: '#4E3FD6',
  /** Lilac — the single highlighted surface per screen. */
  kidSoft: '#D9D3FB',
  kidText: '#3A2DB0',
  onKid: '#FFFFFF',
  /** Ink — primary buttons and the floating pill. */
  hero: '#221F2B',
  onHero: '#FFFFFF',
  /** Leaf — only for "protection is live". */
  leaf: '#2F9E6E',

  lock: '#B4532A',
  lockSoft: '#F7E4DA',

  danger: '#C2362B',
  dangerSoft: '#FBE3E0',
  shadow: 'rgba(34, 31, 43, 0.08)',
};

type Palette = { [K in keyof typeof light]: string };

const dark: Palette = {
  bg: '#121117',
  surface: '#1C1B23',
  surfaceSunken: '#25242E',
  border: 'rgba(255, 255, 255, 0.06)',
  text: '#F1F0F6',
  textSecondary: '#A19FAD',
  textTertiary: '#6E6C7A',

  kid: '#A99CFF',
  kidSoft: '#322C5C',
  kidText: '#C9C0FF',
  onKid: '#15122B',
  hero: '#F1F0F6',
  onHero: '#17151F',
  leaf: '#4CC48F',

  lock: '#E07F55',
  lockSoft: '#3A2318',

  danger: '#EF6A5B',
  dangerSoft: '#3A1C19',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export type Theme = { colors: Palette; dark: boolean };

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? { colors: dark, dark: true } : { colors: light, dark: false };
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** Hierarchy, not one radius for everything: big stat cards > rows/actions > chips. */
export const radius = { sm: 12, md: 18, lg: 28, pill: 999 } as const;

/**
 * Figtree, three weights only. Android can't synthesise weights for a custom
 * family, so each weight is its own family; `font()` maps weight → family.
 */
export const FONT = {
  '400': 'Figtree_400Regular',
  '500': 'Figtree_500Medium',
  '600': 'Figtree_600SemiBold',
} as const;

export type Weight = keyof typeof FONT;

export function font(weight: string | number | undefined): string {
  const w = String(weight ?? '400');
  if (w === 'bold' || Number(w) >= 600) return FONT['600'];
  if (Number(w) >= 500) return FONT['500'];
  return FONT['400'];
}

// Scale steps 13 · 15 · 17 · 28 · 34 · 64. One very large size carries each
// screen's main fact; everything else stays small so the jump is felt.
export const type = {
  /** The one dominant figure or word on a screen. */
  big: { fontSize: 64, lineHeight: 64, fontWeight: '600', letterSpacing: -2.6 },
  display: { fontSize: 34, lineHeight: 40, fontWeight: '600', letterSpacing: -0.9 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '600', letterSpacing: -0.6 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  number: { fontSize: 34, lineHeight: 38, fontWeight: '500', letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
} as const;

/** 44pt iOS / 48dp Android minimum touch target. */
export const MIN_TOUCH = 48;
