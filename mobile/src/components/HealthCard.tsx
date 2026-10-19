import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import type { Health, TamperKind } from '@/lib/kidMode';
import { oemStep } from '@/lib/oem';
import { layoutAnim } from '@/theme/motion';
import { radius, space, useTheme } from '@/theme/tokens';
import { I } from '@/components/icons';

const TAMPER: Record<TamperKind, string> = {
  vpnRevoked: 'The website filter was switched off',
  guardOff: 'App blocking was switched off',
  clockChanged: 'The phone’s clock or time zone was changed',
  privateDns: 'Private DNS was turned on, which can get around the filter',
  advancedProtection: 'Advanced Protection was turned on, which switches off app blocking',
};

type Row = { label: string; value: string; ok: boolean };

/**
 * Is protection actually running right now (report #1)? Silent failure is parents' top
 * complaint, so every part says its state in words, and anything not OK is one tap from a fix.
 */
export function HealthCard({
  health,
  onFix,
  onDismiss,
}: {
  health: Health;
  onFix: () => void;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const rows: Row[] = [
    {
      label: 'Website filter',
      value: health.filter === 'on' ? 'Filtering' : health.filter === 'ready' ? 'Ready' : 'Off',
      ok: health.filter !== 'off',
    },
    {
      label: 'App blocking',
      value: health.guard === 'on' ? 'On' : health.guard === 'partial' ? 'Partly on' : 'Off',
      ok: health.guard === 'on',
    },
    { label: 'Background running', value: health.battery ? 'Allowed' : 'Restricted', ok: health.battery },
  ];
  if (health.autostart !== null) {
    rows.push({ label: oemStep(health.manufacturer).title, value: health.autostart ? 'Checked' : 'Not checked', ok: health.autostart });
  }
  const allOk = rows.every((r) => r.ok) && health.warnings.length === 0;

  return (
    <Animated.View layout={layoutAnim.reflow()} style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.head}>
        <Text variant="heading">Protection status</Text>
        <View style={[styles.badge, { backgroundColor: allOk ? colors.kidSoft : colors.lockSoft }]}>
          <Text variant="caption" style={{ color: allOk ? colors.kidText : colors.lock, fontWeight: '600' }}>
            {allOk ? 'All good' : 'Needs attention'}
          </Text>
        </View>
      </View>

      {health.warnings.length ? (
        <Animated.View entering={layoutAnim.fadeIn()} exiting={layoutAnim.fadeOut()} style={[styles.warnings, { backgroundColor: colors.lockSoft }]}>
          {health.warnings.slice(0, 3).map((w) => (
            <View key={`${w.kind}-${w.at}`} style={styles.warning} accessible>
              <I.warning size={16} color={colors.lock} />
              <View style={{ flex: 1 }}>
                <Text variant="label" style={{ color: colors.lock }}>
                  {TAMPER[w.kind]}
                </Text>
                <Text variant="caption" style={{ color: colors.lock, opacity: 0.8 }}>
                  {when(w.at)}
                </Text>
              </View>
            </View>
          ))}
          <PressableScale accessibilityRole="button" accessibilityLabel="Dismiss warnings" hitSlop={8} onPress={onDismiss} style={styles.dismiss}>
            <Text variant="label" style={{ color: colors.lock }}>
              Got it
            </Text>
          </PressableScale>
        </Animated.View>
      ) : null}

      <View>
        {rows.map((r) => {
          // Shape and word carry the state too, not colour alone.
          const content = (
            <>
              {r.ok ? <I.check size={16} weight="bold" color={colors.leaf} /> : <I.warning size={16} weight="bold" color={colors.lock} />}
              <Text variant="label" style={{ flex: 1 }}>
                {r.label}
              </Text>
              <Text variant="label" style={{ color: r.ok ? colors.textSecondary : colors.lock, fontWeight: r.ok ? '400' : '600' }}>
                {r.value}
              </Text>
              {r.ok ? null : <I.chevron size={16} color={colors.lock} />}
            </>
          );
          // Only rows that need fixing are buttons; a disabled pressable would look greyed out.
          return r.ok ? (
            <View key={r.label} accessible accessibilityLabel={`${r.label}: ${r.value}`} style={styles.row}>
              {content}
            </View>
          ) : (
            <PressableScale
              key={r.label}
              accessibilityRole="button"
              accessibilityLabel={`${r.label}: ${r.value}. Fix`}
              scaleTo={0.98}
              onPress={onFix}
              style={styles.row}>
              {content}
            </PressableScale>
          );
        })}
      </View>
    </Animated.View>
  );
}

function when(at: number) {
  const m = Math.round((Date.now() - at) / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(at).toLocaleDateString([], { weekday: 'long' });
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: space.sm + 2, paddingVertical: 3, borderRadius: radius.pill },
  warnings: { borderRadius: radius.md, padding: space.md, gap: space.sm },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  dismiss: { alignSelf: 'flex-end', minHeight: 32, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 40 },
});
