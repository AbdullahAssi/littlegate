import { KidMode } from '../../modules/kid-mode';

// Short-lived "parent unlocked" window after a correct PIN, so Settings can't
// be reached by deep link without one. In-memory only: an app restart locks it.
// This is the screen gate; the native module enforces its own window on every
// parent-only call (ERR_PARENT_LOCKED), and close() ends both.
const WINDOW_MS = 5 * 60_000;
let unlockedUntil = 0;

export const parentSession = {
  open() {
    unlockedUntil = Date.now() + WINDOW_MS;
  },
  close() {
    unlockedUntil = 0;
    // Optional call: a dev client built before this function existed must not crash.
    // Closing the native window early is a tightening, never needed for correctness.
    KidMode.endParentSession?.();
  },
  isOpen() {
    return Date.now() < unlockedUntil;
  },
};
