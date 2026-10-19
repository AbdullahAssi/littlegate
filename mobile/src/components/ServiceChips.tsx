import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { CATEGORIES, SERVICES, type CategoryId, type ServiceId } from '@/lib/kidMode';
import { radius, space, useTheme } from '@/theme/tokens';
import { I } from '@/components/icons';

/**
 * One-tap blocks for named services. A service its category already blocks shows as
 * blocked but can't be switched off here: the category is the thing to change.
 */
export function ServiceChips({
  categories,
  blocked,
  onChange,
}: {
  categories: CategoryId[];
  blocked: ServiceId[];
  onChange: (next: ServiceId[]) => void;
}) {
  const { colors } = useTheme();

  function toggle(id: ServiceId) {
    Haptics.selectionAsync();
    onChange(blocked.includes(id) ? blocked.filter((s) => s !== id) : [...blocked, id]);
  }

  return (
    <View style={styles.wrap}>
      {SERVICES.map((s) => {
        const covered = categories.includes(s.category);
        const on = covered || blocked.includes(s.id);
        const via = CATEGORIES.find((c) => c.id === s.category)?.title;
        return (
          <PressableScale
            key={s.id}
            accessibilityRole="switch"
            accessibilityLabel={`Block ${s.name}`}
            accessibilityState={{ checked: on, disabled: covered }}
            accessibilityHint={covered ? `Already blocked by ${via}` : undefined}
            disabled={covered}
            scaleTo={0.94}
            onPress={() => toggle(s.id)}
            style={[
              styles.chip,
              { backgroundColor: on ? colors.kidSoft : colors.surfaceSunken },
              covered && styles.covered,
            ]}>
            {on ? <I.blocked size={14} weight="bold" color={colors.kidText} /> : null}
            <Text variant="label" style={{ color: on ? colors.kidText : colors.textSecondary }}>
              {s.name}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
  covered: { opacity: 0.55 },
});
