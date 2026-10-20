// Hands a freshly generated recovery code to the screen that shows it, without
// putting it in route params (which end up in navigation state / web URLs).
let pending: string | null = null;

export const recoveryHandoff = {
  set(code: string) {
    pending = code;
  },
  /** Side-effect free, so a remount or double render can't lose it. */
  peek() {
    return pending;
  },
  /** Call once the parent confirms they saved it. */
  clear() {
    pending = null;
  },
};
