import '@/global.css';

// Per-weight imports so only the three weights we use are bundled.
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, dark } = useTheme();
  const base = dark ? DarkTheme : DefaultTheme;
  const [fontsLoaded, fontError] = useFonts({ Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold });

  // Wait for fonts, but never forever: on a load error we fall back to the system font.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider
        value={{ ...base, colors: { ...base.colors, background: colors.bg, card: colors.bg, text: colors.text } }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        {/* Screen transitions stay the platform's own — never rebuilt in JS. */}
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="home" options={{ animation: 'fade' }} />
          {/* The parent area rises from below with the PIN, and leaves the way it came. */}
          <Stack.Screen name="permissions" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
          {/* Kid Mode: no swipe-back, no way out but the PIN. */}
          <Stack.Screen name="kid" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen
            name="unlock"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen name="recover" />
          {/* Answering a request: like the PIN, it rises over whatever asked. */}
          <Stack.Screen
            name="approve"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen name="blocked" options={{ gestureEnabled: false, animation: 'fade' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
