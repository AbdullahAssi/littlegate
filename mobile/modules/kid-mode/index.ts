import { requireOptionalNativeModule } from 'expo';

import type { KidModeApi } from './src/KidMode.types';
import { mockKidMode } from './src/mock';

export * from './src/KidMode.types';

const native = requireOptionalNativeModule<KidModeApi>('KidMode');

/** True when running on the real native module; false means the dev mock is in use. */
export const isNativeKidMode = native != null;

if (!native && !__DEV__) {
  // A release build must never fall back to the insecure mock.
  throw new Error('KidMode native module is missing from this build.');
}

export const KidMode: KidModeApi = native ?? mockKidMode;
