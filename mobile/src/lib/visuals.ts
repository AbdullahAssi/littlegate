
import type { CategoryId } from '@/lib/kidMode';
import { I, type AppIcon } from '@/components/icons';

/** Each category owns one hue everywhere it appears (chips, rows, blocked list). */
export const CATEGORY_VISUAL: Record<CategoryId | 'custom', { Icon: AppIcon; hue: string }> = {
  adult: { Icon: I.adult, hue: '#C2410C' },
  gambling: { Icon: I.gambling, hue: '#B45309' },
  violence: { Icon: I.violence, hue: '#B91C1C' },
  social: { Icon: I.social, hue: '#0369A1' },
  gaming: { Icon: I.gaming, hue: '#2563EB' },
  aiCompanion: { Icon: I.aiCompanion, hue: '#DB2777' },
  aiAssistant: { Icon: I.aiAssistant, hue: '#0D9488' },
  custom: { Icon: I.web, hue: '#475569' },
};

// Kid launcher fallback art until native real icons arrive (InstalledApp.iconUri).
const KNOWN_APPS: Record<string, { Icon: AppIcon; hue: string }> = {
  'com.android.camera': { Icon: I.camera, hue: '#3B82F6' },
  'com.google.android.apps.youtube.kids': { Icon: I.play, hue: '#EF4444' },
  'com.duolingo': { Icon: I.learn, hue: '#22A04B' },
  'com.android.chrome': { Icon: I.web, hue: '#0EA5E9' },
  'com.whatsapp': { Icon: I.chat, hue: '#16A34A' },
  'com.mojang.minecraftpe': { Icon: I.puzzle, hue: '#8B5E34' },
  'com.google.android.apps.photos': { Icon: I.photo, hue: '#F59E0B' },
  'org.khanacademy.android': { Icon: I.book, hue: '#14B8A6' },
};

const FALLBACK_HUES = ['#F59E0B', '#3B82F6', '#EC4899', '#10B981', '#E11D48', '#06B6D4', '#F97316'];

export function appVisual(packageName: string): { Icon: AppIcon | null; hue: string } {
  const known = KNOWN_APPS[packageName];
  if (known) return known;
  let h = 0;
  for (let i = 0; i < packageName.length; i++) h = (h * 31 + packageName.charCodeAt(i)) | 0;
  return { Icon: null, hue: FALLBACK_HUES.at(Math.abs(h) % FALLBACK_HUES.length) ?? '#3B82F6' };
}

/** Hex colour at an alpha, for tinted backgrounds behind an icon of the same hue. */
export function tint(hex: string, alpha: number) {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0'); // taste-skill-ignore: hex alpha byte, not a 01/02 label
  return `${hex}${a}`;
}
