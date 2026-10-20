import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { KidMode } from '@/lib/kidMode';

type Target = '/onboarding' | '/home' | '/kid';

/** Decides the first screen: no PIN → onboarding, Kid Mode on → kid launcher, else dashboard. */
export default function Index() {
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    (async () => {
      const [hasPin, status] = await Promise.all([KidMode.hasPin(), KidMode.getStatus()]);
      setTarget(!hasPin ? '/onboarding' : status.active ? '/kid' : '/home');
    })().finally(() => SplashScreen.hideAsync());
  }, []);

  return target ? <Redirect href={target} /> : null;
}
