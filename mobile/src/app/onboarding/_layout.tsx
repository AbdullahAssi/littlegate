import { Stack } from 'expo-router';

import { useTheme } from '@/theme/tokens';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
